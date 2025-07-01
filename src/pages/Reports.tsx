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
import { DollarSign, TrendingUp, TrendingDown, Package, ShoppingBasket, BarChart2, Star, AlertTriangle, Clock, Target, Lightbulb } from 'lucide-react';
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
  unit_price: number;
  quantity: number;
}
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

// A more vibrant and professional color palette for charts
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
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
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

  // *** FIX: Restored the full useQuery implementation for salesData ***
  const { data: salesData = [] } = useQuery({
    queryKey: ['sales', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`);
      if (error) {
        console.error('Error fetching sales data:', error);
        toast({ title: "Error", description: "Could not fetch sales data.", variant: "destructive" });
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // *** FIX: Restored the full useQuery implementation for inventoryData ***
  const { data: inventoryData = [] } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching inventory data:', error);
        toast({ title: "Error", description: "Could not fetch inventory data.", variant: "destructive" });
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // *** FIX: Restored the full useQuery implementation for expensesData ***
  const { data: expensesData = [] } = useQuery({
    queryKey: ['expenses', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) {
        console.error('Error fetching expenses data:', error);
        toast({ title: "Error", description: "Could not fetch expense data.", variant: "destructive" });
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    // Calculate total revenue
    const revenue = salesData.reduce((sum: number, sale: SalesData) => sum + Number(sale.total_amount), 0);
    setTotalRevenue(revenue);

    // Calculate total expenses
    const expenses = expensesData.reduce((sum: number, expense: Expense) => sum + Number(expense.amount), 0);
    setTotalExpenses(expenses);

    // Calculate net profit
    setNetProfit(revenue - expenses);

    // Top selling products
    const productSales: { [key: string]: number } = {};
    salesData.forEach((sale: SalesData) => {
      const items = parseSaleItems(sale.items);
      items.forEach((item: any) => {
        productSales[item.item_name] = (productSales[item.item_name] || 0) + (item.quantity_sold || item.quantity || 0);
      });
    });
    setTopSellingProducts(Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({ name, quantity })));
    
    // Low stock items
    setLowStockItems(inventoryData.filter((item: InventoryItem) => item.quantity < 10).map(item => ({ name: item.item_name, stock: item.quantity })));
    
    // Slow moving items
    const soldProductNames = new Set(Object.keys(productSales));
    setSlowMovingItems(inventoryData.filter((item: InventoryItem) => !soldProductNames.has(item.item_name)).map(item => ({ name: item.item_name, stock: item.quantity })));

    // Daily sales trend
    const dailySales: { [key: string]: number } = {};
    salesData.forEach((sale: SalesData) => {
      const date = new Date(sale.created_at).toLocaleDateString('en-CA');
      dailySales[date] = (dailySales[date] || 0) + Number(sale.total_amount);
    });
    setDailySalesTrend(Object.entries(dailySales).map(([date, sales]) => ({ date, sales })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    
    // Expense breakdown
    const categoryExpenses: { [key: string]: number } = {};
    expensesData.forEach((expense: Expense) => {
      categoryExpenses[expense.category] = (categoryExpenses[expense.category] || 0) + Number(expense.amount);
    });
    setExpenseBreakdown(Object.entries(categoryExpenses).map(([name, value]) => ({ name, value })));

  }, [salesData, inventoryData, expensesData]);
  
  useEffect(() => {
    // Mock data generation can be run once
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
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {label}
              </span>
              <span className="font-bold text-muted-foreground">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payload[0].value)}
              </span>
            </div>
          </div>
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
          <p className="text-muted-foreground">
            Get deep insights into your business performance.
          </p>
        </div>

        {/* Date Range Selector */}
        <Card className="mx-auto w-full max-w-7xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-[180px]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate" className="text-xs">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-[180px]" />
              </div>
              <Button onClick={handleDateRangeChange} className="w-full md:w-auto">Update Analytics</Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Analytics Grid */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Daily Sales Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5"/> Daily Sales Trend</CardTitle>
              <CardDescription>Revenue performance over the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="h-[24rem] w-full p-2">
              <ResponsiveContainer>
                <LineChart data={dailySalesTrend} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888" />
                  <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} stroke="#888" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}/>
                  <Line type="monotone" dataKey="sales" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500"/> Top Selling Products</CardTitle>
              <CardDescription>By quantity sold in the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                {topSellingProducts.length > 0 ? (
                    <ul className="space-y-3">
                        {topSellingProducts.map((product, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate">{product.name}</span>
                            <Badge variant="secondary">{product.quantity} sold</Badge>
                        </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">No sales data for this period.</p>}
            </CardContent>
          </Card>
          
          {/* Expense Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Expense Breakdown</CardTitle>
              <CardDescription>Distribution of expenses by category.</CardDescription>
            </CardHeader>
            <CardContent className="h-[18rem] w-full p-0 flex items-center justify-center">
               {expenseBreakdown.length > 0 ? (
                <ResponsiveContainer>
                    <PieChart>
                    <Pie data={expenseBreakdown} cx="50%" cy="50%" labelLine={false} outerRadius={90} innerRadius={45} fill="#8884d8" dataKey="value" paddingAngle={2}>
                        {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                    </PieChart>
                </ResponsiveContainer>
               ) : <p className="text-sm text-muted-foreground">No expense data for this period.</p>}
            </CardContent>
          </Card>
          
          {/* Inventory Insights (Collapsible) */}
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/> Inventory Insights</CardTitle>
                <CardDescription>Actionable alerts for your stock.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="low-stock">
                        <AccordionTrigger className="text-orange-600 hover:no-underline">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4"/> Low Stock Alerts ({lowStockItems.length} items)
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="max-h-60 overflow-y-auto pr-2">
                             {lowStockItems.length > 0 ? (
                                <ul className="space-y-2">
                                    {lowStockItems.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded-md text-sm">
                                        <span className="font-medium">{item.name}</span>
                                        <Badge variant="destructive">{item.stock} left</Badge>
                                    </li>
                                    ))}
                                </ul>
                             ) : <p className="text-sm text-muted-foreground p-2">All items are well-stocked.</p>}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="slow-moving">
                        <AccordionTrigger className="text-red-600 hover:no-underline">
                           <div className="flex items-center gap-2">
                               <Clock className="h-4 w-4"/> Slow-Moving Inventory ({slowMovingItems.length} items)
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="max-h-60 overflow-y-auto pr-2">
                            {slowMovingItems.length > 0 ? (
                                <ul className="space-y-2">
                                    {slowMovingItems.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-md text-sm">
                                        <span className="font-medium">{item.name}</span>
                                        <Badge variant="outline">{item.stock} in stock</Badge>
                                    </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground p-2">No slow-moving items found in this period.</p>}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* ML & AI Insights Section */}
        <div className="mx-auto grid w-full max-w-7xl gap-2 mt-8">
            <h2 className="text-2xl font-semibold">AI-Powered Insights</h2>
            <p className="text-muted-foreground">Advanced analytics to guide your decisions.</p>
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Market Basket Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-5 w-5"/> Market Basket Analysis</CardTitle>
              <CardDescription>Discover which products are frequently bought together (mock data).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {marketBasketInsights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-800">
                    {insight.itemA} <span className="text-blue-500 mx-1">→</span> {insight.itemB}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    <span className="font-medium">Confidence:</span> {(insight.confidence * 100).toFixed(0)}%
                    <span className="mx-2">|</span>
                    <span className="font-medium">Support:</span> {(insight.support * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Sales Forecasting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5"/> Sales Forecast</CardTitle>
              <CardDescription>Predicted sales for the next 30 days (mock data).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Predicted Revenue</p>
                        <p className="text-lg font-bold text-blue-600">₹{salesForecast.predicted_revenue.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-lg font-bold text-green-600">{salesForecast.confidence_score}%</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Trend</p>
                        <p className="text-lg font-bold text-purple-600">{salesForecast.trend}</p>
                    </div>
                </div>
                <div className="h-48 w-full p-2">
                  <ResponsiveContainer>
                    <LineChart data={salesForecast.forecast_data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#888" interval={5} />
                      <YAxis tickFormatter={(val) => `₹${val}`} tick={{ fontSize: 10 }} stroke="#888" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="predicted_sales" stroke={CHART_COLORS[3]} strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Recommendations Table */}
        <Card className="mx-auto w-full max-w-7xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-400"/> Inventory Recommendations</CardTitle>
            <CardDescription>AI-powered restocking suggestions based on demand forecasting (mock data).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Current Stock</TableHead>
                  <TableHead className="text-center">Predicted Demand</TableHead>
                  <TableHead className="text-center">Suggested Order</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryRecommendations.map((rec, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rec.product_name}</TableCell>
                    <TableCell className="text-center">{rec.current_stock}</TableCell>
                    <TableCell className="text-center">{rec.predicted_demand}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{rec.suggested_order}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;