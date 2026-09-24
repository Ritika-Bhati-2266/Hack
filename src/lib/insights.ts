/**
 * Previse — Insights rules (deterministic, real-data only).
 *
 * Every rule returns null when its input data is missing — the panel
 * skips that line instead of inventing numbers. No LLM, no fake baselines
 * (no month-over-month: a single statement has no previous month).
 */
import type { EarmarkedExpense, Goal, UserFinancialState } from '@/types';

export interface TxnLike {
  amount: number;
  parsedCategory?: string;
}

/**
 * Transactions belong to the live session — a custom profile must never
 * render another session's statement (stale-leak class of bug).
 */
export function visibleTransactions(
  activeCustomer: string,
  liveTransactions: TxnLike[] | undefined
): TxnLike[] {
  return activeCustomer === 'live' ? liveTransactions || [] : [];
}

// ─── 1. Top spend category share (debits only) ─────────────────────────
export interface CategoryInsight {
  category: string;
  amount: number;
  sharePct: number;
}

export function topSpendCategory(txns: TxnLike[]): CategoryInsight | null {
  const byCat: Record<string, number> = {};
  let outflow = 0;
  for (const t of txns) {
    if (t.amount >= 0) continue;
    const abs = Math.abs(t.amount);
    outflow += abs;
    const c = (t.parsedCategory || 'other').toLowerCase();
    byCat[c] = (byCat[c] || 0) + abs;
  }
  if (outflow <= 0) return null;
  const [category, amount] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  return { category, amount, sharePct: Math.round((amount / outflow) * 100) };
}

// ─── 2. Monthly surplus split ──────────────────────────────────────────
export interface SurplusInsight {
  surplus: number;
  saveSuggested: number;
  keepFlexible: number;
  tight: boolean;
}

export function surplusSplit(user: UserFinancialState): SurplusInsight | null {
  if (user.monthlyIncome <= 0) return null;
  const locked = user.earmarkedExpenses.reduce((s, e) => s + e.amount, 0);
  const surplus = Math.round(user.monthlyIncome - locked - user.dailyBurnRate * 30);
  if (surplus > 0) {
    const saveSuggested = Math.round(surplus * 0.6);
    return { surplus, saveSuggested, keepFlexible: surplus - saveSuggested, tight: false };
  }
  return { surplus, saveSuggested: 0, keepFlexible: 0, tight: true };
}

// ─── 3. Nearest upcoming bill (dueDate: "Nst/nd/rd/th of month") ───────
export interface BillInsight {
  name: string;
  amount: number;
  daysLeft: number;
}

export function nearestBill(
  expenses: EarmarkedExpense[],
  now: Date = new Date()
): BillInsight | null {
  let best: BillInsight | null = null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const e of expenses) {
    const day = parseInt(e.dueDate, 10);
    if (!day || day < 1 || day > 31) continue;
    // Clamp to month length (e.g. 31st → Feb 28th).
    const daysInThis = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let cand = new Date(today.getFullYear(), today.getMonth(), Math.min(day, daysInThis));
    if (cand < today) {
      const daysInNext = new Date(cand.getFullYear(), cand.getMonth() + 2, 0).getDate();
      cand = new Date(cand.getFullYear(), cand.getMonth() + 1, Math.min(day, daysInNext));
    }
    const daysLeft = Math.round((cand.getTime() - today.getTime()) / 86400000);
    if (!best || daysLeft < best.daysLeft) {
      best = { name: e.name, amount: e.amount, daysLeft };
    }
  }
  return best;
}

// ─── 4. Goal countdown ─────────────────────────────────────────────────
export interface GoalInsight {
  name: string;
  monthly: number;
  monthsToGoal: number;
  monthsUntilDeadline: number;
  onTrack: boolean;
  stalled: boolean;
}

export function goalCountdown(
  goals: Goal[],
  monthlySavings: number,
  now: Date = new Date(),
  limit = 2
): GoalInsight[] {
  const out: GoalInsight[] = [];
  for (const g of goals) {
    const remaining = g.targetAmount - g.currentAmount;
    if (remaining <= 0) continue;
    const deadline = new Date(g.targetDate + 'T00:00:00');
    const monthsUntilDeadline = Number.isNaN(deadline.getTime())
      ? 0
      : Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 2592000000));
    if (g.monthlyContribution > 0) {
      const monthsToGoal = Math.ceil(remaining / g.monthlyContribution);
      out.push({
        name: g.name,
        monthly: g.monthlyContribution,
        monthsToGoal,
        monthsUntilDeadline,
        onTrack: monthlySavings > 0 && monthsToGoal <= monthsUntilDeadline,
        stalled: false,
      });
    } else {
      out.push({
        name: g.name,
        monthly: 0,
        monthsToGoal: 0,
        monthsUntilDeadline,
        onTrack: false,
        stalled: true,
      });
    }
    if (out.length >= limit) break;
  }
  return out;
}
