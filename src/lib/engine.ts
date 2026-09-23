/**
 * Previse — shared simulation engine (frontend copy of backend/engine/*.js)
 * 1:1 parity with backend/engine/rules.js + simulator.js.
 * Any change here must mirror the backend or "Verify → MATCH" breaks.
 */
import type { UserFinancialState, Goal, SimulationInput, SimulationResult } from '../types';

// Backend shapes: commitments {name, amount, type, dayOfMonth, active}, goals {name, targetAmount, currentAmount, deadline}
const COMMIT_DAY: Record<string, number> = { rent: 1, sip: 5, bill: 10, emi: 1 };

export function backendEMI(principal: number, months: number, annualRate: number): number {
  if (annualRate === 0) return Math.ceil(principal / months);
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.ceil(emi);
}

interface BCommit { name: string; amount: number; dayOfMonth: number; active: boolean }
interface BGoal { name: string; targetAmount: number; currentAmount: number; deadline: number }

export function toBCommitments(user: UserFinancialState): BCommit[] {
  return user.earmarkedExpenses.map((e) => ({
    name: e.name, amount: e.amount, dayOfMonth: COMMIT_DAY[e.category] ?? 1, active: true,
  }));
}
// Same goal mapping as lib/api.ts toBackendProfile: deadline 12 for all
export function toBGoals(goals: Goal[]): BGoal[] {
  return goals.map((g) => ({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: 12 }));
}
function bMonthlyExpenses(cs: BCommit[]): number {
  return cs.filter((c) => c.active).reduce((s, c) => s + c.amount, 0);
}
function bFirewall(balance: number, cs: BCommit[], day: number): number {
  const firewalled = cs.filter((c) => c.active && c.dayOfMonth <= day).reduce((s, c) => s + c.amount, 0);
  return Math.max(0, balance - firewalled);
}
function bRunway(usable: number, monthlyExp: number): number {
  if (monthlyExp <= 0) return Infinity;
  return Math.round((usable / monthlyExp) * 10) / 10;
}
function bSafeDaily(usable: number, monthlyExp: number, day: number): number {
  const daysRemaining = 30 - day + 1;
  const available = Math.max(0, usable - monthlyExp);
  return daysRemaining > 0 ? Math.floor(available / daysRemaining) : 0;
}

/** Firewall-aware liquid buffer — single helper so Navbar/Firewall/Dashboard agree. */
export function usableBalance(user: UserFinancialState, dayOverride?: number): number {
  const day = dayOverride ?? new Date().getDate();
  return bFirewall(user.totalBalance, toBCommitments(user), day);
}
function bMonthsToGoal(g: BGoal, monthlySavings: number): number {
  const remaining = g.targetAmount - g.currentAmount;
  return monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;
}
// Mirror of backend generateVerdict — same order, same thresholds (backend/engine/simulator.js)
function bVerdict(afterRunway: number, emiDetails: { monthlyEMI: number; tenure: number; totalInterest: number } | null,
  beforeUsable: number, beforeRunway: number, beforeGoals: BGoal[], afterGoals: BGoal[],
  beforeSavings: number, afterSavings: number,
  afterDisplay: string): { action: 'wait' | 'emi' | 'buy'; severity: string; message: string; detail: string; weeksToWait: number } {
  if (afterRunway < 1) {
    return { action: 'wait', severity: 'critical', message: 'This would leave you broke within weeks.',
      detail: `Your runway drops to ${afterDisplay}. You need at least 1 month of expenses as buffer.`,
      weeksToWait: Math.ceil((1 - afterRunway) * 4) };
  }
  if (afterRunway < 2) {
    return { action: 'wait', severity: 'warning', message: 'This is risky — less than 2 months of runway.',
      detail: `Your runway drops to ${afterDisplay}. Wait until you have at least 2 months buffer.`,
      weeksToWait: Math.ceil((2 - afterRunway) * 4) };
  }
  if (emiDetails) {
    // Exact backend replica (simulator.js): income derived as usable/runway
    const monthlyIncome = beforeRunway > 0 ? beforeUsable / beforeRunway : 0;
    if (monthlyIncome > 0 && emiDetails.monthlyEMI / monthlyIncome > 0.3) {
      return { action: 'wait', severity: 'warning', message: 'EMI is too high relative to your income.',
        detail: `EMI exceeds 30% of your monthly income.`, weeksToWait: 0 };
    }
    return { action: 'emi', severity: 'safe', message: 'EMI is affordable within your budget.',
      detail: `EMI for ${emiDetails.tenure} months. Total interest: ${emiDetails.totalInterest}.`, weeksToWait: 0 };
  }
  const goalDelayed = beforeGoals.some((g, i) => {
    const b = bMonthsToGoal(g, beforeSavings), a = bMonthsToGoal(afterGoals[i], afterSavings);
    return isFinite(b) && isFinite(a) && a - b >= 2;
  });
  if (goalDelayed) {
    return { action: 'wait', severity: 'caution', message: 'This delays your financial goals significantly.',
      detail: 'One or more goals are delayed by 2+ months. Consider waiting or reducing the amount.', weeksToWait: 0 };
  }
  if (afterRunway >= 3) {
    return { action: 'buy', severity: 'safe', message: 'Safe to buy — your finances can handle this.',
      detail: `Runway stays at ${afterDisplay} after purchase. Buffer remains healthy.`, weeksToWait: 0 };
  }
  return { action: 'buy', severity: 'caution', message: 'You can buy this, but be cautious.',
    detail: `Runway drops to ${afterDisplay}. Consider building more buffer first.`, weeksToWait: 0 };
}

