
// import React, { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Badge } from '@/components/ui/badge';
// import { FileText, Download, Send, Calendar as CalendarIcon, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
// import { format } from 'date-fns';
// import { Navbar } from '@/components/Navbar';
// import { useToast } from '@/hooks/use-toast';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// import { useQuery } from '@tanstack/react-query';

// const Reports = () => {
//   const { toast } = useToast();
//   const { user } = useAuth();
//   const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
//   const [reportType, setReportType] = useState('monthly');

//   // Fetch reports data
//   const { data: reportsData, isLoading } = useQuery({
//     queryKey: ['reports', user?.id, selectedMonth],
//     queryFn: async () => {
//       const [salesRes, expensesRes, inventoryRes] = await Promise.all([
//         supabase.from('sales').select('*').eq('user_id', user!.id),
//         supabase.from('expenses').select('*').eq('user_id', user!.id),
//         supabase.from('inventory').select('*').eq('user_id', user!.id)
//       ]);

//       const sales = salesRes.data || [];
//       const expenses = expensesRes.data || [];
//       const inventory = inventoryRes.data || [];

//       // Calculate monthly data for last 6 months
//       const monthlyData = [];
//       const now = new Date();
      
//       for (let i = 5; i >= 0; i--) {
//         const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
//         const monthSales = sales.filter(sale => {
//           const saleDate = new Date(sale.created_at!);
//           return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
//         });
        
//         const monthExpenses = expenses.filter(expense => {
//           const expenseDate = new Date(expense.date);
//           return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
//         });

//         const salesTotal = monthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
//         const expensesTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

//         monthlyData.push({
//           month: format(date, 'MMM'),
//           sales: salesTotal,
//           expenses: expensesTotal,
//           profit: salesTotal - expensesTotal
//         });
//       }

//       // Category analysis for sales
//       const categoryStats: { [key: string]: { value: number; amount: number } } = {};
//       let totalSalesAmount = 0;
      
//       sales.forEach(sale => {
//         const items = Array.isArray(sale.items) ? sale.items : [];
//         items.forEach((item: any) => {
//           const category = item.category || 'Others';
//           const amount = Number(item.quantity) * Number(item.unit_price);
          
//           if (!categoryStats[category]) {
//             categoryStats[category] = { value: 0, amount: 0 };
//           }
//           categoryStats[category].amount += amount;
//           totalSalesAmount += amount;
//         });
//       });

//       // Convert to percentage
//       const categoryData = Object.entries(categoryStats).map(([name, data]) => ({
//         name,
//         value: Math.round((data.amount / totalSalesAmount) * 100) || 0,
//         amount: data.amount
//       }));

//       // Expense breakdown
//       const expenseBreakdown: { [key: string]: number } = {};
//       expenses.forEach(expense => {
//         const category = expense.category;
//         expenseBreakdown[category] = (expenseBreakdown[category] || 0) + Number(expense.amount);
//       });

//       const expenseBreakdownArray = Object.entries(expenseBreakdown).map(([category, amount]) => ({
//         category,
//         amount
//       }));

//       // Current month data
//       const currentMonth = selectedMonth || new Date();
//       const currentMonthSales = sales.filter(sale => {
//         const saleDate = new Date(sale.created_at!);
//         return saleDate.getMonth() === currentMonth.getMonth() && 
//                saleDate.getFullYear() === currentMonth.getFullYear();
//       });

//       const currentMonthExpenses = expenses.filter(expense => {
//         const expenseDate = new Date(expense.date);
//         return expenseDate.getMonth() === currentMonth.getMonth() && 
//                expenseDate.getFullYear() === currentMonth.getFullYear();
//       });

//       const totalSales = currentMonthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
//       const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
//       const netProfit = totalSales - totalExpenses;
//       const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

//       // Get top selling category
//       const topCategory = categoryData.length > 0 
//         ? categoryData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
//         : null;

//       return {
//         monthlyData,
//         categoryData,
//         expenseBreakdown: expenseBreakdownArray,
//         currentMonthData: {
//           totalSales,
//           totalExpenses,
//           netProfit,
//           profitMargin,
//           growthRate: 0, // Could calculate from previous month
//           topSellingCategory: topCategory?.name || 'N/A',
//           transactionCount: currentMonthSales.length
//         }
//       };
//     },
//     enabled: !!user?.id
//   });

//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

//   const generateReport = () => {
//     toast({
//       title: "Success",
//       description: "Report generated successfully"
//     });
//   };

//   const downloadReport = () => {
//     toast({
//       title: "Success",
//       description: "Report downloaded as PDF"
//     });
//   };

//   const sendReport = () => {
//     toast({
//       title: "Success",
//       description: "Report sent via email"
//     });
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

