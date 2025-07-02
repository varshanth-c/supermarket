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
  Plus, ShoppingCart, Camera, Download,
  Loader2, Minus, User, QrCode, CreditCard, Store, Sparkles, CheckCircle, Mail, Search, Clock
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
// --- FIX: Import autoTable explicitly ---
import autoTable from 'jspdf-autotable';
import { ADMIN_USER_ID } from '@/contexts/AuthContext';

// --- Type Definitions ---
interface InventoryItem { id: string; item_name: string; category: string; quantity: number; unit_price: number; barcode?: string | null; }
interface CartItem extends InventoryItem { cart_quantity: number; }
interface Customer { name: string; phone: string; email: string; address: string; }
interface CompanyInfo { name: string; address: string; phone: string; email: string; upi_id?: string; }
interface BillItem { id: string; item_name: string; cart_quantity: number; unit_price: number; total_price: number; final_amount: number; }
interface BillData { billId: string; items: BillItem[]; customer: Customer; subtotal: number; finalAmount: number; notes: string; timestamp: string; companyInfo: CompanyInfo; paymentMethod: 'upi_qr'; userId: string; }
interface OrderSlipData { orderId: string; items: CartItem[]; customer: Customer; totalAmount: number; timestamp: Date; companyInfo: CompanyInfo; }


const CustomerPOSPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();

  // --- State Management ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', address: '' });
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [companyInfo] = useState<CompanyInfo>(() => {
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    return savedCompanyInfo ? JSON.parse(savedCompanyInfo) : { name: 'Your Company Name', address: '123 Business St', phone: '9876543210', email: 'contact@yourcompany.com', upi_id: 'your-upi@okhdfc' };
  });
  const [activeTab, setActiveTab] = useState('cart');
  
  // --- Dialog visibility states ---
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showOrderSlipDialog, setShowOrderSlipDialog] = useState(false);

  // --- State for payment and order data ---
  const [qrData, setQrData] = useState<{ orderId: string; upiString: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [completedBill, setCompletedBill] = useState<BillData | null>(null);
  const [completedOrderSlip, setCompletedOrderSlip] = useState<OrderSlipData | null>(null);

  const { data: inventoryItems = [], isLoading: isInventoryLoading } = useQuery({
    queryKey: ['inventory', ADMIN_USER_ID],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory').select('*').eq('user_id', ADMIN_USER_ID).order('item_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!ADMIN_USER_ID,
  });

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    const items: BillItem[] = cart.map(item => {
      const basePrice = item.cart_quantity * item.unit_price;
      subtotal += basePrice;
      return { id: item.id, item_name: item.item_name, cart_quantity: item.cart_quantity, unit_price: item.unit_price, total_price: basePrice, final_amount: basePrice };
    });
    return { items, subtotal, finalAmount: subtotal };
  }, [cart]);


  // --- Mutations ---
  const createPickupOrderMutation = useMutation({
    mutationFn: async (payload: { cartItems: CartItem[], customer: Customer, totalAmount: number, userId: string }) => {
      const { data, error } = await supabase.functions.invoke('create-pickup-order', { body: payload });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      const orderSlipData: OrderSlipData = { orderId: data.id, items: cart, customer, totalAmount: cartTotals.finalAmount, timestamp: new Date(), companyInfo };
      setCompletedOrderSlip(orderSlipData);
      setShowPaymentDialog(false);
      setShowOrderSlipDialog(true);
      resetSale();
      if (customer.email) {
        handleSendOrderSlipEmail(orderSlipData);
      }
    },
    onError: (error: any) => toast({ title: "Order Failed", description: error.message, variant: "destructive" }),
  });
  
  const sendEmailMutation = useMutation({
    mutationFn: async (vars: { to: string; subject: string; html: string; pdfBase64: string; pdfName: string }) => {
      const { error } = await supabase.functions.invoke('send-email', { body: vars });
      if (error) throw new Error(`Failed to send email: ${error.message}`);
    },
    onSuccess: () => toast({ title: 'Email Sent!', description: 'The document has been sent to the customer.' }),
    onError: (error: any) => toast({ title: 'Email Failed', description: error.message, variant: 'destructive' }),
  });


  // --- useEffect for polling payment status ---
  useEffect(() => {
    let intervalId: number | undefined;
    if (paymentStatus === 'pending' && qrData?.orderId) {
      intervalId = setInterval(async () => {
        try {
          const billDataForVerification: BillData = { billId: `TEMP-${qrData.orderId}`, items: cartTotals.items, customer, subtotal: cartTotals.subtotal, finalAmount: cartTotals.finalAmount, notes, timestamp: new Date().toISOString(), companyInfo, paymentMethod: 'upi_qr', userId: ADMIN_USER_ID };
          const { data, error } = await supabase.functions.invoke('verify-and-process-payment', { body: { order_id: qrData.orderId, cartItems: cart.map(item => ({ id: item.id, cart_quantity: item.cart_quantity })), customer, billData: billDataForVerification } });
          if (error) throw new Error(`Verification failed: ${error.message}`);
          if (data.status === 'paid') {
            clearInterval(intervalId);
            setPaymentStatus('success');
            setCompletedBill(data.billData);
            setShowQrDialog(false);
            setShowSaleSuccessDialog(true);
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            resetSale();
          }
        } catch (error: any) {
          console.error("Polling error:", error);
          toast({ title: "Verification Error", description: error.message, variant: "destructive" });
          setPaymentStatus('failed');
          clearInterval(intervalId);
        }
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [paymentStatus, qrData, cart, customer, notes, companyInfo, cartTotals, queryClient]);


  // --- Handlers ---
  const handlePayAtStore = () => { createPickupOrderMutation.mutate({ cartItems: cart, customer, totalAmount: cartTotals.finalAmount, userId: ADMIN_USER_ID }); };
  const handlePayWithQR = async () => { setShowPaymentDialog(false); setPaymentStatus('pending'); try { const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', { body: { amount: cartTotals.finalAmount } }); if (error) throw new Error(error.message); const upiString = `upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&cu=INR&tid=${order.id}`; setQrData({ orderId: order.id, upiString }); setShowQrDialog(true); } catch (error: any) { setPaymentStatus('failed'); toast({ title: "Order Creation Failed", description: error.message, variant: "destructive" }); } };
  const proceedToPayment = () => { if (cart.length === 0) { toast({ title: "Empty Cart", variant: "destructive" }); return; } if (!customer.name || !customer.phone) { toast({ title: "Customer Info Missing", variant: "destructive" }); return; } setShowPaymentDialog(true); };
  const resetSale = () => { setCart([]); setCustomer({ name: '', phone: '', email: '', address: '' }); setNotes(''); setSearchTerm(''); setQrData(null); setPaymentStatus('idle'); };
  const handleBarcodeScanned = (barcode: string) => { stopScanning(); setShowBarcodeScanner(false); const item = inventoryItems.find(i => i.barcode === barcode); if (item) { addToCart(item.id, 1); toast({ title: 'Item Added' }); } else { toast({ title: 'Not Found', variant: 'destructive' }); } };
  const startBarcodeScan = () => { startScanning(handleBarcodeScanned).then(() => setShowBarcodeScanner(true)).catch((e) => toast({ title: "Camera Error", variant: "destructive" })); };
  const stopBarcodeScan = () => { stopScanning(); setShowBarcodeScanner(false); };
  const addToCart = (itemId: string, quantity: number) => { const itemToAdd = inventoryItems.find(i => i.id === itemId); if (!itemToAdd) return; const existingItem = cart.find(i => i.id === itemId); const cartQuantity = existingItem?.cart_quantity || 0; if (itemToAdd.quantity < cartQuantity + quantity) { toast({ title: "Stock Alert", variant: "destructive" }); return; } if (existingItem) { setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: i.cart_quantity + quantity } : i)); } else { setCart([...cart, { ...itemToAdd, cart_quantity: quantity }]); } };
  const updateCartQuantity = (itemId: string, newQuantity: number) => { const inventoryItem = inventoryItems.find(i => i.id === itemId); if (!inventoryItem) return; if (newQuantity <= 0) { setCart(cart.filter(i => i.id !== itemId)); } else if (newQuantity > inventoryItem.quantity) { toast({ title: "Out of Stock", variant: "destructive" }); } else { setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: newQuantity } : i)); } };
  const filteredInventoryItems = useMemo(() => { if (!searchTerm) return inventoryItems; const lowercasedFilter = searchTerm.toLowerCase(); return inventoryItems.filter(item => item.item_name.toLowerCase().includes(lowercasedFilter) || item.category.toLowerCase().includes(lowercasedFilter)); }, [searchTerm, inventoryItems]);

  // --- PDF & Email Functions ---
  const generatePdfInvoice = (bill: BillData | null) => {
    if (!bill) return;
    const doc = new jsPDF();
    const tableData = bill.items.map((item, i) => [i + 1, item.item_name, item.cart_quantity, `₹${item.unit_price.toFixed(2)}`, `₹${item.final_amount.toFixed(2)}`]);
    doc.setFontSize(20); doc.text(bill.companyInfo.name, 14, 22);
    doc.setFontSize(10); doc.text(bill.companyInfo.address, 14, 30); doc.text(`Phone: ${bill.companyInfo.phone}`, 14, 36); doc.line(14, 40, 196, 40);
    doc.setFontSize(12); doc.text('Invoice', 196, 46, { align: 'right' });
    doc.setFontSize(10); doc.text(`Invoice No: ${bill.billId}`, 14, 55); doc.text(`Date: ${format(new Date(bill.timestamp), 'dd MMM yyyy, hh:mm a')}`, 14, 61);
    doc.text('Bill To:', 196, 55, { align: 'right' }); doc.text(bill.customer.name, 196, 61, { align: 'right' }); doc.text(bill.customer.phone, 196, 67, { align: 'right' });
    
    // --- FIX: Call autoTable as a function ---
    autoTable(doc, {
      startY: 80,
      head: [['#', 'Description', 'Qty', 'Rate', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [38, 38, 38] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`Grand Total:`, 140, finalY + 15); doc.text(`₹${bill.finalAmount.toFixed(2)}`, 196, finalY + 15, { align: 'right' });
    doc.setFontSize(10); doc.text(`Payment Method: UPI QR`, 14, finalY + 25);
    doc.setFontSize(8); doc.text('Thank you for your business!', 14, finalY + 40);
    doc.save(`invoice-${bill.billId}.pdf`);
  };

  const generateOrderSlipPDF = (slip: OrderSlipData | null, outputType: 'save' | 'base64' = 'save') => {
    if (!slip) return null;
    const doc = new jsPDF();
    const tableData = slip.items.map((item, i) => [i + 1, item.item_name, item.cart_quantity, `₹${item.unit_price.toFixed(2)}`, `₹${(item.cart_quantity * item.unit_price).toFixed(2)}`]);
    doc.setFontSize(20); doc.text(slip.companyInfo.name, 14, 22);
    doc.setFontSize(10); doc.text(slip.companyInfo.address, 14, 30); doc.text(`Phone: ${slip.companyInfo.phone}`, 14, 36); doc.line(14, 40, 196, 40);
    doc.setFontSize(14); doc.text('PICKUP ORDER SLIP', 14, 55);
    doc.setFontSize(10); doc.text(`Order ID: ${slip.orderId}`, 14, 61); doc.text(`Date: ${format(slip.timestamp, 'dd MMM yyyy, hh:mm a')}`, 14, 67);
    
    // --- FIX: Call autoTable as a function ---
    autoTable(doc, {
      startY: 75,
      head: [['#', 'Description', 'Qty', 'Rate', 'Total']],
      body: tableData,
      theme: 'striped',
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`Total Amount Due:`, 140, finalY + 15); doc.text(`₹${slip.totalAmount.toFixed(2)}`, 196, finalY + 15, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Payment Status: PENDING - PAY AT STORE', 14, finalY + 25, { textColor: 'red' });
    doc.setFontSize(8); doc.text('Please show this slip at the store to complete your purchase.', 14, finalY + 40);
    if (outputType === 'save') { doc.save(`order-slip-${slip.orderId}.pdf`); return null; }
    return doc.output('datauristring').split(',')[1];
  };

  const handleSendOrderSlipEmail = (slip: OrderSlipData) => { if (!slip || !slip.customer.email) return; const pdfBase64 = generateOrderSlipPDF(slip, 'base64'); if (pdfBase64) { sendEmailMutation.mutate({ to: slip.customer.email, subject: `Your Order Slip from ${slip.companyInfo.name} (#${slip.orderId})`, html: `<p>Hi ${slip.customer.name},</p><p>Thank you for your order! Please find your order slip attached. Show this at the store to complete your payment and pick up your items.</p>`, pdfBase64, pdfName: `order-slip-${slip.orderId}.pdf` }); } };

  if (isInventoryLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary"/></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Store className="h-8 w-8 text-primary"/> Point of Sale
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create a new transaction</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={startBarcodeScan} variant="outline" className="bg-white dark:bg-gray-800">
              <Camera className="h-4 w-4 mr-2"/> Scan Barcode
            </Button>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        <Input placeholder="Search by name, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white dark:bg-gray-800" />
                    </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto py-4">
                {filteredInventoryItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredInventoryItems.map(item => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800" onClick={() => addToCart(item.id, 1)}>
                                <CardContent className="p-3 flex flex-col justify-between h-full">
                                    <div>
                                        <h3 className="font-semibold text-sm truncate">{item.item_name}</h3>
                                        <p className="text-xs text-gray-500">{item.category}</p>
                                        <p className="font-bold text-base my-1">₹{item.unit_price.toFixed(2)}</p>
                                    </div>
                                    <div className="mt-1">
                                        <Badge variant={item.quantity > 10 ? 'default' : item.quantity > 0 ? 'warning' : 'destructive'} className="text-xs">Stock: {item.quantity}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/>
                        <p className="mt-4">No products found</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

           <div className="lg:col-span-1">
            <Card className="sticky top-24 border border-gray-200 dark:border-gray-800 shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="cart" className="flex items-center"><ShoppingCart className="h-4 w-4 mr-1"/>Cart ({cart.length})</TabsTrigger>
                  <TabsTrigger value="customer" className="flex items-center"><User className="h-4 w-4 mr-1"/>Customer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cart" className="p-4">
                  <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                    {cart.length === 0 ? (
                        <div className="text-center py-10"><ShoppingCart className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600"/><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your cart is empty</p></div>
                    ) : cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex-1"><p className="font-semibold text-sm">{item.item_name}</p><p className="text-xs text-gray-500 dark:text-gray-400">₹{item.unit_price.toFixed(2)}</p></div>
                            <div className="flex items-center gap-1 border rounded-md">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.cart_quantity - 1)}><Minus className="h-3 w-3"/></Button>
                                <span className="w-6 text-center text-sm font-medium">{item.cart_quantity}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.cart_quantity + 1)}><Plus className="h-3 w-3"/></Button>
                            </div>
                            <p className="w-16 text-right font-medium">₹{(item.cart_quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                      <div className="mt-4 border-t pt-4 space-y-2">
                          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{cartTotals.finalAmount.toFixed(2)}</span></div>
                          <Button onClick={proceedToPayment} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"><CreditCard className="h-4 w-4 mr-2"/> Proceed to Checkout</Button>
                      </div>
                  )}
                </TabsContent>

                <TabsContent value="customer" className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div><Label htmlFor="c-name">Name *</Label><Input id="c-name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
                  <div><Label htmlFor="c-phone">Phone *</Label><Input id="c-phone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
                  <div><Label htmlFor="c-email">Email (for e-receipts)</Label><Input id="c-email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} /></div>
                  <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </main>
        
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>How would you like to proceed?</DialogTitle><DialogDescription>Choose to pay online now or generate a slip to pay at the store.</DialogDescription></DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                    <Button variant="outline" className="h-28 flex-col gap-2 text-base" onClick={handlePayAtStore} disabled={createPickupOrderMutation.isPending}>
                        {createPickupOrderMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Store className="h-6 w-6" />}
                        Pay at Store
                    </Button>
                    <Button className="h-28 flex-col gap-2 text-base bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePayWithQR} disabled={paymentStatus === 'pending'}>
                        {paymentStatus === 'pending' ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="h-6 w-6" />}
                        Pay Now with UPI
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog open={showOrderSlipDialog} onOpenChange={setShowOrderSlipDialog}>
            <DialogContent className="max-w-lg">
                <DialogHeader className="text-center">
                    <Clock className="h-16 w-16 mx-auto text-blue-500 bg-blue-100 p-3 rounded-full"/>
                    <DialogTitle className="text-2xl mt-4">Order Placed!</DialogTitle>
                    <DialogDescription>Your order slip is ready. Please show this at the store to pay and collect your items.</DialogDescription>
                </DialogHeader>
                <div className="p-4 my-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Your Order ID</p>
                    <p className="font-mono text-lg font-bold">{completedOrderSlip?.orderId}</p>
                    <div className="flex justify-center mt-2"><QRCodeSVG value={completedOrderSlip?.orderId || ''} size={128} /></div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="w-full" onClick={() => generateOrderSlipPDF(completedOrderSlip, 'save')}>
                        <Download className="h-4 w-4 mr-2"/>Download Slip
                    </Button>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowOrderSlipDialog(false)}>
                        <Plus className="h-4 w-4 mr-2"/>Start New Sale
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={showQrDialog} onOpenChange={(open) => !open && setShowQrDialog(false)}>
            <DialogContent className="max-w-sm text-center">
                <DialogHeader>
                    <DialogTitle>Scan to Pay ₹{cartTotals.finalAmount.toFixed(2)}</DialogTitle>
                    <DialogDescription>Use any UPI app. Your bill will be generated automatically after payment.</DialogDescription>
                </DialogHeader>
                <div className="p-4 my-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center">
                    {qrData?.upiString && <QRCodeSVG value={qrData.upiString} size={200} includeMargin={true} />}
                    <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Awaiting payment confirmation...</span>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" className="w-full" onClick={() => { setShowQrDialog(false); setPaymentStatus('idle'); setQrData(null); }}>Cancel Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={showSaleSuccessDialog} onOpenChange={setShowSaleSuccessDialog}>
            <DialogContent className="max-w-lg">
                <DialogHeader className="text-center"><Sparkles className="h-16 w-16 mx-auto text-green-500 bg-green-100 p-3 rounded-full"/><DialogTitle className="text-2xl mt-4">Payment Successful!</DialogTitle><DialogDescription>Your invoice has been generated.</DialogDescription></DialogHeader>
                <div className="py-6 space-y-3">
                    <Button className="w-full" variant="outline" onClick={() => generatePdfInvoice(completedBill)}><Download className="h-4 w-4 mr-2"/>Download PDF Invoice</Button>
                </div>
                <DialogFooter><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowSaleSuccessDialog(false)}><Plus className="h-4 w-4 mr-2"/>Start New Sale</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={showBarcodeScanner} onOpenChange={stopBarcodeScan}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Barcode Scanner</DialogTitle><DialogDescription>Point your camera at a product barcode</DialogDescription></DialogHeader>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden"><video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/><canvas ref={canvasRef} className="hidden" /><div className="absolute inset-0 flex items-center justify-center"><div className="border-2 border-dashed border-white rounded-lg w-64 h-32" /></div></div>
            <DialogFooter><Button onClick={stopBarcodeScan} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">Close Scanner</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustomerPOSPage;