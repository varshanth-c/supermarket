import React, { useState, useEffect, useMemo,useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, ShoppingCart, Trash2, Camera, Download, Send, Printer, Save, Check, History,
  Loader2, Minus, User, QrCode, CreditCard, FileText, Store, Sparkles, UploadCloud,ServerOff, CheckCircle, Mail, Search
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- Type Definitions ---

import { saveSaleOffline, getOfflineSales, deleteSyncedSale, BillData as OfflineBillData } from '@/utils/offlineUtils';
interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  barcode?: string | null;
}

interface CartItem extends InventoryItem {
  cart_quantity: number;
}

interface Customer {
  name:string;
  phone: string;
  email: string;
  address: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
}

interface Sale {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  items: any;
  bill_data: any;
}

interface BillItem {
  id: string;
  item_name: string;
  cart_quantity: number;
  unit_price: number;
  total_price: number;
  final_amount: number;
}

// interface BillData {
//   billId: string;
//   items: BillItem[];
//   customer: Customer;
//   subtotal: number;
//   finalAmount: number;
//   notes: string;
//   timestamp: Date;
//   companyInfo: CompanyInfo;
//   paymentMethod: 'cash' | 'online';
// }
interface BillData extends OfflineBillData {}
// --- Default Company Information ---
const defaultCompanyInfo: CompanyInfo = {
  name: 'Sri Lakshmi Supermarket',
  address: '#45, Main Road, V.V. Nagar, Mandya, Karnataka - 571401',
  phone: '+91 98765 43210',
  email: 'srilakshmisupermarket@gmail.com',
  upi_id: 'varshanthgowdaml@oksbi',
  bank_name: 'State Bank of India',
  account_number: 'XXXXXXX1234',
  ifsc_code: 'SBIN000123456'
};


const Sales = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();

  // --- State Management ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', address: '' });
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- COMPANY INFO LOGIC FOR A SINGLE COMPANY ---
  // Load company info from localStorage. If not present, use the hardcoded defaults.
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    try {
        const savedCompanyInfo = localStorage.getItem('companyInfo');
        // If there's saved info, parse it. Otherwise, use the defaults.
        return savedCompanyInfo ? JSON.parse(savedCompanyInfo) : defaultCompanyInfo;
    } catch (error) {
        // If JSON parsing fails, fall back to defaults.
        return defaultCompanyInfo;
    }
  });

  // Save company info to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
  }, [companyInfo]);

  // Handler to save info from the dialog and show a toast.
  const handleSaveCompanyInfo = () => {
    // The useEffect above already handles the saving part.
    // This function just closes the dialog and gives user feedback.
    setShowCompanyDialog(false);
    toast({
        title: "Information Saved",
        description: "The company details have been updated on this device.",
    });
  }
  // --- END OF COMPANY INFO LOGIC ---

  const [activeTab, setActiveTab] = useState('cart');
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSaleCount, setPendingSaleCount] = useState(0);
  const [lastSaleWasOffline, setLastSaleWasOffline] = useState(false);
  // Dialog visibility states
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showSaleHistoryDialog, setShowSaleHistoryDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false);

  // Sale-specific state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [completedBill, setCompletedBill] = useState<BillData | null>(null);
  
  // --- Data Fetching & Mutations (Now only for Inventory, Sales, etc.) ---
  const { data: inventoryItems = [], isLoading: isInventoryLoading } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory').select('*').eq('user_id', user?.id).order('item_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: salesHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['sales-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Sale[] || [];
    },
    enabled: !!user?.id,
  });

  // const saveSaleMutation = useMutation({
  //   mutationFn: async ({ billData }: { billData: BillData }) => {
  //     const { data, error } = await supabase
  //       .from('sales')
  //       .insert({
  //         user_id: user!.id,
  //         customer_name: billData.customer.name,
  //         customer_phone: billData.customer.phone,
  //         customer_email: billData.customer.email,
  //         items: JSON.stringify(billData.items),
  //         total_amount: billData.finalAmount,
  //         bill_data: JSON.stringify(billData),
  //         payment_status: 'completed',
  //       })
  //       .select()
  //       .single();
  //     if (error) throw new Error(error.message);
  //     return data;
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['sales-history'] });
  //   },
  // });

  // const updateInventoryMutation = useMutation({
  //   mutationFn: async (items: CartItem[]) => {
  //     const updates = items.map(item =>
  //       supabase.from('inventory').update({ quantity: item.quantity - item.cart_quantity }).eq('id', item.id)
  //     );
  //     const results = await Promise.all(updates);
  //     results.forEach(({ error }) => { if (error) throw new Error(error.message); });
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['inventory'] });
  //   },
  // });
  // DELETE your old `saveSaleMutation` and `updateInventoryMutation`.