//   const { monthlyData = [], categoryData = [], expenseBreakdown = [], currentMonthData } = reportsData || {};

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar />
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Reports</h1>
//             <p className="text-gray-600">Generate comprehensive business insights and analytics</p>
//           </div>
          
//           <div className="flex space-x-2">
//             <Button variant="outline" onClick={downloadReport}>
//               <Download className="h-4 w-4 mr-2" />
//               Download PDF
//             </Button>
//             <Button variant="outline" onClick={sendReport}>
//               <Send className="h-4 w-4 mr-2" />
//               Send Report
//             </Button>
//             <Button onClick={generateReport}>
//               <FileText className="h-4 w-4 mr-2" />
//               Generate Report
//             </Button>
//           </div>
//         </div>

//         {/* Report Controls */}
//         <Card className="mb-8">
//           <CardHeader>
//             <CardTitle>Report Configuration</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col md:flex-row gap-4">
//               <Select value={reportType} onValueChange={setReportType}>
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Report Type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="monthly">Monthly Report</SelectItem>
//                   <SelectItem value="quarterly">Quarterly Report</SelectItem>
//                   <SelectItem value="yearly">Yearly Report</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline" className="justify-start text-left font-normal w-full md:w-48">
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "Select period"}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0">
//                   <Calendar
//                     mode="single"
//                     selected={selectedMonth}
//                     onSelect={setSelectedMonth}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Key Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card className="border-0 shadow-sm">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
//               <TrendingUp className="h-4 w-4 text-green-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.totalSales?.toLocaleString() || 0}</div>
//               <div className="flex items-center mt-1">
//                 <Badge className="bg-green-100 text-green-800">
//                   Current Period
//                 </Badge>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-0 shadow-sm">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
//               <TrendingDown className="h-4 w-4 text-red-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.totalExpenses?.toLocaleString() || 0}</div>
//               <p className="text-xs text-gray-500 mt-1">Current period</p>
//             </CardContent>
//           </Card>

//           <Card className="border-0 shadow-sm">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
//               <BarChart3 className="h-4 w-4 text-blue-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.netProfit?.toLocaleString() || 0}</div>
//               <div className="flex items-center mt-1">
//                 <Badge className="bg-blue-100 text-blue-800">
//                   {currentMonthData?.profitMargin?.toFixed(1) || 0}% margin
//                 </Badge>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-0 shadow-sm">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
//               <FileText className="h-4 w-4 text-purple-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">{currentMonthData?.transactionCount || 0}</div>
//               <p className="text-xs text-gray-500 mt-1">This period</p>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Sales Trend */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales vs Expenses Trend</CardTitle>
//               <CardDescription>Monthly comparison over the last 6 months</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart data={monthlyData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
//                   <Bar dataKey="sales" fill="#22c55e" name="Sales" />
//                   <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>

//           {/* Profit Trend */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Profit Trend</CardTitle>
//               <CardDescription>Net profit over the last 6 months</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={monthlyData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Profit']} />
//                   <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Sales by Category */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales by Category</CardTitle>
//               <CardDescription>Revenue distribution across product categories</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {categoryData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <PieChart>
//                     <Pie
//                       data={categoryData}
//                       cx="50%"
//                       cy="50%"
//                       labelLine={false}
//                       label={({ name, value }) => `${name}: ${value}%`}
//                       outerRadius={80}
//                       fill="#8884d8"
//                       dataKey="value"
//                     >
//                       {categoryData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Pie>
//                     <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="flex items-center justify-center h-[300px] text-gray-500">
//                   No sales data available
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Expense Breakdown */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Expense Breakdown</CardTitle>
//               <CardDescription>Current period expense categories</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {expenseBreakdown.length > 0 ? (
//                   expenseBreakdown.map((expense, index) => (
//                     <div key={expense.category} className="flex items-center justify-between">
//                       <div className="flex items-center space-x-3">
//                         <div 
//                           className="w-4 h-4 rounded-full" 
//                           style={{ backgroundColor: COLORS[index % COLORS.length] }}
//                         />
//                         <span className="font-medium">{expense.category}</span>
//                       </div>
//                       <span className="font-semibold">₹{expense.amount.toLocaleString()}</span>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-center text-gray-500">No expense data available</div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Detailed Summary */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Period Summary Report</CardTitle>
//             <CardDescription>
//               Comprehensive business overview for {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "current period"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <div>
//                 <h3 className="text-lg font-semibold mb-4">Revenue Analysis</h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span>Gross Sales:</span>
//                     <span className="font-semibold">₹{currentMonthData?.totalSales?.toLocaleString() || 0}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Total Expenses:</span>
//                     <span className="font-semibold">₹{currentMonthData?.totalExpenses?.toLocaleString() || 0}</span>
//                   </div>
//                   <div className="flex justify-between border-t pt-2">
//                     <span>Net Profit:</span>
//                     <span className={`font-semibold ${(currentMonthData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                       ₹{currentMonthData?.netProfit?.toLocaleString() || 0}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Profit Margin:</span>
//                     <span className="font-semibold">{currentMonthData?.profitMargin?.toFixed(1) || 0}%</span>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span>Top Category:</span>
//                     <span className="font-semibold">{currentMonthData?.topSellingCategory || 'N/A'}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Total Transactions:</span>
//                     <span className="font-semibold">{currentMonthData?.transactionCount || 0}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Avg. Transaction:</span>
//                     <span className="font-semibold">
//                       ₹{currentMonthData?.transactionCount > 0 
//                         ? Math.round((currentMonthData?.totalSales || 0) / currentMonthData.transactionCount).toLocaleString()
//                         : 0}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Reports;


// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Badge } from '@/components/ui/badge';
// import { FileText, Download, Send, Calendar as CalendarIcon, TrendingUp, TrendingDown, BarChart3, ArrowRight, AlertTriangle } from 'lucide-react';
// import { format } from 'date-fns';
// import { Navbar } from '@/components/Navbar';
// import { useToast } from '@/hooks/use-toast';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// import { useQuery } from '@tanstack/react-query';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

// const Reports = () => {
//   const { toast } = useToast();
//   const { user } = useAuth();
//   const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
//   const [reportType, setReportType] = useState('monthly');
//   const [insights, setInsights] = useState<any>(null);

//   // Fetch reports data
//   const { data: reportsData, isLoading } = useQuery({
//     queryKey: ['reports', user?.id, selectedMonth],
//     queryFn: async () => {
//       const [salesRes, expensesRes, inventoryRes] = await Promise.all([
//         supabase.from('sales').select('*').eq('user_id', user!.id),
//         supabase.from('expenses').select('*').eq('user_id', user!.id),
//         supabase.from('inventory').select('*').eq('user_id', user!.id)
//       ]);

//       const sales = salesRes.data || [];
//       const expenses = expensesRes.data || [];
//       const inventory = inventoryRes.data || [];

//       // Calculate monthly data for last 6 months
//       const monthlyData = [];
//       const now = new Date();
      
//       for (let i = 5; i >= 0; i--) {
//         const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
//         const monthSales = sales.filter(sale => {
//           const saleDate = new Date(sale.created_at!);
//           return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
//         });
        
//         const monthExpenses = expenses.filter(expense => {
//           const expenseDate = new Date(expense.date);
//           return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
//         });

//         const salesTotal = monthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
//         const expensesTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

//         monthlyData.push({
//           month: format(date, 'MMM'),
//           sales: salesTotal,
//           expenses: expensesTotal,
//           profit: salesTotal - expensesTotal
//         });
//       }

//       // Category analysis for sales
//       const categoryStats: { [key: string]: { value: number; amount: number } } = {};
//       let totalSalesAmount = 0;
      
//       sales.forEach(sale => {
//         const items = Array.isArray(sale.items) ? sale.items : [];
//         items.forEach((item: any) => {
//           const category = item.category || 'Others';
//           const amount = Number(item.quantity) * Number(item.unit_price);
          
//           if (!categoryStats[category]) {
//             categoryStats[category] = { value: 0, amount: 0 };
//           }
//           categoryStats[category].amount += amount;
//           totalSalesAmount += amount;
//         });
//       });

//       // Convert to percentage
//       const categoryData = Object.entries(categoryStats).map(([name, data]) => ({
//         name,
//         value: Math.round((data.amount / totalSalesAmount) * 100) || 0,
//         amount: data.amount
//       }));

//       // Expense breakdown
//       const expenseBreakdown: { [key: string]: number } = {};
//       expenses.forEach(expense => {
//         const category = expense.category;
//         expenseBreakdown[category] = (expenseBreakdown[category] || 0) + Number(expense.amount);
//       });

//       const expenseBreakdownArray = Object.entries(expenseBreakdown).map(([category, amount]) => ({
//         category,
//         amount
//       }));

//       // Current month data
//       const currentMonth = selectedMonth || new Date();
//       const currentMonthSales = sales.filter(sale => {
//         const saleDate = new Date(sale.created_at!);
//         return saleDate.getMonth() === currentMonth.getMonth() && 
//                saleDate.getFullYear() === currentMonth.getFullYear();
//       });

//       const currentMonthExpenses = expenses.filter(expense => {
//         const expenseDate = new Date(expense.date);
//         return expenseDate.getMonth() === currentMonth.getMonth() && 
//                expenseDate.getFullYear() === currentMonth.getFullYear();
//       });

//       const totalSales = currentMonthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
//       const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
//       const netProfit = totalSales - totalExpenses;
//       const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

//       // Get top selling category
//       const topCategory = categoryData.length > 0 
//         ? categoryData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
//         : null;

//       return {
//         monthlyData,
//         categoryData,
//         expenseBreakdown: expenseBreakdownArray,
//         currentMonthData: {
//           totalSales,
//           totalExpenses,
//           netProfit,
//           profitMargin,
//           growthRate: 0, // Could calculate from previous month
//           topSellingCategory: topCategory?.name || 'N/A',
//           transactionCount: currentMonthSales.length
//         }
//       };
//     },
//     enabled: !!user?.id
//   });

//   // Fetch analytics data
//   const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
//     queryKey: ['analytics', user?.id],
//     queryFn: async () => {
//       if (!user?.id) return null;
//       const response = await fetch(`/api/reports/${user.id}`);
//       if (!response.ok) throw new Error('Failed to fetch analytics');
//       return response.json();
//     },
//     enabled: !!user?.id
//   });

//   useEffect(() => {
//     if (analyticsData) {
//       setInsights(analyticsData);
//     }
//   }, [analyticsData]);

//   const generateReport = () => {
//     toast({
//       title: "Success",
//       description: "Report generated successfully"
//     });
//   };

//   const downloadReport = () => {
//     toast({
//       title: "Success",
//       description: "Report downloaded as PDF"
//     });
//   };

//   const sendReport = () => {
//     toast({
//       title: "Success",
//       description: "Report sent via email"
//     });
//   };

//   if (isLoading || analyticsLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Navbar />
//         <div className="container mx-auto px-4 py-8">
//           <div className="flex items-center justify-center h-96">
//             <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const { monthlyData = [], categoryData = [], expenseBreakdown = [], currentMonthData } = reportsData || {};

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar />
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Intelligence Dashboard</h1>
//             <p className="text-gray-600">Comprehensive analytics and predictive insights</p>
//           </div>
          
//           <div className="flex flex-wrap gap-2">
//             <Button variant="outline" onClick={downloadReport} className="flex-1 min-w-[180px]">
//               <Download className="h-4 w-4 mr-2" />
//               Export PDF
//             </Button>
//             <Button variant="outline" onClick={sendReport} className="flex-1 min-w-[180px]">
//               <Send className="h-4 w-4 mr-2" />
//               Email Report
//             </Button>
//             <Button onClick={generateReport} className="flex-1 min-w-[180px]">
//               <FileText className="h-4 w-4 mr-2" />
//               Generate Insights
//             </Button>
//           </div>
//         </div>

//         {/* Report Controls */}
//         <Card className="mb-8">
//           <CardHeader className="pb-3">
//             <CardTitle>Report Configuration</CardTitle>
//             <CardDescription>Customize your analytics period and report type</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col md:flex-row gap-4">
//               <Select value={reportType} onValueChange={setReportType}>
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Report Type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="monthly">Monthly Report</SelectItem>
//                   <SelectItem value="quarterly">Quarterly Report</SelectItem>
//                   <SelectItem value="yearly">Yearly Report</SelectItem>
//                   <SelectItem value="predictive">Predictive Analytics</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline" className="justify-start text-left font-normal w-full md:w-48">
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "Select period"}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0">
//                   <Calendar
//                     mode="single"
//                     selected={selectedMonth}
//                     onSelect={setSelectedMonth}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Key Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
//               <TrendingUp className="h-4 w-4 text-green-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.totalSales?.toLocaleString() || 0}</div>
//               <div className="flex items-center mt-1">
//                 <Badge className="bg-green-100 text-green-800">
//                   Current Period
//                 </Badge>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
//               <TrendingDown className="h-4 w-4 text-red-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.totalExpenses?.toLocaleString() || 0}</div>
//               <p className="text-xs text-gray-500 mt-1">Current period</p>
//             </CardContent>
//           </Card>

