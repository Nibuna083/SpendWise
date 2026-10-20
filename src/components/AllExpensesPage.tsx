import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Edit2, Trash2, ArrowUpDown, Plus } from 'lucide-react';
import { Expense } from '../types.ts';
import { fetchExpenses } from '../api/client.ts';

interface AllExpensesPageProps {
  categories: string[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onAddNewClick: () => void;
}

export const AllExpensesPage: React.FC<AllExpensesPageProps> = ({
  categories,
  onEditExpense,
  onDeleteExpense,
  onAddNewClick
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetchExpenses({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        from: startDate || undefined,
        to: endDate || undefined,
      });
      setExpenses(res.expenses);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory, startDate, endDate]);

  // Client-side text search on description or category
  const filtered = expenses.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.category.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      e.date.includes(q)
    );
  });

  const totalFilteredSpending = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            All Expenses Ledger
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Complete database transaction history with filtering and live recalculations.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#226192] hover:bg-[#1b4e75] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>New Expense</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search description or category..."
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full h-10 px-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#226192]/30 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              placeholder="From date"
              aria-label="Start date filter"
              className="w-full h-10 px-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#226192]/30"
            />
          </div>

          {/* Date to */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              placeholder="To date"
              aria-label="End date filter"
              className="w-full h-10 px-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#226192]/30"
            />
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          <div className="text-stone-600">
            Showing <strong className="text-stone-900">{filtered.length}</strong> matching transaction{filtered.length === 1 ? '' : 's'} · Total:{' '}
            <strong className="text-stone-900 font-mono">
              ₹{totalFilteredSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          {(selectedCategory !== 'All' || startDate || endDate || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#226192] hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-stone-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-stone-500 animate-pulse">
            Loading transaction ledger...
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-normal">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-stone-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-sm truncate">
                      {item.description || <span className="text-stone-300 italic">No description</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-stone-900 whitespace-nowrap">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditExpense(item)}
                        className="px-2.5 py-1 text-xs text-[#226192] hover:bg-stone-100 rounded font-medium mr-1.5 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(item)}
                        className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-medium cursor-pointer"
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
          <div className="py-12 text-center text-sm text-stone-500">
            No expenses found matching the current search and filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
