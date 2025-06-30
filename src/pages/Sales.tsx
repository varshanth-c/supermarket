

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShoppingCart, Trash2, Camera, Download, Send, Printer, Save, Edit, Check, RotateCcw, History } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { format } from 'date-fns';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  barcode?: string | null;
  gst_rate?: number;
  hsn_code?: string;
}

interface CartItem extends InventoryItem {
  cart_quantity: number;
  total_price: number;
  gst_amount: number;
  final_amount: number;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
}

interface Cart {
  id: string;
  name: string;
  items: CartItem[];
  customer: Customer;
  isHeld: boolean;
  createdAt: Date;
  notes: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  logo?: string;
}

interface Sale {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  items: any[];
  bill_data: any;
}

const Sales = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showEditBillDialog, setShowEditBillDialog] = useState(false);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showSaleHistoryDialog, setShowSaleHistoryDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [billId, setBillId] = useState('');
  const [currentBill, setCurrentBill] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeTab, setActiveTab] = useState('current-sale');
  
  const [carts, setCarts] = useState<Cart[]>([
    {
      id: '1',
      name: 'Cart 1',
      items: [],
      customer: { name: '', phone: '', email: '', address: '', gstin: '' },
      isHeld: false,
      createdAt: new Date(),
      notes: ''
    }
  ]);
  const [activeCartId, setActiveCartId] = useState('1');

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Your Company Name',
    address: 'Your Company Address',
    gstin: 'Your GSTIN Number',
    phone: 'Your Phone Number',
    email: 'your@email.com',
    logo: ''
  });

  // Fetch inventory items from Supabase
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user?.id)
        .order('item_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch sales history
  const { data: salesHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['sales-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const categories = [...new Set(inventoryItems.map(item => item.category))];
  const activeCart = carts.find(cart => cart.id === activeCartId) || carts[0];

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save sale mutation
  const saveSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      // Convert items to JSON string for storage
      const itemsJson = JSON.stringify(saleData.items);
      const billDataJson = JSON.stringify(saleData.bill_data);
      
      const { data, error } = await supabase
        .from('sales')
        .insert({
          user_id: user!.id,
          items: itemsJson,
          total_amount: saleData.total_amount,
          customer_name: saleData.customer_name,
          customer_phone: saleData.customer_phone,
          customer_email: saleData.customer_email,
          bill_url: null,
          qr_code_url: null,
          bill_data: billDataJson,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    }
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async (updates: any[]) => {
      const promises = updates.map(({ id, quantity }) => 
        supabase
          .from('inventory')
          .update({ quantity })
          .eq('id', id)
          .eq('user_id', user!.id)
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const filteredItems = selectedCategory 
    ? inventoryItems.filter(item => item.category === selectedCategory)
    : [];

  const selectedItemData = inventoryItems.find(item => item.id === selectedItem);

  const calculateGST = (price: number, gstRate: number) => {
    const gstAmount = (price * gstRate) / 100;
    return {
      gstAmount,
      finalAmount: price + gstAmount
    };
  };

  const addNewCart = () => {
    const newCartId = Date.now().toString();
    const newCart: Cart = {
      id: newCartId,
      name: `Cart ${carts.length + 1}`,
      items: [],
      customer: { name: '', phone: '', email: '', address: '', gstin: '' },
      isHeld: false,
      createdAt: new Date(),
      notes: ''
    };
    setCarts([...carts, newCart]);
    setActiveCartId(newCartId);
  };

  const handleBarcodeInput = (barcode: string) => {
    const item = inventoryItems.find(item => item.barcode === barcode || item.id === barcode);
    if (item) {
      setSelectedCategory(item.category);
      setSelectedItem(item.id);
      setQuantity(1);
      toast({
        title: "Product Found",
        description: `${item.item_name} added to selection`
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive"
      });
    }
  };

  const startBarcodeScanning = async () => {
    try {
      await startScanning(handleBarcodeInput);
      setShowBarcodeScanner(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera",
        variant: "destructive"
      });
    }
  };

  const addToCart = () => {
    if (!selectedItemData || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select an item and valid quantity",
        variant: "destructive"
      });
      return;
    }

    if (quantity > selectedItemData.quantity) {
      toast({
        title: "Error",
        description: "Insufficient stock available",
        variant: "destructive"
      });
      return;
    }

    const gstRate = (selectedItemData as any).gst_rate || 18;
    const basePrice = quantity * selectedItemData.unit_price;
    const { gstAmount, finalAmount } = calculateGST(basePrice, gstRate);

    const updatedCarts = carts.map(cart => {
      if (cart.id === activeCartId) {
        const existingItem = cart.items.find(item => item.id === selectedItemData.id);
        
        if (existingItem) {
          const newQuantity = existingItem.cart_quantity + quantity;
          const newBasePrice = newQuantity * selectedItemData.unit_price;
          const { gstAmount: newGstAmount, finalAmount: newFinalAmount } = calculateGST(newBasePrice, gstRate);
          
          return {
            ...cart,
            items: cart.items.map(item => 
              item.id === selectedItemData.id 
                ? { 
                    ...item, 
                    cart_quantity: newQuantity, 
                    total_price: newBasePrice,
                    gst_amount: newGstAmount,
                    final_amount: newFinalAmount
                  }
                : item
            )
          };
        } else {
          const cartItem: CartItem = {
            ...selectedItemData,
            cart_quantity: quantity,
            total_price: basePrice,
            gst_amount: gstAmount,
            final_amount: finalAmount,
            gst_rate: gstRate
          };
          return {
            ...cart,
            items: [...cart.items, cartItem]
          };
        }
      }
      return cart;
    });

    setCarts(updatedCarts);
    setSelectedCategory('');
    setSelectedItem('');
    setQuantity(1);
    setBarcodeInput('');

    toast({
      title: "Success",
      description: "Item added to cart"
    });
  };

  const removeFromCart = (itemId: string) => {
    const updatedCarts = carts.map(cart => 
      cart.id === activeCartId 
        ? { ...cart, items: cart.items.filter(item => item.id !== itemId) }
        : cart
    );
    setCarts(updatedCarts);
  };

  const updateCustomer = (field: keyof Customer, value: string) => {
    const updatedCarts = carts.map(cart => 
      cart.id === activeCartId 
        ? { ...cart, customer: { ...cart.customer, [field]: value } }
        : cart
    );
    setCarts(updatedCarts);
  };

  const updateCartNotes = (notes: string) => {
    const updatedCarts = carts.map(cart => 
      cart.id === activeCartId 
        ? { ...cart, notes }
        : cart
    );
    setCarts(updatedCarts);
  };

  const getTotalAmount = () => {
    return activeCart.items.reduce((total, item) => total + item.total_price, 0);
  };

  const getTotalGST = () => {
    return activeCart.items.reduce((total, item) => total + item.gst_amount, 0);
  };

  const getFinalAmount = () => {
    return activeCart.items.reduce((total, item) => total + item.final_amount, 0);
  };

  const generateBill = async () => {
    if (activeCart.items.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive"
      });
      return;
    }

    if (!activeCart.customer.name || !activeCart.customer.phone) {
      toast({
        title: "Error",
        description: "Please provide customer name and phone",
        variant: "destructive"
      });
      return;
    }

    const newBillId = `INV-${Date.now()}`;
    setBillId(newBillId);
    
    const billData = {
      billId: newBillId,
      items: activeCart.items,
      customer: activeCart.customer,
      subtotal: getTotalAmount(),
      totalGST: getTotalGST(),
      finalAmount: getFinalAmount(),
      notes: activeCart.notes,
      timestamp: new Date(),
      companyInfo
    };
    
    setCurrentBill(billData);
    setShowBillDialog(true);
  };

  const editBill = () => {
    setShowBillDialog(false);
    setShowEditBillDialog(true);
  };

  const saveUpdatedBill = () => {
    // Recalculate totals and update current bill
    const updatedBillData = {
      ...currentBill,
      items: activeCart.items,
      customer: activeCart.customer,
      subtotal: getTotalAmount(),
      totalGST: getTotalGST(),
      finalAmount: getFinalAmount(),
      notes: activeCart.notes
    };
    
    setCurrentBill(updatedBillData);
    setShowEditBillDialog(false);
    setShowBillDialog(true);
    
    toast({
      title: "Success",
      description: "Bill updated successfully"
    });
  };

  const completeSale = async () => {
    try {
      const saleData = {
        items: activeCart.items,
        total_amount: getFinalAmount(),
        customer_name: activeCart.customer.name,
        customer_phone: activeCart.customer.phone,
        customer_email: activeCart.customer.email,
        bill_data: currentBill
      };

      // Update inventory quantities
      const inventoryUpdates = activeCart.items.map(item => ({
        id: item.id,
        quantity: item.quantity - item.cart_quantity
      }));

      await Promise.all([
        saveSaleMutation.mutateAsync(saleData),
        updateInventoryMutation.mutateAsync(inventoryUpdates)
      ]);

      // Clear the active cart and reset
      const updatedCarts = carts.map(cart => 
        cart.id === activeCartId 
          ? { 
              ...cart, 
              items: [], 
              customer: { name: '', phone: '', email: '', address: '', gstin: '' }, 
              isHeld: false,
              notes: ''
            }
          : cart
      );
      setCarts(updatedCarts);
      setShowBillDialog(false);
      setCurrentBill(null);
      setBillId('');
      
      toast({
        title: "Success",
        description: "Transaction completed successfully!"
      });

    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Error",
        description: "Failed to complete transaction",
        variant: "destructive"
      });
    }
  };

  const printThermalReceipt = () => {
    if (!currentBill) return;
    
    const printContent = `
      ${companyInfo.name}
      ${companyInfo.address}
      GSTIN: ${companyInfo.gstin}
      Phone: ${companyInfo.phone}
      Email: ${companyInfo.email}
      
      ================================
      INVOICE: ${currentBill.billId}
      Date: ${new Date().toLocaleDateString('en-IN')}
      Time: ${new Date().toLocaleTimeString('en-IN')}
      ================================
      
      Customer: ${currentBill.customer.name}
      Phone: ${currentBill.customer.phone}
      ${currentBill.customer.gstin ? `GSTIN: ${currentBill.customer.gstin}` : ''}
      
      ================================
      ITEMS:
      ================================
      ${currentBill.items.map((item: CartItem) => 
        `${item.item_name}
HSN: ${(item as any).hsn_code || 'N/A'}
Qty: ${item.cart_quantity} x ₹${item.unit_price}
GST ${item.gst_rate}%: ₹${item.gst_amount.toFixed(2)}
Total: ₹${item.final_amount.toFixed(2)}
--------------------------------`
      ).join('\n')}
      
      ================================
      Subtotal: ₹${currentBill.subtotal.toFixed(2)}
      GST Total: ₹${currentBill.totalGST.toFixed(2)}
      FINAL AMOUNT: ₹${currentBill.finalAmount.toFixed(2)}
      ================================
      
      ${currentBill.notes ? `Notes: ${currentBill.notes}` : ''}
      
      Thank you for your business!
      ================================
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const viewSaleDetails = (sale: Sale) => {
    try {
      // Parse the JSON strings
      const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
      const bill_data = typeof sale.bill_data === 'string' ? JSON.parse(sale.bill_data) : sale.bill_data;
      
      setSelectedSale({
        ...sale,
        items,
        bill_data
      });
      setShowSaleHistoryDialog(true);
    } catch (error) {
      console.error("Error parsing sale data:", error);
      toast({
        title: "Error",
        description: "Could not load sale details",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">GST Compliant POS System</h1>
            <p className="text-gray-600">Complete transaction management with barcode scanning</p>
            {isOffline && (
              <Badge variant="destructive" className="mt-2">
                Offline Mode - Sales will sync when online
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowCompanyDialog(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Company Info
            </Button>
            <Button onClick={addNewCart} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Cart
            </Button>
            <Button onClick={startBarcodeScanning} variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Scan Barcode
            </Button>
          </div>
        </div>

        {/* Main Tabs - Current Sale vs History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="current-sale">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Current Sale
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Sales History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Current Sale Content */}
        {activeTab === 'current-sale' && (
          <>
            {/* Multi-Cart Tabs */}
            <Tabs value={activeCartId} onValueChange={setActiveCartId} className="mb-6">
              <TabsList className="mb-4">
                {carts.map((cart) => (
                  <TabsTrigger key={cart.id} value={cart.id} className="relative">
                    <div className="flex items-center space-x-2">
                      <span>{cart.name}</span>
                      <Badge variant="secondary">{cart.items.length}</Badge>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Item Selection */}
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Add Items to Cart</CardTitle>
                    <CardDescription>Select items or scan barcode</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Barcode Input */}
                    <div className="grid gap-2">
                      <Label htmlFor="barcode">Barcode Scanner Input</Label>
                      <div className="flex gap-2">
                        <Input
                          id="barcode"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="Scan or enter barcode"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleBarcodeInput(barcodeInput);
                            }
                          }}
                        />
                        <Button onClick={() => handleBarcodeInput(barcodeInput)}>
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item">Item</Label>
                        <Select value={selectedItem} onValueChange={setSelectedItem} disabled={!selectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredItems.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.item_name} (₹{item.unit_price}) - Stock: {item.quantity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={selectedItemData?.quantity || 1}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    <Button onClick={addToCart} className="w-full md:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>

                {/* Cart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>{activeCart.name} ({activeCart.items.length} items)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeCart.items.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Cart is empty</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>HSN</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>GST%</TableHead>
                              <TableHead>GST Amt</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeCart.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell>{(item as any).hsn_code || 'N/A'}</TableCell>
                                <TableCell>{item.cart_quantity}</TableCell>
                                <TableCell>₹{item.unit_price}</TableCell>
                                <TableCell>{item.gst_rate || 18}%</TableCell>
                                <TableCell>₹{item.gst_amount.toFixed(2)}</TableCell>
                                <TableCell>₹{item.final_amount.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₹{getTotalAmount().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total GST:</span>
                            <span>₹{getTotalGST().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                            <span>Final Amount:</span>
                            <span>₹{getFinalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Customer Info & Checkout */}
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customer-name">Name *</Label>
                      <Input
                        id="customer-name"
                        value={activeCart.customer.name}
                        onChange={(e) => updateCustomer('name', e.target.value)}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-phone">Phone *</Label>
                      <Input
                        id="customer-phone"
                        value={activeCart.customer.phone}
                        onChange={(e) => updateCustomer('phone', e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-email">Email</Label>
                      <Input
                        id="customer-email"
                        type="email"
                        value={activeCart.customer.email}
                        onChange={(e) => updateCustomer('email', e.target.value)}
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-address">Address</Label>
                      <Textarea
                        id="customer-address"
                        value={activeCart.customer.address}
                        onChange={(e) => updateCustomer('address', e.target.value)}
                        placeholder="Customer address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-gstin">GSTIN (Optional)</Label>
                      <Input
                        id="customer-gstin"
                        value={activeCart.customer.gstin}
                        onChange={(e) => updateCustomer('gstin', e.target.value)}
                        placeholder="GST identification number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="transaction-notes">Transaction Notes</Label>
                      <Textarea
                        id="transaction-notes"
                        value={activeCart.notes}
                        onChange={(e) => updateCartNotes(e.target.value)}
                        placeholder="Add any special notes for this transaction"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Checkout</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{getTotalAmount().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>GST:</span>
                          <span>₹{getTotalGST().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-blue-800 border-t pt-2">
                          <span>Total Amount:</span>
                          <span>₹{getFinalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={generateBill} 
                        className="w-full"
                        disabled={activeCart.items.length === 0}
                      >
                        Generate GST Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Sales History Content */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>All completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : salesHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sales history available</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.bill_data?.billId || 'N/A'}</TableCell>
                          <TableCell>
                            {format(new Date(sale.created_at), 'dd MMM yyyy hh:mm a')}
                          </TableCell>
                          <TableCell>{sale.customer_name}</TableCell>
                          <TableCell>{sale.customer_phone}</TableCell>
                          <TableCell>
                            {typeof sale.items === 'string' 
                              ? JSON.parse(sale.items).length 
                              : sale.items.length}
                          </TableCell>
                          <TableCell>₹{sale.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewSaleDetails(sale)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Barcode Scanner Dialog */}
        <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Barcode Scanner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setShowBarcodeScanner(false);
                stopScanning();
              }}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Company Info Dialog */}
        <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Company Information</DialogTitle>
              <DialogDescription>Update your company details for invoices</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <Label>GSTIN</Label>
                <Input
                  value={companyInfo.gstin}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstin: e.target.value }))}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowCompanyDialog(false)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bill Dialog */}
        <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>GST Invoice Generated</DialogTitle>
              <DialogDescription>
                Invoice ID: {billId}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentBill && (
                <div className="border rounded-lg p-6 bg-white">
                  {/* Company Header */}
                  <div className="text-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold">{companyInfo.name}</h2>
                    <p className="text-gray-600">{companyInfo.address}</p>
                    <p className="text-sm">GSTIN: {companyInfo.gstin} | Phone: {companyInfo.phone}</p>
                    <p className="text-sm">Email: {companyInfo.email}</p>
                  </div>

                  {/* Invoice Details */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold mb-2">Bill To:</h3>
                      <p className="font-medium">{currentBill.customer.name}</p>
                      <p>{currentBill.customer.phone}</p>
                      {currentBill.customer.email && <p>{currentBill.customer.email}</p>}
                      {currentBill.customer.address && <p>{currentBill.customer.address}</p>}
                      {currentBill.customer.gstin && <p>GSTIN: {currentBill.customer.gstin}</p>}
                    </div>
                    <div className="text-right">
                      <p><strong>Invoice No:</strong> {currentBill.billId}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
                      <p><strong>Time:</strong> {new Date().toLocaleTimeString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <Table className="mb-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr.</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>HSN/SAC</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>GST%</TableHead>
                        <TableHead>GST Amt</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentBill.items.map((item: CartItem, index: number) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{(item as any).hsn_code || 'N/A'}</TableCell>
                          <TableCell>{item.cart_quantity}</TableCell>
                          <TableCell>₹{item.unit_price}</TableCell>
                          <TableCell>₹{item.total_price.toFixed(2)}</TableCell>
                          <TableCell>{item.gst_rate}%</TableCell>
                          <TableCell>₹{item.gst_amount.toFixed(2)}</TableCell>
                          <TableCell>₹{item.final_amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-1/3 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{currentBill.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total GST:</span>
                        <span>₹{currentBill.totalGST.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span>₹{currentBill.finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {currentBill.notes && (
                    <div className="mt-6 pt-4 border-t">
                      <p><strong>Notes:</strong> {currentBill.notes}</p>
                    </div>
                  )}

                  {/* QR Code */}
                  <div className="mt-6 text-center">
                    <QRCodeSVG
                      value={JSON.stringify({
                        invoice: currentBill.billId,
                        amount: currentBill.finalAmount,
                        customer: currentBill.customer.name,
                        date: new Date().toISOString()
                      })}
                      size={120}
                    />
                    <p className="text-sm text-gray-500 mt-2">QR Code for Invoice Verification</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={editBill}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Bill
              </Button>
              <Button variant="outline" onClick={printThermalReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={completeSale} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
                Complete Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bill Dialog */}
        <Dialog open={showEditBillDialog} onOpenChange={setShowEditBillDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>Make changes to the current invoice</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={activeCart.customer.name}
                  onChange={(e) => updateCustomer('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Customer Phone</Label>
                <Input
                  value={activeCart.customer.phone}
                  onChange={(e) => updateCustomer('phone', e.target.value)}
                />
              </div>
              <div>
                <Label>Transaction Notes</Label>
                <Textarea
                  value={activeCart.notes}
                  onChange={(e) => updateCartNotes(e.target.value)}
                />
              </div>
              
              {/* Items in cart for editing */}
              <div>
                <Label>Items in Cart</Label>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCart.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.cart_quantity}</TableCell>
                          <TableCell>₹{item.final_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditBillDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveUpdatedBill}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sale History Details Dialog */}
        <Dialog open={showSaleHistoryDialog} onOpenChange={setShowSaleHistoryDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>
                Invoice ID: {selectedSale?.bill_data?.billId || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedSale && (
                <div className="border rounded-lg p-6 bg-white">
                  {/* Company Header */}
                  <div className="text-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold">{companyInfo.name}</h2>
                    <p className="text-gray-600">{companyInfo.address}</p>
                    <p className="text-sm">GSTIN: {companyInfo.gstin} | Phone: {companyInfo.phone}</p>
                    <p className="text-sm">Email: {companyInfo.email}</p>
                  </div>

                  {/* Invoice Details */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold mb-2">Bill To:</h3>
                      <p className="font-medium">{selectedSale.customer_name}</p>
                      <p>{selectedSale.customer_phone}</p>
                      {selectedSale.customer_email && <p>{selectedSale.customer_email}</p>}
                    </div>
                    <div className="text-right">
                      <p><strong>Invoice No:</strong> {selectedSale.bill_data?.billId || 'N/A'}</p>
                      <p><strong>Date:</strong> {format(new Date(selectedSale.created_at), 'dd MMM yyyy')}</p>
                      <p><strong>Time:</strong> {format(new Date(selectedSale.created_at), 'hh:mm a')}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <Table className="mb-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr.</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>HSN/SAC</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>GST%</TableHead>
                        <TableHead>GST Amt</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item: any, index: number) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.hsn_code || 'N/A'}</TableCell>
                          <TableCell>{item.cart_quantity}</TableCell>
                          <TableCell>₹{item.unit_price}</TableCell>
                          <TableCell>₹{item.total_price?.toFixed(2)}</TableCell>
                          <TableCell>{item.gst_rate}%</TableCell>
                          <TableCell>₹{item.gst_amount?.toFixed(2)}</TableCell>
                          <TableCell>₹{item.final_amount?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-1/3 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{selectedSale.bill_data?.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total GST:</span>
                        <span>₹{selectedSale.bill_data?.totalGST?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span>₹{selectedSale.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedSale.bill_data?.notes && (
                    <div className="mt-6 pt-4 border-t">
                      <p><strong>Notes:</strong> {selectedSale.bill_data.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSaleHistoryDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Sales;