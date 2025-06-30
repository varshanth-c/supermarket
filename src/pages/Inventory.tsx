
// import React, { useState, useRef } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Plus, Edit, Trash2, Search, Camera, QrCode } from 'lucide-react';
// import { Navbar } from '@/components/Navbar';
// import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
// import { ProductBarcode } from '@/components/ProductBarcode';

// interface InventoryItem {
//   id: string;
//   item_name: string;
//   category: string;
//   quantity: number;
//   unit_price: number;
//   low_stock_threshold: number;
//   barcode?: string | null;
//   gst_rate?: number;
//   hsn_code?: string;
// }

// const Inventory = () => {
//   const { toast } = useToast();
//   const { user } = useAuth();
//   const queryClient = useQueryClient();
//   const { videoRef, canvasRef, startScanning, stopScanning } = useBarcodeScanner();
  
//   const [showAddDialog, setShowAddDialog] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
//   const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('');
  
//   const [formData, setFormData] = useState({
//     item_name: '',
//     category: '',
//     quantity: 0,
//     unit_price: 0,
//     low_stock_threshold: 10,
//     barcode: '',
//     gst_rate: 18,
//     hsn_code: ''
//   });

//   // Fetch inventory items
//   const { data: inventoryItems = [], isLoading } = useQuery({
//     queryKey: ['inventory', user?.id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('inventory')
//         .select('*')
//         .eq('user_id', user?.id)
//         .order('item_name');
      
//       if (error) throw error;
//       return data || [];
//     },
//     enabled: !!user?.id
//   });

//   // Add item mutation
//   const addItemMutation = useMutation({
//     mutationFn: async (newItem: any) => {
//       const { data, error } = await supabase
//         .from('inventory')
//         .insert([{ ...newItem, user_id: user!.id }])
//         .select()
//         .single();
      
//       if (error) throw error;
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['inventory'] });
//       setShowAddDialog(false);
//       resetForm();
//       toast({ title: "Success", description: "Item added successfully" });
//     },
//     onError: (error) => {
//       toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
//     }
//   });

//   // Update item mutation
//   const updateItemMutation = useMutation({
//     mutationFn: async ({ id, ...updateData }: any) => {
//       const { data, error } = await supabase
//         .from('inventory')
//         .update(updateData)
//         .eq('id', id)
//         .eq('user_id', user!.id)
//         .select()
//         .single();
      
//       if (error) throw error;
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['inventory'] });
//       setShowEditDialog(false);
//       setEditingItem(null);
//       resetForm();
//       toast({ title: "Success", description: "Item updated successfully" });
//     }
//   });

//   // Delete item mutation
//   const deleteItemMutation = useMutation({
//     mutationFn: async (id: string) => {
//       const { error } = await supabase
//         .from('inventory')
//         .delete()
//         .eq('id', id)
//         .eq('user_id', user!.id);
      
//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['inventory'] });
//       toast({ title: "Success", description: "Item deleted successfully" });
//     }
//   });

//   const categories = [...new Set(inventoryItems.map(item => item.category))];
  
//   const filteredItems = inventoryItems.filter(item => {
//     const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          (item.barcode && item.barcode.includes(searchTerm));
//     const matchesCategory = !selectedCategory || item.category === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   const resetForm = () => {
//     setFormData({
//       item_name: '',
//       category: '',
//       quantity: 0,
//       unit_price: 0,
//       low_stock_threshold: 10,
//       barcode: '',
//       gst_rate: 18,
//       hsn_code: ''
//     });
//   };

//   const handleAddItem = () => {
//     addItemMutation.mutate(formData);
//   };

//   const handleUpdateItem = () => {
//     if (editingItem) {
//       updateItemMutation.mutate({ id: editingItem.id, ...formData });
//     }
//   };

//   const handleEdit = (item: InventoryItem) => {
//     setEditingItem(item);
//     setFormData({
//       item_name: item.item_name,
//       category: item.category,
//       quantity: item.quantity,
//       unit_price: item.unit_price,
//       low_stock_threshold: item.low_stock_threshold,
//       barcode: item.barcode || '',
//       gst_rate: (item as any).gst_rate || 18,
//       hsn_code: (item as any).hsn_code || ''
//     });
//     setShowEditDialog(true);
//   };

//   const handleBarcodeScanned = (barcode: string) => {
//     setFormData(prev => ({ ...prev, barcode }));
//     setShowBarcodeScanner(false);
//     stopScanning();
//     toast({ title: "Barcode Scanned", description: `Barcode: ${barcode}` });
//   };

//   const startBarcodeScanning = async () => {
//     try {
//       await startScanning(handleBarcodeScanned);
//       setShowBarcodeScanner(true);
//     } catch (error) {
//       toast({
//         title: "Camera Error",
//         description: "Unable to access camera",
//         variant: "destructive"
//       });
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Navbar />
//         <div className="container mx-auto px-4 py-8">
//           <div className="flex items-center justify-center">
//             <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar />
//       <div className="container mx-auto px-4 py-8">
//         <div className="mb-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
//             <p className="text-gray-600">Manage your products with barcode support</p>
//           </div>
//           <Button onClick={() => setShowAddDialog(true)}>
//             <Plus className="h-4 w-4 mr-2" />
//             Add Product
//           </Button>
//         </div>

