
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, TrendingUp, BarChart3, Users, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: Implement authentication with Supabase
    // For now, directly navigate to dashboard
    navigate('/dashboard');
  };

  const features = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels, manage categories, and get low-stock alerts"
    },
    {
      icon: ShoppingCart,
      title: "Smart Sales",
      description: "Category-wise item selection with automated bill generation and QR codes"
    },
    {
      icon: TrendingUp,
      title: "Expense Tracking",
      description: "Monitor business expenses across different categories with detailed reports"
    },
    {
      icon: BarChart3,
      title: "Business Reports",
      description: "Generate comprehensive monthly reports with insights and analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">VendorFlow</h1>
              <p className="text-gray-600">Complete Business Management Solution</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Login Form */}
          <div className="order-2 lg:order-1">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-lg">
                  Sign in to manage your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="h-12"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleLogin}
                  className="w-full h-12 text-lg font-semibold"
                >
                  Sign In
                </Button>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account? 
                    <Button variant="link" className="p-0 ml-1 text-blue-600">
                      Sign up here
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Secured with Supabase Authentication</span>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="order-1 lg:order-2">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Manage Your Local Business
                <span className="text-blue-600"> Efficiently</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Complete dashboard for local vendors to manage inventory, track sales, 
                monitor expenses, and generate detailed business reports.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <feature.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Local Vendors</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">10K+</div>
                <div className="text-sm text-gray-600">Transactions</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-6">
                Join hundreds of local vendors already using VendorFlow to grow their business
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleLogin}
                className="font-semibold"
              >
                Start Managing Your Business
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
