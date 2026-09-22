/**
 * Previse — Financial Rules Engine
 * Core calculations: buffer, runway, safe-to-spend, goals
 */

const { applyFirewall } = require("./firewall");

function calculateMonthlyExpenses(commitments) {
  return commitments.filter((c) => c.active).reduce((sum, c) => sum + c.amount, 0);
}

function calculateBuffer(balance, commitments, dayOfMonth) {
  const { usableBalance } = applyFirewall(balance, commitments, dayOfMonth);
  return usableBalance;
}

function calculateRunway(usableBalance, monthlyExpenses) {
  if (monthlyExpenses <= 0) return { months: Infinity, days: Infinity, status: "safe", display: "∞ months" };
  const months = usableBalance / monthlyExpenses;
  const days = Math.floor(months * 30);
  let status = "safe";
  if (months < 1) status = "critical";
  else if (months < 2) status = "warning";
  else if (months < 3) status = "caution";

  return { months: Math.round(months * 10) / 10, days, status, display: `${Math.round(months * 10) / 10} months` };
}

function calculateSafeToSpend(usableBalance, monthlyExpenses, dayOfMonth) {
  const daysInMonth = 30;
  const daysRemaining = daysInMonth - dayOfMonth + 1;
  const emergencyReserve = monthlyExpenses;
  const available = Math.max(0, usableBalance - emergencyReserve);
  const daily = daysRemaining > 0 ? Math.floor(available / daysRemaining) : 0;
  const oneTime = Math.floor(available * 0.5);

  let status = "safe";
  if (daily <= 0) status = "critical";
  else if (daily < 500) status = "warning";
  else if (daily < 1000) status = "caution";

  return { daily, oneTime, status };
}

function calculateGoals(goals, monthlySavings) {
  return goals.map((g) => {
    const remaining = g.targetAmount - g.currentAmount;
    const monthsToGoal = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;
    const progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
    const onTrack = monthsToGoal <= g.deadline;

    return {
      ...g,
      remaining,
      monthsToGoal,
      progress,
      onTrack,
    };
  });
}

function calculateFinancialState(profile, dayOfMonth = new Date().getDate()) {
  const monthlyExpenses = calculateMonthlyExpenses(profile.commitments);
  const usableBalance = calculateBuffer(profile.balance, profile.commitments, dayOfMonth);
  const runway = calculateRunway(usableBalance, monthlyExpenses);
  const safeToSpend = calculateSafeToSpend(usableBalance, monthlyExpenses, dayOfMonth);
  const monthlySavings = profile.monthlyInflow - monthlyExpenses;
  const goals = calculateGoals(profile.goals || [], monthlySavings);
  const firewall = applyFirewall(profile.balance, profile.commitments, dayOfMonth);

  return {
    monthlyExpenses,
    buffer: { total: usableBalance },
    runway,
    safeToSpend,
    monthlySavings,
    goals,
    firewall,
  };
}

module.exports = {
  calculateMonthlyExpenses,
  calculateBuffer,
  calculateRunway,
  calculateSafeToSpend,
  calculateGoals,
  calculateFinancialState,
};
