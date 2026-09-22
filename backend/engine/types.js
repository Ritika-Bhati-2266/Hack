/**
 * Previse — Core Data Types
 * Factory functions for financial data structures
 */

function createFinancialProfile({ name, balance, monthlyInflow, commitments = [], goals = [] }) {
  return { name, balance, monthlyInflow, commitments, goals };
}

function createCommitment({ name, amount, type = "fixed", dayOfMonth = 1, active = true }) {
  return { name, amount, type, dayOfMonth, active };
}

function createGoal({ name, targetAmount, currentAmount = 0, deadline = 12, priority = "medium" }) {
  return { name, targetAmount, currentAmount, deadline, priority };
}

function createPurchaseProposal({ name, amount, mode = "cash", emiMonths = 12, interestRate = 12 }) {
  return { name, amount, mode, emiMonths, interestRate };
}

function createSimulationResult({ proposal, before, after, verdict, reasoning, goalImpact = [] }) {
  return { proposal, before, after, verdict, reasoning, goalImpact };
}

module.exports = {
  createFinancialProfile,
  createCommitment,
  createGoal,
  createPurchaseProposal,
  createSimulationResult,
};
