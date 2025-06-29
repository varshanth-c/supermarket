
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, DollarSign, FileText, ShoppingCart, Receipt } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      const [inventoryRes, salesRes, expensesRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('user_id', user!.id),
        supabase.from('sales').select('*').eq('user_id', user!.id),
        supabase.from('expenses').select('*').eq('user_id', user!.id)
      ]);

      const inventory = inventoryRes.data || [];
      const sales = salesRes.data || [];
      const expenses = expensesRes.data || [];

      // Calculate totals
      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const netProfit = totalSales - totalExpenses;
      const activeItems = inventory.length;

      // Recent activity (last 5 transactions)
      const recentSales = sales.slice(0, 3).map(sale => ({
        type: 'sale',
        description: `Sale to ${sale.customer_name || 'Customer'}`,
        amount: Number(sale.total_amount),
        date: new Date(sale.created_at!)
      }));

      const recentExpenses = expenses.slice(0, 2).map(expense => ({
        type: 'expense',
        description: expense.description,
        amount: Number(expense.amount),
        date: new Date(expense.created_at)
      }));

      const recentActivity = [...recentSales, ...recentExpenses]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3);

      return {
        totalSales,
        totalExpenses,
        netProfit,
        activeItems,
        recentActivity
      };
    },
    enabled: !!user?.id
  });

  const quickActions = [
    {
      title: "Manage Inventory",
      description: "Add, edit or view your inventory items",
      icon: Package,
      action: () => navigate('/inventory'),
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
    },
    {
      title: "Record Sale",
      description: "Add new sales transaction with bill generation",
      icon: ShoppingCart,
      action: () => navigate('/sales'),
      color: "bg-green-50 hover:bg-green-100 border-green-200"
    },
    {
      title: "Add Expense",
      description: "Track your business expenses",
      icon: Receipt,
      action: () => navigate('/expenses'),
      color: "bg-red-50 hover:bg-red-100 border-red-200"
    },
    {
      title: "View Reports",
      description: "Generate and view business reports",
      icon: FileText,
      action: () => navigate('/reports'),
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200"
    }
  ];

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
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

  const statsCards = [
    {
      title: "Total Sales",
      value: `₹${dashboardData?.totalSales.toLocaleString() || 0}`,
      description: "All time",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Total Expenses",
      value: `₹${dashboardData?.totalExpenses.toLocaleString() || 0}`,
      description: "All time",
      icon: DollarSign,
      color: "text-red-600"
    },
    {
      title: "Active Items",
      value: dashboardData?.activeItems.toString() || "0",
      description: "In inventory",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Net Profit",
      value: `₹${dashboardData?.netProfit.toLocaleString() || 0}`,
      description: "All time",
      icon: FileText,
      color: dashboardData?.netProfit >= 0 ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your business.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all duration-200 ${action.color} border-2`}
                onClick={action.action}
              >
                <CardHeader className="text-center pb-4">
                  <action.icon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                  <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Recent Activity</CardTitle>
            <CardDescription>Your latest business transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                    activity.type === 'sale' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {activity.type === 'sale' ? (
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                      ) : (
                        <Receipt className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-600">{getTimeAgo(activity.date)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      activity.type === 'sale' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.type === 'sale' ? '+' : '-'}₹{activity.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity. Start by adding inventory items or recording transactions!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
