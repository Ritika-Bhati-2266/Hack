/**
 * Previse — Live Profile Builder
 * Bridges AA/CSV data to the Phase 1 engine
 */

const { parseTransactions, detectMonthlyInflow, detectCommitments } = require("./parser");

function buildLiveProfile({ accounts, transactions }) {
  const { transactions: parsed, accuracy, warnings } = parseTransactions(transactions);

  const rawBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  // No demo fallback: a genuine 0 stays 0, and no accounts => 0.
  const balance = rawBalance;
  const monthlyInflow = detectMonthlyInflow(parsed);
  const detected = detectCommitments(parsed);

  // Production mode: NEVER invent commitments.
  //   1. "detected" — repeating narrations found (normal case).
  //   2. "single-sample" — thin file, no repeats, but REAL debits exist:
  //      aggregate actual debits by category as the monthly estimate.
  //   3. credits-only file => throw: caller returns 400, no fake data.
  const debits = parsed.filter((t) => t.amount < 0);
  let commitments;
  let commitmentsSource;
  if (detected.length > 0) {
    commitments = detected;
    commitmentsSource = "detected";
  } else if (debits.length > 0) {
    const byCategory = {};
    for (const d of debits) {
      const key =
        d.parsedCategory && d.parsedCategory !== "other"
          ? d.parsedCategory
          : d.narration.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(" ").slice(0, 3).join(" ") || "expense";
      byCategory[key] = (byCategory[key] || 0) + Math.abs(d.amount);
    }
    commitments = Object.entries(byCategory).map(([name, amount]) => ({
      name,
      amount: Math.round(amount),
      type: "recurring",
      dayOfMonth: 1,
      active: true,
    }));
    commitmentsSource = "single-sample";
    warnings.push(
      `Only ${parsed.length} transactions — no repeating expenses found, using your actual ${debits.length} expense(s) as monthly estimate. Upload 1-3 months of statements for accurate recurring detection.`
    );
  } else {
    const err = new Error(
      "No debit transactions found — upload a statement with expenses (1-3 months) so commitments can be detected. No demo data substituted."
    );
    err.code = "NO_EXPENSES";
    throw err;
  }

  const profile = {
    name: "Live User",
    balance,
    monthlyInflow,
    commitments,
    goals: [],
  };

  if (monthlyInflow === 0) {
    warnings.push("No salary/income detected in transactions. Income set to 0 — simulation results may be inaccurate.");
  }

  const meta = {
    parsingAccuracy: accuracy,
    // What the engine actually simulates with (detected or single-sample).
    monthlyExpenses: commitments.reduce((sum, c) => sum + c.amount, 0),
    commitmentsSource,
    parsedCount: parsed.filter((t) => t.parsedCategory !== "other").length,
    totalTransactions: parsed.length,
    accountsCount: accounts.length,
    warnings,
  };

  return { profile, meta };
}

module.exports = { buildLiveProfile };