// REPLACE them with this single `processSaleMutation`.
// Add this line with your other useState hooks
const [transactionId, setTransactionId] = useState('');
const processSaleMutation = useMutation({
  mutationFn: async (billData: BillData) => {
      // This calls the Edge Function you wrote
      const { data, error } = await supabase.functions.invoke('process-sale', {
          body: { billData },
      });
      if (error) {
          throw new Error(`Transaction failed: ${error.message}`);
      }
      return data;
  },
  onSuccess: () => {
      // Invalidate queries to refetch fresh data from the server
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['sales-history', user?.id] });
  },
});
// Add this entire new block of code inside your component

const syncOfflineSales = useCallback(async () => {
  if (isSyncing || !user) return; // Prevent multiple syncs

  setIsSyncing(true);
  const pendingSales = await getOfflineSales();
  setPendingSaleCount(pendingSales.length);

  if (pendingSales.length === 0) {
    setIsSyncing(false);
    return;
  }

  toast({ title: 'Syncing...', description: `Uploading ${pendingSales.length} offline sale(s).` });

  let successCount = 0;
  for (const billData of pendingSales) {
    try {
      await processSaleMutation.mutateAsync(billData);
      await deleteSyncedSale(billData.billId);
      successCount++;
    } catch (error) {
      console.error(`Failed to sync sale ${billData.billId}:`, error);
      toast({
        title: 'Sync Error',
        description: `Could not sync sale ${billData.billId}. It will be retried later.`,
        variant: 'destructive',
      });
    }
  }
  
  if (successCount > 0) {
      toast({
          title: 'Sync Complete',
          description: `${successCount} sale(s) successfully synced.`,
          className: "bg-green-100 border-green-400",
      });
  }

  const remainingSales = await getOfflineSales();
  setPendingSaleCount(remainingSales.length);
  setIsSyncing(false);
}, [isSyncing, user, processSaleMutation, toast, queryClient]);

// Add this new `useEffect` hook inside your component

