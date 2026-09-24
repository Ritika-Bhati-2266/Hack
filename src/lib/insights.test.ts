import { describe, expect, it } from 'vitest';
import { backendProfileToStore } from './api';
import type { BackendProfile } from './api';
import { goalCountdown, nearestBill, surplusSplit, topSpendCategory, visibleTransactions } from './insights';
import type { Goal, UserFinancialState } from '@/types';

// Profile A — heavy traveler with surplus + goals
const traveler: UserFinancialState = {
  totalBalance: 200000,
  monthlyIncome: 120000,
  dailyBurnRate: 1500,
  earmarkedExpenses: [
    { id: '1', name: 'Apartment Rent', amount: 30000, category: 'rent', dueDate: '1st of month', autoDebit: true },
    { id: '2', name: 'Mutual Fund SIPs', amount: 20000, category: 'sip', dueDate: '5th of month', autoDebit: true },
  ],
};
const travelerTxns = [
  { amount: -25000, parsedCategory: 'travel' },
  { amount: -15000, parsedCategory: 'travel' },
  { amount: -8000, parsedCategory: 'food' },
  { amount: 120000, parsedCategory: 'salary' },
];
const travelerGoals: Goal[] = [
  { id: 'g1', name: 'Bali Trip', targetAmount: 100000, currentAmount: 35000, monthlyContribution: 8000, targetDate: '2027-06-01', category: 'travel', delayInMonths: 0 },
];

// Profile B — tight budget, bill due soon, no goals
const tight: UserFinancialState = {
  totalBalance: 30000,
  monthlyIncome: 50000,
  dailyBurnRate: 1200,
  earmarkedExpenses: [
    { id: '1', name: 'Apartment Rent', amount: 18000, category: 'rent', dueDate: '1st of month', autoDebit: true },
  ],
};

// Profile C — empty (guest): everything must be null/[]
const empty: UserFinancialState = { totalBalance: 0, monthlyIncome: 0, dailyBurnRate: 0, earmarkedExpenses: [] };

describe('insights personalization — same rules, different profiles, different advice', () => {
  it('top category: traveler → travel 83%, tight/empty → null (no txns)', () => {
    const t = topSpendCategory(travelerTxns);
    expect(t?.category).toBe('travel');
    expect(t?.sharePct).toBe(83); // 40000/48000
    expect(topSpendCategory([])).toBeNull();
  });

  it('surplus: traveler → save suggestion, tight → tight flag, empty → null', () => {
    const s = surplusSplit(traveler);
    // 120000 − 50000 − 45000 = 25000 surplus → 15000 save / 10000 flexible
    expect(s).toEqual({ surplus: 25000, saveSuggested: 15000, keepFlexible: 10000, tight: false });
    const st = surplusSplit(tight);
    // 50000 − 18000 − 36000 = −4000 → tight
    expect(st?.tight).toBe(true);
    expect(surplusSplit(empty)).toBeNull();
  });

  it('nearest bill: picks soonest due date per profile', () => {
    const now = new Date(2026, 8, 3); // Sep 3
    const b = nearestBill(traveler.earmarkedExpenses, now);
    expect(b?.name).toBe('Mutual Fund SIPs'); // Sep 5 < Oct 1
    expect(b?.daysLeft).toBe(2);
    expect(nearestBill([], now)).toBeNull();
  });

  it('goals: traveler countdown vs empty → []', () => {
    const g = goalCountdown(travelerGoals, 25000, new Date(2026, 8, 3));
    expect(g).toHaveLength(1);
    expect(g[0].monthsToGoal).toBe(9); // ceil(65000/8000)
    expect(g[0].onTrack).toBe(true);
    expect(goalCountdown([], 0)).toEqual([]);
  });
});

const profileA: BackendProfile = {
  name: 'Spender', balance: 200000, monthlyInflow: 120000,
  commitments: [
    { name: 'INDIGO AIRLINES', amount: 25000, type: 'recurring', dayOfMonth: 2, active: true },
    { name: 'UPI-HDFC-RENT', amount: 30000, type: 'recurring', dayOfMonth: 1, active: true },
  ],
  goals: [],
};
const profileB: BackendProfile = {
  name: 'Saver', balance: 500000, monthlyInflow: 150000,
  commitments: [
    { name: 'UPI-HDFC-RENT', amount: 20000, type: 'recurring', dayOfMonth: 1, active: true },
    { name: 'SIP-HDFC MIDCAP FUND', amount: 40000, type: 'recurring', dayOfMonth: 5, active: true },
  ],
  goals: [],
};

describe('no-merge / no-stale-leak — Sample A → Sample B replaces, never accumulates', () => {
  it('visibleTransactions: live sees txns, custom/empty see []', () => {
    const txns = [{ amount: -100, parsedCategory: 'flight' }];
    expect(visibleTransactions('live', txns)).toEqual(txns);
    expect(visibleTransactions('custom_1', txns)).toEqual([]);
    expect(visibleTransactions('empty', txns)).toEqual([]);
    expect(visibleTransactions('live', undefined)).toEqual([]);
  });

  it('adapter outputs are independent: B has only B data after A', () => {
    const r1 = backendProfileToStore(profileA);
    const r2 = backendProfileToStore(profileB);
    expect(r1.user.earmarkedExpenses.map((e) => e.name)).toEqual(['INDIGO AIRLINES', 'UPI-HDFC-RENT']);
    expect(r2.user.earmarkedExpenses.map((e) => e.name)).toEqual(['UPI-HDFC-RENT', 'SIP-HDFC MIDCAP FUND']);
    expect(r2.user.totalBalance).toBe(500000);
    // Mutating A must not touch B (no shared refs → no merge possible).
    r1.user.earmarkedExpenses.push({ id: 'x', name: 'MUTANT', amount: 1, category: 'bill', dueDate: '1st of month', autoDebit: true });
    expect(r2.user.earmarkedExpenses).toHaveLength(2);
  });
});
