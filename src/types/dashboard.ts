// Dashboard specific types
export interface DashboardData {
  balance: BalanceData;
  transactions: Transaction[];
  expenses: ExpenseCategory[];
  incomeExpenses: ChartDataPoint[];
  goals: FinancialGoal[];
}

export interface BalanceData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  merchant?: string;
  icon?: string;
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
}

// Component Props Types
export interface DashboardProps {
  userName?: string;
  userAvatar?: string;
  data?: Partial<DashboardData>;
}

export interface BalanceOverviewProps {
  data?: BalanceData;
}

export interface RecentTransactionsProps {
  transactions?: Transaction[];
  onViewAll?: () => void;
  onAddTransaction?: () => void;
}

export interface ExpenseChartProps {
  categories?: ExpenseCategory[];
  totalExpenses?: number;
}

export interface IncomeExpenseChartProps {
  data?: ChartDataPoint[];
  period?: 'last6months' | 'last12months' | 'year';
}

export interface FinancialGoalsProps {
  goals?: FinancialGoal[];
  onAddGoal?: () => void;
  onViewAll?: () => void;
}

// Layout Props Types
export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export interface HeaderProps {
  onMenuToggle: () => void;
  userName?: string;
  userAvatar?: string;
}