import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Camera, QrCode, Info, Package, DollarSign, Tag, BarChart, Box, Percent, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ProductBarcode } from '@/components/ProductBarcode';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryItem {
  id: string;
  user_id?: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  low_stock_threshold: number;
  barcode?: string | null;
  hsn_code?: string | null;
  image_url?: string | null;
  description?: string | null;
  brand?: string | null;
  specifications?: any;
  is_available: boolean;
  cost_price: number;
  offer_price?: number | null;
  sku?: string | null;
  supplier_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const Inventory = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  // Initialize formData with proper null values for UUID fields
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'user_id'>>({
    item_name: '',
    category: '',
    quantity: 0,
    unit_price: 0,
    low_stock_threshold: 10,
    barcode: null,
    hsn_code: null,
    image_url: null,
    description: null,
    brand: null,
    specifications: null,
    is_available: true,
    cost_price: 0,
    offer_price: null,
    sku: null,
    supplier_id: null  // Important: Set to null instead of empty string
  });

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading, isError, error } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('item_name', { ascending: true });
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      return data as InventoryItem[];
    },
    enabled: !!user?.id
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (newItem: Omit<InventoryItem, 'id'>) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Prepare data with proper null values
      const payload = {
        ...newItem,
        user_id: user.id,
        supplier_id: newItem.supplier_id || null, // Ensure UUID field is either valid UUID or null
        barcode: newItem.barcode || null,
        hsn_code: newItem.hsn_code || null,
        image_url: newItem.image_url || null,
        description: newItem.description || null,
        brand: newItem.brand || null,
        sku: newItem.sku || null,
        offer_price: newItem.offer_price || null,
        specifications: newItem.specifications || null
      };
      
      const { data, error } = await supabase
        .from('inventory')
        .insert([payload])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddDialog(false);
      resetForm();
      toast({ title: "Success", description: "Item added successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add item", 
        variant: "destructive" 
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: InventoryItem) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Prepare data with proper null values
      const payload = {
        ...updateData,
        supplier_id: updateData.supplier_id || null,
        barcode: updateData.barcode || null,
        hsn_code: updateData.hsn_code || null,
        image_url: updateData.image_url || null,
        description: updateData.description || null,
        brand: updateData.brand || null,
        sku: updateData.sku || null,
        offer_price: updateData.offer_price || null,
        specifications: updateData.specifications || null
      };
      
      const { data, error } = await supabase
        .from('inventory')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowEditDialog(false);
      setEditingItem(null);
      resetForm();
      toast({ title: "Success", description: "Item updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update item", 
        variant: "destructive" 
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: "Success", description: "Item deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete item", 
        variant: "destructive" 
      });
    }
  });

  const categories = [...new Set(inventoryItems.map(item => item.category))];
  
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.barcode && item.barcode.includes(searchTerm)) ||
                         (item.sku && item.sku.includes(searchTerm));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    // Tab filtering
    if (activeTab === 'low') {
      return matchesSearch && matchesCategory && item.quantity <= item.low_stock_threshold && item.is_available;
    } else if (activeTab === 'out') {
      return matchesSearch && matchesCategory && item.quantity === 0 && item.is_available;
    } else if (activeTab === 'inactive') {
      return matchesSearch && matchesCategory && !item.is_available;
    }
    
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      quantity: 0,
      unit_price: 0,
      low_stock_threshold: 10,
      barcode: null,
      hsn_code: null,
      image_url: null,
      description: null,
      brand: null,
      specifications: null,
      is_available: true,
      cost_price: 0,
      offer_price: null,
      sku: null,
      supplier_id: null  // Set to null
    });
  };

  const handleAddItem = () => {
    // Validate required fields
    if (!formData.item_name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Item name and category are required",
        variant: "destructive"
      });
      return;
    }

    addItemMutation.mutate({
      ...formData,
      // Convert empty strings to null for UUID fields
      supplier_id: formData.supplier_id || null
    } as Omit<InventoryItem, 'id'>);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    
    // Validate required fields
    if (!formData.item_name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Item name and category are required",
        variant: "destructive"
      });
      return;
    }

    updateItemMutation.mutate({ 
      ...editingItem,
      ...formData,
      id: editingItem.id,
      // Convert empty strings to null for UUID fields
      supplier_id: formData.supplier_id || null
    });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      low_stock_threshold: item.low_stock_threshold,
      barcode: item.barcode || null,
      hsn_code: item.hsn_code || null,
      image_url: item.image_url || null,
      description: item.description || null,
      brand: item.brand || null,
      specifications: item.specifications || null,
      is_available: item.is_available,
      cost_price: item.cost_price,
      offer_price: item.offer_price || null,
      sku: item.sku || null,
      supplier_id: item.supplier_id || null  // Set to null if empty
    });
    setShowEditDialog(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));
    setShowBarcodeScanner(false);
    stopScanning();
    toast({ title: "Barcode Scanned", description: `Barcode: ${barcode}` });
  };

  const startBarcodeScanning = async () => {
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

  const getStockStatus = (item: InventoryItem) => {
    if (!item.is_available) return "Not Available";
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.low_stock_threshold) return "Low Stock";
    return "In Stock";
  };

  const getStatusVariant = (item: InventoryItem) => {
    if (!item.is_available) return "secondary";
    if (item.quantity === 0) return "destructive";
    if (item.quantity <= item.low_stock_threshold) return "warning";
    return "success";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
            </div>
            
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white border border-red-200 rounded-xl shadow-sm">
            <CardContent className="p-6 text-center">
              <Info className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 mt-4">Database Error</h2>
              <p className="text-gray-600 mt-2">
                {error?.message || "Failed to load inventory data"}
              </p>
              <Button 
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => queryClient.refetchQueries({ queryKey: ['inventory'] })}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate inventory metrics
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => 
    item.quantity <= item.low_stock_threshold && item.is_available
  ).length;
  const outOfStockItems = inventoryItems.filter(item => 
    item.quantity === 0 && item.is_available
  ).length;

  // Fix for uncontrolled inputs: Convert null to empty string for inputs
  const getInputValue = (value: string | number | null | undefined) => {
    return value === null || value === undefined ? '' : value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Package className="h-8 w-8 text-indigo-600" />
              Inventory Management
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Manage your products with detailed information, barcode support, and real-time tracking
            </p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Inventory Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <Box className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-500">Total Products</h3>
                  <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-lg mr-4">
                  <BarChart className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-500">Low Stock</h3>
                  <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-rose-100 p-3 rounded-lg mr-4">
                  <Info className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-500">Out of Stock</h3>
                  <p className="text-3xl font-bold text-gray-900">{outOfStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="mb-2 text-gray-700">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, SKU or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="category-filter" className="mb-2 text-gray-700">Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Status Tabs */}
            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                    All Products
                  </TabsTrigger>
                  <TabsTrigger value="low" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                    Low Stock
                  </TabsTrigger>
                  <TabsTrigger value="out" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                    Out of Stock
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                    Not Available
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-gray-900">Products ({filteredItems.length})</CardTitle>
              <div className="text-sm text-gray-500">
                Showing {filteredItems.length} of {inventoryItems.length} items
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-700 font-medium">Product</TableHead>
                    <TableHead className="text-gray-700 font-medium">SKU</TableHead>
                    <TableHead className="text-gray-700 font-medium">Category</TableHead>
                    <TableHead className="text-gray-700 font-medium">Quantity</TableHead>
                    <TableHead className="text-gray-700 font-medium">Pricing</TableHead>
                    <TableHead className="text-gray-700 font-medium">Barcode</TableHead>
                    <TableHead className="text-gray-700 font-medium">Status</TableHead>
                    <TableHead className="text-gray-700 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell className="py-4">
                        <div className="flex items-center">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.item_name} 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 mr-4"
                            />
                          ) : (
                            <div className="bg-gray-100 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center text-gray-400 mr-4">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.item_name}</div>
                            {item.brand && (
                              <div className="text-sm text-gray-500">{item.brand}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md inline-block font-mono">
                          {item.sku || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-700 bg-gray-100">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.quantity}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">₹{item.unit_price}</div>
                          {item.offer_price && item.offer_price > 0 && (
                            <div className="text-sm text-green-600 flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              Offer: ₹{item.offer_price}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Cost: ₹{item.cost_price}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.barcode ? (
                          <div className="text-xs">
                            <ProductBarcode 
                              value={item.barcode} 
                              width={1} 
                              height={30} 
                              displayValue={false} 
                            />
                            <div className="mt-1 text-gray-500 font-mono text-xs">{item.barcode}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No barcode</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(item)} 
                          className="capitalize"
                        >
                          {getStockStatus(item)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-100 hover:bg-rose-50"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredItems.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                  <p className="mt-1 text-gray-500 max-w-md mx-auto">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                  <Button 
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setActiveTab('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-3xl bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-indigo-600" />
                Add New Product
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Enter product details with comprehensive inventory information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item_name" className="text-gray-700">Product Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                    placeholder="Enter product name"
                    className="border-gray-300 rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-gray-700">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                    className="border-gray-300 rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="brand" className="text-gray-700">Brand</Label>
                  <Input
                    id="brand"
                    value={getInputValue(formData.brand)}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value || null }))}
                    placeholder="Enter brand name"
                    className="border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={getInputValue(formData.description)}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || null }))}
                    placeholder="Product description..."
                    className="border-gray-300 rounded-lg min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="image_url" className="text-gray-700">Image URL</Label>
                  <Input
                    id="image_url"
                    value={getInputValue(formData.image_url)}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value || null }))}
                    placeholder="https://example.com/image.jpg"
                    className="border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity" className="text-gray-700">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="low_stock_threshold" className="text-gray-700">Low Stock Alert</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 10 }))}
                      className="border-gray-300 rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_price" className="text-gray-700">Cost Price (₹) *</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit_price" className="text-gray-700">Selling Price (₹) *</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      className="border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="offer_price" className="text-gray-700">Offer Price (₹)</Label>
                  <Input
                    id="offer_price"
                    type="number"
                    step="0.01"
                    value={getInputValue(formData.offer_price)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      offer_price: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className="border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hsn_code" className="text-gray-700">HSN Code</Label>
                  <Input
                    id="hsn_code"
                    value={getInputValue(formData.hsn_code)}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value || null }))}
                    placeholder="Enter HSN code"
                    className="border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sku" className="text-gray-700">SKU</Label>
                  <Input
                    id="sku"
                    value={getInputValue(formData.sku)}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value || null }))}
                    placeholder="Enter SKU"
                    className="border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="barcode" className="text-gray-700">Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      value={getInputValue(formData.barcode)}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value || null }))}
                      placeholder="Enter or scan barcode"
                      className="border-gray-300 rounded-lg"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-gray-300 rounded-lg"
                      onClick={startBarcodeScanning}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="is_available" className="text-gray-700">Product Available</Label>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="border-t border-gray-200 pt-4">
              <Button 
                variant="outline" 
                className="border-gray-300 rounded-lg"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddItem} 
                disabled={addItemMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                {addItemMutation.isPending ? 'Adding...' : 'Add Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-indigo-600" />
                Edit Product
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Update product details
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_item_name" className="text-gray-700">Product Name *</Label>
                  <Input
                    id="edit_item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                    className="border-gray-300 rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_category" className="text-gray-700">Category *</Label>
                  <Input
                    id="edit_category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="border-gray-300 rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_brand" className="text-gray-700">Brand</Label>
                  <Input
                    id="edit_brand"
                    value={getInputValue(formData.brand)}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value || null }))}
                    className="border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_description" className="text-gray-700">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={getInputValue(formData.description)}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || null }))}
                    className="border-gray-300 rounded-lg min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_image_url" className="text-gray-700">Image URL</Label>
                  <Input
                    id="edit_image_url"
                    value={getInputValue(formData.image_url)}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value || null }))}
                    className="border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_quantity" className="text-gray-700">Quantity *</Label>
                    <Input
                      id="edit_quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_low_stock_threshold" className="text-gray-700">Low Stock Alert</Label>
                    <Input
                      id="edit_low_stock_threshold"
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 10 }))}
                      className="border-gray-300 rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_cost_price" className="text-gray-700">Cost Price (₹) *</Label>
                    <Input
                      id="edit_cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_unit_price" className="text-gray-700">Selling Price (₹) *</Label>
                    <Input
                      id="edit_unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      className="border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_offer_price" className="text-gray-700">Offer Price (₹)</Label>
                  <Input
                    id="edit_offer_price"
                    type="number"
                    step="0.01"
                    value={getInputValue(formData.offer_price)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      offer_price: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className="border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_hsn_code" className="text-gray-700">HSN Code</Label>
                  <Input
                    id="edit_hsn_code"
                    value={getInputValue(formData.hsn_code)}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value || null }))}
                    className="border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_sku" className="text-gray-700">SKU</Label>
                  <Input
                    id="edit_sku"
                    value={getInputValue(formData.sku)}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value || null }))}
                    className="border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_barcode" className="text-gray-700">Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_barcode"
                      value={getInputValue(formData.barcode)}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value || null }))}
                      className="border-gray-300 rounded-lg"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-gray-300 rounded-lg"
                      onClick={startBarcodeScanning}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="edit_is_available" className="text-gray-700">Product Available</Label>
                  <Switch
                    id="edit_is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="border-t border-gray-200 pt-4">
              <Button 
                variant="outline" 
                className="border-gray-300 rounded-lg"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateItem} 
                disabled={updateItemMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                {updateItemMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Barcode Scanner Dialog */}
        // In Inventory.js...

        {/* Barcode Scanner Dialog */}
        <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
          <DialogContent className="bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-indigo-600" />
                Scan Barcode
              </DialogTitle>
              <DialogDescription>
                Point your camera at the barcode. A red box will appear when it's detected.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* This container makes the overlay possible */}
              <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="absolute top-0 left-0 w-full h-full object-cover" 
                />
                {/* The canvas is now visible and placed directly on top of the video */}
                <canvas 
                  ref={canvasRef} 
                  className="absolute top-0 left-0 w-full h-full" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowBarcodeScanner(false);
                  stopScanning();
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Inventory;