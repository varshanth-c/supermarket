import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Package, ShoppingBasket, BarChart2, Star, AlertTriangle, Clock, Target, Lightbulb, Receipt } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

// Type definitions
interface SalesData {
  id: string;
  items: Json;
  total_amount: number;
  created_at: string;
  user_id: string;
}
interface InventoryItem {
  id: string;
  item_name: string;
  unit_price: number; // Selling price
  cost_price: number;  // Cost price
  quantity: number;
}
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899', '#f59e0b'];

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
  const [inventoryValue, setInventoryValue] = useState(0); // *** NEW ***
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<any[]>([]);
  const [dailySalesTrend, setDailySalesTrend] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  
  // Mock data states
  const [marketBasketInsights, setMarketBasketInsights] = useState<any[]>([]);
  const [salesForecast, setSalesForecast] = useState<any>({
    predicted_revenue: 0, confidence_score: 0, trend: 'Stable', forecast_data: []
  });
  const [inventoryRecommendations, setInventoryRecommendations] = useState<any[]>([]);

  const parseSaleItems = (items: Json): any[] => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
    return [];
  };

  const { data: salesData = [] } = useQuery({
    queryKey: ['sales', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('sales').select('*').eq('user_id', user.id).gte('created_at', `${startDate}T00:00:00.000Z`).lte('created_at', `${endDate}T23:59:59.999Z`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: inventoryData = [] } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('inventory').select('id, item_name, unit_price, cost_price, quantity').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(item => ({ ...item, cost_price: Number(item.cost_price) || 0, quantity: Number(item.quantity) || 0 }));
    },
    enabled: !!user?.id
  });

  const { data: expensesData = [] } = useQuery({
    queryKey: ['expenses', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!salesData || !inventoryData || !expensesData) return;

    // --- FINANCIAL CALCULATIONS ---
    const revenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const expenses = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const inventoryMap = new Map(inventoryData.map(item => [item.item_name, item]));
    const cogs = salesData.reduce((sum, sale) => {
        const items = parseSaleItems(sale.items);
        return sum + items.reduce((itemSum, item) => {
            const inventoryItem = inventoryMap.get(item.item_name);
            const costPrice = inventoryItem ? inventoryItem.cost_price : 0;
            return itemSum + (costPrice * (item.quantity_sold || item.quantity || 0));
        }, 0);
    }, 0);

    setTotalRevenue(revenue);
    setTotalCOGS(cogs);
    setTotalExpenses(expenses);
    setNetProfit(revenue - cogs - expenses);

    // --- INVENTORY CALCULATIONS ---
    // *** NEW: Calculate Total Inventory Value ***
    const totalInventoryValue = inventoryData.reduce((sum, item) => {
        return sum + (item.cost_price * item.quantity);
    }, 0);
    setInventoryValue(totalInventoryValue);

    // --- ANALYTICS CALCULATIONS ---
    const productSales = {};
    salesData.forEach(sale => {
      parseSaleItems(sale.items).forEach(item => {
        productSales[item.item_name] = (productSales[item.item_name] || 0) + (item.quantity_sold || item.quantity || 0);
      });
    });
    setTopSellingProducts(Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({ name, quantity })));
    
    setLowStockItems(inventoryData.filter(item => item.quantity < 10).map(item => ({ name: item.item_name, stock: item.quantity })));
    const soldProductNames = new Set(Object.keys(productSales));
    setSlowMovingItems(inventoryData.filter(item => !soldProductNames.has(item.item_name)).map(item => ({ name: item.item_name, stock: item.quantity })));

    const dailySales = {};
    salesData.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString('en-CA');
      dailySales[date] = (dailySales[date] || 0) + Number(sale.total_amount);
    });
    setDailySalesTrend(Object.entries(dailySales).map(([date, sales]) => ({ date, sales })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    
    const categoryExpenses = {};
    expensesData.forEach(expense => {
      categoryExpenses[expense.category] = (categoryExpenses[expense.category] || 0) + Number(expense.amount);
    });
    setExpenseBreakdown(Object.entries(categoryExpenses).map(([name, value]) => ({ name, value })));

  }, [salesData, inventoryData, expensesData]);
  
  useEffect(() => {
    setMarketBasketInsights([
      { itemA: 'Wheat', itemB: 'Fertilizer', confidence: 0.75, support: 0.2 },
      { itemA: 'Corn', itemB: 'Pesticide', confidence: 0.6, support: 0.15 },
    ]);
    setSalesForecast({
      predicted_revenue: 52450.75, confidence_score: 87.5, trend: 'Increasing',
      forecast_data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(new Date().setDate(new Date().getDate() + i)).toLocaleDateString('en-CA'),
        predicted_sales: Math.random() * 800 + 400 + i * 15
      }))
    });
    setInventoryRecommendations([
      { product_name: 'Wheat', current_stock: 50, predicted_demand: 75, suggested_order: 100, priority: 'High' },
      { product_name: 'Corn', current_stock: 30, predicted_demand: 40, suggested_order: 50, priority: 'Medium' },
    ]);
  }, []);

  const handleDateRangeChange = () => {
    toast({
      title: 'Updating Analytics',
      description: `Fetching data from ${startDate} to ${endDate}.`,
    });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-[0.70rem] uppercase text-muted-foreground">{label}</p>
          <p className="font-bold text-muted-foreground">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (tickItem: number) => `₹${(tickItem / 1000)}k`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Navbar />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-7xl gap-2">
          <h1 className="text-3xl font-semibold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Get deep insights into your business performance.</p>
        </div>

        <Card className="mx-auto w-full max-w-7xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-2"><Label htmlFor="startDate" className="text-xs">Start Date</Label><Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-[180px]" /></div>
              <div className="grid gap-2"><Label htmlFor="endDate" className="text-xs">End Date</Label><Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-[180px]" /></div>
              <Button onClick={handleDateRangeChange} className="w-full md:w-auto">Update Analytics</Button>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">₹{totalCOGS.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Operating Expenses</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{netProfit.toFixed(2)}</div></CardContent></Card>
        </div>
        
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5"/> Daily Sales Trend</CardTitle><CardDescription>Revenue performance over the selected period.</CardDescription></CardHeader><CardContent className="h-[24rem] w-full p-2"><ResponsiveContainer><LineChart data={dailySalesTrend} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/><XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888" /><YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} stroke="#888" /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}/><Line type="monotone" dataKey="sales" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500"/> Top Selling Products</CardTitle><CardDescription>By quantity sold in the selected period.</CardDescription></CardHeader><CardContent>{topSellingProducts.length > 0 ? (<ul className="space-y-3">{topSellingProducts.map((p, i) => (<li key={i} className="flex items-center justify-between text-sm"><span className="font-medium truncate">{p.name}</span><Badge variant="secondary">{p.quantity} sold</Badge></li>))}</ul>) : <p className="text-sm text-muted-foreground">No sales data for this period.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Expense Breakdown</CardTitle><CardDescription>Distribution of expenses by category.</CardDescription></CardHeader><CardContent className="h-[18rem] w-full p-0 flex items-center justify-center">{expenseBreakdown.length > 0 ? (<ResponsiveContainer><PieChart><Pie data={expenseBreakdown} cx="50%" cy="50%" labelLine={false} outerRadius={90} innerRadius={45} fill="#8884d8" dataKey="value" paddingAngle={2}>{expenseBreakdown.map((e, i) => (<Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}</Pie><Tooltip formatter={(v: number) => `₹${v.toFixed(2)}`} /><Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/></PieChart></ResponsiveContainer>) : <p className="text-sm text-muted-foreground">No expense data for this period.</p>}</CardContent></Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/> Inventory Insights</CardTitle>
                <CardDescription>Key metrics and actionable alerts for your stock.</CardDescription>
                 {/* *** NEW: Display for Total Inventory Value *** */}
                <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground">Total Inventory Value (at cost)</p>
                    <p className="text-2xl font-bold text-blue-700">₹{inventoryValue.toFixed(2)}</p>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="low-stock"><AccordionTrigger className="text-orange-600 hover:no-underline"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Low Stock Alerts ({lowStockItems.length} items)</div></AccordionTrigger><AccordionContent><div className="max-h-60 overflow-y-auto pr-2">{lowStockItems.length > 0 ? (<ul className="space-y-2">{lowStockItems.map((item, i) => (<li key={i} className="flex justify-between items-center p-2 bg-orange-50 rounded-md text-sm"><span className="font-medium">{item.name}</span><Badge variant="destructive">{item.stock} left</Badge></li>))}</ul>) : <p className="text-sm text-muted-foreground p-2">All items are well-stocked.</p>}</div></AccordionContent></AccordionItem>
                    <AccordionItem value="slow-moving"><AccordionTrigger className="text-red-600 hover:no-underline"><div className="flex items-center gap-2"><Clock className="h-4 w-4"/> Slow-Moving Inventory ({slowMovingItems.length} items)</div></AccordionTrigger><AccordionContent><div className="max-h-60 overflow-y-auto pr-2">{slowMovingItems.length > 0 ? (<ul className="space-y-2">{slowMovingItems.map((item, i) => (<li key={i} className="flex justify-between items-center p-2 bg-red-50 rounded-md text-sm"><span className="font-medium">{item.name}</span><Badge variant="outline">{item.stock} in stock</Badge></li>))}</ul>) : <p className="text-sm text-muted-foreground p-2">No slow-moving items found in this period.</p>}</div></AccordionContent></AccordionItem>
                </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* --- The rest of the AI/ML mock data sections remain the same --- */}
        {/* ... */}

      </main>
    </div>
  );
};

export default Reports;