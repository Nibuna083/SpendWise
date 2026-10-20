import React from 'react';
import { Edit2, Trash2, Clock, ArrowRight } from 'lucide-react';
import { Expense } from '../types.ts';

interface RecentExpensesListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onViewAll: () => void;
}

export const RecentExpensesList: React.FC<RecentExpensesListProps> = ({
  expenses,
  onEdit,
  onDelete,
  onViewAll
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-300 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#226192]" />
          <h3 className="text-base font-bold text-stone-900">
            Recent Expenses
          </h3>
          <span className="text-xs text-stone-500 font-mono">
            ({expenses.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-[#226192] hover:text-[#1b4e75] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-stone-500">No expenses recorded yet.</p>
          <p className="text-xs text-stone-400 mt-1">Use the form above to add your first expense.</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {expenses.slice(0, 7).map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50/70 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-stone-900 truncate">
                    {item.category}
                  </span>
                  <span className="text-xs text-stone-400" aria-hidden="true">·</span>
                  <span className="text-xs text-stone-500 font-mono">
                    {item.date}
                  </span>
                </div>

                {item.description ? (
                  <p className="text-xs text-stone-600 truncate mt-0.5">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic mt-0.5">
                    No description
                  </p>
                )}
              </div>

              {/* Amount and Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-stone-900 mr-1">
                  ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    title="Edit expense"
                    className="p-1.5 text-stone-400 hover:text-[#226192] hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                    aria-label={`Edit expense of ₹${item.amount} in ${item.category}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    title="Delete expense"
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    aria-label={`Delete expense of ₹${item.amount} in ${item.category}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
