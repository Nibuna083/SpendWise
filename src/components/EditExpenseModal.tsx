import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Expense } from '../types.ts';
import { CategoryDropdown } from './CategoryDropdown.tsx';

interface EditExpenseModalProps {
  isOpen: boolean;
  expense: Expense | null;
  categories: string[];
  onSave: (id: number, data: { amount: number; category: string; date: string; description?: string }) => Promise<void>;
  onClose: () => void;
  onCategoryAdded?: (category: string) => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  expense,
  categories,
  onSave,
  onClose,
  onCategoryAdded
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setDate(expense.date);
      setDescription(expense.description || '');
      setError(null);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!category.trim()) {
      setError('Category is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(expense.id, {
        amount: numAmount,
        category: category.trim(),
        date,
        description: description.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 id="edit-dialog-title" className="text-base font-bold text-stone-900">
            Edit Expense
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="edit-amount" className="block text-xs font-bold text-stone-700 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono text-sm pointer-events-none">
                ₹
              </span>
              <input
                id="edit-amount"
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full h-10 pl-8 pr-3 text-sm font-mono text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-category" className="block text-xs font-bold text-stone-700 mb-1">
              Category
            </label>
            <CategoryDropdown
              id="edit-category"
              categories={categories}
              selectedCategory={category}
              onSelectCategory={setCategory}
              onCategoryAdded={onCategoryAdded}
            />
          </div>

          <div>
            <label htmlFor="edit-date" className="block text-xs font-bold text-stone-700 mb-1">
              Date
            </label>
            <input
              id="edit-date"
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full h-10 px-3 text-sm text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-xs font-bold text-stone-700 mb-1">
              Description
            </label>
            <input
              id="edit-description"
              type="text"
              maxLength={120}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Weekly grocery restock"
              className="w-full h-10 px-3 text-sm text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#226192]/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#226192] hover:bg-[#1b4e75] disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
