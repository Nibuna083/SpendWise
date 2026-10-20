import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  PieChart,
  TrendingUp,
  Info,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { MonthlyReportData, Expense } from '../types.ts';
import { fetchMonthlyReport, getMonthlyExportUrl } from '../api/client.ts';
import { MONTH_NAMES } from '../server/reports.ts';

interface MonthlyReportPageProps {
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  initialYear?: number;
  initialMonth?: number;
}

export const MonthlyReportPage: React.FC<MonthlyReportPageProps> = ({
  onEditExpense,
  onDeleteExpense,
  initialYear = 2026,
  initialMonth = 10
}) => {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Load report data
  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMonthlyReport(selectedYear, selectedMonth);
      setReport(data);
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedYear, selectedMonth]);

  // Year options: 2024 to 2027
  const yearOptions = [2024, 2025, 2026, 2027];

  // Month options: 1 to 12
  const monthOptions = MONTH_NAMES.map((name, idx) => ({
    label: name,
    value: idx + 1
  }));

  // Filtered expense list for this month
  const expensesList = report?.expenses || [];
  const filteredExpenses = categoryFilter === 'All'
    ? expensesList
    : expensesList.filter(e => e.category.toLowerCase() === categoryFilter.toLowerCase());

  // Max daily trend spending for chart height
  const maxDailyTrend = report?.dailyTrends
    ? Math.max(...report.dailyTrends.map(d => d.total), 1)
    : 1;

  const handleExportCsv = () => {
    const url = getMonthlyExportUrl(selectedYear, selectedMonth);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendwise_report_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'increased') return <ArrowUpRight className="w-4 h-4 text-stone-700 shrink-0" />;
    if (status === 'decreased') return <ArrowDownRight className="w-4 h-4 text-stone-700 shrink-0" />;
    return <Minus className="w-4 h-4 text-stone-700 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month/Year Selector */}
      <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#226192]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Expense Report
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Automatic calendar-month boundaries ({report?.startDate || '...'} to {report?.endDate || '...'}).
          </p>
        </div>

        {/* Controls: Month dropdown, Year dropdown, CSV export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
            aria-label="Select reporting month"
            className="h-10 px-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#226192]/30 cursor-pointer"
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            aria-label="Select reporting year"
            className="h-10 px-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#226192]/30 cursor-pointer"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!report || report.totalSpending === 0}
            className="h-10 px-3.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-300 p-8 text-center text-sm text-stone-500 animate-pulse">
          Loading {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Report...
        </div>
      ) : report ? (
        <>
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Total Month Spend
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
                ₹{report.totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-stone-500">
                {report.transactionCount} transaction{report.transactionCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Previous Month
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-700 mt-1 block">
                ₹{report.previousMonthSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1 text-xs text-stone-600 mt-1">
                {getStatusIcon(report.changeStatus)}
                <span>
                  {report.changeStatus === 'increased'
                    ? `+₹${report.spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${report.spendingChangePercentage}%)`
                    : report.changeStatus === 'decreased'
                    ? `-₹${report.spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${report.spendingChangePercentage}%)`
                    : 'Unchanged'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Daily Average
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-900 mt-1 block">
                ₹{report.averageDailySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-stone-500">
                Calculated over {report.elapsedDays} calendar day{report.elapsedDays === 1 ? '' : 's'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Highest Spending
              </span>
              <span className="text-xl sm:text-2xl font-bold text-stone-900 mt-1 block truncate">
                {report.highestSpendingCategory ? report.highestSpendingCategory.category : 'None'}
              </span>
              <span className="text-xs font-mono tabular-nums text-stone-500">
                {report.highestSpendingCategory
                  ? `₹${report.highestSpendingCategory.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${report.highestSpendingCategory.percentage}%)`
                  : '0 transactions'}
              </span>
            </div>
          </div>

          {/* Factual Summary Section */}
          <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#226192]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Factual Spending Analysis
              </h2>
            </div>
            <div className="bg-stone-50 rounded-lg p-3 sm:p-4 border border-stone-200/80 text-xs sm:text-sm text-stone-700 space-y-2 leading-relaxed">
              {report.factualSummary.map((fact, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#226192] font-bold">·</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown & Daily Trends Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Breakdown */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#226192]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                    Category Breakdown
                  </h3>
                </div>
                <span className="text-xs text-stone-500">
                  {report.categoryBreakdown.length} Categories
                </span>
              </div>

              {report.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {report.categoryBreakdown.map((item, idx) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-stone-800">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono tabular-nums text-stone-900">
                            ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-stone-500 font-mono w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                          className={`h-full rounded-full ${
                            idx === 0 ? 'bg-[#EF8557]' : 'bg-[#226192]'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {item.count} recorded transaction{item.count === 1 ? '' : 's'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No categorized expenses in this month.
                </div>
              )}
            </div>

            {/* Daily Spending Trends throughout the month */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#226192]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                      Daily Spending Trend
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500">
                    Day 1 to {report.totalDaysInMonth}
                  </span>
                </div>

                <p className="text-xs text-stone-500 mb-4">
                  Visual day-by-day distribution across all {report.totalDaysInMonth} calendar days.
                </p>

                {/* Day-by-Day Bars */}
                <div className="h-44 flex items-end justify-between gap-0.5 sm:gap-1 pt-6 pb-2 border-b border-stone-200">
                  {report.dailyTrends.map(day => {
                    const heightPercent = maxDailyTrend > 0
                      ? Math.max((day.total / maxDailyTrend) * 100, day.total > 0 ? 8 : 2)
                      : 2;
                    const isHighestDay = report.highestSpendingDay && report.highestSpendingDay.date === day.date && day.total > 0;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-stone-900 text-white text-[10px] font-mono py-1 px-1.5 rounded shadow whitespace-nowrap z-30">
                          {day.date}: ₹{day.total.toFixed(2)}
                        </div>

                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xs transition-all ${
                            day.total === 0
                              ? 'bg-stone-200'
                              : isHighestDay
                              ? 'bg-[#EF8557]'
                              : 'bg-[#226192]'
                          }`}
                        />

                        {day.dayOfMonth % 5 === 0 || day.dayOfMonth === 1 ? (
                          <span className="text-[9px] text-stone-500 font-mono mt-1">
                            {day.dayOfMonth}
                          </span>
                        ) : (
                          <span className="h-3 text-[9px] opacity-0">·</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {report.highestSpendingDay && (
                <div className="pt-3 text-xs text-stone-600 flex items-center justify-between">
                  <span>Peak day: <strong>{report.highestSpendingDay.date}</strong> ({report.highestSpendingDay.dayName})</span>
                  <span className="font-mono font-bold text-stone-900">
                    ₹{report.highestSpendingDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Month's Itemized Expense Table with Category Filter */}
          <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {MONTH_NAMES[selectedMonth - 1]} Expense Records
                </h3>
                <p className="text-xs text-stone-500">
                  Showing {filteredExpenses.length} of {expensesList.length} transaction{expensesList.length === 1 ? '' : 's'}
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="h-9 px-2.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#226192]"
                >
                  <option value="All">All Categories</option>
                  {report.categoryBreakdown.map(c => (
                    <option key={c.category} value={c.category}>
                      {c.category} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-normal">
                    {filteredExpenses.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-stone-700 whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-900">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">
                          {item.description || <span className="text-stone-300 italic">No description</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-stone-900">
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onEditExpense(item)}
                            className="px-2 py-1 text-xs text-[#226192] hover:bg-stone-100 rounded font-medium mr-1 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(item)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-stone-500">
                No transactions match the selected criteria for this month.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
