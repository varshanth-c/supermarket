
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart, Trash2, QrCode, Download, Send } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
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

const Sales = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    email: ''
  });
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [billId, setBillId] = useState('');

  // Mock inventory data - replace with Supabase integration
  const inventoryItems: InventoryItem[] = [
    { id: '1', item_name: 'Tomato', category: 'Vegetables', quantity: 50, unit_price: 25 },
    { id: '2', item_name: 'Onion', category: 'Vegetables', quantity: 30, unit_price: 20 },
    { id: '3', item_name: 'Potato', category: 'Vegetables', quantity: 80, unit_price: 15 },
    { id: '4', item_name: 'Soap', category: 'Toiletries', quantity: 25, unit_price: 45 },
    { id: '5', item_name: 'Shampoo', category: 'Toiletries', quantity: 15, unit_price: 120 },
    { id: '6', item_name: 'Bread', category: 'Others', quantity: 40, unit_price: 35 },
    { id: '7', item_name: 'Milk', category: 'Others', quantity: 20, unit_price: 55 },
  ];

  const categories = ['Vegetables', 'Toiletries', 'Others', 'Snacks', 'Beverages'];

  const filteredItems = selectedCategory 
    ? inventoryItems.filter(item => item.category === selectedCategory)
    : [];

  const selectedItemData = inventoryItems.find(item => item.id === selectedItem);

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

    const existingItem = cart.find(item => item.id === selectedItemData.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === selectedItemData.id 
          ? { ...item, cart_quantity: item.cart_quantity + quantity, total_price: (item.cart_quantity + quantity) * item.unit_price }
          : item
      ));
    } else {
      const cartItem: CartItem = {
        ...selectedItemData,
        cart_quantity: quantity,
        total_price: quantity * selectedItemData.unit_price
      };
      setCart([...cart, cartItem]);
    }

    // Reset selection
    setSelectedCategory('');
    setSelectedItem('');
    setQuantity(1);

    toast({
      title: "Success",
      description: "Item added to cart"
    });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const generateBill = () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive"
      });
      return;
    }

    if (!customer.name || !customer.phone) {
      toast({
        title: "Error",
        description: "Please provide customer name and phone",
        variant: "destructive"
      });
      return;
    }

    const newBillId = `BILL-${Date.now()}`;
    setBillId(newBillId);
    setShowBillDialog(true);

    // TODO: Save to Supabase and generate PDF
    toast({
      title: "Success",
      description: "Bill generated successfully"
    });
  };

  const downloadBill = () => {
    // TODO: Generate and download PDF
    toast({
      title: "Success",
      description: "Bill downloaded successfully"
    });
  };

  const sendBill = () => {
    // TODO: Send bill via email/SMS/WhatsApp
    toast({
      title: "Success",
      description: "Bill sent successfully"
    });
  };

  const completeSale = () => {
    // TODO: Save to Supabase, update inventory, and clear cart
    setCart([]);
    setCustomer({ name: '', phone: '', email: '' });
    setShowBillDialog(false);
    
    toast({
      title: "Success",
      description: "Sale completed successfully"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Transaction</h1>
          <p className="text-gray-600">Create new sales transactions with smart item selection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item Selection */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add Items to Cart</CardTitle>
                <CardDescription>Select category and items to add to your sale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <span>Shopping Cart ({cart.length} items)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
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
                        {cart.map((item) => (
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
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone *</Label>
                  <Input
                    id="customer-phone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">Email (Optional)</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({...customer, email: e.target.value})}
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
                    disabled={cart.length === 0}
                  >
                    Generate Bill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
              {/* Bill Preview */}
              <div className="border rounded-lg p-6 bg-white">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">VendorFlow</h2>
                  <p className="text-gray-600">Sales Invoice</p>
                  <p className="text-sm text-gray-500">Bill ID: {billId}</p>
                  <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Customer Details:</h3>
                  <p>{customer.name}</p>
                  <p>{customer.phone}</p>
                  {customer.email && <p>{customer.email}</p>}
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
                    {cart.map((item) => (
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

                {/* QR Code Placeholder */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">QR Code for Bill Download</p>
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