useEffect(() => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    setIsOffline(!isOnline);
    if (isOnline) {
      toast({ title: "You are back online!", description: "Checking for pending sales to sync." });
      syncOfflineSales(); // Attempt to sync when connection is restored
    } else {
      toast({ title: "You are offline", description: "Sales will be saved locally.", variant: "destructive" });
    }
  };
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check on component load
  getOfflineSales().then(sales => setPendingSaleCount(sales.length));
  if (navigator.onLine) {
      syncOfflineSales();
  }
  
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
}, [syncOfflineSales, toast]);

  const sendEmailMutation = useMutation({
    mutationFn: async (vars: { customerEmail: string; customerName: string; billId: string; pdfBase64: string }) => {
      const { error } = await supabase.functions.invoke('send-invoice', {
        body: vars,
      });
      if (error) throw new Error(`Failed to send email: ${error.message}`);
    },
    onSuccess: () => {
      toast({ title: 'Email Sent!', description: 'The invoice has been sent to the customer.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Email Failed', description: error.message, variant: 'destructive' });
    }
  });

  // Handle barcode scanning
  const handleBarcodeScanned = (barcode: string) => {
    const item = inventoryItems.find(i => i.barcode === barcode);
    if (item) {
      addToCart(item.id, 1);
      toast({ title: 'Item Added', description: `${item.item_name} added to cart` });
    } else {
      toast({ title: 'Not Found', description: `No product with barcode ${barcode}`, variant: 'destructive' });
    }
  };

  // Start barcode scanning
  const startBarcodeScan = async () => {
    try {
      await startScanning(handleBarcodeScanned);
      setShowBarcodeScanner(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera",
        variant: "destructive"
      });
    }
  };

  // Stop barcode scanning
  const stopBarcodeScan = () => {
    stopScanning();
    setShowBarcodeScanner(false);
  };

  // --- Memoized Calculations ---
  const filteredInventoryItems = useMemo(() => {
    if (!searchTerm) return inventoryItems;
    const lowercasedFilter = searchTerm.toLowerCase();
    return inventoryItems.filter(item =>
        item.item_name.toLowerCase().includes(lowercasedFilter) ||
        item.category.toLowerCase().includes(lowercasedFilter) ||
        item.barcode?.includes(lowercasedFilter)
    );
  }, [searchTerm, inventoryItems]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    const billItems: BillItem[] = cart.map(item => {
        const basePrice = item.cart_quantity * item.unit_price;
        subtotal += basePrice;
        return {
            id: item.id, 
            item_name: item.item_name, 
            cart_quantity: item.cart_quantity,
            unit_price: item.unit_price, 
            total_price: basePrice, 
            final_amount: basePrice,
        };
    });
    return { items: billItems, subtotal, finalAmount: subtotal };
  }, [cart]);


  // --- Handlers & Logic ---
  const addToCart = (itemId: string, quantity: number) => {
    const itemToAdd = inventoryItems.find(i => i.id === itemId);
    if (!itemToAdd) return;

    const existingItem = cart.find(i => i.id === itemId);
    const availableStock = itemToAdd.quantity - (existingItem?.cart_quantity || 0);

    if (quantity > availableStock) {
      toast({ title: "Stock Alert", description: `Only ${availableStock} more units available.`, variant: "destructive" });
      return;
    }

    if (existingItem) {
      setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: i.cart_quantity + quantity } : i));
    } else {
      setCart([...cart, { ...itemToAdd, cart_quantity: quantity }]);
    }
  };
  
  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    const itemInCart = cart.find(i => i.id === itemId);
    const inventoryItem = inventoryItems.find(i => i.id === itemId);
    if (!itemInCart || !inventoryItem) return;

    if (newQuantity <= 0) {
      setCart(cart.filter(i => i.id !== itemId));
    } else if (newQuantity > inventoryItem.quantity) {
      toast({ title: "Out of Stock", description: `Only ${inventoryItem.quantity} units available.`, variant: "destructive" });
    } else {
      setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: newQuantity } : i));
    }
  };
  
  // const proceedToPayment = () => {
  //   if (cart.length === 0) {
  //     toast({ title: "Empty Cart", description: "Please add items to the cart first.", variant: "destructive" });
  //     return;
  //   }
  //   if (!customer.name || !customer.phone) {
  //       toast({ title: "Customer Info Missing", description: "Please enter customer name and phone number.", variant: "destructive" });
  //       return;
  //   }
  //   setShowPaymentDialog(true);
  // };
  
  // Find this function...
// const proceedToPayment = () => {
//     if (cart.length === 0) {
//       toast({ title: "Empty Cart", /* ... */ });
//       return;
//     }
//     if (!customer.name || !customer.phone) {
//         toast({ title: "Customer Info Missing", /* ... */ });
//         return;
//     }
//     setShowPaymentDialog(true);
// };

// ...and MODIFY it to look like this:
const proceedToPayment = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to the cart first.", variant: "destructive" });
      return;
    }
    if (!customer.name || !customer.phone) {
        toast({ title: "Customer Info Missing", description: "Please enter customer name and phone number.", variant: "destructive" });
        setActiveTab('customer'); // Also a good idea to switch to the customer tab
        return;
    }
    
    // Generate the ID ONCE and store it in state
    setTransactionId(`INV-${Date.now()}`); 
    
    // Now, show the dialog
    setShowPaymentDialog(true);
  };

  // const completeSale = async (paymentMethod: 'cash' | 'online') => {
  //   const billData: BillData = {
  //     billId: `INV-${Date.now()}`,
  //     items: cartTotals.items,
  //     customer,
  //     subtotal: cartTotals.subtotal,
  //     finalAmount: cartTotals.finalAmount,
  //     notes,
  //     timestamp: new Date(),
  //     companyInfo,
  //     paymentMethod,
  //   };
    
  //   try {
  //     // These can run in parallel
  //     await Promise.all([
  //         updateInventoryMutation.mutateAsync(cart),
  //         saveSaleMutation.mutateAsync({ billData })
  //     ]);
      
  //     setCompletedBill(billData);
  //     setShowPaymentDialog(false);
  //     setShowSaleSuccessDialog(true);

  //     toast({
  //         title: "Transaction Complete!", 
  //         description: "Sale recorded successfully.",
  //         className: "bg-green-100 border-green-400",
  //     });
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       toast({ title: "Transaction Failed", description: error.message, variant: "destructive" });
  //     } else {
  //       toast({ title: "Transaction Failed", description: "An unknown error occurred.", variant: "destructive" });
  //     }
  //   }
  // };
  // DELETE your entire old `completeSale` function.
