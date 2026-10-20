import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, ArrowUpRight, ArrowDownRight, Minus, BarChart2 } from 'lucide-react';
import { WeeklyReportData } from '../types.ts';

interface WeeklyReportCardProps {
  report: WeeklyReportData | null;
  onNavigateWeek: (direction: 'prev' | 'next' | 'current') => void;
  isCurrentWeek?: boolean;
}

export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({
  report,
  onNavigateWeek,
  isCurrentWeek = true
}) => {
  if (!report) {
    return (
      <div className="bg-white rounded-xl border border-stone-300 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-stone-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-stone-100 rounded mb-4"></div>
      </div>
    );
  }

  const {
    weekStart,
    weekEnd,
    totalSpending,
    previousWeekSpending,
    spendingChangeAmount,
    spendingChangePercentage,
    changeStatus,
    transactionCount,
    elapsedDays,
    averageDailySpending,
    highestSpendingDay,
    dailySpending,
    categoryBreakdown
  } = report;

  // Max daily spending for chart height scaling
  const maxDaySpending = Math.max(...dailySpending.map(d => d.total), 1);

  const getStatusIcon = () => {
    if (changeStatus === 'increased') {
      return <ArrowUpRight className="w-4 h-4 text-stone-700 shrink-0" />;
    }
    if (changeStatus === 'decreased') {
      return <ArrowDownRight className="w-4 h-4 text-stone-700 shrink-0" />;
    }
    return <Minus className="w-4 h-4 text-stone-700 shrink-0" />;
  };

  const getStatusLabel = () => {
    if (changeStatus === 'increased') {
      return `Spending increased by ₹${spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${spendingChangePercentage}%) compared with last week`;
    }
    if (changeStatus === 'decreased') {
      return `Spending decreased by ₹${spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${spendingChangePercentage}%) compared with last week`;
    }
    return `Spending remained unchanged compared with last week`;
  };

  return (
    <div className="bg-white rounded-xl border border-stone-300 shadow-sm p-4 sm:p-6">
      {/* Header with week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#226192]" />
            <h3 className="text-base font-bold text-stone-900">
              Weekly Report
            </h3>
            {isCurrentWeek && (
              <span className="text-[11px] font-medium text-[#226192] bg-[#226192]/10 px-2 py-0.5 rounded">
                Current Week
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {weekStart} (Mon) – {weekEnd} (Sun)
          </p>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateWeek('prev')}
            title="Previous Week"
            className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => onNavigateWeek('current')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Current Week</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateWeek('next')}
            title="Next Week"
            className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-b border-stone-100">
        <div>
          <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Total This Week
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-0.5 block">
            ₹{totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-stone-500">
            {transactionCount} transaction{transactionCount === 1 ? '' : 's'}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Previous Week
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-700 mt-0.5 block">
            ₹{previousWeekSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-1 text-xs text-stone-600 mt-0.5">
            {getStatusIcon()}
            <span className="truncate">
              {changeStatus === 'unchanged' ? '0%' : `${spendingChangePercentage}%`}
            </span>
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Daily Average
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-0.5 block">
            ₹{averageDailySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-stone-500">
            Based on {elapsedDays} elapsed day{elapsedDays === 1 ? '' : 's'}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Peak Spending Day
          </span>
          <span className="text-xl font-bold text-stone-900 mt-0.5 block truncate">
            {highestSpendingDay ? highestSpendingDay.dayName : 'None'}
          </span>
          <span className="text-xs font-mono tabular-nums text-stone-500">
            {highestSpendingDay ? `₹${highestSpendingDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0 recorded'}
          </span>
        </div>
      </div>

      {/* Week-over-week neutral indicator banner */}
      <div className="py-2.5 px-3 my-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 flex items-center gap-2">
        {getStatusIcon()}
        <span>{getStatusLabel()}</span>
      </div>

      {/* Daily 7-Weekday Bar Chart */}
      <div className="pt-2 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Daily Spending (All 7 Days)
          </span>
          <span className="text-xs text-stone-500">
            Hover or tap bars for details
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-1 sm:gap-3 pt-6 pb-2 px-1 border-b border-stone-200">
          {dailySpending.map((day) => {
            const heightPercent = maxDaySpending > 0 ? Math.max((day.total / maxDaySpending) * 100, day.total > 0 ? 8 : 2) : 2;
            const isHighest = highestSpendingDay && highestSpendingDay.date === day.date && day.total > 0;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-stone-900 text-white text-[11px] font-mono py-1 px-2 rounded shadow-md whitespace-nowrap z-20">
                  {day.shortName}: ₹{day.total.toFixed(2)} ({day.count} txn)
                </div>

                {/* Amount label on top of bar if active */}
                {day.total > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-stone-500 mb-1 hidden sm:block truncate max-w-full">
                    ₹{day.total > 999 ? `${(day.total / 1000).toFixed(1)}k` : day.total.toFixed(0)}
                  </span>
                )}

                {/* The visual bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[42px] rounded-t-sm transition-all duration-300 ${
                    day.total === 0
                      ? 'bg-stone-200'
                      : isHighest
                      ? 'bg-[#EF8557] hover:brightness-105'
                      : 'bg-[#226192] hover:bg-[#1b4e75]'
                  }`}
                />

                {/* Weekday label */}
                <span className="text-[11px] font-medium text-stone-600 mt-2 truncate">
                  {day.shortName}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  {day.date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown for this week */}
      <div className="pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-3">
          Category Spending This Week
        </h4>

        {categoryBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {categoryBreakdown.map(cat => (
              <div
                key={cat.category}
                className="p-2.5 bg-stone-50 border border-stone-200/80 rounded-lg flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <span className="text-xs font-semibold text-stone-900 block truncate">
                    {cat.category}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {cat.count} transaction{cat.count === 1 ? '' : 's'} · {cat.percentage}%
                  </span>
                </div>
                <span className="text-xs font-bold font-mono tabular-nums text-stone-900 shrink-0">
                  ₹{cat.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-stone-50 rounded-lg text-xs text-stone-500">
            No expenses recorded for this week.
          </div>
        )}
      </div>
    </div>
  );
};
