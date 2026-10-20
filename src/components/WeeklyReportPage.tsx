import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Layers
} from 'lucide-react';
import { WeeklyReportData, Expense } from '../types.ts';
import { fetchWeeklyReport, fetchExpenses } from '../api/client.ts';
import { addDays, formatDate, parseDate } from '../server/reports.ts';

interface WeeklyReportPageProps {
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const WeeklyReportPage: React.FC<WeeklyReportPageProps> = ({
  onEditExpense,
  onDeleteExpense
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('2026-10-19'); // Monday
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [weekExpenses, setWeekExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWeeklyData = async (startStr: string) => {
    setIsLoading(true);
    try {
      const data = await fetchWeeklyReport(startStr);
      setReport(data);

      // Load expenses in this date range
      const res = await fetchExpenses({
        from: data.weekStart,
        to: data.weekEnd
      });
      setWeekExpenses(res.expenses);
    } catch (err) {
      console.error('Failed to load weekly report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklyData(currentWeekStart);
  }, [currentWeekStart]);

  const handleNavigate = (direction: 'prev' | 'next' | 'current') => {
    if (direction === 'current') {
      setCurrentWeekStart('2026-10-19');
      return;
    }
    const currentMon = parseDate(currentWeekStart);
    const newMon = addDays(currentMon, direction === 'prev' ? -7 : 7);
    setCurrentWeekStart(formatDate(newMon));
  };

  const getStatusIcon = (status: string) => {
    if (status === 'increased') return <ArrowUpRight className="w-4 h-4 text-stone-700 shrink-0" />;
    if (status === 'decreased') return <ArrowDownRight className="w-4 h-4 text-stone-700 shrink-0" />;
    return <Minus className="w-4 h-4 text-stone-700 shrink-0" />;
  };

  const maxDaySpending = report?.dailySpending
    ? Math.max(...report.dailySpending.map(d => d.total), 1)
    : 1;

  const isCurrentActiveWeek = currentWeekStart === '2026-10-19';

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#226192]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Weekly Spending Report
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {report?.weekStart} (Monday) to {report?.weekEnd} (Sunday)
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleNavigate('prev')}
            className="p-2 border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isCurrentActiveWeek && (
            <button
              type="button"
              onClick={() => handleNavigate('current')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Current Week</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNavigate('next')}
            className="p-2 border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-300 p-8 text-center text-sm text-stone-500 animate-pulse">
          Loading weekly metrics...
        </div>
      ) : report ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Total This Week
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
                Previous Week
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-700 mt-1 block">
                ₹{report.previousWeekSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1 text-xs text-stone-600 mt-1">
                {getStatusIcon(report.changeStatus)}
                <span>
                  {report.changeStatus === 'increased'
                    ? `Increased by ₹${report.spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${report.spendingChangePercentage}%)`
                    : report.changeStatus === 'decreased'
                    ? `Decreased by ₹${report.spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${report.spendingChangePercentage}%)`
                    : 'Unchanged vs last week'}
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
                Across {report.elapsedDays} elapsed day{report.elapsedDays === 1 ? '' : 's'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Peak Day
              </span>
              <span className="text-xl sm:text-2xl font-bold text-stone-900 mt-1 block truncate">
                {report.highestSpendingDay ? report.highestSpendingDay.dayName : 'None'}
              </span>
              <span className="text-xs font-mono tabular-nums text-stone-500">
                {report.highestSpendingDay
                  ? `₹${report.highestSpendingDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : '₹0 recorded'}
              </span>
            </div>
          </div>

          {/* 7-Weekday Daily Bar Chart */}
          <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Daily Breakdown (Monday through Sunday)
              </h3>
              <span className="text-xs text-stone-500">
                Includes zero-expense days
              </span>
            </div>

            <div className="h-56 flex items-end justify-between gap-1 sm:gap-4 pt-8 pb-2 border-b border-stone-200">
              {report.dailySpending.map(day => {
                const heightPercent = maxDaySpending > 0
                  ? Math.max((day.total / maxDaySpending) * 100, day.total > 0 ? 8 : 2)
                  : 2;
                const isHighest = report.highestSpendingDay && report.highestSpendingDay.date === day.date && day.total > 0;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-stone-900 text-white text-[11px] font-mono py-1 px-2 rounded shadow-md whitespace-nowrap z-20">
                      {day.dayName} ({day.date}): ₹{day.total.toFixed(2)}
                    </div>

                    {day.total > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-stone-600 mb-1 hidden sm:block">
                        ₹{day.total.toFixed(0)}
                      </span>
                    )}

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[56px] rounded-t-sm transition-all ${
                        day.total === 0
                          ? 'bg-stone-200'
                          : isHighest
                          ? 'bg-[#EF8557]'
                          : 'bg-[#226192]'
                      }`}
                    />

                    <span className="text-xs font-semibold text-stone-700 mt-2 truncate">
                      {day.shortName}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution for this week */}
          <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-[#226192]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Weekly Category Distribution
              </h3>
            </div>

            {report.categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.categoryBreakdown.map((item, idx) => (
                  <div key={item.category} className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-stone-900">{item.category}</span>
                      <span className="text-xs font-mono font-bold text-stone-900">
                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden mb-1.5">
                      <div
                        style={{ width: `${Math.min(100, Math.max(4, item.percentage))}%` }}
                        className={`h-full rounded-full ${idx === 0 ? 'bg-[#EF8557]' : 'bg-[#226192]'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>{item.count} transaction{item.count === 1 ? '' : 's'}</span>
                      <span className="font-mono">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-stone-500">
                No category data for this week.
              </div>
            )}
          </div>

          {/* Itemized Transactions for this Week */}
          <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-3">
              This Week's Itemized Transactions ({weekExpenses.length})
            </h3>

            {weekExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-normal">
                    {weekExpenses.map(item => (
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
              <div className="text-center py-6 text-xs text-stone-500">
                No individual expenses recorded for this week.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
