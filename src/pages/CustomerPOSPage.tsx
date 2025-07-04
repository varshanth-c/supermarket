// import React, { useState, useEffect, useMemo } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Badge } from '@/components/ui/badge';
// import { Textarea } from '@/components/ui/textarea';
// import {
//   Plus, ShoppingCart, Camera, Download, Send, Save, Check,
//   Loader2, Minus, User, QrCode, CreditCard, Store, Sparkles, ServerOff, CheckCircle, Mail, Search
// } from 'lucide-react';
// import { Navbar } from '@/components/Navbar';
// import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { QRCodeSVG } from 'qrcode.react';
// import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
// import { format } from 'date-fns';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import { ADMIN_USER_ID } from '@/contexts/AuthContext';
// // --- Type Definitions (kept from original) ---
// interface InventoryItem {
//   id: string;
//   item_name: string;
//   category: string;
//   quantity: number;
//   unit_price: number;
//   barcode?: string | null;
// }

// interface CartItem extends InventoryItem {
//   cart_quantity: number;
// }

// interface Customer {
//   name: string;
//   phone: string;
//   email: string;
//   address: string;
// }

// interface CompanyInfo {
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   upi_id?: string;
//   bank_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
// }

// interface BillItem {
//   id: string;
//   item_name: string;
//   cart_quantity: number;
//   unit_price: number;
//   total_price: number;
//   final_amount: number;
// }

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


// const CustomerPOSPage = () => {
//   const { toast } = useToast();
//   const { user } = useAuth();
//   const queryClient = useQueryClient();
//   const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();

//   // --- State Management ---
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', address: '' });
//   const [notes, setNotes] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Load company info from localStorage. This is needed for invoices.
//   const [companyInfo] = useState<CompanyInfo>(() => {
//     const savedCompanyInfo = localStorage.getItem('companyInfo');
//     return savedCompanyInfo ? JSON.parse(savedCompanyInfo) : {
//       name: 'Your Company Name',
//       address: '123 Business St, Commerce City, 12345',
//       phone: '9876543210',
//       email: 'contact@yourcompany.com',
//       upi_id: 'varshanthgowdaml@oksbi',
//       bank_name: 'Your Bank Name',
//       account_number: 'XXXXXXX1234',
//       ifsc_code: 'ABCD0123456'
//     };
//   });

//   const [activeTab, setActiveTab] = useState('cart');
//   const [isOffline] = useState(!navigator.onLine);
  
//   // Dialog visibility states
//   const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
//   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
//   const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false);

//   // Sale-specific state
//   const [completedBill, setCompletedBill] = useState<BillData | null>(null);
  
//   // --- Data Fetching & Mutations with Tanstack Query ---
//   // Inventory is still needed for the product catalog
//   const { data: inventoryItems = [], isLoading: isInventoryLoading } = useQuery({
//     queryKey: ['inventory', ADMIN_USER_ID],
//     queryFn: async () => {
//       const { data, error } = await supabase.from('inventory').select('*').eq('user_id', ADMIN_USER_ID).order('item_name');
//       if (error) throw new Error(error.message);
//       return data || [];
//     },
//     enabled: !!ADMIN_USER_ID,
//   });

//   // REMOVED: Sales history query is not needed for this user role.

//   const saveSaleMutation = useMutation({
//     mutationFn: async ({ billData }: { billData: BillData }) => {
//       const { data, error } = await supabase
//         .from('sales')
//         .insert({
//           user_id: user!.id,
//           customer_name: billData.customer.name,
//           customer_phone: billData.customer.phone,
//           customer_email: billData.customer.email,
//           items: JSON.stringify(billData.items),
//           total_amount: billData.finalAmount,
//           bill_data: JSON.stringify(billData),
//           payment_status: 'completed',
//         })
//         .select()
//         .single();
//       if (error) throw new Error(error.message);
//       return data;
//     },
//     // No need to invalidate sales-history query as it doesn't exist here
//   });

//   const updateInventoryMutation = useMutation({
//     mutationFn: async (items: CartItem[]) => {
//       const updates = items.map(item =>
//         supabase.from('inventory').update({ quantity: item.quantity - item.cart_quantity }).eq('id', item.id)
//       );
//       const results = await Promise.all(updates);
//       results.forEach(({ error }) => { if (error) throw new Error(error.message); });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['inventory'] });
//     },
//   });
  
//   const sendEmailMutation = useMutation({
//     mutationFn: async (vars: { customerEmail: string; customerName: string; billId: string; pdfBase64: string }) => {
//       const { error } = await supabase.functions.invoke('send-invoice', {
//         body: vars,
//       });
//       if (error) throw new Error(`Failed to send email: ${error.message}`);
//     },
//     onSuccess: () => {
//       toast({ title: 'Email Sent!', description: 'The invoice has been sent to the customer.' });
//     },
//     onError: (error: Error) => {
//       toast({ title: 'Email Failed', description: error.message, variant: 'destructive' });
//     }
//   });

//   const handleBarcodeScanned = (barcode: string) => {
//     const item = inventoryItems.find(i => i.barcode === barcode);
//     if (item) {
//       addToCart(item.id, 1);
//       toast({ title: 'Item Added', description: `${item.item_name} added to cart` });
//     } else {
//       toast({ title: 'Not Found', description: `No product with barcode ${barcode}`, variant: 'destructive' });
//     }
//   };

//   const startBarcodeScan = async () => {
//     try {
//       await startScanning(handleBarcodeScanned);
//       setShowBarcodeScanner(true);
//     } catch (error) {
//       toast({ title: "Camera Error", description: "Unable to access camera", variant: "destructive" });
//     }
//   };

//   const stopBarcodeScan = () => {
//     stopScanning();
//     setShowBarcodeScanner(false);
//   };

