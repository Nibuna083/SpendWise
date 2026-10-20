import React from 'react';
import { Plus, Wallet } from 'lucide-react';

interface HeaderProps {
  activeTab: 'home' | 'expenses' | 'weekly' | 'monthly';
  onSelectTab: (tab: 'home' | 'expenses' | 'weekly' | 'monthly') => void;
  onQuickAddClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onQuickAddClick,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#EAE6DE]/95 backdrop-blur-md border-b border-stone-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#226192] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          <Wallet className="w-6 h-6 text-[#226192] shrink-0" strokeWidth={2.2} />
          <span>SpendWise</span>
        </button>

        {/* Zone 2: Navigation Links (single-line, clean hover underline or active styling) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => onSelectTab('home')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'home'
                ? 'text-[#226192] font-semibold border-b-2 border-[#226192]'
                : 'hover:text-stone-950'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('expenses')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'expenses'
                ? 'text-[#226192] font-semibold border-b-2 border-[#226192]'
                : 'hover:text-stone-950'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => onSelectTab('weekly')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-[#226192] font-semibold border-b-2 border-[#226192]'
                : 'hover:text-stone-950'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => onSelectTab('monthly')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'monthly'
                ? 'text-[#226192] font-semibold border-b-2 border-[#226192]'
                : 'hover:text-stone-950'
            }`}
          >
            Monthly Report
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onQuickAddClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#226192] hover:bg-[#1b4e75] active:bg-[#153e5e] rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#226192]/40"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-stone-200 bg-[#EAE6DE] px-2 py-2 text-xs font-medium text-stone-600">
        <button
          onClick={() => onSelectTab('home')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'home' ? 'text-[#226192] font-bold' : 'hover:text-stone-900'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('expenses')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'expenses' ? 'text-[#226192] font-bold' : 'hover:text-stone-900'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => onSelectTab('weekly')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'weekly' ? 'text-[#226192] font-bold' : 'hover:text-stone-900'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => onSelectTab('monthly')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'monthly' ? 'text-[#226192] font-bold' : 'hover:text-stone-900'
          }`}
        >
          Monthly
        </button>
      </div>
    </header>
  );
};
