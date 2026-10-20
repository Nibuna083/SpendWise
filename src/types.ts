export interface Expense {
  id: number;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  created_at?: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailySpending {
  date: string;
  dayName: string;
  shortName: string;
  total: number;
  count: number;
}

export interface WeeklyReportData {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  totalSpending: number;
  previousWeekSpending: number;
  spendingChangeAmount: number;
  spendingChangePercentage: number;
  changeStatus: 'increased' | 'decreased' | 'unchanged';
  transactionCount: number;
  elapsedDays: number;
  averageDailySpending: number;
  highestSpendingDay: {
    date: string;
    dayName: string;
    amount: number;
  } | null;
  dailySpending: DailySpending[];
  categoryBreakdown: CategorySummary[];
}

export interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  startDate: string;
  endDate: string;
  totalSpending: number;
  previousMonthSpending: number;
  spendingChangeAmount: number;
  spendingChangePercentage: number;
  changeStatus: 'increased' | 'decreased' | 'unchanged';
  transactionCount: number;
  totalDaysInMonth: number;
  elapsedDays: number;
  remainingDays: number;
  averageDailySpending: number;
  highestSpendingCategory: {
    category: string;
    amount: number;
    percentage: number;
  } | null;
  highestSpendingDay: {
    date: string;
    dayName: string;
    amount: number;
  } | null;
  dailyTrends: {
    date: string;
    dayOfMonth: number;
    total: number;
    count: number;
  }[];
  categoryBreakdown: CategorySummary[];
  factualSummary: string[];
  expenses?: Expense[];
}

export interface QuickStats {
  todaySpending: number;
  todayCount: number;
  thisWeekSpending: number;
  thisWeekCount: number;
  thisMonthSpending: number;
  thisMonthCount: number;
  remainingDaysInMonth: number;
}