//   const filteredInventoryItems = useMemo(() => {
//     if (!searchTerm) return inventoryItems;
//     const lowercasedFilter = searchTerm.toLowerCase();
//     return inventoryItems.filter(item =>
//         item.item_name.toLowerCase().includes(lowercasedFilter) ||
//         item.category.toLowerCase().includes(lowercasedFilter) ||
//         item.barcode?.includes(lowercasedFilter)
//     );
//   }, [searchTerm, inventoryItems]);

//   const cartTotals = useMemo(() => {
//     let subtotal = 0;
//     const billItems: BillItem[] = cart.map(item => {
//         const basePrice = item.cart_quantity * item.unit_price;
//         subtotal += basePrice;
//         return {
//             id: item.id, item_name: item.item_name, cart_quantity: item.cart_quantity,
//             unit_price: item.unit_price, total_price: basePrice, final_amount: basePrice,
//         };
//     });
//     return { items: billItems, subtotal, finalAmount: subtotal };
//   }, [cart]);

//   const addToCart = (itemId: string, quantity: number) => {
//     const itemToAdd = inventoryItems.find(i => i.id === itemId);
//     if (!itemToAdd) return;
//     const existingItem = cart.find(i => i.id === itemId);
//     const availableStock = itemToAdd.quantity - (existingItem?.cart_quantity || 0);
//     if (quantity > availableStock) {
//       toast({ title: "Stock Alert", description: `Only ${availableStock} more units available.`, variant: "destructive" });
//       return;
//     }
//     if (existingItem) {
//       setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: i.cart_quantity + quantity } : i));
//     } else {
//       setCart([...cart, { ...itemToAdd, cart_quantity: quantity }]);
//     }
//   };
  
//   const updateCartQuantity = (itemId: string, newQuantity: number) => {
//     const itemInCart = cart.find(i => i.id === itemId);
//     const inventoryItem = inventoryItems.find(i => i.id === itemId);
//     if (!itemInCart || !inventoryItem) return;
//     if (newQuantity <= 0) {
//       setCart(cart.filter(i => i.id !== itemId));
//     } else if (newQuantity > inventoryItem.quantity) {
//       toast({ title: "Out of Stock", description: `Only ${inventoryItem.quantity} units available.`, variant: "destructive" });
//     } else {
//       setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: newQuantity } : i));
//     }
//   };
//   const processSaleMutation = useMutation({
//     mutationFn: async (payload: { cartItems: any[]; customer: any; billData: any; }) => {
//       const { data, error } = await supabase.functions.invoke('process-sale', {
//         body: payload,
//       });

//       if (error) throw new Error(error.message);
//       return data;
//     },
//     onSuccess: () => {
//       // Invalidate both inventory (for stock counts) and user-sales (for their dashboard)
//       queryClient.invalidateQueries({ queryKey: ['inventory'] });
//       queryClient.invalidateQueries({ queryKey: ['user-sales', user?.id] });
//       toast({ title: "Transaction Complete!", description: "Sale recorded and stock updated.", className: "bg-green-100 border-green-400" });
//     },
//     onError: (error: any) => {
//       toast({ title: "Transaction Failed", description: error.message, variant: "destructive" });
//     }
//   });
  
//   const proceedToPayment = () => {
//     if (cart.length === 0) {
//       toast({ title: "Empty Cart", description: "Please add items to the cart first.", variant: "destructive" });
//       return;
//     }
//     if (!customer.name || !customer.phone) {
//         toast({ title: "Customer Info Missing", description: "Please enter customer name and phone number.", variant: "destructive" });
//         return;
//     }
//     setShowPaymentDialog(true);
//   };

//    const completeSale = async (paymentMethod: 'cash' | 'online') => {
//     const billData = {
//       billId: `INV-${Date.now()}`,
//       items: cartTotals.items,
//       customer,
//       subtotal: cartTotals.subtotal,
//       finalAmount: cartTotals.finalAmount,
//       notes,
//       timestamp: new Date(),
//       companyInfo,
//       paymentMethod,
//     };

//     // Prepare the payload for the Edge Function
//     const payload = {
//       cartItems: cart.map(item => ({ id: item.id, cart_quantity: item.cart_quantity })),
//       customer: { name: customer.name, phone: customer.phone, email: customer.email },
//       billData: billData,
//     };
    
//     // Call the new mutation
//     processSaleMutation.mutate(payload, {
//       onSuccess: () => {
//         setCompletedBill(billData);
//         setShowPaymentDialog(false);
//         setShowSaleSuccessDialog(true);
//         resetSale();
//       }
//     });
//   };


//   const resetSale = () => {
//     setCart([]);
//     setCustomer({ name: '', phone: '', email: '', address: '' });
//     setNotes('');
//     setSearchTerm('');
//   };

