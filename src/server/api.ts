import { Router, Request, Response } from 'express';
import { getDb, normalizeCategory } from './db.ts';
import {
  generateWeeklyReport,
  generateMonthlyReport,
  getQuickStats,
  generateMonthlyCsv
} from './reports.ts';

export const apiRouter = Router();

// Reference date default for testing & live simulation
const REFERENCE_DATE = '2026-10-19';

/**
 * GET /expenses/categories
 * Distinct normalized categories
 */
apiRouter.get('/expenses/categories', (req: Request, res: Response) => {
  try {
    const db = getDb();
    // Query both explicit categories table and any existing category in expenses
    const stmt = db.prepare(`
      SELECT DISTINCT name FROM (
        SELECT name FROM categories
        UNION
        SELECT category AS name FROM expenses
      )
      WHERE name IS NOT NULL AND trim(name) != ''
      ORDER BY name ASC
    `);
    const rows = stmt.all() as { name: string }[];
    const categories = rows.map(r => normalizeCategory(r.name));
    // Unique list
    const unique = Array.from(new Set(categories));
    res.json({ categories: unique });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

/**
 * POST /expenses/categories
 * Add a custom category
 */
apiRouter.post('/expenses/categories', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name cannot be empty or whitespace' });
    }
    const normalized = normalizeCategory(name);
    const db = getDb();
    db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(normalized);
    res.status(201).json({ category: normalized, message: 'Category added successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add category' });
  }
});

/**
 * GET /reports/quick-stats
 */
apiRouter.get('/reports/quick-stats', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const stats = getQuickStats(db, REFERENCE_DATE);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate quick stats' });
  }
});

/**
 * GET /reports/weekly?week_start=YYYY-MM-DD
 */
apiRouter.get('/reports/weekly', (req: Request, res: Response) => {
  try {
    const weekStart = req.query.week_start as string | undefined;
    const db = getDb();
    const report = generateWeeklyReport(db, weekStart, REFERENCE_DATE);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate weekly report' });
  }
});

/**
 * GET /reports/monthly?year=YYYY&month=MM
 */
apiRouter.get('/reports/monthly', (req: Request, res: Response) => {
  try {
    const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
    const monthParam = req.query.month ? parseInt(req.query.month as string, 10) : 10;
    
    if (isNaN(yearParam) || isNaN(monthParam) || monthParam < 1 || monthParam > 12) {
      return res.status(400).json({ error: 'Valid year and month (1-12) are required' });
    }

    const db = getDb();
    const report = generateMonthlyReport(db, yearParam, monthParam, REFERENCE_DATE);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate monthly report' });
  }
});

/**
 * GET /reports/monthly/export?year=YYYY&month=MM
 */
apiRouter.get('/reports/monthly/export', (req: Request, res: Response) => {
  try {
    const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
    const monthParam = req.query.month ? parseInt(req.query.month as string, 10) : 10;

    if (isNaN(yearParam) || isNaN(monthParam) || monthParam < 1 || monthParam > 12) {
      return res.status(400).json({ error: 'Valid year and month (1-12) are required' });
    }

    const db = getDb();
    const csvData = generateMonthlyCsv(db, yearParam, monthParam);
    const filename = `spendwise_expenses_${yearParam}_${String(monthParam).padStart(2, '0')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export monthly CSV' });
  }
});

/**
 * GET /expenses
 * Retrieve list of expenses with optional filtering
 */
apiRouter.get('/expenses', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { from, to, category, limit, offset } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (from && typeof from === 'string') {
      conditions.push('date >= ?');
      params.push(from);
    }
    if (to && typeof to === 'string') {
      conditions.push('date <= ?');
      params.push(to);
    }
    if (category && typeof category === 'string' && category !== 'All') {
      conditions.push('category = ?');
      params.push(normalizeCategory(category));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = limit ? `LIMIT ?` : '';
    if (limit) params.push(parseInt(limit as string, 10));

    const offsetClause = offset ? `OFFSET ?` : '';
    if (offset) params.push(parseInt(offset as string, 10));

    const query = `
      SELECT id, amount, category, date, description, created_at
      FROM expenses
      ${whereClause}
      ORDER BY date DESC, id DESC
      ${limitClause} ${offsetClause}
    `;

    const stmt = db.prepare(query);
    const expenses = stmt.all(...params);

    // Total count for pagination
    const countQuery = `SELECT COUNT(id) as count FROM expenses ${whereClause}`;
    const countParams = params.slice(0, conditions.length);
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...countParams) as { count: number };

    res.json({
      expenses,
      totalCount: countResult ? countResult.count : expenses.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch expenses' });
  }
});

/**
 * POST /expenses
 * Add a new expense
 */
apiRouter.post('/expenses', (req: Request, res: Response) => {
  try {
    const { amount, category, date, description } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than 0' });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date in YYYY-MM-DD format is required' });
    }

    const normalizedCategory = normalizeCategory(category);
    const sanitizedDescription = description ? String(description).trim() : '';

    const db = getDb();
    
    // Ensure category exists in categories table
    db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(normalizedCategory);

    const insertStmt = db.prepare(`
      INSERT INTO expenses (amount, category, date, description)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(numAmount, normalizedCategory, date, sanitizedDescription);
    const newId = Number(result.lastInsertRowid);

    const fetchStmt = db.prepare('SELECT id, amount, category, date, description, created_at FROM expenses WHERE id = ?');
    const createdExpense = fetchStmt.get(newId);

    res.status(201).json({
      message: 'Expense added successfully',
      expense: createdExpense
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save expense' });
  }
});

/**
 * PUT /expenses/:id
 * Update an existing expense
 */
apiRouter.put('/expenses/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const { amount, category, date, description } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than 0' });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date in YYYY-MM-DD format is required' });
    }

    const normalizedCategory = normalizeCategory(category);
    const sanitizedDescription = description ? String(description).trim() : '';

    const db = getDb();

    // Check existence
    const checkStmt = db.prepare('SELECT id FROM expenses WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Ensure category exists
    db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(normalizedCategory);

    const updateStmt = db.prepare(`
      UPDATE expenses
      SET amount = ?, category = ?, date = ?, description = ?
      WHERE id = ?
    `);
    updateStmt.run(numAmount, normalizedCategory, date, sanitizedDescription, id);

    const updatedExpense = db.prepare('SELECT id, amount, category, date, description, created_at FROM expenses WHERE id = ?').get(id);

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update expense' });
  }
});

/**
 * DELETE /expenses/:id
 * Delete an expense
 */
apiRouter.delete('/expenses/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const db = getDb();
    const checkStmt = db.prepare('SELECT id FROM expenses WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

    res.json({ message: 'Expense deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete expense' });
  }
});
