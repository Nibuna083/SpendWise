import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { CategoryDropdown } from './CategoryDropdown.tsx';
import { createExpense } from '../api/client.ts';
import { Expense } from '../types.ts';

interface ExpenseFormProps {
  categories: string[];
  onExpenseAdded: (newExpense: Expense) => void;
  onCategoryAdded?: (category: string) => void;
  defaultDate?: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  categories,
  onExpenseAdded,
  onCategoryAdded,
  defaultDate = '2026-10-19'
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Food');
  const [date, setDate] = useState(defaultDate);
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When categories prop loads, ensure category has a sensible default
  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter an amount greater than 0');
      return;
    }

    if (!category.trim()) {
      setErrorMessage('Please choose a category');
      return;
    }

    if (!date) {
      setErrorMessage('Please select a date');
      return;
    }

    setIsSubmitting(true);
    try {
      const newExpense = await createExpense({
        amount: parsedAmount,
        category: category.trim(),
        date,
        description: description.trim()
      });

      // Clear amount and description; keep category for fast consecutive entries; reset date to today
      setAmount('');
      setDescription('');
      setDate(defaultDate);
      setSuccessMessage(`Saved ₹${parsedAmount.toFixed(2)} under ${category}`);
      onExpenseAdded(newExpense);

      // Auto clear success toast after 3.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="expense-entry-card" className="bg-white rounded-xl border border-stone-300 shadow-sm p-4 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
            Log an Expense
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Record a transaction quickly — totals and reports update instantly.
          </p>
        </div>

        {/* Quick Category tags for 1-click selection */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Quick:</span>
          {['Food', 'Transport', 'Groceries', 'Bills'].map(quickCat => (
            <button
              key={quickCat}
              type="button"
              onClick={() => setCategory(quickCat)}
              className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                category === quickCat
                  ? 'bg-[#226192] text-white font-medium'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {quickCat}
            </button>
          ))}
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div
          role="status"
          className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs sm:text-sm flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs sm:text-sm flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 font-semibold cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
          {/* 1. Amount */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label htmlFor="expense-amount" className="block text-xs font-bold text-stone-700 mb-1">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono font-medium text-base pointer-events-none">
                ₹
              </span>
              <input
                id="expense-amount"
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 pl-8 pr-3 text-sm font-mono font-medium text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30 focus:border-[#226192] placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* 2. Category Dropdown */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label htmlFor="category-dropdown" className="block text-xs font-bold text-stone-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <CategoryDropdown
              categories={categories}
              selectedCategory={category}
              onSelectCategory={setCategory}
              onCategoryAdded={onCategoryAdded}
            />
          </div>

          {/* 3. Date */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label htmlFor="expense-date" className="block text-xs font-bold text-stone-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="expense-date"
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full h-11 px-3 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30 focus:border-[#226192]"
            />
          </div>

          {/* 4. Description (Short) */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label htmlFor="expense-desc" className="block text-xs font-bold text-stone-700 mb-1">
              Description <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              id="expense-desc"
              type="text"
              maxLength={120}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Lunch with team"
              className="w-full h-11 px-3 text-sm text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30 focus:border-[#226192] placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-stone-500">
            <span>Category is remembered for quick subsequent entries</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !amount}
            className="inline-flex items-center justify-center gap-2 px-6 h-11 text-sm font-semibold text-white bg-[#226192] hover:bg-[#1b4e75] active:bg-[#153e5e] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>{isSubmitting ? 'Saving...' : 'Add Expense'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