//         {/* Search and Filter */}
//         <Card className="mb-6">
//           <CardContent className="pt-6">
//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="flex-1">
//                 <Label htmlFor="search">Search Products</Label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                   <Input
//                     id="search"
//                     placeholder="Search by name or barcode..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//               </div>
//               <div className="w-full md:w-48">
//                 <Label htmlFor="category-filter">Filter by Category</Label>
//                 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="All categories" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="">All categories</SelectItem>
//                     {categories.map(category => (
//                       <SelectItem key={category} value={category}>{category}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Inventory Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Products ({filteredItems.length})</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Product Name</TableHead>
//                     <TableHead>Category</TableHead>
//                     <TableHead>Quantity</TableHead>
//                     <TableHead>Unit Price</TableHead>
//                     <TableHead>GST Rate</TableHead>
//                     <TableHead>HSN Code</TableHead>
//                     <TableHead>Barcode</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredItems.map((item) => (
//                     <TableRow key={item.id}>
//                       <TableCell className="font-medium">{item.item_name}</TableCell>
//                       <TableCell>{item.category}</TableCell>
//                       <TableCell>{item.quantity}</TableCell>
//                       <TableCell>₹{item.unit_price}</TableCell>
//                       <TableCell>{(item as any).gst_rate || 18}%</TableCell>
//                       <TableCell>{(item as any).hsn_code || 'N/A'}</TableCell>
//                       <TableCell>
//                         {item.barcode ? (
//                           <div className="text-xs">
//                             <ProductBarcode 
//                               value={item.barcode} 
//                               width={1} 
//                               height={30} 
//                               displayValue={false} 
//                             />
//                             <div className="mt-1">{item.barcode}</div>
//                           </div>
//                         ) : 'No barcode'}
//                       </TableCell>
//                       <TableCell>
//                         <Badge variant={item.quantity <= item.low_stock_threshold ? "destructive" : "secondary"}>
//                           {item.quantity <= item.low_stock_threshold ? "Low Stock" : "In Stock"}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex space-x-2">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => handleEdit(item)}
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => deleteItemMutation.mutate(item.id)}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Add Item Dialog */}
//         <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Add New Product</DialogTitle>
//               <DialogDescription>
//                 Enter product details with GST information and barcode
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="item_name">Product Name *</Label>
//                 <Input
//                   id="item_name"
//                   value={formData.item_name}
//                   onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
//                   placeholder="Enter product name"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="category">Category *</Label>
//                 <Input
//                   id="category"
//                   value={formData.category}
//                   onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
//                   placeholder="Enter category"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="quantity">Quantity *</Label>
//                 <Input
//                   id="quantity"
//                   type="number"
//                   value={formData.quantity}
//                   onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="unit_price">Unit Price (₹) *</Label>
//                 <Input
//                   id="unit_price"
//                   type="number"
//                   step="0.01"
//                   value={formData.unit_price}
//                   onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="gst_rate">GST Rate (%)</Label>
//                 <Select value={formData.gst_rate.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, gst_rate: parseInt(value) }))}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="0">0%</SelectItem>
//                     <SelectItem value="5">5%</SelectItem>
//                     <SelectItem value="12">12%</SelectItem>
//                     <SelectItem value="18">18%</SelectItem>
//                     <SelectItem value="28">28%</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="hsn_code">HSN Code</Label>
//                 <Input
//                   id="hsn_code"
//                   value={formData.hsn_code}
//                   onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
//                   placeholder="Enter HSN code"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
//                 <Input
//                   id="low_stock_threshold"
//                   type="number"
//                   value={formData.low_stock_threshold}
//                   onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 10 }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="barcode">Barcode</Label>
//                 <div className="flex gap-2">
//                   <Input
//                     id="barcode"
//                     value={formData.barcode}
//                     onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
//                     placeholder="Enter or scan barcode"
//                   />
//                   <Button type="button" variant="outline" onClick={startBarcodeScanning}>
//                     <Camera className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setShowAddDialog(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
//                 {addItemMutation.isPending ? 'Adding...' : 'Add Product'}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Edit Item Dialog */}
//         <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Edit Product</DialogTitle>
//               <DialogDescription>
//                 Update product details
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//               {/* Same form fields as Add Dialog */}
//               <div className="space-y-2">
//                 <Label htmlFor="edit_item_name">Product Name *</Label>
//                 <Input
//                   id="edit_item_name"
//                   value={formData.item_name}
//                   onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit_category">Category *</Label>
//                 <Input
//                   id="edit_category"
//                   value={formData.category}
//                   onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit_quantity">Quantity *</Label>
//                 <Input
//                   id="edit_quantity"
//                   type="number"
//                   value={formData.quantity}
//                   onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit_unit_price">Unit Price (₹) *</Label>
//                 <Input
//                   id="edit_unit_price"
//                   type="number"
//                   step="0.01"
//                   value={formData.unit_price}
//                   onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit_gst_rate">GST Rate (%)</Label>
//                 <Select value={formData.gst_rate.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, gst_rate: parseInt(value) }))}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="0">0%</SelectItem>
//                     <SelectItem value="5">5%</SelectItem>
//                     <SelectItem value="12">12%</SelectItem>
//                     <SelectItem value="18">18%</SelectItem>
//                     <SelectItem value="28">28%</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit_hsn_code">HSN Code</Label>
//                 <Input
//                   id="edit_hsn_code"
//                   value={formData.hsn_code}
//                   onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit_barcode">Barcode</Label>
//                 <div className="flex gap-2">
//                   <Input
//                     id="edit_barcode"
//                     value={formData.barcode}
//                     onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
//                   />
//                   <Button type="button" variant="outline" onClick={startBarcodeScanning}>
//                     <Camera className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setShowEditDialog(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleUpdateItem} disabled={updateItemMutation.isPending}>
//                 {updateItemMutation.isPending ? 'Updating...' : 'Update Product'}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Barcode Scanner Dialog */}
//         <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Scan Barcode</DialogTitle>
//               <DialogDescription>
//                 Point your camera at the barcode
//               </DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <video ref={videoRef} autoPlay className="w-full rounded-lg" />
//               <canvas ref={canvasRef} className="hidden" />
//             </div>
//             <DialogFooter>
//               <Button onClick={() => {
//                 setShowBarcodeScanner(false);
//                 stopScanning();
//               }}>
//                 Cancel
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </div>
//   );
// };

