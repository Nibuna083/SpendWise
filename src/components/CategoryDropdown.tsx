import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Plus, Search } from 'lucide-react';
import { createCategory } from '../api/client.ts';

interface CategoryDropdownProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCategoryAdded?: (category: string) => void;
  id?: string;
}

export function normalizeCategoryName(name: string): string {
  if (!name || typeof name !== 'string') return 'Other';
  const trimmed = name.trim();
  if (!trimmed) return 'Other';
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onCategoryAdded,
  id = 'category-dropdown'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setSearchQuery('');
        setAddError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current && !isAddingNew) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isAddingNew]);

  // Focus new category input when adding mode active
  useEffect(() => {
    if (isAddingNew && newCatInputRef.current) {
      newCatInputRef.current.focus();
    }
  }, [isAddingNew]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(c => c.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const handleAddNewSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setAddError('Category name cannot be empty');
      return;
    }

    const normalized = normalizeCategoryName(trimmed);

    // Check if category already exists in list (ignoring case)
    const existing = categories.find(c => c.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      onSelectCategory(existing);
      setIsAddingNew(false);
      setNewCategoryName('');
      setIsOpen(false);
      return;
    }

    setIsSubmitting(true);
    setAddError(null);
    try {
      const created = await createCategory(normalized);
      if (onCategoryAdded) {
        onCategoryAdded(created);
      }
      onSelectCategory(created);
      setIsAddingNew(false);
      setNewCategoryName('');
      setIsOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Dropdown trigger button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsAddingNew(false);
          setAddError(null);
        }}
        className="w-full h-11 px-3.5 bg-white border border-stone-300 rounded-lg text-left text-sm text-stone-900 flex items-center justify-between gap-2 shadow-xs hover:border-[#226192] focus:outline-none focus:ring-2 focus:ring-[#226192]/30 focus:border-[#226192] transition-colors cursor-pointer"
      >
        <span className="truncate font-medium">
          {selectedCategory || 'Select category'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-72 flex flex-col"
        >
          {!isAddingNew ? (
            <>
              {/* Search box */}
              <div className="p-2 border-b border-stone-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search category..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#226192] focus:border-[#226192]"
                    onKeyDown={e => {
                      if (e.key === 'Escape') setIsOpen(false);
                    }}
                  />
                </div>
              </div>

              {/* Category options list */}
              <div className="overflow-y-auto py-1 flex-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => {
                    const isSelected = cat.toLowerCase() === selectedCategory.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectCategory(cat);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full px-3.5 py-2 text-xs sm:text-sm text-left flex items-center justify-between gap-2 hover:bg-stone-100 transition-colors cursor-pointer ${
                          isSelected ? 'bg-stone-50 text-[#226192] font-semibold' : 'text-stone-700'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#226192] shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3.5 py-2 text-xs text-stone-500 italic">
                    No matching categories found
                  </div>
                )}
              </div>

              {/* Add Custom Category Option Button */}
              <div className="p-1 border-t border-stone-100 bg-stone-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(true);
                    setNewCategoryName(searchQuery.trim());
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-[#226192] hover:bg-white rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                  <span>Add new category{searchQuery ? ` "${searchQuery}"` : ''}</span>
                </button>
              </div>
            </>
          ) : (
            /* Inline Create Category Form */
            <div className="p-3 bg-stone-50">
              <label htmlFor="new-cat-input" className="block text-xs font-semibold text-stone-700 mb-1">
                New Category Name
              </label>
              <input
                id="new-cat-input"
                ref={newCatInputRef}
                type="text"
                value={newCategoryName}
                onChange={e => {
                  setNewCategoryName(e.target.value);
                  setAddError(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewSubmit();
                  } else if (e.key === 'Escape') {
                    setIsAddingNew(false);
                  }
                }}
                placeholder="e.g. Subscriptions, Hobbies"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#226192] mb-1.5"
              />
              {addError && (
                <p className="text-[11px] text-red-600 mb-2">{addError}</p>
              )}
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !newCategoryName.trim()}
                  onClick={() => handleAddNewSubmit()}
                  className="px-3 py-1 text-xs font-semibold text-white bg-[#226192] hover:bg-[#1b4e75] disabled:opacity-50 rounded cursor-pointer transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Add & Select'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