/** Pure backend-parity simulation — no store writes. Used by runSimulation + dashboard hero preview. */
export function previewSimulation(user: UserFinancialState, goals: Goal[], input: SimulationInput, dayOverride?: number): SimulationResult {
  const day = dayOverride ?? new Date().getDate();
  const commitments = toBCommitments(user);
  const bGoals = toBGoals(goals);
  const monthlyExp = bMonthlyExpenses(commitments);
  const beforeUsable = bFirewall(user.totalBalance, commitments, day);
  const beforeRunway = bRunway(beforeUsable, monthlyExp);
  const beforeSafe = bSafeDaily(beforeUsable, monthlyExp, day);
  const beforeSavings = user.monthlyIncome - monthlyExp;

  const emiN = input.mode === 'CASH' ? 0 : input.mode === 'EMI_3' ? 3 : input.mode === 'EMI_6' ? 6 : input.mode === 'LOAN' ? Math.min(360, Math.max(1, Math.round(input.loanMonths ?? 24))) : 12;
  const rate = input.interestRate ?? 12;
  let simBalance = user.totalBalance;
  let simCommitments = commitments;
  let monthlyEMI = 0, emiDetails: { monthlyEMI: number; tenure: number; totalInterest: number } | null = null;
  let downPayment = 0;
  if (input.mode === 'CASH') {
    downPayment = input.price;
    simBalance = user.totalBalance - input.price;
  } else if (input.mode === 'LOAN') {
    // Backend parity (simulator.js loan branch): loan credits the balance,
    // then the EMI becomes a recurring commitment.
    monthlyEMI = backendEMI(input.price, emiN, rate);
    emiDetails = { monthlyEMI, tenure: emiN, totalInterest: monthlyEMI * emiN - input.price };
    simBalance = user.totalBalance + input.price;
    simCommitments = [...commitments, { name: `Loan EMI: ${input.itemName || 'Custom Item'}`, amount: monthlyEMI, dayOfMonth: 1, active: true }];
  } else {
    monthlyEMI = backendEMI(input.price, emiN, rate);
    emiDetails = { monthlyEMI, tenure: emiN, totalInterest: monthlyEMI * emiN - input.price };
    simCommitments = [...commitments, { name: `EMI: ${input.itemName || 'Custom Item'}`, amount: monthlyEMI, dayOfMonth: 1, active: true }];
  }

  const afterMonthlyExp = bMonthlyExpenses(simCommitments);
  const afterUsable = bFirewall(Math.max(0, simBalance), simCommitments, day);
  const afterRunway = bRunway(afterUsable, afterMonthlyExp);
  const afterSafe = bSafeDaily(afterUsable, afterMonthlyExp, day);
  const afterSavings = user.monthlyIncome - afterMonthlyExp;
  const afterDisplay = `${afterRunway} months`;

  const v = bVerdict(afterRunway, emiDetails, beforeUsable, beforeRunway, bGoals, bGoals, beforeSavings, afterSavings, afterDisplay);
  const verdict: 'WAIT' | 'EMI' | 'BUY' = v.action === 'wait' ? 'WAIT' : v.action === 'emi' ? 'EMI' : 'BUY';
  const verdictTitle =
    v.action === 'wait' && v.severity === 'critical' ? 'Wait — Keep Buffer Safe' :
    v.action === 'wait' && v.severity === 'warning' ? 'Wait — Risky Right Now' :
    v.action === 'wait' ? 'Wait — Goals at Risk' :
    v.action === 'emi' && input.mode === 'LOAN' ? 'Loan Affordable' :
    v.action === 'emi' ? 'EMI Recommended' :
    v.severity === 'safe' ? 'Safe to Buy Now' : 'Buy With Caution';
  const verdictBadge =
    v.severity === 'critical' || v.severity === 'warning' ? 'HIGH RISK' :
    v.action === 'emi' ? 'EMI OK' : v.severity === 'safe' ? 'GREEN LIGHT' : 'MODERATE RISK';
  const recommendation = v.weeksToWait > 0
    ? `${v.message} Wait ~${v.weeksToWait} week(s) for the buffer to rebuild.`
    : v.message;

  const goalDelays = goals.map((g, i) => {
    const b = bMonthsToGoal(bGoals[i], beforeSavings), a = bMonthsToGoal(bGoals[i], afterSavings);
    const d = isFinite(b) && isFinite(a) ? Math.max(0, a - b) : 0;
    return { goalId: g.id, goalName: g.name, delayMonths: d };
  });
  const goalDelayMonths = goalDelays.reduce((m, d) => Math.max(m, d.delayMonths), 0);

  // 36-month trajectory (display only, not part of MATCH)
  const trajectory = [];
  let baselineAccumulated = user.totalBalance;
  let simulatedAccumulated = Math.max(0, simBalance);
  const monthlyGrowth = beforeSavings > 0 ? beforeSavings : 0;
  for (let month = 0; month <= 36; month += 3) {
    baselineAccumulated += monthlyGrowth * 3;
    simulatedAccumulated += monthlyGrowth * 3 - (month <= emiN ? monthlyEMI * 3 : 0);
    trajectory.push({
      month: month === 0 ? 'Now' : `M${month}`,
      baselineSavings: Math.round(baselineAccumulated),
      simulatedSavings: Math.max(0, Math.round(simulatedAccumulated)),
      earmarkedThreshold: monthlyExp,
    });
  }

  return {
    itemName: input.itemName || 'Custom Item',
    purchasePrice: input.price,
    mode: input.mode,
    downPayment,
    monthlyEMI,
    emiMonths: emiN,
    todayBalance: user.totalBalance,
    todayEarmarked: monthlyExp,
    todayBuffer: beforeUsable,
    todayRunwayMonths: beforeRunway,
    todaySafeSpendToday: beforeSafe,
    simulatedBalance: Math.max(0, simBalance),
    simulatedBuffer: afterUsable,
    simulatedRunwayMonths: afterRunway,
    simulatedSafeSpendToday: afterSafe,
    goalDelayMonths,
    perGoalDelays: goalDelays,
    verdict,
    verdictTitle,
    verdictBadge,
    verdictReasoning: v.detail,
    recommendation,
    trajectory,
  };
}