//           <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
//               <BarChart3 className="h-4 w-4 text-blue-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.netProfit?.toLocaleString() || 0}</div>
//               <div className="flex items-center mt-1">
//                 <Badge className={`${(currentMonthData?.netProfit || 0) >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
//                   {currentMonthData?.profitMargin?.toFixed(1) || 0}% margin
//                 </Badge>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
//               <FileText className="h-4 w-4 text-purple-600" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">{currentMonthData?.transactionCount || 0}</div>
//               <p className="text-xs text-gray-500 mt-1">This period</p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Actionable Insights Section */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Top Selling Products */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Top Selling Products</CardTitle>
//               <CardDescription>Your best performing items this month</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {insights?.top_selling?.length > 0 ? (
//                 <div className="space-y-4">
//                   {insights.top_selling.map((item: any, index: number) => (
//                     <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                       <div className="flex items-center">
//                         <span className="font-medium mr-4 text-lg">{index + 1}.</span>
//                         <div>
//                           <p className="font-medium">{item.item_name}</p>
//                           <p className="text-sm text-gray-500">Category: {item.category || 'General'}</p>
//                         </div>
//                       </div>
//                       <Badge variant="secondary" className="px-3 py-1 text-base">
//                         {item.quantity} units
//                       </Badge>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <p>No sales data available</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Inventory Alerts */}
//           <Card>
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <CardTitle>Inventory Alerts</CardTitle>
//                 <AlertTriangle className="h-5 w-5 text-yellow-500" />
//               </div>
//               <CardDescription>Items needing attention</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {/* Low Stock Section */}
//               <div className="mb-6">
//                 <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
//                   <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
//                   Low Stock
//                 </h3>
//                 {insights?.low_stock?.length > 0 ? (
//                   <div className="space-y-3">
//                     {insights.low_stock.map((item: any, index: number) => (
//                       <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
//                         <span className="font-medium">{item.item_name}</span>
//                         <Badge variant="destructive" className="px-3 py-1">
//                           {item.quantity} units (min: {item.low_stock_threshold})
//                         </Badge>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-3 text-gray-500 bg-green-50 rounded-lg">
//                     <p>All items are sufficiently stocked</p>
//                   </div>
//                 )}
//               </div>

