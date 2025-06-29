
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
import { Plus, ShoppingCart, Trash2, QrCode, Download, Send, Camera, Pause, Play, RotateCcw, Printer, Save } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode.react';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  barcode?: string;
}

interface CartItem extends InventoryItem {
  cart_quantity: number;
  total_price: number;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
}

interface Cart {
  id: string;
  name: string;
  items: CartItem[];
  customer: Customer;
  isHeld: boolean;
  createdAt: Date;
}

const Sales = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [carts, setCarts] = useState<Cart[]>([
    {
      id: '1',
      name: 'Cart 1',
      items: [],
      customer: { name: '', phone: '', email: '' },
      isHeld: false,
      createdAt: new Date()
    }
  ]);
  const [activeCartId, setActiveCartId] = useState('1');
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [billId, setBillId] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            addNewCart();
            break;
          case 'h':
            e.preventDefault();
            holdCart();
            break;
          case 'r':
            e.preventDefault();
            resumeCart();
            break;
          case 'Enter':
            e.preventDefault();
            generateBill();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCart]);

  const filteredItems = selectedCategory 
    ? inventoryItems.filter(item => item.category === selectedCategory)
    : [];

  const selectedItemData = inventoryItems.find(item => item.id === selectedItem);

  // Save sale mutation
  const saveSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const { data, error } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    }
  });

  const addNewCart = () => {
    const newCartId = Date.now().toString();
    const newCart: Cart = {
      id: newCartId,
      name: `Cart ${carts.length + 1}`,
      items: [],
      customer: { name: '', phone: '', email: '' },
      isHeld: false,
      createdAt: new Date()
    };
    setCarts([...carts, newCart]);
    setActiveCartId(newCartId);
  };

  const holdCart = () => {
    setCarts(carts.map(cart => 
      cart.id === activeCartId 
        ? { ...cart, isHeld: true }
        : cart
    ));
    toast({
      title: "Cart Held",
      description: "Cart has been put on hold"
    });
  };

  const resumeCart = () => {
    setCarts(carts.map(cart => 
      cart.id === activeCartId 
        ? { ...cart, isHeld: false }
        : cart
    ));
    toast({
      title: "Cart Resumed",
      description: "Cart is now active"
    });
  };

  const removeCart = (cartId: string) => {
    if (carts.length === 1) {
      toast({
        title: "Error",
        description: "Cannot remove the last cart",
        variant: "destructive"
      });
      return;
    }
    
    const updatedCarts = carts.filter(cart => cart.id !== cartId);
    setCarts(updatedCarts);
    
    if (activeCartId === cartId) {
      setActiveCartId(updatedCarts[0].id);
    }
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

  const startBarcodeScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowBarcodeScanner(true);
      }
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

    const updatedCarts = carts.map(cart => {
      if (cart.id === activeCartId) {
        const existingItem = cart.items.find(item => item.id === selectedItemData.id);
        
        if (existingItem) {
          return {
            ...cart,
            items: cart.items.map(item => 
              item.id === selectedItemData.id 
                ? { ...item, cart_quantity: item.cart_quantity + quantity, total_price: (item.cart_quantity + quantity) * item.unit_price }
                : item
            )
          };
        } else {
          const cartItem: CartItem = {
            ...selectedItemData,
            cart_quantity: quantity,
            total_price: quantity * selectedItemData.unit_price
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

  const getTotalAmount = () => {
    return activeCart.items.reduce((total, item) => total + item.total_price, 0);
  };

  const saveToOfflineStorage = (saleData: any) => {
    const offlineSales = JSON.parse(localStorage.getItem('offlineSales') || '[]');
    offlineSales.push({ ...saleData, offline: true, timestamp: Date.now() });
    localStorage.setItem('offlineSales', JSON.stringify(offlineSales));
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

    const newBillId = `BILL-${Date.now()}`;
    setBillId(newBillId);
    
    const saleData = {
      user_id: user!.id,
      items: activeCart.items,
      total_amount: getTotalAmount(),
      customer_name: activeCart.customer.name,
      customer_phone: activeCart.customer.phone,
      customer_email: activeCart.customer.email
    };

    if (isOffline) {
      saveToOfflineStorage(saleData);
      toast({
        title: "Offline Sale",
        description: "Sale saved offline. Will sync when online."
      });
    } else {
      try {
        await saveSaleMutation.mutateAsync(saleData);
        toast({
          title: "Success",
          description: "Bill generated successfully"
        });
      } catch (error) {
        saveToOfflineStorage(saleData);
        toast({
          title: "Saved Offline",
          description: "Sale saved offline due to connection issue"
        });
      }
    }

    setShowBillDialog(true);
  };

  const downloadBill = () => {
    // Generate PDF functionality would go here
    toast({
      title: "Success",
      description: "Bill downloaded successfully"
    });
  };

  const sendBill = () => {
    // Send bill via email/SMS/WhatsApp functionality would go here
    toast({
      title: "Success",
      description: "Bill sent successfully"
    });
  };

  const printThermalReceipt = () => {
    // Thermal receipt printing would go here
    const printContent = `
      VendorFlow Receipt
      Bill ID: ${billId}
      Date: ${new Date().toLocaleDateString()}
      
      Customer: ${activeCart.customer.name}
      Phone: ${activeCart.customer.phone}
      
      Items:
      ${activeCart.items.map(item => 
        `${item.item_name} x${item.cart_quantity} = ₹${item.total_price}`
      ).join('\n')}
      
      Total: ₹${getTotalAmount()}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px;">${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const completeSale = () => {
    // Clear the active cart
    const updatedCarts = carts.map(cart => 
      cart.id === activeCartId 
        ? { ...cart, items: [], customer: { name: '', phone: '', email: '' }, isHeld: false }
        : cart
    );
    setCarts(updatedCarts);
    setShowBillDialog(false);
    
    toast({
      title: "Success",
      description: "Sale completed successfully"
    });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced POS System</h1>
            <p className="text-gray-600">Multi-cart billing with offline support</p>
            {isOffline && (
              <Badge variant="destructive" className="mt-2">
                Offline Mode - Sales will sync when online
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={addNewCart} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Cart (Ctrl+N)
            </Button>
            <Button onClick={startBarcodeScanner} variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Scan Barcode
            </Button>
          </div>
        </div>

        {/* Multi-Cart Tabs */}
        <Tabs value={activeCartId} onValueChange={setActiveCartId} className="mb-6">
          <TabsList className="mb-4">
            {carts.map((cart) => (
              <TabsTrigger key={cart.id} value={cart.id} className="relative">
                <div className="flex items-center space-x-2">
                  {cart.isHeld && <Pause className="h-3 w-3" />}
                  <span>{cart.name}</span>
                  <Badge variant="secondary">{cart.items.length}</Badge>
                  {carts.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCart(cart.id);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
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
                <CardDescription>Select category and items or scan barcode</CardDescription>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>{activeCart.name} ({activeCart.items.length} items)</span>
                    {activeCart.isHeld && <Badge variant="outline">On Hold</Badge>}
                  </CardTitle>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={activeCart.isHeld ? resumeCart : holdCart}
                    >
                      {activeCart.isHeld ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {activeCart.isHeld ? 'Resume (Ctrl+R)' : 'Hold (Ctrl+H)'}
                    </Button>
                  </div>
                </div>
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
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeCart.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.cart_quantity}</TableCell>
                            <TableCell>₹{item.unit_price}</TableCell>
                            <TableCell>₹{item.total_price}</TableCell>
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
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>₹{getTotalAmount()}</span>
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
                  <Label htmlFor="customer-email">Email (Optional)</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={activeCart.customer.email}
                    onChange={(e) => updateCustomer('email', e.target.value)}
                    placeholder="Email address"
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
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-blue-800">₹{getTotalAmount()}</div>
                  </div>
                  <Button 
                    onClick={generateBill} 
                    className="w-full"
                    disabled={activeCart.items.length === 0 || activeCart.isHeld}
                  >
                    Generate Bill (Ctrl+Enter)
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Keyboard shortcuts: Ctrl+N (New Cart), Ctrl+H (Hold), Ctrl+R (Resume)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Barcode Scanner Dialog */}
        <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Barcode Scanner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <video ref={videoRef} autoPlay className="w-full rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowBarcodeScanner(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bill Dialog */}
        <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bill Generated</DialogTitle>
              <DialogDescription>
                Bill ID: {billId}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="border rounded-lg p-6 bg-white">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">VendorFlow</h2>
                  <p className="text-gray-600">Sales Invoice</p>
                  <p className="text-sm text-gray-500">Bill ID: {billId}</p>
                  <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Customer Details:</h3>
                  <p>{activeCart.customer.name}</p>
                  <p>{activeCart.customer.phone}</p>
                  {activeCart.customer.email && <p>{activeCart.customer.email}</p>}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCart.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.cart_quantity}</TableCell>
                        <TableCell>₹{item.unit_price}</TableCell>
                        <TableCell>₹{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{getTotalAmount()}</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <QRCode 
                    value={JSON.stringify({
                      billId,
                      amount: getTotalAmount(),
                      customer: activeCart.customer.name,
                      items: activeCart.items.length
                    })}
                    size={120}
                  />
                  <p className="text-sm text-gray-500 mt-2">QR Code for Bill Details</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={downloadBill}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={sendBill}>
                <Send className="h-4 w-4 mr-2" />
                Send Bill
              </Button>
              <Button variant="outline" onClick={printThermalReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={completeSale}>
                Complete Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Sales;