// REPLACE it with this new, smarter version.

const completeSale = async (paymentMethod: 'cash' | 'online') => {
  if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
  }

  const billData: BillData = {
    billId: `INV-${Date.now()}`,
    items: cartTotals.items,
    customer,
    subtotal: cartTotals.subtotal,
    finalAmount: cartTotals.finalAmount,
    notes,
    timestamp: new Date(),
    companyInfo,
    paymentMethod,
    userId: user.id, // IMPORTANT: Pass the user ID
  };

  setCompletedBill(billData);
  setShowPaymentDialog(false);

  if (isOffline) {
    // --- OFFLINE PATH ---
    try {
      await saveSaleOffline(billData);
      setLastSaleWasOffline(true);
      setPendingSaleCount(prev => prev + 1);
      setShowSaleSuccessDialog(true);
    } catch (error) {
      toast({ title: "Offline Save Failed", variant: "destructive" });
    }
  } else {
    // --- ONLINE PATH ---
    try {
      await processSaleMutation.mutateAsync(billData);
      setLastSaleWasOffline(false);
      setShowSaleSuccessDialog(true);
    } catch (error: any) {
      toast({ title: "Transaction Failed", description: error.message, variant: "destructive" });
    }
  }
};

  const resetSale = () => {
    setCart([]);
    setCustomer({ name: '', phone: '', email: '', address: '' });
    setNotes('');
    setSearchTerm('');
  };

  const generatePdfInvoice = (bill: BillData | null, outputType: 'save' | 'base64' = 'save') => {
    if (!bill) return null;
    const doc = new jsPDF();
    const tableData = bill.items.map((item, i) => [
        i + 1,
        item.item_name,
        item.cart_quantity,
        `${item.unit_price.toFixed(2)}`,
        `${item.final_amount.toFixed(2)}`,
    ]);

    // Header
    doc.setFontSize(20);
    doc.text(bill.companyInfo.name, 14, 22);
    doc.setFontSize(10);
    doc.text(bill.companyInfo.address, 14, 30);
    doc.text(`Phone: ${bill.companyInfo.phone}`, 14, 36);
    doc.line(14, 40, 196, 40);

    // Invoice Info
    doc.setFontSize(12);
    doc.text('Invoice', 196, 46, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Invoice No: ${bill.billId}`, 14, 55);
    doc.text(`Date: ${format(bill.timestamp, 'dd MMM yyyy, hh:mm a')}`, 14, 61);

    // Customer Info
    doc.text('Bill To:', 196, 55, { align: 'right' });
    doc.text(bill.customer.name, 196, 61, { align: 'right' });
    doc.text(bill.customer.phone, 196, 67, { align: 'right' });
    
    // Items Table
    // Items Table
autoTable(doc, { // This is the new, correct way to call it
    startY: 80,
    head: [['Sr.', 'Description', 'Qty', 'Rate', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [38, 38, 38] },
});

    // Totals
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, 150, finalY + 24);
    doc.text(`${bill.finalAmount.toFixed(2)}`, 196, finalY + 24, { align: 'right' });
    
    // Payment Method
    doc.setFontSize(10);
    doc.text(`Payment Method: ${bill.paymentMethod === 'cash' ? 'Cash' : 'Online'}`, 14, finalY + 35);
    
    // Bank Details
    if (bill.companyInfo.bank_name) {
      doc.text(`Bank Name: ${bill.companyInfo.bank_name}`, 14, finalY + 45);
      doc.text(`Account No: ${bill.companyInfo.account_number}`, 14, finalY + 51);
      doc.text(`IFSC Code: ${bill.companyInfo.ifsc_code}`, 14, finalY + 57);
    }
    
    // Terms
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 14, finalY + 70);
    
    if (outputType === 'save') {
      doc.save(`invoice-${bill.billId}.pdf`);
      return null;
    } else if (outputType === 'base64') {
      return doc.output('datauristring').split(',')[1];
    }
    return null;
  };
  
  const handleSendEmail = () => {
    if (!completedBill || !completedBill.customer.email) {
      toast({ title: "Error", description: "Customer email is not available.", variant: "destructive"});
      return;
    }
    const pdfBase64 = generatePdfInvoice(completedBill, 'base64');
    if (pdfBase64) {
      sendEmailMutation.mutate({
        customerEmail: completedBill.customer.email,
        customerName: completedBill.customer.name,
        billId: completedBill.billId,
        pdfBase64: pdfBase64,
      });
    }
  };

  const viewSaleDetails = (sale: Sale) => {
    try {
      const billData = typeof sale.bill_data === 'string' ? JSON.parse(sale.bill_data) : sale.bill_data;
      setSelectedSale({ ...sale, bill_data: billData });
      setShowSaleHistoryDialog(true);
    } catch (error) {
        toast({ title: "Error", description: "Could not load sale details. Data might be malformed.", variant: "destructive" });
    }
  };

  if (isInventoryLoading) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Store className="h-8 w-8 text-primary"/> Point of Sale
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">A modern POS for seamless transaction management</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
  {isOffline && <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2"><ServerOff className="h-4 w-4"/>Offline Mode</Badge>}
  {pendingSaleCount > 0 && !isOffline && (
      <Button onClick={syncOfflineSales} variant="outline" disabled={isSyncing}>
          {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <UploadCloud className="h-4 w-4 mr-2"/>}
          Sync {pendingSaleCount} Sale(s)
      </Button>
  )}
  <Button onClick={startBarcodeScan} variant="outline" className="bg-white dark:bg-gray-800">
    <Camera className="h-4 w-4 mr-2"/> Scan Barcode
  </Button>
  <Button onClick={() => setShowCompanyDialog(true)} variant="outline" className="bg-white dark:bg-gray-800">
    <FileText className="h-4 w-4 mr-2"/> Company Info
  </Button>
</div>
        </header>
        
        {/* The rest of your JSX remains the same... */}
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Product Selection */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Product Catalog</CardTitle>
                        <CardDescription>Search or click on a product to add it to the cart</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, category, barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto py-4">
                {filteredInventoryItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredInventoryItems.map(item => (
                            <Card 
                              key={item.id} 
                              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800"
                              onClick={() => addToCart(item.id, 1)}
                            >
                                <CardContent className="p-3 flex flex-col justify-between h-32">
                                    <div>
                                        <h3 className="font-semibold text-sm truncate">{item.item_name}</h3>
                                        <p className="text-xs text-gray-500">{item.category}</p>
                                        <p className="font-bold text-base my-1">₹{item.unit_price.toFixed(2)}</p>
                                    </div>
                                    <div className="mt-1">
                                        <Badge 
                                          variant={item.quantity > 10 ? 'default' : item.quantity > 0 ? 'warning' : 'destructive'} 
                                          className="text-xs"
                                        >
                                            Stock: {item.quantity}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/>
                        <p className="mt-4">No products found matching your search</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Cart & Checkout */}
           <div className="lg:col-span-1">
            <Card className="sticky top-24 border border-gray-200 dark:border-gray-800 shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="cart" className="flex items-center"><ShoppingCart className="h-4 w-4 mr-1"/>Cart ({cart.length})</TabsTrigger>
                  <TabsTrigger value="customer" className="flex items-center"><User className="h-4 w-4 mr-1"/>Customer</TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center"><History className="h-4 w-4 mr-1"/>History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cart" className="p-4">
                  <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                    {cart.length === 0 ? (
                        <div className="text-center py-10">
                            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your cart is empty</p>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{item.item_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">₹{item.unit_price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1 border rounded-md">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7" 
                                  onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, item.cart_quantity - 1); }}
                                >
                                  <Minus className="h-3 w-3"/>
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">{item.cart_quantity}</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7" 
                                  onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, item.cart_quantity + 1); }}
                                >
                                  <Plus className="h-3 w-3"/>
                                </Button>
                            </div>
                            <p className="w-16 text-right font-medium">₹{(item.cart_quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                      <div className="mt-4 border-t pt-4 space-y-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{cartTotals.finalAmount.toFixed(2)}</span>
                          </div>
                          <Button onClick={proceedToPayment} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                            <CreditCard className="h-4 w-4 mr-2"/> Proceed to Checkout
                          </Button>
                      </div>
                  )}
                </TabsContent>

                <TabsContent value="customer" className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div><Label htmlFor="c-name">Name *</Label><Input id="c-name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
                  <div><Label htmlFor="c-phone">Phone *</Label><Input id="c-phone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
                  <div><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} /></div>
                  <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
                </TabsContent>
                
                <TabsContent value="history" className="p-4">
                    {isHistoryLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-primary"/>
                      </div>
                    ) : salesHistory.length === 0 ? (
                      <div className="text-center py-10">
                        <History className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No sales history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {salesHistory.map(sale => (
                            <div 
                              key={sale.id} 
                              className="text-sm p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                              onClick={() => viewSaleDetails(sale)}
                            >
                                <div className="flex justify-between font-semibold">
                                    <span>{sale.customer_name}</span>
                                    <span>₹{sale.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>{sale.bill_data?.billId || 'Legacy Sale'}</span>
                                    <span>{format(new Date(sale.created_at), 'dd MMM, hh:mm a')}</span>
                                </div>
                            </div>
                        ))}
                      </div>
                    )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </main>
        
        {/* --- Dialogs --- */}
        <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Company Information</DialogTitle>
              <DialogDescription>This information will appear on your invoices. It is saved on this device.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Company Name *</Label><Input value={companyInfo.name} onChange={e => setCompanyInfo(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Address *</Label><Textarea value={companyInfo.address} onChange={e => setCompanyInfo(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
              <div><Label>Phone *</Label><Input value={companyInfo.phone} onChange={e => setCompanyInfo(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" value={companyInfo.email} onChange={e => setCompanyInfo(p => ({ ...p, email: e.target.value }))} /></div>
              
              <div className="pt-4 border-t mt-4">
                <h3 className="font-medium mb-3">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>UPI ID</Label><Input placeholder="your-vpa@okbank" value={companyInfo.upi_id || ''} onChange={e => setCompanyInfo(p => ({ ...p, upi_id: e.target.value }))} /></div>
                  <div><Label>Bank Name</Label><Input value={companyInfo.bank_name || ''} onChange={e => setCompanyInfo(p => ({ ...p, bank_name: e.target.value }))} /></div>
                  <div><Label>Account Number</Label><Input value={companyInfo.account_number || ''} onChange={e => setCompanyInfo(p => ({ ...p, account_number: e.target.value }))} /></div>
                  <div><Label>IFSC Code</Label><Input value={companyInfo.ifsc_code || ''} onChange={e => setCompanyInfo(p => ({ ...p, ifsc_code: e.target.value }))} /></div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleSaveCompanyInfo}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              >
                <Save className="h-4 w-4 mr-2"/> Save Information
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* The rest of your Dialogs remain unchanged... */}
        
        {/* <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Complete Payment</DialogTitle>
                  <DialogDescription>Choose a payment method to finalize the sale</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="upi" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                        <TabsTrigger value="upi"><QrCode className="h-4 w-4 mr-2"/>UPI / QR</TabsTrigger>
                        <TabsTrigger value="cash"><CreditCard className="h-4 w-4 mr-2"/>Cash</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upi" className="text-center p-4 space-y-4">
                        <p>Scan the QR code to pay <strong className="text-lg">₹{cartTotals.finalAmount.toFixed(2)}</strong>.</p>
                        <div className="p-4 bg-white inline-block rounded-lg border-2 border-dashed border-gray-300">
                            <QRCodeSVG
                                value={`upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=${`INV-${Date.now()}`}`}
                                size={200}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                            />
                        </div>
                        <p className="text-xs text-gray-500">To: {companyInfo.upi_id}</p>
                        {saveSaleMutation.isPending || updateInventoryMutation.isPending ? (
                            <Button disabled className="w-full bg-gradient-to-r from-blue-600 to-indigo-700">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>Awaiting Confirmation...
                            </Button>
                        ) : (
                            <Button 
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                              onClick={() => completeSale('online')}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Payment
                            </Button>
                        )}
                        <p className="text-xs text-gray-500 italic">In a real app, this would auto-confirm via a webhook</p>
                    </TabsContent>
                    <TabsContent value="cash" className="p-4 space-y-4">
                        <div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <p className="text-gray-600 dark:text-gray-400">Total Amount Due</p>
                            <p className="text-4xl font-bold text-primary">₹{cartTotals.finalAmount.toFixed(2)}</p>
                        </div>
                        {saveSaleMutation.isPending || updateInventoryMutation.isPending ? (
                             <Button disabled className="w-full bg-gradient-to-r from-blue-600 to-indigo-700">
                               <Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...
                             </Button>
                        ) : (
                             <Button 
                               className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                               onClick={() => completeSale('cash')}
                             >
                               <Check className="h-4 w-4 mr-2"/>Confirm Cash Payment
                             </Button>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
         */}
         // REPLACE your entire Payment Dialog with this corrected version

{/* <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Choose a payment method to finalize the sale</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upi" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="upi"><QrCode className="h-4 w-4 mr-2"/>UPI / QR</TabsTrigger>
                <TabsTrigger value="cash"><CreditCard className="h-4 w-4 mr-2"/>Cash</TabsTrigger>
            </TabsList>
            <TabsContent value="upi" className="text-center p-4 space-y-4">
                <p>Scan the QR code to pay <strong className="text-lg">₹{cartTotals.finalAmount.toFixed(2)}</strong>.</p>
                <div className="p-4 bg-white inline-block rounded-lg border-2 border-dashed border-gray-300">
                    <QRCodeSVG
                        value={`upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=${`INV-${Date.now()}`}`}
                        size={200}
                    />
                </div>
                <p className="text-xs text-gray-500">To: {companyInfo.upi_id}</p>
                
                <Button 
                  className="w-full"
                  onClick={() => completeSale('online')}
                  disabled={processSaleMutation.isPending && !isOffline}
                >
                    {(processSaleMutation.isPending && !isOffline) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {isOffline ? 'Save Sale Offline' : 'Confirm Payment'}
                </Button>
            </TabsContent>
            <TabsContent value="cash" className="p-4 space-y-4">
                <div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-400">Total Amount Due</p>
                    <p className="text-4xl font-bold text-primary">₹{cartTotals.finalAmount.toFixed(2)}</p>
                </div>
                
                 <Button 
                   className="w-full"
                   onClick={() => completeSale('cash')}
                   disabled={processSaleMutation.isPending && !isOffline}
                 >
                   {(processSaleMutation.isPending && !isOffline) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-2"/>}
                   {isOffline ? 'Save Sale Offline' : 'Confirm Cash Payment'}
                 </Button>
            </TabsContent>
        </Tabs>
    </DialogContent>
</Dialog> */}
// REPLACE your entire Payment Dialog with this corrected version

<Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Choose a payment method to finalize the sale</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upi" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="upi"><QrCode className="h-4 w-4 mr-2"/>UPI / QR</TabsTrigger>
                <TabsTrigger value="cash"><CreditCard className="h-4 w-4 mr-2"/>Cash</TabsTrigger>
            </TabsList>
            <TabsContent value="upi" className="text-center p-4 space-y-4">
                <p>Scan the QR code to pay <strong className="text-lg">₹{cartTotals.finalAmount.toFixed(2)}</strong>.</p>
                <div className="p-4 bg-white inline-block rounded-lg border-2 border-dashed border-gray-300">
                    <QRCodeSVG
                        // --- CORRECTED LOGIC HERE ---
                        value={`upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=${transactionId}`}
                        size={200}
                    />
                </div>
                <p className="text-xs text-gray-500">To: {companyInfo.upi_id}</p>
                
                <Button 
                  className="w-full"
                  onClick={() => completeSale('online')}
                  disabled={processSaleMutation.isPending && !isOffline}
                >
                    {(processSaleMutation.isPending && !isOffline) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {isOffline ? 'Save Sale Offline' : 'Confirm Payment'}
                </Button>
            </TabsContent>
            <TabsContent value="cash" className="p-4 space-y-4">
                <div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-400">Total Amount Due</p>
                    <p className="text-4xl font-bold text-primary">₹{cartTotals.finalAmount.toFixed(2)}</p>
                </div>
                 <Button 
                   className="w-full"
                   onClick={() => completeSale('cash')}
                   disabled={processSaleMutation.isPending && !isOffline}
                 >
                   {(processSaleMutation.isPending && !isOffline) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-2"/>}
                   {isOffline ? 'Save Sale Offline' : 'Confirm Cash Payment'}
                 </Button>
            </TabsContent>
        </Tabs>
    </DialogContent>
</Dialog>

<Dialog open={showSaleSuccessDialog} onOpenChange={setShowSaleSuccessDialog}>
  <DialogContent className="max-w-lg">
    <DialogHeader className="text-center">
      {lastSaleWasOffline ? (
        <UploadCloud className="h-16 w-16 mx-auto text-blue-500 bg-blue-100 p-3 rounded-full"/>
      ) : (
        <Sparkles className="h-16 w-16 mx-auto text-green-500 bg-green-100 p-3 rounded-full"/>
      )}
      <DialogTitle className="text-2xl mt-4">
        {lastSaleWasOffline ? "Sale Saved Offline!" : "Transaction Successful!"}
      </DialogTitle>
      <DialogDescription>
        {lastSaleWasOffline 
          ? "This sale will be automatically uploaded when you're back online."
          : "The sale has been recorded on the server."
        }
      </DialogDescription>
    </DialogHeader>
    <div className="py-6 space-y-3">
      <Button 
        className="w-full" 
        variant="outline" 
        onClick={() => generatePdfInvoice(completedBill, 'save')}
      >
        <Download className="h-4 w-4 mr-2"/>Download PDF Invoice
      </Button>
      {/* {completedBill?.customer.email && (
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleSendEmail}
          disabled={sendEmailMutation.isPending || lastSaleWasOffline}
        >
          {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Mail className="h-4 w-4 mr-2"/>}
          Send Invoice via Email
          {lastSaleWasOffline && <span className="text-xs ml-2">(Online only)</span>}
        </Button>
      )} */}
    </div>
    <DialogFooter>
      <Button 
        className="w-full"
        onClick={() => {
          setShowSaleSuccessDialog(false);
          resetSale(); // Important: Reset the form for the next sale!
        }}
      >
        <Plus className="h-4 w-4 mr-2"/>Start New Sale
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
        <Dialog open={showSaleHistoryDialog} onOpenChange={setShowSaleHistoryDialog}>
          <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Sale Details</DialogTitle>
                <DialogDescription>Invoice ID: {selectedSale?.bill_data?.billId}</DialogDescription>
              </DialogHeader>
              {selectedSale && selectedSale.bill_data && (
                  <div className="py-4 max-h-[70vh] overflow-y-auto">
                    <div className="border rounded-lg p-6 bg-white text-sm">
                        <div className="text-center mb-6 border-b pb-4">
                            <h2 className="text-xl font-bold">{selectedSale.bill_data.companyInfo.name}</h2>
                            <p className="text-xs text-gray-600">{selectedSale.bill_data.companyInfo.address}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <h3 className="font-semibold">Bill To:</h3>
                                <p>{selectedSale.bill_data.customer.name}</p>
                                <p>{selectedSale.bill_data.customer.phone}</p>
                                {selectedSale.bill_data.customer.email && (
                                  <p>{selectedSale.bill_data.customer.email}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p><strong>Date:</strong> {format(new Date(selectedSale.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                                <p><strong>Status:</strong> <Badge>{selectedSale.payment_status}</Badge></p>
                            </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSale.bill_data.items.map((item: BillItem, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.item_name}</TableCell>
                                <TableCell>{item.cart_quantity}</TableCell>
                                <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">₹{item.final_amount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex justify-end mt-4 pt-4 border-t">
                          <div className="w-64">
                            <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                              <span>Grand Total:</span>
                              <span>₹{selectedSale.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>
              )}
              <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => generatePdfInvoice(selectedSale?.bill_data, 'save')}
                    className="bg-white dark:bg-gray-800"
                  >
                      <Download className="h-4 w-4 mr-2"/> Download Again
                  </Button>
                  <Button onClick={() => setShowSaleHistoryDialog(false)}>Close</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Barcode Scanner Dialog */}
        <Dialog open={showBarcodeScanner} onOpenChange={stopBarcodeScan}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" /> Barcode Scanner
              </DialogTitle>
              <DialogDescription>
                Point your camera at a product barcode
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-dashed border-white rounded-lg w-64 h-32" />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={stopBarcodeScan} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              >
                Close Scanner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Sales;