//               {/* Slow Moving Section */}
//               <div>
//                 <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
//                   <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
//                   Slow Moving Items
//                 </h3>
//                 {insights?.slow_moving?.length > 0 ? (
//                   <div className="space-y-3">
//                     {insights.slow_moving.map((item: any, index: number) => (
//                       <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
//                         <span className="font-medium">{item.item_name}</span>
//                         <Badge variant="outline" className="border-purple-300 text-purple-700">
//                           No sales in 30 days
//                         </Badge>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-3 text-gray-500 bg-green-50 rounded-lg">
//                     <p>No slow moving items</p>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Profitability and Sales Trends */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Most Profitable Items */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Most Profitable Items</CardTitle>
//               <CardDescription>Items with highest profit margins</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {insights?.profitable_items?.length > 0 ? (
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={insights.profitable_items}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                       <XAxis dataKey="item_name" />
//                       <YAxis 
//                         tickFormatter={(value) => `₹${value}`}
//                       />
//                       <Tooltip 
//                         formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Profit']}
//                         contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
//                       />
//                       <Bar 
//                         dataKey="profit" 
//                         fill="#10b981" 
//                         radius={[4, 4, 0, 0]}
//                         name="Profit"
//                       />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <p>No profitability data available</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Sales Trend with Forecast */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales Trend & Forecast</CardTitle>
//               <CardDescription>Daily sales with 7-day projection</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {insights?.daily_sales?.length > 0 ? (
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={insights.daily_sales}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                       <XAxis 
//                         dataKey="date" 
//                         tickFormatter={(value) => format(new Date(value), 'MMM dd')}
//                       />
//                       <YAxis 
//                         tickFormatter={(value) => `₹${value}`}
//                       />
//                       <Tooltip 
//                         formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Sales']}
//                         labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
//                         contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
//                       />
//                       <Line 
//                         type="monotone" 
//                         dataKey="total_amount" 
//                         stroke="#3b82f6" 
//                         strokeWidth={3} 
//                         dot={{ r: 4 }}
//                         activeDot={{ r: 6, strokeWidth: 0 }}
//                         name="Actual Sales"
//                       />
//                       {/* Sales Forecast */}
//                       {insights.forecast?.length > 0 && (
//                         <Line 
//                           type="monotone" 
//                           dataKey="forecast" 
//                           stroke="#ef4444" 
//                           strokeWidth={2} 
//                           strokeDasharray="5 5"
//                           dot={false}
//                           name="7-Day Forecast"
//                         />
//                       )}
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <p>No sales data available</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Association Rules */}
//         {insights?.associations?.length > 0 && (
//           <Card className="mb-8 border-blue-100">
//             <CardHeader>
//               <CardTitle>Frequently Bought Together</CardTitle>
//               <CardDescription>Product association insights</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {insights.associations.map((rule: any, index: number) => (
//                   <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
//                     <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//                       <div className="flex items-center">
//                         <div className="bg-white px-3 py-2 rounded-md border shadow-sm">
//                           {Array.from(rule.antecedents).join(', ')}
//                         </div>
//                         <ArrowRight className="h-5 w-5 mx-2 text-blue-500" />
//                         <div className="bg-white px-3 py-2 rounded-md border shadow-sm">
//                           {Array.from(rule.consequents).join(', ')}
//                         </div>
//                       </div>
//                       <div className="ml-auto flex flex-col sm:items-end">
//                         <Badge className="bg-blue-100 text-blue-800 mb-1">
//                           Confidence: {(rule.confidence * 100).toFixed(1)}%
//                         </Badge>
//                         <Badge variant="secondary" className="bg-green-100 text-green-800">
//                           Lift: {rule.lift.toFixed(2)}
//                         </Badge>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Sales by Category */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales by Category</CardTitle>
//               <CardDescription>Revenue distribution across product categories</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {categoryData.length > 0 ? (
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={categoryData}
//                         cx="50%"
//                         cy="50%"
//                         labelLine={false}
//                         label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                         outerRadius={80}
//                         fill="#8884d8"
//                         dataKey="value"
//                       >
//                         {categoryData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                         ))}
//                       </Pie>
//                       <Tooltip 
//                         formatter={(value) => [`${value}%`, 'Share']}
//                         contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <p>No sales data available</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Expense Breakdown */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Expense Breakdown</CardTitle>
//               <CardDescription>Current period expense distribution</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {expenseBreakdown.length > 0 ? (
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={expenseBreakdown}
//                         cx="50%"
//                         cy="50%"
//                         labelLine={false}
//                         label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
//                         outerRadius={80}
//                         fill="#8884d8"
//                         dataKey="amount"
//                       >
//                         {expenseBreakdown.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                         ))}
//                       </Pie>
//                       <Tooltip 
//                         formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
//                         contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <p>No expense data available</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Detailed Summary */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Business Summary</CardTitle>
//             <CardDescription>
//               Comprehensive overview for {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "current period"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <div>
//                 <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Financial Overview</h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Gross Sales:</span>
//                     <span className="font-semibold">₹{currentMonthData?.totalSales?.toLocaleString() || 0}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Total Expenses:</span>
//                     <span className="font-semibold">₹{currentMonthData?.totalExpenses?.toLocaleString() || 0}</span>
//                   </div>
//                   <div className="flex justify-between border-t pt-3">
//                     <span className="text-gray-700 font-medium">Net Profit:</span>
//                     <span className={`font-bold text-lg ${(currentMonthData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                       ₹{currentMonthData?.netProfit?.toLocaleString() || 0}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Profit Margin:</span>
//                     <span className={`font-semibold ${(currentMonthData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                       {currentMonthData?.profitMargin?.toFixed(1) || 0}%
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Performance Insights</h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Top Category:</span>
//                     <span className="font-semibold">{currentMonthData?.topSellingCategory || 'N/A'}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Total Transactions:</span>
//                     <span className="font-semibold">{currentMonthData?.transactionCount || 0}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Avg. Transaction:</span>
//                     <span className="font-semibold">
//                       ₹{currentMonthData?.transactionCount > 0 
//                         ? Math.round((currentMonthData?.totalSales || 0) / currentMonthData.transactionCount).toLocaleString()
//                         : 0}
//                     </span>
//                   </div>
//                   {insights?.forecast?.length > 0 && (
//                     <div className="flex justify-between border-t pt-3">
//                       <span className="text-gray-700 font-medium">Next 7 Days Forecast:</span>
//                       <span className="font-bold text-lg text-blue-600">
//                         ₹{Math.round(insights.forecast.reduce((a: number, b: number) => a + b, 0)).toLocaleString()}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Reports;

// src/components/AdvancedAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Json } from '@/integrations/supabase/types';

