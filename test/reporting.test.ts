import { DatabaseSync } from 'node:sqlite';
import {
  generateWeeklyReport,
  generateMonthlyReport,
  generateMonthlyCsv,
  normalizeCategory
} from '../src/server/reports.ts';

function createTestDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
    failed++;
  }
}

console.log('--- Running SpendWise Automated Reporting Tests ---\n');

const db = createTestDb();

// Test 1: Monthly totals include only expenses dated within the selected month
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(100, 'Food', '2026-10-15', 'October expense');
  insert.run(200, 'Transport', '2026-10-20', 'October expense 2');
  insert.run(500, 'Utilities', '2026-11-01', 'November expense');
  insert.run(300, 'Shopping', '2026-09-30', 'September expense');

  const octReport = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  assert(
    octReport.totalSpending === 300 && octReport.transactionCount === 2,
    '1. Monthly totals include only expenses dated within the selected month',
    `Expected total 300, got ${octReport.totalSpending}`
  );
}

// Test 2: Expenses on the first and last days of a month are included
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(150, 'Food', '2026-10-01', 'First day of Oct');
  insert.run(250, 'Food', '2026-10-31', 'Last day of Oct');
  insert.run(999, 'Food', '2026-09-30', 'Before Oct');
  insert.run(999, 'Food', '2026-11-01', 'After Oct');

  const report = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  assert(
    report.totalSpending === 400 && report.transactionCount === 2,
    '2. Expenses on the first and last days of a month are included',
    `Expected total 400, got ${report.totalSpending}`
  );
}

// Test 3: Expenses entered later but dated in a previous month appear in the correct report
{
  // Simulating expense created today (October 19) but with date = '2026-09-15'
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(450, 'Healthcare', '2026-09-15', 'Late entered Sept checkup');

  const septReport = generateMonthlyReport(db, 2026, 9, '2026-10-19');
  const octReport = generateMonthlyReport(db, 2026, 10, '2026-10-19');

  const hasInSept = septReport.expenses?.some(e => e.date === '2026-09-15' && e.amount === 450);
  const notInOct = !octReport.expenses?.some(e => e.date === '2026-09-15');

  assert(
    hasInSept && notInOct && septReport.totalSpending >= 450,
    '3. Expenses entered later but dated in a previous month appear in the correct report'
  );
}

// Test 4: Weekly reports correctly include Monday through Sunday
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  // Week: 2026-10-12 (Mon) to 2026-10-18 (Sun)
  insert.run(100, 'Food', '2026-10-12', 'Monday');
  insert.run(200, 'Food', '2026-10-15', 'Thursday');
  insert.run(300, 'Food', '2026-10-18', 'Sunday');
  insert.run(900, 'Food', '2026-10-11', 'Previous Sunday');
  insert.run(900, 'Food', '2026-10-19', 'Next Monday');

  const weeklyReport = generateWeeklyReport(db, '2026-10-12', '2026-10-19');
  assert(
    weeklyReport.totalSpending === 600 &&
    weeklyReport.transactionCount === 3 &&
    weeklyReport.weekStart === '2026-10-12' &&
    weeklyReport.weekEnd === '2026-10-18',
    '4. Weekly reports correctly include Monday through Sunday',
    `Expected total 600, got ${weeklyReport.totalSpending}`
  );
}

// Test 5: Weekly daily charts contain all seven days, including days with no expenses
{
  const weeklyReport = generateWeeklyReport(db, '2026-10-12', '2026-10-19');
  const hasSevenDays = weeklyReport.dailySpending.length === 7;
  const zeroDay = weeklyReport.dailySpending.find(d => d.date === '2026-10-13');
  const monDay = weeklyReport.dailySpending.find(d => d.date === '2026-10-12');

  assert(
    hasSevenDays && zeroDay !== undefined && zeroDay.total === 0 && monDay !== undefined && monDay.total === 100,
    '5. Weekly daily charts contain all seven days, including days with no expenses'
  );
}

// Test 6: Previous-month and previous-week comparisons are correct
{
  // For week: previous week was 2026-10-05 to 2026-10-11
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(400, 'Groceries', '2026-10-06', 'Previous week expense');

  const weeklyReport = generateWeeklyReport(db, '2026-10-12', '2026-10-19');
  // Current: 600, Previous: 400 + 900 (from Test 4 on 2026-10-11) = 1300
  assert(
    weeklyReport.previousWeekSpending === 1300 &&
    weeklyReport.changeStatus === 'decreased' &&
    weeklyReport.spendingChangeAmount === 700,
    '6. Previous-week comparisons are correct',
    `Expected prev 1300, got ${weeklyReport.previousWeekSpending}`
  );
}

