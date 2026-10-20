import React from 'react';
import { Calendar, ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import { MonthlyReportData, QuickStats } from '../types.ts';

interface MonthlySnapshotCardProps {
  monthlyData: MonthlyReportData | null;
  quickStats: QuickStats | null;
  onNavigateTab: (tab: 'home' | 'expenses' | 'weekly' | 'monthly') => void;
}

export const MonthlySnapshotCard: React.FC<MonthlySnapshotCardProps> = ({
  monthlyData,
  quickStats,
  onNavigateTab
}) => {
  if (!monthlyData) {
    return (
      <div className="bg-white rounded-xl border border-stone-300 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-stone-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-stone-200 rounded w-1/4"></div>
      </div>
    );
  }

  const {
    totalSpending,
    monthName,
    year,
    previousMonthSpending,
    spendingChangeAmount,
    spendingChangePercentage,
    changeStatus,
    transactionCount,
    remainingDays,
    elapsedDays,
    averageDailySpending,
    highestSpendingCategory
  } = monthlyData;

  const getStatusIcon = () => {
    if (changeStatus === 'increased') {
      return <ArrowUpRight className="w-4 h-4 text-stone-700 shrink-0" />;
    }
    if (changeStatus === 'decreased') {
      return <ArrowDownRight className="w-4 h-4 text-stone-700 shrink-0" />;
    }
    return <Minus className="w-4 h-4 text-stone-700 shrink-0" />;
  };

  const getStatusText = () => {
    if (changeStatus === 'increased') {
      return `Increased by ₹${spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${spendingChangePercentage}%) vs last month`;
    }
    if (changeStatus === 'decreased') {
      return `Decreased by ₹${spendingChangeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${spendingChangePercentage}%) vs last month`;
    }
    return `Unchanged compared to last month`;
  };

  return (
    <div className="bg-white rounded-xl border border-stone-300 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
      {/* Top row */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Calendar className="w-4 h-4 text-[#226192]" />
            <span>{monthName} {year} Snapshot</span>
          </div>
          <span className="text-xs text-stone-500">
            {remainingDays} days remaining
          </span>
        </div>

        {/* Big Spending Number */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-stone-900">
            ₹{totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Month-over-month comparison */}
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-600">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-stone-100">
          <div>
            <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Today's Spend
            </span>
            <span className="text-base font-bold font-mono tabular-nums text-stone-900 mt-0.5 block">
              ₹{(quickStats?.todaySpending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-stone-400">
              {quickStats?.todayCount || 0} txn{(quickStats?.todayCount || 0) === 1 ? '' : 's'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              This Week
            </span>
            <span className="text-base font-bold font-mono tabular-nums text-stone-900 mt-0.5 block">
              ₹{(quickStats?.thisWeekSpending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-stone-400">
              {quickStats?.thisWeekCount || 0} txn{(quickStats?.thisWeekCount || 0) === 1 ? '' : 's'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Daily Average
            </span>
            <span className="text-base font-bold font-mono tabular-nums text-stone-900 mt-0.5 block">
              ₹{averageDailySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-stone-400">
              Across {elapsedDays} days
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Top Category
            </span>
            <span className="text-base font-bold text-stone-900 mt-0.5 block truncate">
              {highestSpendingCategory ? highestSpendingCategory.category : 'None'}
            </span>
            <span className="text-[11px] text-stone-400 font-mono tabular-nums">
              {highestSpendingCategory ? `${highestSpendingCategory.percentage}% of total` : '0 txns'}
            </span>
          </div>
        </div>
      </div>

      {/* Shortcuts footer */}
      <div className="pt-4 mt-5 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-stone-500">
          <span>{transactionCount} transactions recorded this month</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('weekly')}
            className="px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md font-medium transition-colors cursor-pointer"
          >
            Weekly Report →
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('monthly')}
            className="px-3 py-1.5 text-[#226192] bg-[#226192]/10 hover:bg-[#226192]/20 rounded-md font-semibold transition-colors cursor-pointer"
          >
            Monthly Report →
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md font-medium transition-colors cursor-pointer"
          >
            All Expenses →
          </button>
        </div>
      </div>
    </div>
  );
};
