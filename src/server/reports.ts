import { DatabaseSync } from 'node:sqlite';
import { getDb, normalizeCategory } from './db.ts';
export { normalizeCategory };

export interface CategoryAggregate {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DayAggregate {
  date: string;
  dayName: string;
  shortName: string;
  total: number;
  count: number;
}

export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WEEKDAY_SHORTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Helper to format a Date as YYYY-MM-DD in local time
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a Date in local time
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get Monday of the week containing the given date
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

/**
 * Add days to a Date
 */
export function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

/**
 * Round monetary values to 2 decimal places
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate change indicators
 */
export function computeChange(current: number, previous: number): {
  amount: number;
  percentage: number;
  status: 'increased' | 'decreased' | 'unchanged';
} {
  const diff = roundCurrency(current - previous);
  let percentage = 0;
  if (previous > 0) {
    percentage = roundCurrency(((current - previous) / previous) * 100);
  } else if (current > 0) {
    percentage = 100; // Handled gracefully instead of divide by zero
  } else {
    percentage = 0;
  }

  let status: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
  if (diff > 0.001) {
    status = 'increased';
  } else if (diff < -0.001) {
    status = 'decreased';
  }

  return {
    amount: Math.abs(diff),
    percentage: Math.abs(percentage),
    status
  };
}

/**
 * Core SQL query for spending totals within date range
 */
export function getRangeSummary(db: DatabaseSync, startDate: string, endDate: string) {
  const stmt = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) AS total,
      COUNT(id) AS count
    FROM expenses
    WHERE date >= ? AND date <= ?
  `);
  const row = stmt.get(startDate, endDate) as { total: number; count: number };
  return {
    total: roundCurrency(row.total || 0),
    count: row.count || 0
  };
}

/**
 * Core SQL query for category breakdown within date range
 */
export function getCategoryBreakdown(db: DatabaseSync, startDate: string, endDate: string, overallTotal: number): CategoryAggregate[] {
  const stmt = db.prepare(`
    SELECT
      category,
      COALESCE(SUM(amount), 0) AS total,
      COUNT(id) AS count
    FROM expenses
    WHERE date >= ? AND date <= ?
    GROUP BY category
    ORDER BY total DESC
  `);
  const rows = stmt.all(startDate, endDate) as { category: string; total: number; count: number }[];

  let runningPercentage = 0;
  const result: CategoryAggregate[] = rows.map((r, index) => {
    const total = roundCurrency(r.total);
    let percentage = 0;
    if (overallTotal > 0) {
      if (index === rows.length - 1) {
        // Guarantee reconciliation to ~100%
        percentage = roundCurrency(Math.max(0, 100 - runningPercentage));
      } else {
        percentage = roundCurrency((total / overallTotal) * 100);
        runningPercentage += percentage;
      }
    }
    return {
      category: r.category,
      total,
      count: r.count,
      percentage
    };
  });

  return result;
}

/**
 * Generate Weekly Report
 */
export function generateWeeklyReport(db: DatabaseSync, weekStartStr?: string, referenceDateStr?: string) {
  const refDate = referenceDateStr ? parseDate(referenceDateStr) : new Date();
  
  let monday: Date;
  if (weekStartStr && /^\d{4}-\d{2}-\d{2}$/.test(weekStartStr)) {
    monday = parseDate(weekStartStr);
  } else {
    monday = getMondayOfWeek(refDate);
  }

  const sunday = addDays(monday, 6);
  const weekStart = formatDate(monday);
  const weekEnd = formatDate(sunday);

  // Previous week boundaries
  const prevMonday = addDays(monday, -7);
  const prevSunday = addDays(monday, -1);
  const prevWeekStart = formatDate(prevMonday);
  const prevWeekEnd = formatDate(prevSunday);

  // Totals
  const currentSummary = getRangeSummary(db, weekStart, weekEnd);
  const prevSummary = getRangeSummary(db, prevWeekStart, prevWeekEnd);
  const change = computeChange(currentSummary.total, prevSummary.total);

  // Category breakdown
  const categoryBreakdown = getCategoryBreakdown(db, weekStart, weekEnd, currentSummary.total);

  // Elapsed days calculation:
  // If the week is in the future, elapsed = 1
  // If the week is the current active week, elapsed = days passed from Monday up to refDate (capped 1 to 7)
  // If the week is in the past, elapsed = 7
  let elapsedDays = 7;
  const refDateFormatted = formatDate(refDate);
  if (refDateFormatted < weekStart) {
    elapsedDays = 1;
  } else if (refDateFormatted >= weekStart && refDateFormatted <= weekEnd) {
    const dayOfWeek = refDate.getDay(); // 0 is Sun, 1 is Mon
    elapsedDays = dayOfWeek === 0 ? 7 : dayOfWeek;
  } else {
    elapsedDays = 7;
  }

  const averageDailySpending = roundCurrency(currentSummary.total / Math.max(1, elapsedDays));

  // Daily spending for all 7 weekdays
  const dailyStmt = db.prepare(`
    SELECT
      date,
      COALESCE(SUM(amount), 0) AS total,
      COUNT(id) AS count
    FROM expenses
    WHERE date >= ? AND date <= ?
    GROUP BY date
  `);
  const dailyRows = dailyStmt.all(weekStart, weekEnd) as { date: string; total: number; count: number }[];
  const dailyMap = new Map(dailyRows.map(r => [r.date, { total: roundCurrency(r.total), count: r.count }]));

  const dailySpending: DayAggregate[] = [];
  let highestDay: { date: string; dayName: string; amount: number } | null = null;
  let maxDayAmount = -1;

  for (let i = 0; i < 7; i++) {
    const curDate = addDays(monday, i);
    const dateFormatted = formatDate(curDate);
    const dayName = WEEKDAY_NAMES[i];
    const shortName = WEEKDAY_SHORTS[i];
    const data = dailyMap.get(dateFormatted) || { total: 0, count: 0 };

    dailySpending.push({
      date: dateFormatted,
      dayName,
      shortName,
      total: data.total,
      count: data.count
    });

    if (data.total > maxDayAmount && data.total > 0) {
      maxDayAmount = data.total;
      highestDay = {
        date: dateFormatted,
        dayName,
        amount: data.total
      };
    }
  }

  return {
    weekStart,
    weekEnd,
    totalSpending: currentSummary.total,
    previousWeekSpending: prevSummary.total,
    spendingChangeAmount: change.amount,
    spendingChangePercentage: change.percentage,
    changeStatus: change.status,
    transactionCount: currentSummary.count,
    elapsedDays,
    averageDailySpending,
    highestSpendingDay: highestDay,
    dailySpending,
    categoryBreakdown
  };
}

/**
 * Generate Monthly Report
 */
export function generateMonthlyReport(db: DatabaseSync, year: number, month: number, referenceDateStr?: string) {
  // Validate month (1-12)
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    const now = new Date();
    year = isNaN(year) ? now.getFullYear() : year;
    month = isNaN(month) || month < 1 || month > 12 ? now.getMonth() + 1 : month;
  }

  const refDate = referenceDateStr ? parseDate(referenceDateStr) : new Date();
  const monthName = MONTH_NAMES[month - 1];

  // Calendar boundaries
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

  // Previous month calculation
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevTotalDays = new Date(prevYear, prevMonth, 0).getDate();
  const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevTotalDays).padStart(2, '0')}`;

