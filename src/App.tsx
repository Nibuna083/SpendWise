import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { ExpenseForm } from './components/ExpenseForm.tsx';
import { MonthlySnapshotCard } from './components/MonthlySnapshotCard.tsx';
import { WeeklyReportCard } from './components/WeeklyReportCard.tsx';
import { RecentExpensesList } from './components/RecentExpensesList.tsx';
import { EditExpenseModal } from './components/EditExpenseModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { WeeklyReportPage } from './components/WeeklyReportPage.tsx';
import { MonthlyReportPage } from './components/MonthlyReportPage.tsx';
import { AllExpensesPage } from './components/AllExpensesPage.tsx';

import { Expense, WeeklyReportData, MonthlyReportData, QuickStats } from './types.ts';
import {
  fetchCategories,
  fetchQuickStats,
  fetchWeeklyReport,
  fetchMonthlyReport,
  fetchExpenses,
  updateExpense,
  deleteExpense
} from './api/client.ts';
import { addDays, formatDate, parseDate } from './server/reports.ts';

// Simulated current date
const TODAY_DATE = '2026-10-19';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'expenses' | 'weekly' | 'monthly'>('home');

  // Core Data States
  const [categories, setCategories] = useState<string[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  // Weekly report navigation on dashboard
  const [dashboardWeekStart, setDashboardWeekStart] = useState<string>('2026-10-19');

  // Edit & Delete modal states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all dashboard data
  const refreshAllData = useCallback(async () => {
    try {
      const [cats, stats, month, week, recent] = await Promise.all([
        fetchCategories(),
        fetchQuickStats(),
        fetchMonthlyReport(2026, 10),
        fetchWeeklyReport(dashboardWeekStart),
        fetchExpenses({ limit: 10 })
      ]);

      setCategories(cats);
      setQuickStats(stats);
      setMonthlyData(month);
      setWeeklyReport(week);
      setRecentExpenses(recent.expenses);
    } catch (err) {
      console.error('Error refreshing SpendWise data:', err);
    }
  }, [dashboardWeekStart]);

  // Initial data fetch
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle week navigation in dashboard Weekly Report card
  const handleDashboardWeekNav = async (direction: 'prev' | 'next' | 'current') => {
    let nextMondayStr = '2026-10-19';
    if (direction !== 'current') {
      const mon = parseDate(dashboardWeekStart);
      const target = addDays(mon, direction === 'prev' ? -7 : 7);
      nextMondayStr = formatDate(target);
    }
    setDashboardWeekStart(nextMondayStr);
    try {
      const week = await fetchWeeklyReport(nextMondayStr);
      setWeeklyReport(week);
    } catch (err) {
      console.error('Failed to change week:', err);
    }
  };

  // Callback when a new expense is successfully logged
  const handleExpenseAdded = (newExpense: Expense) => {
    // Immediately update recent list and reload all affected totals & reports
    setRecentExpenses(prev => [newExpense, ...prev.filter(e => e.id !== newExpense.id)].slice(0, 10));
    refreshAllData();
  };

  // Callback when a new custom category is created
  const handleCategoryAdded = (newCat: string) => {
    setCategories(prev => {
      if (prev.includes(newCat)) return prev;
      return [...prev, newCat].sort();
    });
  };

  // Trigger Edit
  const handleStartEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (
    id: number,
    data: { amount: number; category: string; date: string; description?: string }
  ) => {
    await updateExpense(id, data);
    await refreshAllData();
  };

  // Trigger Delete
  const handleStartDelete = (expense: Expense) => {
    setDeletingExpense(expense);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      await deleteExpense(deletingExpense.id);
      setIsDeleteModalOpen(false);
      setDeletingExpense(null);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Add focus or switch to home
  const handleQuickAddClick = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.getElementById('expense-amount');
        if (el) el.focus();
      }, 100);
    } else {
      const el = document.getElementById('expense-amount');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#EAE6DE] flex flex-col text-stone-800">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickAddClick={handleQuickAddClick}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'home' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Welcoming Heading as required */}
            <div className="border-b border-stone-300 pb-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                Where did your money go today?
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Log purchases immediately, track real-time budgets, and review weekly & monthly trends.
              </p>
            </div>

            {/* Prominent Quick Expense Entry Form */}
            <section aria-label="Quick Expense Entry">
              <ExpenseForm
                categories={categories}
                onExpenseAdded={handleExpenseAdded}
                onCategoryAdded={handleCategoryAdded}
                defaultDate={TODAY_DATE}
              />
            </section>

            {/* Monthly Snapshot Card */}
            <section aria-label="Current Month Snapshot">
              <MonthlySnapshotCard
                monthlyData={monthlyData}
                quickStats={quickStats}
                onNavigateTab={setActiveTab}
              />
            </section>

            {/* Weekly Report on Dashboard with 7-Weekday Bar Chart */}
            <section aria-label="Weekly Dashboard Report">
              <WeeklyReportCard
                report={weeklyReport}
                onNavigateWeek={handleDashboardWeekNav}
                isCurrentWeek={dashboardWeekStart === '2026-10-19'}
              />
            </section>

            {/* Recently Added Expenses Below the Form */}
            <section aria-label="Recently Added Expenses">
              <RecentExpensesList
                expenses={recentExpenses}
                onEdit={handleStartEdit}
                onDelete={handleStartDelete}
                onViewAll={() => setActiveTab('expenses')}
              />
            </section>
          </div>
        )}

        {activeTab === 'expenses' && (
          <AllExpensesPage
            categories={categories}
            onEditExpense={handleStartEdit}
            onDeleteExpense={handleStartDelete}
            onAddNewClick={handleQuickAddClick}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyReportPage
            onEditExpense={handleStartEdit}
            onDeleteExpense={handleStartDelete}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReportPage
            onEditExpense={handleStartEdit}
            onDeleteExpense={handleStartDelete}
            initialYear={2026}
            initialMonth={10}
          />
        )}
      </main>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={isEditModalOpen}
        expense={editingExpense}
        categories={categories}
        onSave={handleSaveEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        expense={deletingExpense}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingExpense(null);
        }}
        isDeleting={isDeleting}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-stone-300 py-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 SpendWise Expense Tracker. Accurate calendar-boundary budgeting.</p>
          <div className="flex items-center gap-4 text-stone-600 font-medium">
            <span>Theme: #EAE6DE / #226192 / #EF8557</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
