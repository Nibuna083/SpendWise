import { Expense, WeeklyReportData, MonthlyReportData, QuickStats } from '../types.ts';

const BASE_URL = '/api';

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/expenses/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.categories || [];
}

export async function createCategory(name: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/expenses/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create category');
  }
  const data = await res.json();
  return data.category;
}

export async function fetchQuickStats(): Promise<QuickStats> {
  const res = await fetch(`${BASE_URL}/reports/quick-stats`);
  if (!res.ok) throw new Error('Failed to fetch quick stats');
  return res.json();
}

export async function fetchWeeklyReport(weekStart?: string): Promise<WeeklyReportData> {
  const url = weekStart
    ? `${BASE_URL}/reports/weekly?week_start=${encodeURIComponent(weekStart)}`
    : `${BASE_URL}/reports/weekly`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weekly report');
  return res.json();
}

export async function fetchMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
  const res = await fetch(`${BASE_URL}/reports/monthly?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('Failed to fetch monthly report');
  return res.json();
}

export async function fetchExpenses(params?: {
  from?: string;
  to?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ expenses: Expense[]; totalCount: number }> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.category) query.set('category', params.category);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const qs = query.toString();
  const url = qs ? `${BASE_URL}/expenses?${qs}` : `${BASE_URL}/expenses`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function createExpense(data: {
  amount: number;
  category: string;
  date: string;
  description?: string;
}): Promise<Expense> {
  const res = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save expense');
  }
  const result = await res.json();
  return result.expense;
}

export async function updateExpense(id: number, data: {
  amount: number;
  category: string;
  date: string;
  description?: string;
}): Promise<Expense> {
  const res = await fetch(`${BASE_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update expense');
  }
  const result = await res.json();
  return result.expense;
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete expense');
  }
}

export function getMonthlyExportUrl(year: number, month: number): string {
  return `${BASE_URL}/reports/monthly/export?year=${year}&month=${month}`;
}