interface SalesData {
  id: string;
  items: Json;
  total_amount: number;
  created_at: string;
  user_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  bill_url?: string;
  qr_code_url?: string;
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

const Reports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [mostProfitableProducts, setMostProfitableProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<any[]>([]);
  const [dailySalesTrend, setDailySalesTrend] = useState<any[]>([]);
  const [weeklySalesPattern, setWeeklySalesPattern] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [marketBasketInsights, setMarketBasketInsights] = useState<any[]>([]);
  const [productClusters, setProductClusters] = useState<any[]>([]);
  const [salesForecast, setSalesForecast] = useState<any>({
    predicted_revenue: 0,
    confidence_score: 0,
    trend: 'Stable',
    forecast_data: []
  });
  const [inventoryRecommendations, setInventoryRecommendations] = useState<any[]>([]);

  // Helper function to safely parse sale items
  const parseSaleItems = (items: Json): any[] => {
    if (Array.isArray(items)) {
      return items;
    }
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Fetch sales data
  const { data: salesData = [] } = useQuery({
    queryKey: ['sales', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (error) {
        console.error('Error fetching sales data:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch inventory data
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
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch expenses data
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
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (salesData.length === 0 && inventoryData.length === 0 && expensesData.length === 0) return;
    
    // Calculate total revenue
    const revenue = salesData.reduce((sum: number, sale: SalesData) => sum + Number(sale.total_amount), 0);
    setTotalRevenue(revenue);

    // Calculate total expenses
    const expenses = expensesData.reduce((sum: number, expense: Expense) => sum + Number(expense.amount), 0);
    setTotalExpenses(expenses);

    // Calculate net profit
    setNetProfit(revenue - expenses);

    // Calculate top selling products
    const productSales: { [key: string]: number } = {};
    salesData.forEach((sale: SalesData) => {
      const items = parseSaleItems(sale.items);
      items.forEach((item: any) => {
        productSales[item.item_name] = (productSales[item.item_name] || 0) + (item.quantity_sold || item.quantity || 0);
      });
    });
    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
    setTopSellingProducts(topProducts);

    // Calculate most profitable products
    const productProfit: { [key: string]: number } = {};
    salesData.forEach((sale: SalesData) => {
      const items = parseSaleItems(sale.items);
      items.forEach((item: any) => {
        const inventoryItem = inventoryData.find((inv: InventoryItem) => inv.item_name === item.item_name);
        const costPrice = inventoryItem?.unit_price || 0;
        const sellingPrice = item.unit_price || item.price || 0;
        const quantity = item.quantity_sold || item.quantity || 0;
        const profit = quantity * (sellingPrice - costPrice);
        productProfit[item.item_name] = (productProfit[item.item_name] || 0) + profit;
      });
    });
    const profitableProducts = Object.entries(productProfit)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, profit]) => ({ name, profit }));
    setMostProfitableProducts(profitableProducts);

    // Identify low stock items
    const lowStock = inventoryData.filter((item: InventoryItem) => item.quantity < 10).map(item => ({
      name: item.item_name,
      stock: item.quantity
    }));
    setLowStockItems(lowStock);

    // Identify slow moving inventory
    const soldProducts = new Set();
    salesData.forEach((sale: SalesData) => {
      const items = parseSaleItems(sale.items);
      items.forEach((item: any) => {
        soldProducts.add(item.item_name);
      });
    });
    const slowMoving = inventoryData.filter((item: InventoryItem) => !soldProducts.has(item.item_name)).map(item => ({
      name: item.item_name,
      stock: item.quantity
    }));
    setSlowMovingItems(slowMoving);

    // Calculate daily sales trend
    const dailySales: { [key: string]: number } = {};
    salesData.forEach((sale: SalesData) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      dailySales[date] = (dailySales[date] || 0) + Number(sale.total_amount);
    });
    const dailySalesTrendData = Object.entries(dailySales).map(([date, sales]) => ({ date, sales }));
    setDailySalesTrend(dailySalesTrendData);

    // Calculate weekly sales pattern
    const weeklySales: { [key: string]: number[] } = {};
    salesData.forEach((sale: SalesData) => {
      const day = new Date(sale.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!weeklySales[day]) {
        weeklySales[day] = [];
      }
      weeklySales[day].push(Number(sale.total_amount));
    });
    const weeklySalesPatternData = Object.entries(weeklySales).map(([day, sales]) => ({
      day,
      avgSales: sales.reduce((a, b) => a + b, 0) / sales.length
    }));
    setWeeklySalesPattern(weeklySalesPatternData);

    // Calculate expense breakdown
    const categoryExpenses: { [key: string]: number } = {};
    expensesData.forEach((expense: Expense) => {
      categoryExpenses[expense.category] = (categoryExpenses[expense.category] || 0) + Number(expense.amount);
    });
    const expenseBreakdownData = Object.entries(categoryExpenses).map(([name, value]) => ({ name, value }));
    setExpenseBreakdown(expenseBreakdownData);

    // Mock market basket analysis
    const mockMarketBasket = [
      { itemA: 'Wheat', itemB: 'Fertilizer', confidence: 0.75, support: 0.2 },
      { itemA: 'Corn', itemB: 'Pesticide', confidence: 0.6, support: 0.15 },
      { itemA: 'Rice', itemB: 'Irrigation System', confidence: 0.8, support: 0.25 }
    ];
    setMarketBasketInsights(mockMarketBasket);

    // Mock product segmentation
    const mockProductClusters = [
      { name: 'Staple Crops', products: ['Wheat', 'Rice', 'Corn'] },
      { name: 'Cash Crops', products: ['Cotton', 'Sugarcane', 'Soybean'] },
      { name: 'Fruits', products: ['Apple', 'Banana', 'Orange'] }
    ];
    setProductClusters(mockProductClusters);

    // Mock sales forecasting
    const mockSalesForecast = {
      predicted_revenue: 50000,
      confidence_score: 85,
      trend: 'Increasing',
      forecast_data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(new Date().setDate(new Date().getDate() + i)).toLocaleDateString(),
        predicted_sales: Math.random() * 1000 + 500
      }))
    };
    setSalesForecast(mockSalesForecast);