  const currentSummary = getRangeSummary(db, startDate, endDate);
  const prevSummary = getRangeSummary(db, prevStartDate, prevEndDate);
  const change = computeChange(currentSummary.total, prevSummary.total);

  // Category Breakdown
  const categoryBreakdown = getCategoryBreakdown(db, startDate, endDate, currentSummary.total);

  // Elapsed days calculation:
  // If selected month is current month: elapsed = current day of month (capped by totalDays)
  // If selected month is in the past: elapsed = full totalDaysInMonth
  // If selected month is in the future: elapsed = 1
  let elapsedDays = totalDaysInMonth;
  const curYear = refDate.getFullYear();
  const curMonth = refDate.getMonth() + 1;
  const curDay = refDate.getDate();

  if (year === curYear && month === curMonth) {
    elapsedDays = Math.min(curDay, totalDaysInMonth);
  } else if (year > curYear || (year === curYear && month > curMonth)) {
    elapsedDays = 1;
  } else {
    elapsedDays = totalDaysInMonth;
  }

  const remainingDays = Math.max(0, totalDaysInMonth - elapsedDays);
  const averageDailySpending = roundCurrency(currentSummary.total / Math.max(1, elapsedDays));

  // Daily Trends (1 to totalDaysInMonth)
  const dailyStmt = db.prepare(`
    SELECT
      date,
      COALESCE(SUM(amount), 0) AS total,
      COUNT(id) AS count
    FROM expenses
    WHERE date >= ? AND date <= ?
    GROUP BY date
  `);
  const dailyRows = dailyStmt.all(startDate, endDate) as { date: string; total: number; count: number }[];
  const dailyMap = new Map(dailyRows.map(r => [r.date, { total: roundCurrency(r.total), count: r.count }]));

  let highestSpendingDay: { date: string; dayName: string; amount: number } | null = null;
  let maxDayAmount = -1;

  const dailyTrends = [];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = dailyMap.get(dateStr) || { total: 0, count: 0 };
    dailyTrends.push({
      date: dateStr,
      dayOfMonth: d,
      total: data.total,
      count: data.count
    });

