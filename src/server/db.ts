import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

export interface ExpenseRecord {
  id: number;
  amount: number;
  category: string;
  date: string;
  description: string;
  created_at: string;
}

let dbInstance: DatabaseSync | null = null;

export function normalizeCategory(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Other';
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Other';
  }
  // Remove redundant inner spaces and title-case words
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || path.resolve(process.cwd(), 'spendwise.db');
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  // Seed standard categories if table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM categories');
  const catCount = (countStmt.get() as { count: number }).count;
  if (catCount === 0) {
    const defaultCategories = [
      'Food',
      'Groceries',
      'Transport',
      'Utilities',
      'Entertainment',
      'Healthcare',
      'Shopping',
      'Bills',
      'Education',
      'Personal Care',
      'Other'
    ];
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    for (const cat of defaultCategories) {
      insertCat.run(cat);
    }
  }

  // Seed sample data if expenses table is empty so the app has immediate reports to explore
  const expCountStmt = db.prepare('SELECT COUNT(*) as count FROM expenses');
  const expCount = (expCountStmt.get() as { count: number }).count;
  if (expCount === 0) {
    seedInitialExpenses(db);
  }

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

function seedInitialExpenses(db: DatabaseSync) {
  const insert = db.prepare(`
    INSERT INTO expenses (amount, category, date, description)
    VALUES (?, ?, ?, ?)
  `);

  // Sample data around October 2026 and September 2026
  const sampleData: [number, string, string, string][] = [
    // October 2026 (Current month in scenario)
    [350, 'Food', '2026-10-19', 'Team lunch at local bistro'],
    [120, 'Transport', '2026-10-19', 'Metro commute'],
    [1450, 'Groceries', '2026-10-18', 'Weekly organic veggies and pantry essentials'],
    [500, 'Entertainment', '2026-10-17', 'Weekend movie ticket'],
    [2200, 'Utilities', '2026-10-16', 'High-speed internet monthly bill'],
    [450, 'Food', '2026-10-15', 'Dinner with friends'],
    [850, 'Shopping', '2026-10-14', 'Desk organizer and stationery'],
    [180, 'Transport', '2026-10-13', 'Cab ride to client office'],
    [2400, 'Groceries', '2026-10-11', 'Supermarket monthly restock'],
    [1500, 'Healthcare', '2026-10-09', 'Routine health checkup'],
    [620, 'Food', '2026-10-07', 'Family brunch'],
    [3200, 'Bills', '2026-10-05', 'Electricity utility bill'],
    [150, 'Personal Care', '2026-10-02', 'Haircut & grooming'],
    [750, 'Food', '2026-10-01', 'First of month groceries & pantry'],

    // September 2026 (Previous month for comparison)
    [950, 'Food', '2026-09-30', 'End of month celebration dinner'],
    [1800, 'Groceries', '2026-09-25', 'Bi-weekly staples'],
    [2200, 'Utilities', '2026-09-18', 'Internet bill'],
    [3100, 'Bills', '2026-09-08', 'Electricity bill'],
    [1200, 'Shopping', '2026-09-04', 'New running shoes'],
    [600, 'Transport', '2026-09-01', 'Monthly transit card recharge']
  ];

  for (const [amt, cat, dt, desc] of sampleData) {
    insert.run(amt, normalizeCategory(cat), dt, desc);
    // Also ensure category is in categories table
    db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(normalizeCategory(cat));
  }
}
