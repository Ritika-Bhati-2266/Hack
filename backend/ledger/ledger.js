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
  // So a fallback is required — but it must NEVER silently substitute demo
  // data when the user gave us real expenses. Three tiers:
  //   1. "detected" — repeating narrations found (normal case).
  //   2. "single-sample" — thin file, no repeats, but REAL debits exist:
  //      aggregate actual debits by category as the monthly estimate.
  //   3. "demo-fallback" — zero debits at all (credits-only file): only
  //      here is demo data used, with an explicit warning.
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
    commitments = mockProfile.commitments;
    commitmentsSource = "demo-fallback";
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
    commitmentsSource,
    parsedCount: parsed.filter((t) => t.parsedCategory !== "other").length,
    totalTransactions: parsed.length,
    accountsCount: accounts.length,
    warnings,
  };

  return { profile, meta };
}

module.exports = { buildLiveProfile };
