/**
 * Previse — Live Profile Builder
 * Bridges AA/CSV data to the Phase 1 engine
 */

const { parseTransactions, detectMonthlyInflow, detectCommitments } = require("./parser");
const { mockProfile } = require("../data/mock");

function buildLiveProfile({ accounts, transactions }) {
  const { transactions: parsed, accuracy, warnings } = parseTransactions(transactions);

  const balance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const monthlyInflow = detectMonthlyInflow(parsed);
  const commitments = detectCommitments(parsed);

  const profile = {
    name: mockProfile.name,
    balance: balance || mockProfile.balance,
    monthlyInflow: monthlyInflow || mockProfile.monthlyInflow,
    commitments: commitments.length > 0 ? commitments : mockProfile.commitments,
    goals: mockProfile.goals,
  };

  const meta = {
    parsingAccuracy: accuracy,
    monthlyExpenses: commitments.reduce((sum, c) => sum + c.amount, 0),
    parsedCount: parsed.filter((t) => t.parsedCategory !== "other").length,
    totalTransactions: parsed.length,
    accountsCount: accounts.length,
    warnings,
  };

  return { profile, meta };
}

module.exports = { buildLiveProfile };