//   const generatePdfInvoice = (bill: BillData | null, outputType: 'save' | 'base64' = 'save') => {
//     if (!bill) return null;
//     const doc = new jsPDF();
//     const tableData = bill.items.map((item, i) => [
//         i + 1, item.item_name, item.cart_quantity,
//         `₹${item.unit_price.toFixed(2)}`, `₹${item.final_amount.toFixed(2)}`,
//     ]);
//     doc.setFontSize(20); doc.text(bill.companyInfo.name, 14, 22);
//     doc.setFontSize(10); doc.text(bill.companyInfo.address, 14, 30);
//     doc.text(`Phone: ${bill.companyInfo.phone}`, 14, 36); doc.line(14, 40, 196, 40);
//     doc.setFontSize(12); doc.text('Invoice', 196, 46, { align: 'right' });
//     doc.setFontSize(10); doc.text(`Invoice No: ${bill.billId}`, 14, 55);
//     doc.text(`Date: ${format(bill.timestamp, 'dd MMM yyyy, hh:mm a')}`, 14, 61);
//     doc.text('Bill To:', 196, 55, { align: 'right' });
//     doc.text(bill.customer.name, 196, 61, { align: 'right' });
//     doc.text(bill.customer.phone, 196, 67, { align: 'right' });
//     (doc as any).autoTable({ startY: 80, head: [['Sr.', 'Description', 'Qty', 'Rate', 'Total']], body: tableData, theme: 'striped', headStyles: { fillColor: [38, 38, 38] } });
//     const finalY = (doc as any).lastAutoTable.finalY;
//     doc.setFontSize(12); doc.setFont('helvetica', 'bold');
//     doc.text(`Grand Total:`, 150, finalY + 24); doc.text(`₹${bill.finalAmount.toFixed(2)}`, 196, finalY + 24, { align: 'right' });
//     doc.setFontSize(10); doc.text(`Payment Method: ${bill.paymentMethod === 'cash' ? 'Cash' : 'Online'}`, 14, finalY + 35);
//     if (bill.companyInfo.bank_name) {
//       doc.text(`Bank Name: ${bill.companyInfo.bank_name}`, 14, finalY + 45);
//       doc.text(`Account No: ${bill.companyInfo.account_number}`, 14, finalY + 51);
//       doc.text(`IFSC Code: ${bill.companyInfo.ifsc_code}`, 14, finalY + 57);
//     }
//     doc.setFontSize(8); doc.text('Thank you for your business!', 14, finalY + 70);
//     if (outputType === 'save') { doc.save(`invoice-${bill.billId}.pdf`); return null; } 
//     else if (outputType === 'base64') { return doc.output('datauristring').split(',')[1]; }
//     return null;
//   };
  
//   const handleSendEmail = () => {
//     if (!completedBill || !completedBill.customer.email) {
//       toast({ title: "Error", description: "Customer email is not available.", variant: "destructive"}); return;
//     }
//     const pdfBase64 = generatePdfInvoice(completedBill, 'base64');
//     if (pdfBase64) {
//       sendEmailMutation.mutate({ customerEmail: completedBill.customer.email, customerName: completedBill.customer.name, billId: completedBill.billId, pdfBase64: pdfBase64 });
//     }
//   };

//   if (isInventoryLoading) return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
//       <Loader2 className="h-16 w-16 animate-spin text-primary"/>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
//       <Navbar />
//       <div className="container mx-auto p-4 sm:p-6 lg:p-8">
//         <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
//               <Store className="h-8 w-8 text-primary"/> Point of Sale
//             </h1>
//             <p className="text-gray-600 dark:text-gray-400 mt-2">Create a new transaction</p>
//           </div>
//           <div className="flex flex-wrap items-center gap-2">
//             {isOffline && <Badge variant="destructive" className="flex items-center gap-1"><ServerOff className="h-4 w-4"/>Offline Mode</Badge>}
//             <Button onClick={startBarcodeScan} variant="outline" className="bg-white dark:bg-gray-800">
//               <Camera className="h-4 w-4 mr-2"/> Scan Barcode
//             </Button>
//             {/* REMOVED: Company Info button is not for this user role */}
//           </div>
//         </header>
        
//         <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2">
//             <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
//               <CardHeader>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                     <div>
//                         <CardTitle>Product Catalog</CardTitle>
//                         <CardDescription>Search or click on a product to add it to the cart</CardDescription>
//                     </div>
//                     <div className="relative w-full sm:w-auto sm:max-w-xs">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                         <Input placeholder="Search by name, category, barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white dark:bg-gray-800" />
//                     </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="max-h-[70vh] overflow-y-auto py-4">
//                 {filteredInventoryItems.length > 0 ? (
//                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                         {filteredInventoryItems.map(item => (
//                             <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800" onClick={() => addToCart(item.id, 1)}>
//                                 <CardContent className="p-3 flex flex-col justify-between h-32">
//                                     <div>
//                                         <h3 className="font-semibold text-sm truncate">{item.item_name}</h3>
//                                         <p className="text-xs text-gray-500">{item.category}</p>
//                                         <p className="font-bold text-base my-1">₹{item.unit_price.toFixed(2)}</p>
//                                     </div>
//                                     <div className="mt-1">
//                                         <Badge variant={item.quantity > 10 ? 'default' : item.quantity > 0 ? 'secondary' : 'destructive'} className="text-xs">Stock: {item.quantity}</Badge>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="text-center py-16 text-gray-500 dark:text-gray-400">
//                         <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/>
//                         <p className="mt-4">No products found matching your search</p>
//                     </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//            <div className="lg:col-span-1">
//             <Card className="sticky top-24 border border-gray-200 dark:border-gray-800 shadow-lg">
//               <Tabs value={activeTab} onValueChange={setActiveTab}>
//                 {/* MODIFIED: grid-cols-2 to remove History */}
//                 <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
//                   <TabsTrigger value="cart" className="flex items-center"><ShoppingCart className="h-4 w-4 mr-1"/>Cart ({cart.length})</TabsTrigger>
//                   <TabsTrigger value="customer" className="flex items-center"><User className="h-4 w-4 mr-1"/>Customer</TabsTrigger>
//                   {/* REMOVED: History TabTrigger */}
//                 </TabsList>
                