// Test 7: Category totals reconcile with the overall total
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(150.25, 'Food', '2026-10-05', 'Lunch');
  insert.run(250.75, 'Transport', '2026-10-06', 'Fuel');
  insert.run(400.00, 'Utilities', '2026-10-10', 'Gas');

  const report = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  const categorySum = Math.round(report.categoryBreakdown.reduce((sum, c) => sum + c.total, 0) * 100) / 100;

  assert(
    categorySum === report.totalSpending && report.totalSpending === 801,
    '7. Category totals reconcile with the overall total',
    `Category sum ${categorySum} vs total ${report.totalSpending}`
  );
}

// Test 8: Percentage shares sum to approximately 100% when spending is nonzero
{
  const report = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  const percentageSum = Math.round(report.categoryBreakdown.reduce((sum, c) => sum + c.percentage, 0));

  assert(
    Math.abs(percentageSum - 100) <= 1,
    '8. Percentage shares sum to approximately 100% when spending is nonzero',
    `Sum was ${percentageSum}%`
  );
}

// Test 9: Empty weeks and months return valid zero-total reports
{
  const emptyMonth = generateMonthlyReport(db, 2025, 1, '2026-10-19');
  const emptyWeek = generateWeeklyReport(db, '2025-01-06', '2026-10-19');

  assert(
    emptyMonth.totalSpending === 0 &&
    emptyMonth.transactionCount === 0 &&
    emptyMonth.categoryBreakdown.length === 0 &&
    emptyWeek.totalSpending === 0 &&
    emptyWeek.dailySpending.length === 7 &&
    emptyWeek.dailySpending.every(d => d.total === 0),
    '9. Empty weeks and months return valid zero-total reports'
  );
}

// Test 10: Month navigation and date filtering do not leak expenses between periods
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(500, 'Food', '2026-08-31', 'August');
  insert.run(600, 'Food', '2026-09-01', 'September Start');
  insert.run(700, 'Food', '2026-09-30', 'September End');
  insert.run(800, 'Food', '2026-10-01', 'October Start');

  const aug = generateMonthlyReport(db, 2026, 8, '2026-10-19');
  const sep = generateMonthlyReport(db, 2026, 9, '2026-10-19');
  const oct = generateMonthlyReport(db, 2026, 10, '2026-10-19');

  assert(
    aug.totalSpending === 500 &&
    sep.totalSpending === 1300 &&
    oct.totalSpending === 800,
    '10. Month navigation and date filtering do not leak expenses between periods'
  );
}

// Test 11: Editing or deleting an expense updates every affected report
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  const res = insert.run(1000, 'Food', '2026-10-19', 'Editable item');
  const id = Number(res.lastInsertRowid);

  let reportBefore = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  assert(reportBefore.totalSpending === 1000, '11a. Initial monthly total matches');

  // Edit amount to 1250 and category to Transport
  db.prepare('UPDATE expenses SET amount = ?, category = ? WHERE id = ?').run(1250, 'Transport', id);
  let reportAfterEdit = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  assert(
    reportAfterEdit.totalSpending === 1250 &&
    reportAfterEdit.categoryBreakdown[0].category === 'Transport',
    '11b. Edited amount and category reflected in monthly report'
  );

  // Delete
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  let reportAfterDelete = generateMonthlyReport(db, 2026, 10, '2026-10-19');
  assert(reportAfterDelete.totalSpending === 0, '11c. Deleting expense updates report to zero');
}

// Test 12: CSV export contains only the selected month's records
{
  db.prepare('DELETE FROM expenses').run();
  const insert = db.prepare('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)');
  insert.run(120, 'Food', '2026-10-05', 'October Breakfast');
  insert.run(340, 'Transport', '2026-10-12', 'October Train');
  insert.run(999, 'Shopping', '2026-09-20', 'September Jacket');

  const csv = generateMonthlyCsv(db, 2026, 10);
  const containsOct1 = csv.includes('October Breakfast');
  const containsOct2 = csv.includes('October Train');
  const notContainsSep = !csv.includes('September Jacket');
  const headerCheck = csv.startsWith('ID,Date,Category,Amount (INR),Description');

  assert(
    containsOct1 && containsOct2 && notContainsSep && headerCheck,
    '12. CSV export contains only the selected month records'
  );
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All 12 automated reporting tests passed successfully!\n');
}
