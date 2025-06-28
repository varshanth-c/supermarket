
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, DollarSign, FileText, ShoppingCart, Receipt } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

const Dashboard = () => {
  const navigate = useNavigate();

  const statsCards = [
    {
      title: "Total Sales",
      value: "₹15,240",
      description: "This month",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Total Expenses",
      value: "₹8,450",
      description: "This month",
      icon: DollarSign,
      color: "text-red-600"
    },
    {
      title: "Active Items",
      value: "245",
      description: "In inventory",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Net Profit",
      value: "₹6,790",
      description: "This month",
      icon: FileText,
      color: "text-purple-600"
    }
  ];

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
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Sale to John Doe</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">+₹1,250</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Receipt className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Office Rent</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">-₹5,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Inventory Updated</p>
                    <p className="text-sm text-gray-600">2 days ago</p>
                  </div>
                </div>
                <span className="font-semibold text-blue-600">+50 items</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
