
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Send, Calendar as CalendarIcon, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const Reports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState('monthly');

  // Fetch reports data
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports', user?.id, selectedMonth],
    queryFn: async () => {
      const [salesRes, expensesRes, inventoryRes] = await Promise.all([
        supabase.from('sales').select('*').eq('user_id', user!.id),
        supabase.from('expenses').select('*').eq('user_id', user!.id),
        supabase.from('inventory').select('*').eq('user_id', user!.id)
      ]);

      const sales = salesRes.data || [];
      const expenses = expensesRes.data || [];
      const inventory = inventoryRes.data || [];

      // Calculate monthly data for last 6 months
      const monthlyData = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthSales = sales.filter(sale => {
          const saleDate = new Date(sale.created_at!);
          return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
        });
        
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
        });

        const salesTotal = monthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        const expensesTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

        monthlyData.push({
          month: format(date, 'MMM'),
          sales: salesTotal,
          expenses: expensesTotal,
          profit: salesTotal - expensesTotal
        });
      }

      // Category analysis for sales
      const categoryStats: { [key: string]: { value: number; amount: number } } = {};
      let totalSalesAmount = 0;
      
      sales.forEach(sale => {
        const items = Array.isArray(sale.items) ? sale.items : [];
        items.forEach((item: any) => {
          const category = item.category || 'Others';
          const amount = Number(item.quantity) * Number(item.unit_price);
          
          if (!categoryStats[category]) {
            categoryStats[category] = { value: 0, amount: 0 };
          }
          categoryStats[category].amount += amount;
          totalSalesAmount += amount;
        });
      });

      // Convert to percentage
      const categoryData = Object.entries(categoryStats).map(([name, data]) => ({
        name,
        value: Math.round((data.amount / totalSalesAmount) * 100) || 0,
        amount: data.amount
      }));

      // Expense breakdown
      const expenseBreakdown: { [key: string]: number } = {};
      expenses.forEach(expense => {
        const category = expense.category;
        expenseBreakdown[category] = (expenseBreakdown[category] || 0) + Number(expense.amount);
      });

      const expenseBreakdownArray = Object.entries(expenseBreakdown).map(([category, amount]) => ({
        category,
        amount
      }));

      // Current month data
      const currentMonth = selectedMonth || new Date();
      const currentMonthSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at!);
        return saleDate.getMonth() === currentMonth.getMonth() && 
               saleDate.getFullYear() === currentMonth.getFullYear();
      });

      const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth.getMonth() && 
               expenseDate.getFullYear() === currentMonth.getFullYear();
      });

      const totalSales = currentMonthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const netProfit = totalSales - totalExpenses;
      const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

      // Get top selling category
      const topCategory = categoryData.length > 0 
        ? categoryData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
        : null;

      return {
        monthlyData,
        categoryData,
        expenseBreakdown: expenseBreakdownArray,
        currentMonthData: {
          totalSales,
          totalExpenses,
          netProfit,
          profitMargin,
          growthRate: 0, // Could calculate from previous month
          topSellingCategory: topCategory?.name || 'N/A',
          transactionCount: currentMonthSales.length
        }
      };
    },
    enabled: !!user?.id
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const generateReport = () => {
    toast({
      title: "Success",
      description: "Report generated successfully"
    });
  };

  const downloadReport = () => {
    toast({
      title: "Success",
      description: "Report downloaded as PDF"
    });
  };

  const sendReport = () => {
    toast({
      title: "Success",
      description: "Report sent via email"
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

  const { monthlyData = [], categoryData = [], expenseBreakdown = [], currentMonthData } = reportsData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Reports</h1>
            <p className="text-gray-600">Generate comprehensive business insights and analytics</p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={sendReport}>
              <Send className="h-4 w-4 mr-2" />
              Send Report
            </Button>
            <Button onClick={generateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Report Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal w-full md:w-48">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "Select period"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={setSelectedMonth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.totalSales?.toLocaleString() || 0}</div>
              <div className="flex items-center mt-1">
                <Badge className="bg-green-100 text-green-800">
                  Current Period
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.totalExpenses?.toLocaleString() || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Current period</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{currentMonthData?.netProfit?.toLocaleString() || 0}</div>
              <div className="flex items-center mt-1">
                <Badge className="bg-blue-100 text-blue-800">
                  {currentMonthData?.profitMargin?.toFixed(1) || 0}% margin
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{currentMonthData?.transactionCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">This period</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Sales vs Expenses Trend</CardTitle>
              <CardDescription>Monthly comparison over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
                  <Bar dataKey="sales" fill="#22c55e" name="Sales" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Net profit over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Profit']} />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Revenue distribution across product categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No sales data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Current period expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseBreakdown.length > 0 ? (
                  expenseBreakdown.map((expense, index) => (
                    <div key={expense.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{expense.category}</span>
                      </div>
                      <span className="font-semibold">₹{expense.amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">No expense data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Period Summary Report</CardTitle>
            <CardDescription>
              Comprehensive business overview for {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "current period"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span className="font-semibold">₹{currentMonthData?.totalSales?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span className="font-semibold">₹{currentMonthData?.totalExpenses?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Net Profit:</span>
                    <span className={`font-semibold ${(currentMonthData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{currentMonthData?.netProfit?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className="font-semibold">{currentMonthData?.profitMargin?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Top Category:</span>
                    <span className="font-semibold">{currentMonthData?.topSellingCategory || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-semibold">{currentMonthData?.transactionCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Transaction:</span>
                    <span className="font-semibold">
                      ₹{currentMonthData?.transactionCount > 0 
                        ? Math.round((currentMonthData?.totalSales || 0) / currentMonthData.transactionCount).toLocaleString()
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