//                 <TabsContent value="cart" className="p-4">
//                   <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
//                     {cart.length === 0 ? (
//                         <div className="text-center py-10">
//                             <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/>
//                             <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your cart is empty</p>
//                         </div>
//                     ) : cart.map(item => (
//                         <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
//                             <div className="flex-1">
//                                 <p className="font-semibold text-sm">{item.item_name}</p>
//                                 <p className="text-xs text-gray-500 dark:text-gray-400">₹{item.unit_price.toFixed(2)}</p>
//                             </div>
//                             <div className="flex items-center gap-1 border rounded-md">
//                                 <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, item.cart_quantity - 1); }}><Minus className="h-3 w-3"/></Button>
//                                 <span className="w-6 text-center text-sm font-medium">{item.cart_quantity}</span>
//                                 <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, item.cart_quantity + 1); }}><Plus className="h-3 w-3"/></Button>
//                             </div>
//                             <p className="w-16 text-right font-medium">₹{(item.cart_quantity * item.unit_price).toFixed(2)}</p>
//                         </div>
//                     ))}
//                   </div>
//                   {cart.length > 0 && (
//                       <div className="mt-4 border-t pt-4 space-y-2">
//                           <div className="flex justify-between font-bold text-lg">
//                             <span>Total</span>
//                             <span>₹{cartTotals.finalAmount.toFixed(2)}</span>
//                           </div>
//                           <Button onClick={proceedToPayment} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"><CreditCard className="h-4 w-4 mr-2"/> Proceed to Checkout</Button>
//                       </div>
//                   )}
//                 </TabsContent>

//                 <TabsContent value="customer" className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
//                   <div><Label htmlFor="c-name">Name *</Label><Input id="c-name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
//                   <div><Label htmlFor="c-phone">Phone *</Label><Input id="c-phone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
//                   <div><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} /></div>
//                   <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
//                 </TabsContent>
                
//                 {/* REMOVED: History TabsContent */}
//               </Tabs>
//             </Card>
//           </div>
//         </main>
        
//         {/* --- Dialogs --- */}
//         {/* REMOVED: Company Info Dialog */}

//         <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
//             <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Complete Payment</DialogTitle>
//                   <DialogDescription>Choose a payment method to finalize the sale</DialogDescription>
//                 </DialogHeader>
//                 <Tabs defaultValue="upi" className="w-full">
//                     <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
//                         <TabsTrigger value="upi"><QrCode className="h-4 w-4 mr-2"/>UPI / QR</TabsTrigger>
//                         <TabsTrigger value="cash"><CreditCard className="h-4 w-4 mr-2"/>Cash</TabsTrigger>
//                     </TabsList>
//                     <TabsContent value="upi" className="text-center p-4 space-y-4">
//                         <p>Scan the QR code to pay <strong className="text-lg">₹{cartTotals.finalAmount.toFixed(2)}</strong>.</p>
//                         <div className="p-4 bg-white inline-block rounded-lg border-2 border-dashed border-gray-300">
//                             <QRCodeSVG value={`upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=${`INV-${Date.now()}`}`} size={200} bgColor="#ffffff" fgColor="#000000" level="H" />
//                         </div>
//                         <p className="text-xs text-gray-500">To: {companyInfo.upi_id}</p>
//                         {saveSaleMutation.isPending || updateInventoryMutation.isPending ? (
//                             <Button disabled className="w-full bg-gradient-to-r from-blue-600 to-indigo-700"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Awaiting Confirmation...</Button>
//                         ) : (
//                             <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800" onClick={() => completeSale('online')}><CheckCircle className="h-4 w-4 mr-2" />Confirm Payment</Button>
//                         )}
//                         <p className="text-xs text-gray-500 italic">In a real app, this would auto-confirm via a webhook</p>
//                     </TabsContent>
//                     <TabsContent value="cash" className="p-4 space-y-4">
//                         <div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
//                             <p className="text-gray-600 dark:text-gray-400">Total Amount Due</p>
//                             <p className="text-4xl font-bold text-primary">₹{cartTotals.finalAmount.toFixed(2)}</p>
//                         </div>
//                         {saveSaleMutation.isPending || updateInventoryMutation.isPending ? (
//                              <Button disabled className="w-full bg-gradient-to-r from-blue-600 to-indigo-700"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...</Button>
//                         ) : (
//                              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800" onClick={() => completeSale('cash')}><Check className="h-4 w-4 mr-2"/>Confirm Cash Payment</Button>
//                         )}
//                     </TabsContent>
//                 </Tabs>
//             </DialogContent>
//         </Dialog>
        
//         <Dialog open={showSaleSuccessDialog} onOpenChange={setShowSaleSuccessDialog}>
//             <DialogContent className="max-w-lg">
//                 <DialogHeader className="text-center">
//                     <Sparkles className="h-16 w-16 mx-auto text-green-500 bg-green-100 p-3 rounded-full"/>
//                     <DialogTitle className="text-2xl mt-4">Transaction Successful!</DialogTitle>
//                     <DialogDescription>The sale has been completed and recorded</DialogDescription>
//                 </DialogHeader>
//                 <div className="py-6 space-y-3">
//                     <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800" variant="outline" onClick={() => generatePdfInvoice(completedBill, 'save')}><Download className="h-4 w-4 mr-2"/>Download PDF Invoice</Button>
//                     {completedBill?.customer.email && (
//                       <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800" variant="outline" onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
//                           {sendEmailMutation.isPending ? (<Loader2 className="h-4 w-4 mr-2 animate-spin"/>) : (<Mail className="h-4 w-4 mr-2"/>)} Send Invoice via Email
//                       </Button>
//                     )}
//                 </div>
//                 <DialogFooter>
//                     <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800" onClick={() => setShowSaleSuccessDialog(false)}><Plus className="h-4 w-4 mr-2"/>Start New Sale</Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>

//         {/* REMOVED: Sale History Details Dialog */}

        
//       </div>
//     </div>
//   );
// };

// export default CustomerPOSPage;

// src/pages/CustomerPOSPage.tsx

// src/pages/CustomerPOSPage.tsx

