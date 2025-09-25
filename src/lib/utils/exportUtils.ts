// Export utilities for financial data
export interface ExportOptions {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeCategories?: boolean;
  includeNotes?: boolean;
  currency?: string;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  notes?: string;
  merchant?: string;
  accountId?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: Date;
  createdDate: Date;
  status: 'active' | 'completed' | 'paused';
  description?: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate: Date;
}

export interface ExportData {
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
    dateRange: string;
    generatedAt: Date;
  };
}

// CSV Export Functions
export const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row =>
    headers.map(header => {
      let value = row[header];

      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'string' && value.includes(',')) {
        value = `"${value.replace(/"/g, '""')}"`;
      } else if (value instanceof Date) {
        value = value.toLocaleDateString();
      } else if (typeof value === 'number') {
        value = value.toString();
      }

      return value;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportTransactionsCSV = (
  transactions: Transaction[],
  options: ExportOptions
): void => {
  const filteredTransactions = filterTransactionsByDate(transactions, options.dateRange);

  const headers = [
    'id',
    'date',
    'description',
    'amount',
    'type',
    'category',
    ...(options.includeNotes ? ['notes'] : []),
    'merchant'
  ];

  const csvData = filteredTransactions.map(transaction => ({
    id: transaction.id,
    date: transaction.date.toLocaleDateString(),
    description: transaction.description,
    amount: transaction.type === 'expense' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    ...(options.includeNotes ? { notes: transaction.notes || '' } : {}),
    merchant: transaction.merchant || ''
  }));

  const csvContent = convertToCSV(csvData, headers);
  const filename = `transactions_${options.dateRange.startDate.toISOString().split('T')[0]}_to_${options.dateRange.endDate.toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, filename);
};

export const exportGoalsCSV = (goals: Goal[]): void => {
  const headers = [
    'id',
    'title',
    'targetAmount',
    'currentAmount',
    'progress',
    'category',
    'targetDate',
    'createdDate',
    'status',
    'description'
  ];

  const csvData = goals.map(goal => ({
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    progress: `${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%`,
    category: goal.category,
    targetDate: goal.targetDate.toLocaleDateString(),
    createdDate: goal.createdDate.toLocaleDateString(),
    status: goal.status,
    description: goal.description || ''
  }));

  const csvContent = convertToCSV(csvData, headers);
  const filename = `goals_summary_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, filename);
};

export const exportBudgetsCSV = (budgets: Budget[]): void => {
  const headers = [
    'id',
    'name',
    'category',
    'budgetAmount',
    'spentAmount',
    'remainingAmount',
    'utilizationPercent',
    'period',
    'startDate',
    'endDate'
  ];

  const csvData = budgets.map(budget => ({
    id: budget.id,
    name: budget.name,
    category: budget.category,
    budgetAmount: budget.budgetAmount,
    spentAmount: budget.spentAmount,
    remainingAmount: budget.budgetAmount - budget.spentAmount,
    utilizationPercent: `${Math.round((budget.spentAmount / budget.budgetAmount) * 100)}%`,
    period: budget.period,
    startDate: budget.startDate.toLocaleDateString(),
    endDate: budget.endDate.toLocaleDateString()
  }));

  const csvContent = convertToCSV(csvData, headers);
  const filename = `budgets_summary_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, filename);
};

// Utility Functions
export const filterTransactionsByDate = (
  transactions: Transaction[],
  dateRange: { startDate: Date; endDate: Date }
): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
  });
};

export const calculateSummary = (
  transactions: Transaction[],
  dateRange: { startDate: Date; endDate: Date }
) => {
  const filteredTransactions = filterTransactionsByDate(transactions, dateRange);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
    transactionCount: filteredTransactions.length,
    dateRange: `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`,
    generatedAt: new Date()
  };
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

// Date range presets
export const getDateRangePresets = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const last3Months = new Date(today);
  last3Months.setMonth(last3Months.getMonth() - 3);

  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisYearStart = new Date(today.getFullYear(), 0, 1);

  return {
    today: { startDate: today, endDate: today },
    yesterday: { startDate: yesterday, endDate: yesterday },
    lastWeek: { startDate: lastWeek, endDate: today },
    lastMonth: { startDate: lastMonth, endDate: today },
    last3Months: { startDate: last3Months, endDate: today },
    lastYear: { startDate: lastYear, endDate: today },
    thisMonth: { startDate: thisMonthStart, endDate: today },
    thisYear: { startDate: thisYearStart, endDate: today }
  };
};