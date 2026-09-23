/**
 * Previse — Live Profile Builder
 * Bridges AA/CSV data to the Phase 1 engine
 */

const { parseTransactions, detectMonthlyInflow, detectCommitments } = require("./parser");
const { mockProfile } = require("../data/mock");

function buildLiveProfile({ accounts, transactions }) {
  const { transactions: parsed, accuracy, warnings } = parseTransactions(transactions);

  const rawBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  // A genuine 0 balance (broke user) must stay 0 — only fall back to demo
  // when there are no accounts at all. (`rawBalance || mock` silently turned
  // every broke user into the ₹1.85L demo profile.)
  const balance = accounts.length > 0 ? rawBalance : mockProfile.balance;
  const monthlyInflow = detectMonthlyInflow(parsed);
  const detected = detectCommitments(parsed);

  // Engine safety: 0 commitments => infinite runway => every verdict BUY.
  // Keep the demo fallback, but label it honestly instead of silently mixing
  // mock commitments with a meta that claims monthlyExpenses 0.
  const usingDemoCommitments = detected.length === 0;
  const commitments = usingDemoCommitments ? mockProfile.commitments : detected;
  if (usingDemoCommitments) {
    warnings.push(
      `Only ${parsed.length} transactions — not enough history to detect recurring expenses, showing demo commitments. Upload 1-3 months of statements for accurate results.`
    );
  }

  const profile = {
    name: mockProfile.name,
    balance,
    monthlyInflow,
    commitments,
    goals: mockProfile.goals,
  };

  if (monthlyInflow === 0) {
    warnings.push("No salary/income detected in transactions. Income set to 0 — simulation results may be inaccurate.");
  }

  const meta = {
    parsingAccuracy: accuracy,
    // What the engine actually simulates with (detected OR demo fallback) —
    // never 0-while-profile-uses-mock again.
    monthlyExpenses: commitments.reduce((sum, c) => sum + c.amount, 0),
    commitmentsSource: usingDemoCommitments ? "demo-fallback" : "detected",
    parsedCount: parsed.filter((t) => t.parsedCategory !== "other").length,
    totalTransactions: parsed.length,
    accountsCount: accounts.length,
    warnings,
  };

  return { profile, meta };
}

module.exports = { buildLiveProfile };