// src/pages/CustomerPOSPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, ShoppingCart, Camera, Download, Mail, Check,
  Loader2, Minus, User, QrCode, CreditCard, Store, Sparkles, CheckCircle, Search, Archive, AlertTriangle, ListRestart
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { format, formatDistanceToNow } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ADMIN_USER_ID } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// --- Type Definitions (no changes here) ---
interface InventoryItem { id: string; item_name: string; category: string; quantity: number; unit_price: number; barcode?: string | null; image_url?: string | null; }
interface CartItem extends InventoryItem { cart_quantity: number; }
interface UserProfile { id: string; name?: string; phone?: string; email?: string; address?: string; }
interface Customer { name: string; phone: string; email: string; address: string; }
interface CompanyInfo { name: string; address: string; phone: string; email: string; upi_id?: string; }
interface BillItem { id: string; item_name: string; cart_quantity: number; unit_price: number; total_price: number; final_amount: number; }
interface BillData { billId: string; items: BillItem[]; customer: Customer; subtotal: number; finalAmount: number; notes: string; timestamp: Date; companyInfo: CompanyInfo; paymentMethod: 'cash' | 'online'; }
interface PendingOrder { id: string; created_at: string; customer_info: Customer; order_items: CartItem[]; total_amount: number; }
// NEW: Define the type for the data we send to update a pending order
type PendingOrderUpdateData = Omit<PendingOrder, 'id' | 'created_at'>;


const CustomerPOSPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();

  // --- State Management (no changes here) ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', address: '' });
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [companyInfo] = useState<CompanyInfo>(() => { const saved = localStorage.getItem('companyInfo'); return saved ? JSON.parse(saved) : { name: 'Your Company', address: '123 Business St', phone: '9876543210', email: 'contact@company.com', upi_id: 'your-upi-id@okhdfcbank' }; });
  const [activeTab, setActiveTab] = useState('cart');
  const [loadedPendingOrderId, setLoadedPendingOrderId] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false);
  const [completedBill, setCompletedBill] = useState<BillData | null>(null);
  
  // --- Persistent Cart with localStorage (no changes here) ---
  useEffect(() => { const savedCart = localStorage.getItem('activeCart'); if (savedCart) { setCart(JSON.parse(savedCart)); } }, []);
  useEffect(() => { if (cart.length > 0) { localStorage.setItem('activeCart', JSON.stringify(cart)); } else { localStorage.removeItem('activeCart'); } }, [cart]);

  // --- Data Fetching & Mutations with Tanstack Query ---
  // (userProfile and inventoryItems queries remain the same)
  const { data: userProfile, isLoading: isProfileLoading } = useQuery({ queryKey: ['userProfile', user?.id], queryFn: async (): Promise<UserProfile | null> => { if (!user) return null; const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single(); if (error && error.code !== 'PGRST116') { console.error("Error fetching profile:", error); throw new Error(error.message); } return data ? { ...data, email: user.email } : null; }, enabled: !!user });
  useEffect(() => { if (userProfile && !loadedPendingOrderId) { setCustomer({ name: userProfile.name || '', phone: userProfile.phone || '', email: userProfile.email || '', address: userProfile.address || '' }); } }, [userProfile, loadedPendingOrderId]);
  const { data: inventoryItems = [], isLoading: isInventoryLoading } = useQuery({ queryKey: ['inventory', ADMIN_USER_ID], queryFn: async () => { const { data, error } = await supabase.from('inventory').select('*').eq('user_id', ADMIN_USER_ID).order('item_name'); if (error) throw new Error(error.message); return data || []; }, enabled: !!ADMIN_USER_ID });
  const { data: pendingOrders = [] } = useQuery({ queryKey: ['pendingOrders', user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('pending_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (error) throw new Error('Could not fetch held sales: ' + error.message); return data as PendingOrder[]; }, enabled: !!user });

  const createPendingOrderMutation = useMutation({
    mutationFn: async (orderData: Omit<PendingOrder, 'id' | 'created_at'> & { user_id: string }) => {
        const { error } = await supabase.from('pending_orders').insert(orderData);
        if (error) throw new Error('Could not hold sale: ' + error.message);
    },
    onSuccess: () => {
        toast({ title: "Sale Held", description: "The current sale has been saved." });
        queryClient.invalidateQueries({ queryKey: ['pendingOrders', user?.id] });
        resetSale();
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  });

  // NEW: Mutation to UPDATE an existing pending order
  const updatePendingOrderMutation = useMutation({
    mutationFn: async ({ orderId, orderData }: { orderId: string, orderData: PendingOrderUpdateData }) => {
        const { error } = await supabase.from('pending_orders').update(orderData).eq('id', orderId);
        if (error) throw new Error('Could not update held sale: ' + error.message);
    },
    onSuccess: () => {
        toast({ title: "Held Sale Updated", description: "Your changes to the held sale have been saved." });
        queryClient.invalidateQueries({ queryKey: ['pendingOrders', user?.id] });
        resetSale();
    },
    onError: (error: Error) => { toast({ title: "Update Error", description: error.message, variant: "destructive" }); }
  });

  const deletePendingOrderMutation = useMutation({
    mutationFn: async (orderId: string) => { const { error } = await supabase.from('pending_orders').delete().eq('id', orderId); if (error) throw new Error('Could not remove held sale: ' + error.message); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pendingOrders', user?.id] }); },
    onError: (error: Error) => { toast({ title: "Cleanup Error", description: error.message, variant: "destructive" }); }
  });

  const processSaleMutation = useMutation({
    mutationFn: async (payload: { cartItems: any[]; customer: any; billData: any; }) => { const { data, error } = await supabase.functions.invoke('process-sale', { body: payload }); if (error) throw new Error(`Transaction failed: ${error.message}`); return data; },
    onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['user-sales', user?.id] });
        toast({ title: "Transaction Complete!", className: "bg-green-100 border-green-400" });
        if (loadedPendingOrderId) { deletePendingOrderMutation.mutate(loadedPendingOrderId); }
        setCompletedBill(variables.billData);
        setShowPaymentDialog(false);
        setShowSaleSuccessDialog(true);
        resetSale();
    },
    onError: (error: any) => { toast({ title: "Transaction Failed", description: error.message, variant: "destructive" }); }
  });

  const sendEmailMutation = useMutation({ mutationFn: async (vars: { to: string; subject: string; html: string; pdfBase64: string; pdfName: string }) => { const { error } = await supabase.functions.invoke('send-email', { body: vars }); if (error) throw new Error(`Failed to send email: ${error.message}`); }, onSuccess: () => { toast({ title: 'Email Sent!', description: 'The invoice has been sent.' }); }, onError: (error: Error) => { toast({ title: 'Email Failed', description: error.message, variant: 'destructive' }); } });

  // --- Handlers ---
  const cartTotals = useMemo(() => { const subtotal = cart.reduce((acc, item) => acc + (item.cart_quantity * item.unit_price), 0); const billItems: BillItem[] = cart.map(item => ({ id: item.id, item_name: item.item_name, cart_quantity: item.cart_quantity, unit_price: item.unit_price, total_price: item.cart_quantity * item.unit_price, final_amount: item.cart_quantity * item.unit_price, })); return { items: billItems, subtotal, finalAmount: subtotal }; }, [cart]);
  const proceedToPayment = () => { if (cart.length === 0) { toast({ title: "Empty Cart", variant: "destructive" }); return; } if (!customer.name || !customer.phone) { toast({ title: "Customer Info Missing", variant: "destructive" }); setActiveTab('customer'); return; } setShowPaymentDialog(true); };
  
  const completeSale = async (paymentMethod: 'cash' | 'online') => {
    const billData: BillData = { billId: `INV-${Date.now()}`, items: cartTotals.items, customer, subtotal: cartTotals.subtotal, finalAmount: cartTotals.finalAmount, notes, timestamp: new Date(), companyInfo, paymentMethod };
    const payload = { cartItems: cart.map(item => ({ id: item.id, cart_quantity: item.cart_quantity })), customer: { name: customer.name, phone: customer.phone, email: customer.email }, billData: billData, };
    processSaleMutation.mutate(payload);
  };

  const resetSale = () => {
    setCart([]);
    if (userProfile) { setCustomer({ name: userProfile.name || '', phone: userProfile.phone || '', email: userProfile.email || '', address: userProfile.address || '' }); } 
    else { setCustomer({ name: '', phone: '', email: '', address: '' }); }
    setNotes('');
    setSearchTerm('');
    setLoadedPendingOrderId(null);
  };
  
  // MODIFIED: This handler is now smarter. It either creates or updates.
  const handleHoldSale = () => {
    if (!user) return;
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Cannot hold an empty sale.", variant: "destructive" });
      return;
    }
    const orderData: PendingOrderUpdateData = {
        customer_info: customer,
        order_items: cart,
        total_amount: cartTotals.finalAmount,
        status: 'pending'
    };

    if (loadedPendingOrderId) {
        // This is an existing held sale, so UPDATE it.
        updatePendingOrderMutation.mutate({ orderId: loadedPendingOrderId, orderData });
    } else {
        // This is a new sale, so CREATE it.
        createPendingOrderMutation.mutate({ ...orderData, user_id: user.id });
    }
  };
  
  const handleLoadPendingOrder = (order: PendingOrder) => {
    setCart(order.order_items || []);
    setCustomer(order.customer_info || { name: '', phone: '', email: '', address: '' });
    setLoadedPendingOrderId(order.id);
    setActiveTab('cart');
    toast({ title: "Sale Loaded", description: "The held sale is now active in your cart." });
  };
  
  const filteredInventoryItems = useMemo(() => { if (!searchTerm) return inventoryItems; const lower = searchTerm.toLowerCase(); return inventoryItems.filter(item => item.item_name.toLowerCase().includes(lower) || item.category.toLowerCase().includes(lower)); }, [searchTerm, inventoryItems]);
  const addToCart = (itemId: string, quantity: number) => { const itemToAdd = inventoryItems.find(i => i.id === itemId); if (!itemToAdd) return; const existing = cart.find(i => i.id === itemId); const stock = itemToAdd.quantity - (existing?.cart_quantity || 0); if (quantity > stock) { toast({ title: "Stock Alert", variant: "destructive" }); return; } if (existing) { setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: i.cart_quantity + quantity } : i)); } else { setCart([...cart, { ...itemToAdd, cart_quantity: quantity }]); } };
  const updateCartQuantity = (itemId: string, newQuantity: number) => { const item = inventoryItems.find(i => i.id === itemId); if (!item) return; if (newQuantity <= 0) { setCart(cart.filter(i => i.id !== itemId)); } else if (newQuantity > item.quantity) { toast({ title: "Out of Stock", variant: "destructive" }); } else { setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: newQuantity } : i)); } };

  const generatePdfInvoice = (bill: BillData | null, outputType: 'save' | 'base64' = 'save') => { if (!bill) return null; const doc = new jsPDF(); const tableData = bill.items.map((item, i) => [ i + 1, item.item_name, item.cart_quantity, `₹${item.unit_price.toFixed(2)}`, `₹${item.final_amount.toFixed(2)}`, ]); doc.setFontSize(20); doc.text(bill.companyInfo.name, 14, 22); doc.setFontSize(10); doc.text(bill.companyInfo.address, 14, 30); doc.text(`Phone: ${bill.companyInfo.phone}`, 14, 36); doc.line(14, 40, 196, 40); doc.setFontSize(12); doc.text('Invoice', 196, 46, { align: 'right' }); doc.setFontSize(10); doc.text(`Invoice No: ${bill.billId}`, 14, 55); doc.text(`Date: ${format(bill.timestamp, 'dd MMM yyyy, hh:mm a')}`, 14, 61); doc.text('Bill To:', 196, 55, { align: 'right' }); doc.text(bill.customer.name, 196, 61, { align: 'right' }); doc.text(bill.customer.phone, 196, 67, { align: 'right' }); autoTable(doc, { startY: 80, head: [['#', 'Description', 'Qty', 'Rate', 'Total']], body: tableData, theme: 'striped', headStyles: { fillColor: [38, 38, 38] } }); const finalY = (doc as any).lastAutoTable.finalY; doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`Grand Total:`, 150, finalY + 15); doc.text(`₹${bill.finalAmount.toFixed(2)}`, 196, finalY + 15, { align: 'right' }); doc.setFontSize(10); doc.text(`Payment Method: ${bill.paymentMethod === 'cash' ? 'Cash' : 'Online / UPI'}`, 14, finalY + 25); doc.setFontSize(8); doc.text('Thank you for your business!', 14, finalY + 35); if (outputType === 'save') { doc.save(`invoice-${bill.billId}.pdf`); return null; } return doc.output('datauristring').split(',')[1]; };
  const handleSendEmail = () => { if (!completedBill || !completedBill.customer.email) { toast({ title: "Error", variant: "destructive"}); return; } const pdfBase64 = generatePdfInvoice(completedBill, 'base64'); if (pdfBase64) { sendEmailMutation.mutate({ to: completedBill.customer.email, subject: `Invoice from ${completedBill.companyInfo.name}`, html: `<p>Hi ${completedBill.customer.name},</p><p>Thank you for your purchase! Your invoice is attached.</p>`, pdfBase64: pdfBase64, pdfName: `invoice-${completedBill.billId}.pdf` }); } };
  const handleBarcodeScanned = (b: string) => { stopBarcodeScan(); const i = inventoryItems.find(it => it.barcode === b); if (i) { addToCart(i.id, 1); toast({ title: 'Item Added' }); } else { toast({ title: 'Not Found', variant: 'destructive' }); } };
  const startBarcodeScan = () => { startScanning(handleBarcodeScanned).then(() => setShowBarcodeScanner(true)).catch(() => toast({ title: "Camera Error", variant: "destructive" })); };
  const stopBarcodeScan = () => { stopScanning(); setShowBarcodeScanner(false); };
  
  if (isInventoryLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary"/></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="container mx-auto p-4">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold flex items-center gap-3"><Store className="h-8 w-8 text-primary"/> Point of Sale</h1><p className="text-gray-600 dark:text-gray-400 mt-1">Create a new transaction or manage held sales.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button onClick={startBarcodeScan} variant="outline" className="bg-white dark:bg-gray-800"><Camera className="h-4 w-4 mr-2"/> Scan Barcode</Button></div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border shadow-lg"><CardHeader><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div className='flex-grow'><CardTitle>Product Catalog</CardTitle><CardDescription>Click a product to add it to the cart.</CardDescription></div><div className="relative w-full sm:w-auto sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white dark:bg-gray-800" /></div></div></CardHeader><CardContent className="max-h-[65vh] overflow-y-auto p-4">{filteredInventoryItems.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{filteredInventoryItems.map(item => (<Card key={item.id} className="overflow-hidden hover:shadow-xl hover:ring-2 hover:ring-primary transition-all cursor-pointer" onClick={() => addToCart(item.id, 1)}><CardContent className="p-3 flex flex-col justify-between h-full"><div><h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.item_name}</h3><p className="text-xs text-gray-500 mt-1">{item.category}</p><p className="font-bold text-base my-2">₹{item.unit_price.toFixed(2)}</p></div><Badge variant={item.quantity > 10 ? 'default' : item.quantity > 0 ? 'secondary' : 'destructive'} className="text-xs self-start">Stock: {item.quantity}</Badge></CardContent></Card>))}</div>) : (<div className="text-center py-16 text-gray-500"><Search className="h-12 w-12 mx-auto text-gray-300"/><p className="mt-4">No products found.</p></div>)}</CardContent></Card>
          </div>

           <div className="lg:col-span-1">
            <Card className="sticky top-20 border shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="cart" className="flex items-center gap-1.5"><ShoppingCart className="h-4 w-4"/>Cart ({cart.length})</TabsTrigger>
                  <TabsTrigger value="held" className="flex items-center gap-1.5"><Archive className="h-4 w-4"/>Held ({pendingOrders.length})</TabsTrigger>
                  <TabsTrigger value="customer" className="flex items-center gap-1.5"><User className="h-4 w-4"/>Customer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cart" className="p-4">
                    {loadedPendingOrderId && (
                        <div className="p-3 mb-4 text-sm bg-blue-50 text-blue-800 border-l-4 border-blue-500 rounded-r-md flex items-center justify-between gap-2">
                           <p>Editing a held sale.</p>
                           <Button variant="ghost" size="sm" onClick={resetSale} className="text-blue-800 hover:bg-blue-100">
                             <ListRestart className="h-4 w-4 mr-1" /> New
                           </Button>
                        </div>
                    )}
                  <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-2">
                    {cart.length === 0 ? (<div className="text-center py-10"><ShoppingCart className="h-12 w-12 mx-auto text-gray-300"/><p className="mt-2 text-sm text-gray-500">Cart is empty</p></div>) : cart.map(item => (<div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"><div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{item.item_name}</p><p className="text-xs text-gray-500">₹{item.unit_price.toFixed(2)}</p></div><div className="flex items-center gap-1 border rounded-md shrink-0"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.cart_quantity - 1)}><Minus className="h-3 w-3"/></Button><span className="w-6 text-center text-sm font-medium">{item.cart_quantity}</span><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.cart_quantity + 1)}><Plus className="h-3 w-3"/></Button></div><p className="w-16 text-right font-medium shrink-0">₹{(item.cart_quantity * item.unit_price).toFixed(2)}</p></div>))}
                  </div>
                  {cart.length > 0 && (<div className="mt-4 border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{cartTotals.finalAmount.toFixed(2)}</span></div>
                      <div className="grid grid-cols-2 gap-2">
                          {/* MODIFIED: The disabled state now checks both mutations */}
                          <Button 
                              onClick={handleHoldSale} 
                              variant="outline" 
                              disabled={createPendingOrderMutation.isPending || updatePendingOrderMutation.isPending}
                          >
                              {createPendingOrderMutation.isPending || updatePendingOrderMutation.isPending ? 
                                <Loader2 className="h-4 w-4 animate-spin"/> : 
                                <Archive className="h-4 w-4 mr-2"/>
                              }
                              {loadedPendingOrderId ? 'Update Hold' : 'Hold'}
                          </Button>
                          <Button onClick={proceedToPayment} className="bg-blue-600 hover:bg-blue-700 text-white"><CreditCard className="h-4 w-4 mr-2"/> Checkout</Button>
                      </div>
                    </div>)}
                </TabsContent>
                
                <TabsContent value="held" className="p-4">
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {pendingOrders.length === 0 ? (<div className="text-center py-10"><Archive className="h-12 w-12 mx-auto text-gray-300"/><p className="mt-2 text-sm text-gray-500">No sales on hold</p></div>) : pendingOrders.map(order => ( <AlertDialog key={order.id}><AlertDialogTrigger asChild><div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"><div className="flex justify-between items-center"><p className="font-semibold text-sm">{order.customer_info?.name || 'Walk-in'}</p><p className="font-bold text-sm">₹{order.total_amount.toFixed(2)}</p></div><p className="text-xs text-gray-500 mt-1">{order.order_items.length} items • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p></div></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Load This Sale?</AlertDialogTitle><AlertDialogDescription>This will replace any items currently in your cart. You can then complete the transaction.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleLoadPendingOrder(order)}>Load Sale</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>))}
                    </div>
                </TabsContent>

                <TabsContent value="customer" className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div><Label htmlFor="c-name">Name *</Label><Input id="c-name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
                  <div><Label htmlFor="c-phone">Phone *</Label><Input id="c-phone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
                  <div><Label htmlFor="c-email">Email (for e-receipts)</Label><Input id="c-email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} /></div>
                  <div><Label htmlFor="c-address">Address</Label><Input id="c-address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} /></div>
                  <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </main>
        
        {/* --- Dialogs (Payment, Success, Barcode) remain the same --- */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Complete Payment</DialogTitle><DialogDescription>Choose a payment method for ₹{cartTotals.finalAmount.toFixed(2)}</DialogDescription></DialogHeader><Tabs defaultValue="online" className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="online">UPI / QR</TabsTrigger><TabsTrigger value="cash">Cash</TabsTrigger></TabsList><TabsContent value="online" className="text-center p-4 space-y-4"><p>Scan the QR code to pay using any UPI app.</p><div className="p-4 bg-white inline-block rounded-lg border-2 border-dashed"><QRCodeSVG value={`upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=INV${Date.now()}`} size={180} /></div><p className="text-xs text-gray-500">UPI ID: {companyInfo.upi_id}</p><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => completeSale('online')} disabled={processSaleMutation.isPending}>{processSaleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />} Confirm & Complete Sale</Button></TabsContent><TabsContent value="cash" className="p-4 space-y-4"><div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800/50"><p className="text-gray-600 dark:text-gray-400">Total Amount Due</p><p className="text-4xl font-bold text-primary">₹{cartTotals.finalAmount.toFixed(2)}</p></div><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => completeSale('cash')} disabled={processSaleMutation.isPending}>{processSaleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-2" />} Confirm Cash Payment</Button></TabsContent></Tabs></DialogContent></Dialog>
        <Dialog open={showSaleSuccessDialog} onOpenChange={setShowSaleSuccessDialog}><DialogContent className="max-w-lg"><DialogHeader className="text-center"><Sparkles className="h-16 w-16 mx-auto text-green-500 bg-green-100 p-3 rounded-full"/><DialogTitle className="text-2xl mt-4">Transaction Successful!</DialogTitle><DialogDescription>The sale has been completed and recorded.</DialogDescription></DialogHeader><div className="py-6 space-y-3"><Button className="w-full" variant="outline" onClick={() => generatePdfInvoice(completedBill, 'save')}><Download className="h-4 w-4 mr-2"/>Download PDF Invoice</Button>{completedBill?.customer.email && (<Button className="w-full" variant="outline" onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>{sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Mail className="h-4 w-4 mr-2"/>} Send Invoice via Email</Button>)}</div><DialogFooter><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowSaleSuccessDialog(false)}><Plus className="h-4 w-4 mr-2"/>Start New Sale</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={showBarcodeScanner} onOpenChange={stopBarcodeScan}><DialogContent className="max-w-md p-4"><DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Barcode Scanner</DialogTitle><DialogDescription>Point camera at a product barcode.</DialogDescription></DialogHeader><div className="relative aspect-video bg-black rounded-lg overflow-hidden mt-4"><video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/><div className="absolute inset-0 border-8 border-black/30 flex items-center justify-center"><div className="border-2 border-dashed border-white/80 rounded-lg w-2/3 h-1/2" /></div></div><DialogFooter className='mt-4'><Button onClick={stopBarcodeScan} className="w-full">Close Scanner</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </div>
  );
};

export default CustomerPOSPage;