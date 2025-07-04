// src/pages/Reports.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart,
  Bar,
  Legend,
  Cell 
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart, BarChart2, Star, AlertTriangle, Clock, Receipt, Banknote } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

// Type definitions
interface SalesData { id: string; items: Json; total_amount: number; created_at: string; user_id: string; }
interface InventoryItem { id: string; item_name: string; unit_price: number; cost_price: number; quantity: number; }
interface Expense { id: string; amount: number; category: string; description: string; date: string; }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899', '#f59e0b'];

// Helper function for consistent currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};


const Reports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // States for processed data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCOGS, setTotalCOGS] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<any[]>([]);
  const [dailySalesTrend, setDailySalesTrend] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  
  const parseSaleItems = (items: Json): any[] => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') { try { const parsed = JSON.parse(items); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
    return [];
  };

  const { data: salesData = [] } = useQuery({ queryKey: ['sales', user?.id, startDate, endDate], queryFn: async () => { if (!user?.id) return []; const { data, error } = await supabase.from('sales').select('*').eq('user_id', user.id).gte('created_at', `${startDate}T00:00:00.000Z`).lte('created_at', `${endDate}T23:59:59.999Z`); if (error) throw error; return data || []; }, enabled: !!user?.id });
  const { data: inventoryData = [] } = useQuery({ queryKey: ['inventory', user?.id], queryFn: async () => { if (!user?.id) return []; const { data, error } = await supabase.from('inventory').select('id, item_name, unit_price, cost_price, quantity').eq('user_id', user.id); if (error) throw error; return (data || []).map(item => ({ ...item, cost_price: Number(item.cost_price) || 0, quantity: Number(item.quantity) || 0 })); }, enabled: !!user?.id });
  const { data: expensesData = [] } = useQuery({ queryKey: ['expenses', user?.id, startDate, endDate], queryFn: async () => { if (!user?.id) return []; const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate); if (error) throw error; return data || []; }, enabled: !!user?.id });

  useEffect(() => {
    if (!salesData || !inventoryData || !expensesData) return;

    // --- FINANCIAL CALCULATIONS ---
    const revenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const expenses = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    // ** THE FIX IS HERE **
    // Create a Map using the item's unique ID for a reliable lookup.
    const inventoryMap = new Map(inventoryData.map(item => [item.id, item]));

    const cogs = salesData.reduce((sum, sale) => {
        const items = parseSaleItems(sale.items);
        return sum + items.reduce((itemSum, soldItem) => {
            // Use the item's 'id' from the sale to find the corresponding item in inventory.
            const inventoryItem = inventoryMap.get(soldItem.id); 
            const costPrice = inventoryItem ? inventoryItem.cost_price : 0;
            
            // Helpful for debugging: Log if an item has a cost of 0 or isn't found
            if (inventoryItem && costPrice === 0) console.warn(`Item "${inventoryItem.item_name}" has a cost_price of 0.`);
            if (!inventoryItem) console.warn(`Sold item ID "${soldItem.id}" not found in current inventory.`);

            const quantity = soldItem.cart_quantity || soldItem.quantity_sold || 0;
            return itemSum + (costPrice * quantity);
        }, 0);
    }, 0);

    setTotalRevenue(revenue);
    setTotalCOGS(cogs); // This is now correctly calculated!
    setTotalExpenses(expenses);
    setNetProfit(revenue - cogs - expenses);

    // --- INVENTORY CALCULATIONS ---
    const totalInventoryValue = inventoryData.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
    setInventoryValue(totalInventoryValue);

    // --- ANALYTICS CALCULATIONS (No changes needed here) ---
    const productSales = new Map<string, number>();
    salesData.forEach(sale => { parseSaleItems(sale.items).forEach(item => { productSales.set(item.item_name, (productSales.get(item.item_name) || 0) + (item.cart_quantity || 0)); }); });
    setTopSellingProducts(Array.from(productSales.entries()).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({ name, quantity })));
    setLowStockItems(inventoryData.filter(item => item.quantity > 0 && item.quantity < 10).map(item => ({ name: item.item_name, stock: item.quantity })));
    const soldProductNames = new Set(productSales.keys());
    setSlowMovingItems(inventoryData.filter(item => item.quantity > 0 && !soldProductNames.has(item.item_name)).map(item => ({ name: item.item_name, stock: item.quantity })));
    const dailySales = new Map<string, number>();
    salesData.forEach(sale => { const date = new Date(sale.created_at).toLocaleDateString('en-CA'); dailySales.set(date, (dailySales.get(date) || 0) + Number(sale.total_amount)); });
    setDailySalesTrend(Array.from(dailySales.entries()).map(([date, sales]) => ({ date, sales })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    const categoryExpenses = new Map<string, number>();
    expensesData.forEach(expense => { categoryExpenses.set(expense.category, (categoryExpenses.get(expense.category) || 0) + Number(expense.amount)); });
    setExpenseBreakdown(Array.from(categoryExpenses.entries()).map(([name, value]) => ({ name, value })));

  }, [salesData, inventoryData, expensesData]);
  
  const handleDateRangeChange = () => { toast({ title: 'Updating Analytics' }); queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['expenses'] }); };
  const CustomTooltip = ({ active, payload, label }: any) => { if (active && payload && payload.length) { return (<div className="rounded-lg border bg-background p-2 shadow-sm"><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="font-bold text-foreground">{formatCurrency(payload[0].value)}</p></div>); } return null; };
  const formatYAxis = (tickItem: number) => `₹${(tickItem / 1000)}k`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-7xl gap-2">
          <h1 className="text-3xl font-semibold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">An overview of your business performance.</p>
        </div>

        <Card className="mx-auto w-full max-w-7xl"><CardContent className="pt-6"><div className="flex flex-wrap items-end gap-4"><div className="grid gap-2"><Label htmlFor="startDate" className="text-xs">Start Date</Label><Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-[180px]" /></div><div className="grid gap-2"><Label htmlFor="endDate" className="text-xs">End Date</Label><Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-[180px]" /></div><Button onClick={handleDateRangeChange} className="w-full md:w-auto">Generate Report</Button></div></CardContent></Card>

        {/* --- KPI Cards --- */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(totalRevenue)}</div><p className="text-xs text-muted-foreground">+20.1% from last month</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cost of Goods</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600 dark:text-orange-500">{formatCurrency(totalCOGS)}</div><p className="text-xs text-muted-foreground">Direct cost of items sold</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Expenses</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600 dark:text-red-500">{formatCurrency(totalExpenses)}</div><p className="text-xs text-muted-foreground">Total operating costs</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600 dark:text-blue-500' : 'text-red-600'}`}>{formatCurrency(netProfit)}</div><p className="text-xs text-muted-foreground">Your bottom line</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">{formatCurrency(inventoryValue)}</div><p className="text-xs text-muted-foreground">Value of stock at cost</p></CardContent></Card>
        </div>
        
        <div className="mx-auto grid w-full max-w-7xl auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-3"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5"/> Daily Sales Trend</CardTitle><CardDescription>Revenue performance over the selected period.</CardDescription></CardHeader><CardContent className="h-[24rem] w-full p-2"><ResponsiveContainer><LineChart data={dailySalesTrend} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/><XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--primary), 0.1)' }}/><Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></CardContent></Card>
          
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500"/> Top Selling Products</CardTitle><CardDescription>By quantity sold.</CardDescription></CardHeader>
            <CardContent>
              {topSellingProducts.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>Product</TableHead><TableHead className="text-right">Sold</TableHead></TableRow></TableHeader>
                  <TableBody>{topSellingProducts.map((p, i) => (<TableRow key={i}><TableCell className="font-medium">{i + 1}</TableCell><TableCell>{p.name}</TableCell><TableCell className="text-right">{p.quantity}</TableCell></TableRow>))}</TableBody>
                </Table>
              ) : <p className="text-sm text-muted-foreground py-10 text-center">No sales data for this period.</p>}
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Expense Breakdown</CardTitle><CardDescription>Distribution by category.</CardDescription></CardHeader>
            <CardContent className="h-[20rem] w-full p-0 flex items-center justify-center">
              {expenseBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis type="number" tickFormatter={(v) => `₹${v/1000}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"/>
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"/>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: 'hsla(var(--primary), 0.1)' }}/>
                    <Bar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} radius={[0, 4, 4, 0]}>
                      {expenseBreakdown.map((e, i) => (<Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground py-10 text-center">No expense data for this period.</p>}
            </CardContent>
          </Card>

          <Card className="flex flex-col"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500"/> Low Stock Alerts</CardTitle><CardDescription>Items needing reordering soon.</CardDescription></CardHeader>
            <CardContent className="flex-grow">
              {lowStockItems.length > 0 ? (
                <ul className="space-y-2">{lowStockItems.map((item, i) => (<li key={i} className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md text-sm"><span className="font-medium">{item.name}</span><span className="font-bold text-orange-600 dark:text-orange-400">{item.stock} left</span></li>))}</ul>
              ) : <p className="text-sm text-muted-foreground pt-10 text-center">All items are well-stocked.</p>}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default Reports;