    // Mock inventory recommendations
    const mockInventoryRecommendations = [
      { product_name: 'Wheat', current_stock: 50, predicted_demand: 75, suggested_order: 100, priority: 'High' },
      { product_name: 'Corn', current_stock: 30, predicted_demand: 40, suggested_order: 50, priority: 'Medium' },
      { product_name: 'Rice', current_stock: 120, predicted_demand: 90, suggested_order: 0, priority: 'Low' }
    ];
    setInventoryRecommendations(mockInventoryRecommendations);

  }, [salesData, inventoryData, expensesData, startDate, endDate]);

  // Fix the pie chart rendering issue
  const renderExpenseBreakdown = () => {
    if (!expenseBreakdown || expenseBreakdown.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">No expense data available</p>
          </CardContent>
        </Card>
      );
    }

    // Generate colors for each category
    const COLORS = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
      '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
    ];

    const pieData = expenseBreakdown.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Distribution of expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    percent > 8 ? `${name.length > 8 ? name.substring(0, 8) + '...' : name}` : ''
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `₹${Number(value).toFixed(2)}`, 
                    name
                  ]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={50}
                  formatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '11px',
                    lineHeight: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category breakdown table */}
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Category Details:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {expenseBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-medium">₹{Number(item.value).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleDateRangeChange = () => {
    console.log('Date range changed:', startDate, endDate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">Advanced insights and machine learning analytics</p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={handleDateRangeChange}>
                Update Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{netProfit.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Selling Products</CardTitle>
              <CardDescription>By quantity sold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSellingProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{product.name}</span>
                    <Badge>{product.quantity} sold</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Profitable Products */}
          <Card>
            <CardHeader>
              <CardTitle>Most Profitable Products</CardTitle>
              <CardDescription>Top 5 by profit margin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mostProfitableProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="secondary">₹{product.profit.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Low Stock Alerts</CardTitle>
              <CardDescription>Items below threshold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="destructive">{item.stock} left</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Slow Moving Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Slow-Moving Inventory</CardTitle>
              <CardDescription>Zero sales in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {slowMovingItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline">{item.stock} in stock</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Sales performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySalesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Sales']} />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Sales Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales Pattern</CardTitle>
              <CardDescription>Average sales by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySalesPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Avg Sales']} />
                    <Bar dataKey="avgSales" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown - Fixed */}
        <div className="mb-6">
          {renderExpenseBreakdown()}
        </div>

        {/* ML Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Market Basket Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Market Basket Analysis</CardTitle>
              <CardDescription>Frequently bought together</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketBasketInsights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">
                      {insight.itemA} → {insight.itemB}
                    </div>
                    <div className="text-sm text-blue-600">
                      Confidence: {(insight.confidence * 100).toFixed(1)}% | 
                      Support: {(insight.support * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Segmentation */}
          <Card>
            <CardHeader>
              <CardTitle>Product Segmentation</CardTitle>
              <CardDescription>K-Means clustering results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productClusters.map((cluster, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800 mb-2">
                      {cluster.name} ({cluster.products.length} products)
                    </div>
                    <div className="text-sm text-green-600">
                      {cluster.products.slice(0, 3).join(', ')}
                      {cluster.products.length > 3 && ` +${cluster.products.length - 3} more`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Forecasting */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sales Forecasting</CardTitle>
            <CardDescription>Predicted sales for next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹{salesForecast.predicted_revenue.toFixed(2)}</div>
                <div className="text-sm text-blue-800">Predicted Revenue</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{salesForecast.confidence_score.toFixed(1)}%</div>
                <div className="text-sm text-green-800">Confidence Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{salesForecast.trend}</div>
                <div className="text-sm text-purple-800">Trend Direction</div>
              </div>
            </div>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesForecast.forecast_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Predicted Sales']} />
                  <Line type="monotone" dataKey="predicted_sales" stroke="#ff7300" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Recommendations</CardTitle>
            <CardDescription>AI-powered restocking suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Predicted Demand</TableHead>
                    <TableHead>Suggested Order</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryRecommendations.map((rec, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rec.product_name}</TableCell>
                      <TableCell>{rec.current_stock}</TableCell>
                      <TableCell>{rec.predicted_demand}</TableCell>
                      <TableCell className="font-bold text-blue-600">{rec.suggested_order}</TableCell>
                      <TableCell>
                        <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
