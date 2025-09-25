import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation } from '@apollo/client';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  DollarSign,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

import Layout from '@/components/layout/Layout';
import ExportControls from '@/components/reports/ExportControls';
import {
  GET_MONTHLY_REPORT,
  GET_MONTHLY_REPORTS,
  GET_CATEGORY_STATS,
  GENERATE_MONTHLY_REPORT,
} from '@/lib/graphql/queries/reports';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface MonthlyReport {
  id: string;
  userId: string;
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  budgetAdherence: number;
  categoryBreakdown: CategoryBreakdown[];
  spendingTrends: SpendingTrend[];
  budgetComparison: BudgetComparison[];
  achievements: Achievement[];
  recommendations: Recommendation[];
  generatedAt: string;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  previousAmount?: number;
  change?: number;
}

interface SpendingTrend {
  date: string;
  amount: number;
  category?: string;
}

interface BudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  goalId?: string;
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  category?: string;
}

interface CategoryStats {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentage: number;
}

type ReportView = 'overview' | 'monthly' | 'yearly' | 'categories' | 'trends' | 'export';

export default function ReportsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for report parameters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reportView, setReportView] = useState<ReportView>('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent('/reports')}`);
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // GraphQL queries
  const {
    data: monthlyReportData,
    loading: monthlyReportLoading,
    error: monthlyReportError,
    refetch: refetchMonthlyReport,
  } = useQuery(GET_MONTHLY_REPORT, {
    variables: { year: selectedYear, month: selectedMonth },
    skip: !isAuthenticated || reportView !== 'monthly',
    errorPolicy: 'all',
  });

  const {
    data: yearlyReportsData,
    loading: yearlyReportsLoading,
    error: yearlyReportsError,
    refetch: refetchYearlyReports,
  } = useQuery(GET_MONTHLY_REPORTS, {
    variables: { year: selectedYear },
    skip: !isAuthenticated || (reportView !== 'yearly' && reportView !== 'overview'),
    errorPolicy: 'all',
  });

  const {
    data: categoryStatsData,
    loading: categoryStatsLoading,
    error: categoryStatsError,
    refetch: refetchCategoryStats,
  } = useQuery(GET_CATEGORY_STATS, {
    variables: {
      dateFrom: new Date(dateRange.from),
      dateTo: new Date(dateRange.to),
      type: 'EXPENSE',
    },
    skip: !isAuthenticated || reportView !== 'categories',
    errorPolicy: 'all',
  });

  const [generateReport, { loading: generateLoading }] = useMutation(GENERATE_MONTHLY_REPORT, {
    onCompleted: () => {
      refetchMonthlyReport();
      refetchYearlyReports();
    },
    onError: (error) => {
      console.error('Error generating report:', error);
    },
  });

  // Memoized data
  const monthlyReport = monthlyReportData?.getMonthlyReport;
  const yearlyReports = yearlyReportsData?.getMonthlyReports || [];
  const categoryStats = categoryStatsData?.getCategoryStats || [];

  // Chart data
  const chartData = useMemo(() => {
    // Monthly income vs expenses
    const monthlyIncomeVsExpenses = {
      labels: ['Income', 'Expenses', 'Net Income'],
      datasets: [
        {
          label: 'Amount',
          data: monthlyReport
            ? [monthlyReport.totalIncome, monthlyReport.totalExpenses, monthlyReport.netIncome]
            : [0, 0, 0],
          backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
          borderWidth: 1,
        },
      ],
    };

    // Yearly trends
    const yearlyTrends = {
      labels: yearlyReports.map(r => `${r.month}/${r.year}`),
      datasets: [
        {
          label: 'Income',
          data: yearlyReports.map(r => r.totalIncome),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: yearlyReports.map(r => r.totalExpenses),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Net Income',
          data: yearlyReports.map(r => r.netIncome),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    // Category breakdown
    const categoryBreakdown = {
      labels: monthlyReport?.categoryBreakdown.map(c => c.category) || [],
      datasets: [
        {
          data: monthlyReport?.categoryBreakdown.map(c => c.amount) || [],
          backgroundColor: [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#64748b'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };

    // Category stats
    const categoryStatsChart = {
      labels: categoryStats.map(c => c.category),
      datasets: [
        {
          label: 'Total Amount',
          data: categoryStats.map(c => c.totalAmount),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Spending trends
    const spendingTrends = monthlyReport?.spendingTrends ? {
      labels: monthlyReport.spendingTrends.map(t => new Date(t.date).getDate().toString()),
      datasets: [
        {
          label: 'Daily Spending',
          data: monthlyReport.spendingTrends.map(t => t.amount),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    } : { labels: [], datasets: [] };

    // Savings rate over time
    const savingsRateChart = {
      labels: yearlyReports.map(r => `${r.month}/${r.year}`),
      datasets: [
        {
          label: 'Savings Rate (%)',
          data: yearlyReports.map(r => r.savingsRate),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    return {
      monthlyIncomeVsExpenses,
      yearlyTrends,
      categoryBreakdown,
      categoryStatsChart,
      spendingTrends,
      savingsRateChart,
    };
  }, [monthlyReport, yearlyReports, categoryStats]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const handleGenerateReport = async () => {
    await generateReport({
      variables: { year: selectedYear, month: selectedMonth },
    });
  };

  const handleExportReport = () => {
    if (!monthlyReport) return;

    const reportData = {
      reportInfo: {
        year: monthlyReport.year,
        month: getMonthName(monthlyReport.month),
        generatedAt: new Date(monthlyReport.generatedAt).toLocaleDateString(),
      },
      summary: {
        totalIncome: formatCurrency(monthlyReport.totalIncome),
        totalExpenses: formatCurrency(monthlyReport.totalExpenses),
        netIncome: formatCurrency(monthlyReport.netIncome),
        savingsRate: formatPercentage(monthlyReport.savingsRate),
        budgetAdherence: formatPercentage(monthlyReport.budgetAdherence),
      },
      categoryBreakdown: monthlyReport.categoryBreakdown,
      achievements: monthlyReport.achievements,
      recommendations: monthlyReport.recommendations,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `financial-report-${monthlyReport.year}-${monthlyReport.month.toString().padStart(2, '0')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportCSV = () => {
    if (!monthlyReport) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    // Add summary data
    csvContent += "Summary\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Income,${monthlyReport.totalIncome}\n`;
    csvContent += `Total Expenses,${monthlyReport.totalExpenses}\n`;
    csvContent += `Net Income,${monthlyReport.netIncome}\n`;
    csvContent += `Savings Rate,${monthlyReport.savingsRate}\n`;
    csvContent += `Budget Adherence,${monthlyReport.budgetAdherence}\n\n`;

    // Add category breakdown
    csvContent += "Category Breakdown\n";
    csvContent += "Category,Amount,Percentage,Transaction Count,Previous Amount,Change\n";
    monthlyReport.categoryBreakdown.forEach(category => {
      csvContent += `${category.category},${category.amount},${category.percentage},${category.transactionCount},${category.previousAmount || 0},${category.change || 0}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial-report-${monthlyReport.year}-${monthlyReport.month.toString().padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Financial Reports - AI Personal Finance Mentor</title>
        <meta name="description" content="Comprehensive financial reports and analytics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600">Comprehensive analysis of your financial data</p>
            </div>

            <div className="flex items-center space-x-3">
              {monthlyReport && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportReport}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </button>
                </>
              )}
              <button
                onClick={handleGenerateReport}
                disabled={generateLoading}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {generateLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </button>
            </div>
          </div>

          {/* Report Navigation */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex space-x-1">
                  {[
                    { key: 'overview', label: 'Overview', icon: BarChart3 },
                    { key: 'monthly', label: 'Monthly', icon: Calendar },
                    { key: 'yearly', label: 'Yearly', icon: TrendingUp },
                    { key: 'categories', label: 'Categories', icon: PieChart },
                    { key: 'trends', label: 'Trends', icon: TrendingUp },
                    { key: 'export', label: 'Export Data', icon: Download },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setReportView(key as ReportView)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        reportView === key
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {(reportView === 'monthly' || reportView === 'overview') && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                        {getMonthName(selectedMonth)} {selectedYear}
                      </span>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6">
              {/* Overview View */}
              {reportView === 'overview' && (
                <div className="space-y-6">
                  {monthlyReport && (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Total Income</p>
                              <p className="text-2xl font-bold text-green-900 mt-1">
                                {formatCurrency(monthlyReport.totalIncome)}
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-red-700">Total Expenses</p>
                              <p className="text-2xl font-bold text-red-900 mt-1">
                                {formatCurrency(monthlyReport.totalExpenses)}
                              </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Net Income</p>
                              <p className="text-2xl font-bold text-blue-900 mt-1">
                                {formatCurrency(monthlyReport.netIncome)}
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-700">Savings Rate</p>
                              <p className="text-2xl font-bold text-purple-900 mt-1">
                                {formatPercentage(monthlyReport.savingsRate)}
                              </p>
                            </div>
                            <Target className="h-8 w-8 text-purple-600" />
                          </div>
                        </div>
                      </div>

                      {/* Charts Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
                          <div className="h-64">
                            <Bar
                              data={chartData.monthlyIncomeVsExpenses}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => formatCurrency(Number(value)),
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                          <div className="h-64 flex justify-center">
                            <div className="w-64">
                              <Doughnut
                                data={chartData.categoryBreakdown}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'right',
                                      labels: {
                                        boxWidth: 12,
                                        padding: 15,
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Monthly View */}
              {reportView === 'monthly' && (
                <div className="space-y-6">
                  {monthlyReportLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading monthly report...</span>
                    </div>
                  ) : monthlyReportError ? (
                    <div className="flex items-center justify-center py-12">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <span className="ml-2 text-red-600">Error loading monthly report</span>
                    </div>
                  ) : monthlyReport ? (
                    <>
                      {/* Monthly Report Content */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Summary */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Income:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(monthlyReport.totalIncome)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expenses:</span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(monthlyReport.totalExpenses)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-900 font-medium">Net Income:</span>
                              <span className={`font-bold ${monthlyReport.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(monthlyReport.netIncome)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Savings Rate:</span>
                              <span className="font-semibold text-blue-600">
                                {formatPercentage(monthlyReport.savingsRate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                          <div className="space-y-3">
                            {monthlyReport.categoryBreakdown.map((category) => (
                              <div key={category.category} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="capitalize text-gray-900">{category.category}</span>
                                  <span className="text-sm text-gray-500">
                                    ({category.transactionCount} transactions)
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="font-semibold">{formatCurrency(category.amount)}</span>
                                  <span className="text-sm text-gray-500">
                                    {formatPercentage(category.percentage)}
                                  </span>
                                  {category.change !== undefined && (
                                    <div className={`flex items-center text-sm ${
                                      category.change >= 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {category.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                      {formatPercentage(Math.abs(category.change))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Daily Spending Trends */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Spending Trends</h3>
                        <div className="h-64">
                          <Line
                            data={chartData.spendingTrends}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Day of Month',
                                  },
                                },
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: (value) => formatCurrency(Number(value)),
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* Achievements and Recommendations */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Achievements */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Award className="w-5 h-5 mr-2 text-yellow-500" />
                            Achievements
                          </h3>
                          {monthlyReport.achievements.length > 0 ? (
                            <div className="space-y-3">
                              {monthlyReport.achievements.map((achievement) => (
                                <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                                  <Award className="w-5 h-5 text-yellow-500 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                                    <p className="text-sm text-gray-600">{achievement.description}</p>
                                    {achievement.amount && (
                                      <p className="text-sm font-medium text-yellow-700">
                                        {formatCurrency(achievement.amount)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No achievements this month. Keep working towards your goals!</p>
                          )}
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
                            Recommendations
                          </h3>
                          {monthlyReport.recommendations.length > 0 ? (
                            <div className="space-y-3">
                              {monthlyReport.recommendations.map((recommendation) => (
                                <div key={recommendation.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                  <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                                    <p className="text-sm text-gray-600">{recommendation.description}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                      recommendation.priority === 'HIGH'
                                        ? 'bg-red-100 text-red-800'
                                        : recommendation.priority === 'MEDIUM'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {recommendation.priority} Priority
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">Great job! No recommendations this month.</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No report available</h3>
                      <p className="mt-1 text-sm text-gray-500">Generate a report for this month to see detailed analytics.</p>
                      <button
                        onClick={handleGenerateReport}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate Report
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Yearly View */}
              {reportView === 'yearly' && (
                <div className="space-y-6">
                  {yearlyReportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading yearly reports...</span>
                    </div>
                  ) : yearlyReports.length > 0 ? (
                    <>
                      {/* Yearly Trends Chart */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Trends</h3>
                        <div className="h-80">
                          <Line
                            data={chartData.yearlyTrends}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: (value) => formatCurrency(Number(value)),
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* Savings Rate Trend */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings Rate Trend</h3>
                        <div className="h-64">
                          <Line
                            data={chartData.savingsRateChart}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  ticks: {
                                    callback: (value) => `${value}%`,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* Monthly Summary Table */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Monthly Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings Rate</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {yearlyReports.map((report) => (
                                <tr key={`${report.year}-${report.month}`} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {getMonthName(report.month)} {report.year}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                    {formatCurrency(report.totalIncome)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                    {formatCurrency(report.totalExpenses)}
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                    report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(report.netIncome)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                    {formatPercentage(report.savingsRate)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No yearly data available</h3>
                      <p className="mt-1 text-sm text-gray-500">Generate monthly reports to see yearly trends.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Categories View */}
              {reportView === 'categories' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Category Analysis</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">From:</label>
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">To:</label>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <button
                        onClick={() => refetchCategoryStats()}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  {categoryStatsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading category stats...</span>
                    </div>
                  ) : categoryStats.length > 0 ? (
                    <>
                      {/* Category Chart */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Spending by Category</h4>
                        <div className="h-64">
                          <Bar
                            data={chartData.categoryStatsChart}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: (value) => formatCurrency(Number(value)),
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* Category Details Table */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h4 className="text-md font-medium text-gray-900">Category Details</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {categoryStats.map((category) => (
                                <tr key={category.category} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {category.category}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(category.totalAmount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {category.transactionCount}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatCurrency(category.averageAmount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                    {formatPercentage(category.percentage)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <PieChart className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No category data available</h3>
                      <p className="mt-1 text-sm text-gray-500">Add some transactions to see category analysis.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Trends View */}
              {reportView === 'trends' && yearlyReports.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Income Trend */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Trend</h3>
                      <div className="h-64">
                        <Line
                          data={{
                            labels: yearlyReports.map(r => `${r.month}/${r.year}`),
                            datasets: [
                              {
                                label: 'Income',
                                data: yearlyReports.map(r => r.totalIncome),
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                fill: true,
                                tension: 0.4,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value) => formatCurrency(Number(value)),
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Expense Trend */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Trend</h3>
                      <div className="h-64">
                        <Line
                          data={{
                            labels: yearlyReports.map(r => `${r.month}/${r.year}`),
                            datasets: [
                              {
                                label: 'Expenses',
                                data: yearlyReports.map(r => r.totalExpenses),
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                fill: true,
                                tension: 0.4,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value) => formatCurrency(Number(value)),
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Net Income Trend */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Income Trend</h3>
                      <div className="h-64">
                        <Line
                          data={{
                            labels: yearlyReports.map(r => `${r.month}/${r.year}`),
                            datasets: [
                              {
                                label: 'Net Income',
                                data: yearlyReports.map(r => r.netIncome),
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                                tension: 0.4,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value) => formatCurrency(Number(value)),
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Savings Rate Trend */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings Rate Trend</h3>
                      <div className="h-64">
                        <Line
                          data={chartData.savingsRateChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  callback: (value) => `${value}%`,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export View */}
              {reportView === 'export' && (
                <ExportControls />
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}