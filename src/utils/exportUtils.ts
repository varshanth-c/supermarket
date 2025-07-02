
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (analytics: any, timeRange: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Business Analytics Report', 20, 20);
  
  // Time range
  doc.setFontSize(12);
  doc.text(`Period: ${timeRange}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Financial metrics
  doc.setFontSize(16);
  doc.text('Financial Overview', 20, 65);
  
  const financialData = [
    ['Total Sales', `$${analytics.financial_metrics.total_sales?.toLocaleString() || '0'}`],
    ['Total Expenses', `$${analytics.financial_metrics.total_expenses?.toLocaleString() || '0'}`],
    ['Net Profit', `$${analytics.financial_metrics.net_profit?.toLocaleString() || '0'}`],
    ['Profit Margin', `${analytics.financial_metrics.profit_margin?.toFixed(1) || '0'}%`]
  ];
  
  (doc as any).autoTable({
    startY: 75,
    head: [['Metric', 'Value']],
    body: financialData,
    theme: 'grid'
  });
  
  // Top selling products
  let yPosition = (doc as any).lastAutoTable.finalY + 20;
  doc.text('Top Selling Products', 20, yPosition);
  
  const topSellingData = analytics.top_selling?.map((item: any) => [
    item.item_name,
    item.quantity_sold.toString(),
    `$${item.total_revenue.toLocaleString()}`
  ]) || [];
  
  (doc as any).autoTable({
    startY: yPosition + 10,
    head: [['Product', 'Quantity Sold', 'Revenue']],
    body: topSellingData,
    theme: 'grid'
  });
  
  doc.save(`business-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
