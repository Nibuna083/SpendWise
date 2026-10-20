import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Expense } from '../types.ts';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  expense,
  onConfirm,
  onCancel,
  isDeleting
}) => {
  if (!isOpen || !expense) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-stone-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 id="delete-dialog-title" className="text-base font-bold text-stone-900">
              Delete Expense
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Are you sure you want to delete this expense? This action will immediately update your monthly, weekly, and category reports.
            </p>

            <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Amount:</span>
                <span className="font-bold font-mono text-stone-900">₹{expense.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Category:</span>
                <span className="font-medium text-stone-800">{expense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date:</span>
                <span className="text-stone-800">{expense.date}</span>
              </div>
              {expense.description && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Description:</span>
                  <span className="text-stone-800 truncate max-w-[200px]">{expense.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Delete Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};
