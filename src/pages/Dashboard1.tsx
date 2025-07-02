import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Package, Users, Download, FileText } from 'lucide-react';

// --- COMPONENTS TO BE RENDERED ---
import { Navbar } from '@/components/Navbar'; // 1. Import the Navbar
import { SalesOverviewChart } from '@/components/charts/SalesOverviewChart';
import { TopSellingChart } from '@/components/charts/TopSellingChart';
import { ExpenseBreakdownChart } from '@/components/charts/ExpenseBreakdownChart';
import { ProfitabilityChart } from '@/components/charts/ProfitabilityChart';
import { CustomerTrendsChart } from '@/components/charts/CustomerTrendsChart';
import { InventoryAlertsCard } from '@/components/cards/InventoryAlertsCard';
import { PerformanceScoreCard } from '@/components/cards/PerformanceScoreCard';
import { StrategicPlanningCard } from '@/components/cards/StrategicPlanningCard';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { AssociationRulesCard } from '@/components/cards/AssociationRulesCard';
import { exportToPDF, exportToCSV } from '@/utils/exportUtils';

// 2. Update the API endpoint to your live production server
const API_URL = 'https://pythonanalysis-production.up.railway.app/api/analytics';

const fetchAnalytics = async (timeFilter: string) => {
  const response = await fetch(`${API_URL}?period=${timeFilter}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data');
  }
  return response.json();
};

const TIME_FILTERS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '3y', label: '3 Years' }
];

const Dashboard1 = () => {
  const [timeFilter, setTimeFilter] = useState('30d');
  
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', timeFilter],
    queryFn: () => fetchAnalytics(timeFilter),
    refetchInterval: 30000,
  });

  const handleExportPDF = () => {
    if (analytics) {
      exportToPDF(analytics, timeFilter);
    }
  };

  const handleExportCSV = (dataType: string) => {
    if (!analytics) return;
    
    switch (dataType) {
      case 'sales':
        exportToCSV(analytics.daily_sales, 'daily-sales');
        break;
      case 'products':
        exportToCSV(analytics.top_selling, 'top-selling-products');
        break;
      case 'expenses':
        exportToCSV(analytics.expense_breakdown, 'expense-breakdown');
        break;
      default:
        exportToCSV(analytics.daily_sales, 'analytics-data');
    }
  };
  
  // Render loading state immediately
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your business insights...</p>
          </div>
        </div>
      </>
    );
  }

  // Render error state immediately
  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load dashboard data</p>
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // If data is available, render the full dashboard
  const { financial_metrics } = analytics;
  const profitColor = financial_metrics.net_profit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitIcon = financial_metrics.net_profit >= 0 ? TrendingUp : TrendingDown;

  return (
    <>
      {/* 3. Add the Navbar component here. It will render at the top of the page. */}
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Business Analytics Dashboard</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Advanced insights with strategic planning and performance analysis
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
                >
                  {TIME_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> PDF Report
                </Button>
                <Button onClick={() => handleExportCSV('sales')} variant="outline" size="sm" className="flex items-center gap-1">
                  <Download className="h-3 w-3" /> Export CSV
                </Button>
                <button onClick={() => refetch()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2"><DollarSign className="h-4 w-4" />Total Sales</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">${financial_metrics.total_sales?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-slate-500 mt-1">Revenue from all sales this month</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2"><Package className="h-4 w-4" />Total Expenses</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">${financial_metrics.total_expenses?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-slate-500 mt-1">Operating costs and expenditures</p>
                </CardContent>
              </Card>
              <Card className={`border-l-4 ${financial_metrics.net_profit >= 0 ? 'border-l-green-500' : 'border-l-red-500'} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">{React.createElement(profitIcon, { className: "h-4 w-4" })}Net Profit</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitColor}`}>${financial_metrics.net_profit?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-slate-500 mt-1">{financial_metrics.net_profit >= 0 ? 'Your business is profitable' : 'Focus on reducing costs'}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2"><Users className="h-4 w-4" />Profit Margin</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitColor}`}>{financial_metrics.profit_margin?.toFixed(1) || '0'}%</div>
                  <p className="text-xs text-slate-500 mt-1">{financial_metrics.profit_margin > 20 ? 'Excellent margins' : financial_metrics.profit_margin > 10 ? 'Good profitability' : 'Consider cost optimization'}</p>
                </CardContent>
              </Card>
          </div>

          {/* ... Rest of your dashboard JSX ... */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PerformanceScoreCard data={financial_metrics} />
              <StrategicPlanningCard data={financial_metrics} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card className="h-full"><CardHeader><CardTitle className="text-lg font-semibold text-slate-900">Sales Performance</CardTitle><CardDescription className="text-sm text-slate-600">Daily sales trend shows your business momentum. Look for patterns to optimize inventory and staffing.</CardDescription></CardHeader><CardContent><SalesOverviewChart data={analytics.daily_sales} /></CardContent></Card>
              </div>
              <div><InventoryAlertsCard data={analytics.low_stock} /></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card><CardHeader><CardTitle className="text-lg font-semibold text-slate-900">Best Performers</CardTitle><CardDescription className="text-sm text-slate-600">Your top-selling items. Keep these well-stocked and consider promoting similar products.</CardDescription></CardHeader><CardContent><TopSellingChart data={analytics.top_selling} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-lg font-semibold text-slate-900">Profit Champions</CardTitle><CardDescription className="text-sm text-slate-600">Items generating the highest profit margins. Focus marketing efforts on these products.</CardDescription></CardHeader><CardContent><ProfitabilityChart data={analytics.profitable_items} /></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card><CardHeader><CardTitle className="text-lg font-semibold text-slate-900">Where Your Money Goes</CardTitle><CardDescription className="text-sm text-slate-600">Expense breakdown helps identify cost optimization opportunities. Large segments may need attention.</CardDescription></CardHeader><CardContent><ExpenseBreakdownChart data={analytics.expense_breakdown} /></CardContent></Card>
              </div>
              <div>
                <Card><CardHeader><CardTitle className="text-lg font-semibold text-slate-900">Customer Mix</CardTitle><CardDescription className="text-sm text-slate-600">Balance of returning vs new customers shows business health and growth potential.</CardDescription></CardHeader><CardContent><CustomerTrendsChart data={analytics.customer_trends} /></CardContent></Card>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle className="text-lg font-semibold text-slate-900">7-Day Sales Forecast</CardTitle><CardDescription className="text-sm text-slate-600">AI-powered prediction of your next week's sales. Plan inventory and staffing accordingly.</CardDescription></CardHeader><CardContent><ForecastChart data={analytics.forecast} /></CardContent></Card>
              <div><AssociationRulesCard data={analytics.associations} /></div>
            </div>
            <div className="mt-12 text-center">
              <p className="text-xs text-slate-500">Dashboard updates every 30 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
              <p className="text-xs text-slate-500 mt-1">Period: {TIME_FILTERS.find(f => f.value === timeFilter)?.label} • Health Score calculated from profitability, revenue scale, and cost control</p>
            </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard1;