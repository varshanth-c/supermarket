
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  low_stock_alert: number;
}

const Inventory = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Mock data - replace with Supabase integration
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: '1',
      item_name: 'Tomato',
      category: 'Vegetables',
      quantity: 50,
      unit_price: 25,
      low_stock_alert: 10
    },
    {
      id: '2',
      item_name: 'Onion',
      category: 'Vegetables',
      quantity: 30,
      unit_price: 20,
      low_stock_alert: 15
    },
    {
      id: '3',
      item_name: 'Potato',
      category: 'Vegetables',
      quantity: 80,
      unit_price: 15,
      low_stock_alert: 20
    },
    {
      id: '4',
      item_name: 'Soap',
      category: 'Toiletries',
      quantity: 25,
      unit_price: 45,
      low_stock_alert: 5
    },
    {
      id: '5',
      item_name: 'Shampoo',
      category: 'Toiletries',
      quantity: 15,
      unit_price: 120,
      low_stock_alert: 5
    },
    {
      id: '6',
      item_name: 'Bread',
      category: 'Others',
      quantity: 40,
      unit_price: 35,
      low_stock_alert: 10
    },
    {
      id: '7',
      item_name: 'Milk',
      category: 'Others',
      quantity: 20,
      unit_price: 55,
      low_stock_alert: 8
    }
  ]);

  const categories = ['Vegetables', 'Toiletries', 'Others', 'Snacks', 'Beverages'];

  const [newItem, setNewItem] = useState({
    item_name: '',
    category: '',
    quantity: 0,
    unit_price: 0,
    low_stock_alert: 0
  });

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    if (!newItem.item_name || !newItem.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const item: InventoryItem = {
      id: Date.now().toString(),
      ...newItem
    };

    setInventoryItems([...inventoryItems, item]);
    setNewItem({
      item_name: '',
      category: '',
      quantity: 0,
      unit_price: 0,
      low_stock_alert: 0
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Item added to inventory successfully"
    });
  };

  const handleEditItem = (item: InventoryItem) => {
    setInventoryItems(inventoryItems.map(i => i.id === item.id ? item : i));
    setEditingItem(null);
    
    toast({
      title: "Success",
      description: "Item updated successfully"
    });
  };

  const handleDeleteItem = (id: string) => {
    setInventoryItems(inventoryItems.filter(item => item.id !== id));
    
    toast({
      title: "Success",
      description: "Item deleted successfully"
    });
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.low_stock_alert) {
      return { status: 'Low Stock', color: 'bg-red-100 text-red-800' };
    }
    if (item.quantity <= item.low_stock_alert * 2) {
      return { status: 'Medium Stock', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Manage your stock levels and product information</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit-price">Unit Price (₹)</Label>
                    <Input
                      id="unit-price"
                      type="number"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="low-stock">Low Stock Alert</Label>
                  <Input
                    id="low-stock"
                    type="number"
                    value={newItem.low_stock_alert}
                    onChange={(e) => setNewItem({...newItem, low_stock_alert: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Inventory Items ({filteredItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price}</TableCell>
                        <TableCell>₹{(item.quantity * item.unit_price).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Item</DialogTitle>
                <DialogDescription>
                  Update item information
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-item-name">Item Name</Label>
                  <Input
                    id="edit-item-name"
                    value={editingItem.item_name}
                    onChange={(e) => setEditingItem({...editingItem, item_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingItem.category} onValueChange={(value) => setEditingItem({...editingItem, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-unit-price">Unit Price (₹)</Label>
                    <Input
                      id="edit-unit-price"
                      type="number"
                      value={editingItem.unit_price}
                      onChange={(e) => setEditingItem({...editingItem, unit_price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-low-stock">Low Stock Alert</Label>
                  <Input
                    id="edit-low-stock"
                    type="number"
                    value={editingItem.low_stock_alert}
                    onChange={(e) => setEditingItem({...editingItem, low_stock_alert: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleEditItem(editingItem)}>Update Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Inventory;