// export default Inventory;

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Camera, QrCode } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ProductBarcode } from '@/components/ProductBarcode';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  low_stock_threshold: number;
  barcode?: string | null;
  gst_rate?: number;
  hsn_code?: string;
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
  
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity: 0,
    unit_price: 0,
    low_stock_threshold: 10,
    barcode: '',
    gst_rate: 18,
    hsn_code: ''
  });

  // Fetch inventory items
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

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (newItem: any) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert([{ ...newItem, user_id: user!.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddDialog(false);
      resetForm();
      toast({ title: "Success", description: "Item added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowEditDialog(false);
      setEditingItem(null);
      resetForm();
      toast({ title: "Success", description: "Item updated successfully" });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: "Success", description: "Item deleted successfully" });
    }
  });

  const categories = [...new Set(inventoryItems.map(item => item.category))];
  
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.barcode && item.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      quantity: 0,
      unit_price: 0,
      low_stock_threshold: 10,
      barcode: '',
      gst_rate: 18,
      hsn_code: ''
    });
  };

  const handleAddItem = () => {
    addItemMutation.mutate(formData);
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, ...formData });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      low_stock_threshold: item.low_stock_threshold,
      barcode: item.barcode || '',
      gst_rate: (item as any).gst_rate || 18,
      hsn_code: (item as any).hsn_code || ''
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Manage your products with barcode support</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="category-filter">Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>GST Rate</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.unit_price}</TableCell>
                      <TableCell>{(item as any).gst_rate || 18}%</TableCell>
                      <TableCell>{(item as any).hsn_code || 'N/A'}</TableCell>
                      <TableCell>
                        {item.barcode ? (
                          <div className="text-xs">
                            <ProductBarcode 
                              value={item.barcode} 
                              width={1} 
                              height={30} 
                              displayValue={false} 
                            />
                            <div className="mt-1">{item.barcode}</div>
                          </div>
                        ) : 'No barcode'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.quantity <= item.low_stock_threshold ? "destructive" : "secondary"}>
                          {item.quantity <= item.low_stock_threshold ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
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
            </div>
          </CardContent>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter product details with GST information and barcode
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item_name">Product Name *</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price (₹) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_rate">GST Rate (%)</Label>
                <Select value={formData.gst_rate.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, gst_rate: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsn_code">HSN Code</Label>
                <Input
                  id="hsn_code"
                  value={formData.hsn_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
                  placeholder="Enter HSN code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 10 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Enter or scan barcode"
                  />
                  <Button type="button" variant="outline" onClick={startBarcodeScanning}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? 'Adding...' : 'Add Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product details
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Same form fields as Add Dialog */}
              <div className="space-y-2">
                <Label htmlFor="edit_item_name">Product Name *</Label>
                <Input
                  id="edit_item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_category">Category *</Label>
                <Input
                  id="edit_category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_quantity">Quantity *</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_unit_price">Unit Price (₹) *</Label>
                <Input
                  id="edit_unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_gst_rate">GST Rate (%)</Label>
                <Select value={formData.gst_rate.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, gst_rate: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_hsn_code">HSN Code</Label>
                <Input
                  id="edit_hsn_code"
                  value={formData.hsn_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_barcode">Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit_barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={startBarcodeScanning}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateItem} disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Barcode Scanner Dialog */}
        <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scan Barcode</DialogTitle>
              <DialogDescription>
                Point your camera at the barcode
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <video ref={videoRef} autoPlay className="w-full rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setShowBarcodeScanner(false);
                stopScanning();
              }}>
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