    if (data.total > maxDayAmount && data.total > 0) {
      maxDayAmount = data.total;
      const parsed = parseDate(dateStr);
      highestSpendingDay = {
        date: dateStr,
        dayName: WEEKDAY_NAMES[parsed.getDay() === 0 ? 6 : parsed.getDay() - 1],
        amount: data.total
      };
    }
  }

  // Highest spending category
  let highestSpendingCategory: { category: string; amount: number; percentage: number } | null = null;
  if (categoryBreakdown.length > 0 && currentSummary.total > 0) {
    const top = categoryBreakdown[0];
    highestSpendingCategory = {
      category: top.category,
      amount: top.total,
      percentage: top.percentage
    };
  }

  // Factual observations strictly derived from data
  const factualSummary: string[] = [];
  if (currentSummary.total > 0) {
    factualSummary.push(`Total expenditure for ${monthName} ${year} is ₹${currentSummary.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} across ${currentSummary.count} recorded transaction${currentSummary.count === 1 ? '' : 's'}.`);
    
    if (highestSpendingCategory) {
      factualSummary.push(`${highestSpendingCategory.category} was the highest spending category, accounting for ₹${highestSpendingCategory.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${highestSpendingCategory.percentage}% of the month's spending).`);
    }

    if (highestSpendingDay) {
      factualSummary.push(`The peak spending day was ${highestSpendingDay.date} (${highestSpendingDay.dayName}) with ₹${highestSpendingDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} spent.`);
    }

    factualSummary.push(`Average daily expenditure for this period stands at ₹${averageDailySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })} per day (${elapsedDays} day${elapsedDays === 1 ? '' : 's'} calculated).`);

    if (prevSummary.total > 0) {
      const changeText = change.status === 'increased' ? 'increased by' : change.status === 'decreased' ? 'decreased by' : 'remained unchanged compared to';
      factualSummary.push(`Compared to ${MONTH_NAMES[prevMonth - 1]} ${prevYear} (₹${prevSummary.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}), spending has ${changeText} ₹${change.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${change.percentage}%).`);
    } else {
      factualSummary.push(`No expenses were recorded in previous month ${MONTH_NAMES[prevMonth - 1]} ${prevYear}.`);
    }
  } else {
    factualSummary.push(`No expenses have been recorded for ${monthName} ${year}.`);
  }

  // Fetch full expenses list for the month
  const expensesStmt = db.prepare(`
    SELECT id, amount, category, date, description, created_at
    FROM expenses
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC, id DESC
  `);
  const expenses = expensesStmt.all(startDate, endDate) as any[];

  return {
    year,
    month,
    monthName,
    startDate,
    endDate,
    totalSpending: currentSummary.total,
    previousMonthSpending: prevSummary.total,
    spendingChangeAmount: change.amount,
    spendingChangePercentage: change.percentage,
    changeStatus: change.status,
    transactionCount: currentSummary.count,
    totalDaysInMonth,
    elapsedDays,
    remainingDays,
    averageDailySpending,
    highestSpendingCategory,
    highestSpendingDay,
    dailyTrends,
    categoryBreakdown,
    factualSummary,
    expenses
  };
}

/**
 * Quick snapshot stats for the home dashboard
 */
export function getQuickStats(db: DatabaseSync, referenceDateStr?: string) {
  const refDate = referenceDateStr ? parseDate(referenceDateStr) : new Date();
  const todayStr = formatDate(refDate);

  const monday = getMondayOfWeek(refDate);
  const weekStart = formatDate(monday);
  const weekEnd = formatDate(addDays(monday, 6));

  const year = refDate.getFullYear();
  const month = refDate.getMonth() + 1;
  const totalDays = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

  const todaySummary = getRangeSummary(db, todayStr, todayStr);
  const weekSummary = getRangeSummary(db, weekStart, weekEnd);
  const monthSummary = getRangeSummary(db, monthStart, monthEnd);

  const remainingDaysInMonth = Math.max(0, totalDays - refDate.getDate());

  return {
    todaySpending: todaySummary.total,
    todayCount: todaySummary.count,
    thisWeekSpending: weekSummary.total,
    thisWeekCount: weekSummary.count,
    thisMonthSpending: monthSummary.total,
    thisMonthCount: monthSummary.count,
    remainingDaysInMonth
  };
}

/**
 * Generate CSV representation of monthly expenses
 */
export function generateMonthlyCsv(db: DatabaseSync, year: number, month: number): string {
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

  const stmt = db.prepare(`
    SELECT id, date, category, amount, description
    FROM expenses
    WHERE date >= ? AND date <= ?
    ORDER BY date ASC, id ASC
  `);
  const rows = stmt.all(startDate, endDate) as {
    id: number;
    date: string;
    category: string;
    amount: number;
    description: string;
  }[];

  const escapeCsv = (str: string) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const header = ['ID', 'Date', 'Category', 'Amount (INR)', 'Description'].join(',');
  const lines = rows.map(r => [
    r.id,
    r.date,
    escapeCsv(r.category),
    roundCurrency(r.amount).toFixed(2),
    escapeCsv(r.description || '')
  ].join(','));

  return [header, ...lines].join('\n');
}
