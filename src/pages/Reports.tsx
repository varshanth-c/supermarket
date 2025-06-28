
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

const Reports = () => {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState('monthly');

  // Mock data - replace with Supabase integration
  const salesData = [
    { month: 'Jan', sales: 12000, expenses: 8000, profit: 4000 },
    { month: 'Feb', sales: 15000, expenses: 9000, profit: 6000 },
    { month: 'Mar', sales: 18000, expenses: 10000, profit: 8000 },
    { month: 'Apr', sales: 16000, expenses: 11000, profit: 5000 },
    { month: 'May', sales: 20000, expenses: 12000, profit: 8000 },
    { month: 'Jun', sales: 22000, expenses: 13000, profit: 9000 }
  ];

  const categoryData = [
    { name: 'Vegetables', value: 45, amount: 9900 },
    { name: 'Toiletries', value: 25, amount: 5500 },
    { name: 'Others', value: 20, amount: 4400 },
    { name: 'Snacks', value: 10, amount: 2200 }
  ];

  const expenseBreakdown = [
    { category: 'Rent', amount: 5000 },
    { category: 'Inventory', amount: 8000 },
    { category: 'Transport', amount: 2000 },
    { category: 'Utilities', amount: 1500 },
    { category: 'Marketing', amount: 1000 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const currentMonthData = {
    totalSales: 22000,
    totalExpenses: 13000,
    netProfit: 9000,
    profitMargin: 40.9,
    growthRate: 10.5,
    topSellingCategory: 'Vegetables',
    transactionCount: 156
  };

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
              <div className="text-2xl font-bold text-gray-900">₹{currentMonthData.totalSales.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                <Badge className="bg-green-100 text-green-800">
                  +{currentMonthData.growthRate}%
                </Badge>
                <span className="text-xs text-gray-500 ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{currentMonthData.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Monthly expenses</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{currentMonthData.netProfit.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                <Badge className="bg-blue-100 text-blue-800">
                  {currentMonthData.profitMargin}% margin
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
              <div className="text-2xl font-bold text-gray-900">{currentMonthData.transactionCount}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
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
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
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
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Profit']} />
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
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Monthly expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseBreakdown.map((expense, index) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary Report</CardTitle>
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
                    <span className="font-semibold">₹{currentMonthData.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span className="font-semibold">₹{currentMonthData.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Net Profit:</span>
                    <span className="font-semibold text-green-600">₹{currentMonthData.netProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className="font-semibold">{currentMonthData.profitMargin}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Growth Rate:</span>
                    <Badge className="bg-green-100 text-green-800">+{currentMonthData.growthRate}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Category:</span>
                    <span className="font-semibold">{currentMonthData.topSellingCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-semibold">{currentMonthData.transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Transaction:</span>
                    <span className="font-semibold">₹{Math.round(currentMonthData.totalSales / currentMonthData.transactionCount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Continue focusing on {currentMonthData.topSellingCategory} as it's your top revenue generator</li>
                <li>• Consider optimizing expenses to improve profit margin beyond {currentMonthData.profitMargin}%</li>
                <li>• Your growth rate of {currentMonthData.growthRate}% is positive - maintain current strategies</li>
                <li>• Monitor inventory levels for popular categories to avoid stockouts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
