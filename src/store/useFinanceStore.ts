import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserFinancialState, Goal, SimulationInput, SimulationResult, PaymentMode } from '@/types';

export type CustomerId = 'spender' | 'saver' | 'chaser';

interface FinanceStore {
  user: UserFinancialState;
  goals: Goal[];
  currentSimulation: SimulationResult | null;
  activeCustomer: CustomerId;
  switchCustomer: (id: CustomerId) => void;
  runSimulation: (input: SimulationInput) => SimulationResult;
  clearSimulation: () => void;
  acceptWaitRecommendation: () => void;
  confirmPurchaseAnyway: () => void;
}

const INITIAL_USER: UserFinancialState = {
  totalBalance: 140000,
  monthlyIncome: 80000,
  dailyBurnRate: 1500,
  earmarkedExpenses: [
    { id: '1', name: 'Apartment Rent', amount: 35000, category: 'rent', dueDate: '1st of month', autoDebit: true },
    { id: '2', name: 'Mutual Fund SIPs', amount: 15000, category: 'sip', dueDate: '5th of month', autoDebit: true },
    { id: '3', name: 'Electricity & Wifi', amount: 10000, category: 'bill', dueDate: '10th of month', autoDebit: true },
  ],
};

const INITIAL_GOALS: Goal[] = [
  {
    id: 'g1',
    name: 'Emergency Shield Fund',
    targetAmount: 300000,
    currentAmount: 180000,
    monthlyContribution: 15000,
    targetDate: '2026-12-31',
    category: 'emergency',
    delayInMonths: 0,
  },
  {
    id: 'g2',
    name: 'iPhone 16 Pro Max',
    targetAmount: 140000,
    currentAmount: 45000,
    monthlyContribution: 10000,
    targetDate: '2026-10-15',
    category: 'tech',
    delayInMonths: 0,
  },
  {
    id: 'g3',
    name: 'Bali Retreat Trip',
    targetAmount: 120000,
    currentAmount: 60000,
    monthlyContribution: 8000,
    targetDate: '2026-11-20',
    category: 'travel',
    delayInMonths: 0,
  },
];

export const CUSTOMERS: Record<CustomerId, { label: string; sub: string; user: UserFinancialState; goals: Goal[] }> = {
  spender: {
    label: 'Rahul Verma',
    sub: 'Spender • Food 32% ↑',
    user: {
      totalBalance: 240000,
      monthlyIncome: 85000,
      dailyBurnRate: 1500,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 35000, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: 15000, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: 10000, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: 210000, monthlyContribution: 15000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'iPhone 16 Pro Max', targetAmount: 80000, currentAmount: 35000, monthlyContribution: 8000, targetDate: '2026-10-15', category: 'tech', delayInMonths: 0 },
      { id: 'g3', name: 'Bali Retreat Trip', targetAmount: 120000, currentAmount: 60000, monthlyContribution: 6000, targetDate: '2026-11-20', category: 'travel', delayInMonths: 0 },
    ],
  },
  saver: {
    label: 'Priya Sharma',
    sub: 'Saver • SIP Regular',
    user: {
      totalBalance: 290000,
      monthlyIncome: 95000,
      dailyBurnRate: 1266,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 28000, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: 30000, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: 8800, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: 245000, monthlyContribution: 15000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'Europe Trip', targetAmount: 250000, currentAmount: 180000, monthlyContribution: 12000, targetDate: '2026-10-15', category: 'travel', delayInMonths: 0 },
      { id: 'g3', name: 'iPhone 16 Pro Max', targetAmount: 80000, currentAmount: 65000, monthlyContribution: 5000, targetDate: '2026-11-20', category: 'tech', delayInMonths: 0 },
    ],
  },
  chaser: {
    label: 'Aman Singh',
    sub: 'Chaser • Tight Buffer',
    user: {
      totalBalance: 98000,
      monthlyIncome: 65000,
      dailyBurnRate: 1166,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 22000, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: 10000, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: 12000, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 200000, currentAmount: 98000, monthlyContribution: 10000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'Bike Downpayment', targetAmount: 60000, currentAmount: 48000, monthlyContribution: 8000, targetDate: '2026-10-15', category: 'asset', delayInMonths: 0 },
      { id: 'g3', name: 'Bali Retreat Trip', targetAmount: 120000, currentAmount: 30000, monthlyContribution: 5000, targetDate: '2026-11-20', category: 'travel', delayInMonths: 0 },
    ],
  },
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
  user: INITIAL_USER,
  goals: INITIAL_GOALS,
  currentSimulation: null,
  activeCustomer: 'spender',
  switchCustomer: (id) => {
    const c = CUSTOMERS[id];
    set({ activeCustomer: id, user: c.user, goals: c.goals, currentSimulation: null });
  },

  runSimulation: (input: SimulationInput): SimulationResult => {
    const { user, goals } = get();
    const totalEarmarked = user.earmarkedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const todayBuffer = user.totalBalance - totalEarmarked;
    const monthlyBurn = user.dailyBurnRate * 30;
    const todayRunway = Number((todayBuffer / monthlyBurn).toFixed(1));
    
    // Dynamic days remaining in month (not hardcoded 15)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
    const remainingDailyBurn = daysRemaining * user.dailyBurnRate;
    const todaySafeSpendToday = Math.max(0, todayBuffer - remainingDailyBurn);

    // Calculate Payment Mode details
    let emiMonths = 0;
    let monthlyEMI = 0;
    let downPayment = 0;

    if (input.mode === 'CASH') {
      downPayment = input.price;
    } else if (input.mode === 'EMI_3') {
      emiMonths = 3;
      monthlyEMI = Math.round((input.price * 1.07) / 3); // ~14% annual interest prorated
    } else if (input.mode === 'EMI_6') {
      emiMonths = 6;
      monthlyEMI = Math.round((input.price * 1.10) / 6);
    } else if (input.mode === 'EMI_12') {
      emiMonths = 12;
      monthlyEMI = Math.round((input.price * 1.14) / 12);
    }

    // Simulated Metrics
    const simulatedBalance = Math.max(0, user.totalBalance - downPayment);
    const simulatedBuffer = Math.max(0, simulatedBalance - totalEarmarked - (monthlyEMI * (emiMonths > 0 ? 1 : 0)));
    const simulatedRunwayMonths = Number((simulatedBuffer / monthlyBurn).toFixed(1));
    const simulatedSafeSpendToday = Math.max(0, simulatedBuffer - remainingDailyBurn);

    // Goal delay estimation — customer-aware, no negative denominator
    const impactAmount = input.mode === 'CASH' ? input.price : monthlyEMI * emiMonths;
    const rawNetSavings = user.monthlyIncome - totalEarmarked - monthlyBurn;
    const effectiveMonthlySavings = rawNetSavings > 0 ? rawNetSavings : Math.max(5000, Math.round(user.monthlyIncome * 0.08 + goals.reduce((a, g) => a + g.monthlyContribution, 0) * 0.2));
    const goalDelayMonths = Number((impactAmount / effectiveMonthlySavings).toFixed(1));

    // Decision Logic Engine — dynamic values, no hardcoded ₹35k/₹15k/₹80k
    const rentAmt = user.earmarkedExpenses.find(e => e.category === 'rent')?.amount ?? 0;
    const sipAmt = user.earmarkedExpenses.find(e => e.category === 'sip')?.amount ?? 0;
    let verdict: 'WAIT' | 'EMI' | 'BUY' = 'BUY';
    let verdictTitle = 'Safe to Buy Now';
    let verdictBadge = 'GREEN LIGHT';
    let verdictReasoning = `Your buffer remains healthy at ₹${simulatedBuffer.toLocaleString('en-IN')} with ${simulatedRunwayMonths} months of runway available.`;
    let recommendation = 'You can complete this purchase directly via UPI or debit card without disturbing your earmarked savings.';

    if (simulatedRunwayMonths < 2.0) {
      verdict = 'WAIT';
      verdictTitle = 'Wait 6 Weeks — Keep Buffer Safe';
      verdictBadge = 'HIGH RISK';
      verdictReasoning = `Immediate cash purchase drops your safe runway to ${simulatedRunwayMonths} months (< 2.0 months emergency threshold). This exposes you to risk if rent (₹${rentAmt.toLocaleString('en-IN')}) or SIPs (₹${sipAmt.toLocaleString('en-IN')}) are due.`;
      recommendation = `Pause purchase for 6 weeks until next salary cycle of ₹${user.monthlyIncome.toLocaleString('en-IN')} adds back ₹${effectiveMonthlySavings.toLocaleString('en-IN')}+ to your liquid buffer.`;
    } else if (simulatedRunwayMonths >= 2.0 && simulatedRunwayMonths <= 3.0) {
      verdict = 'EMI';
      verdictTitle = 'EMI Recommended (3 to 6 Months)';
      verdictBadge = 'MODERATE RISK';
      verdictReasoning = `Full cash purchase reduces buffer significantly. Spreading payment over 6 months at ₹${Math.round(input.price/6).toLocaleString('en-IN')}/mo keeps your upfront buffer protected above ₹${Math.round(todayBuffer * 0.6).toLocaleString('en-IN')}.`;
      recommendation = `Choose No-Cost EMI (6 Months) to preserve runway liquidity while acquiring the item.`;
    }

    // 36-Month Trajectory data generation — customer-aware growth
    const trajectory = [];
    let baselineAccumulated = user.totalBalance;
    let simulatedAccumulated = simulatedBalance;
    // Use effectiveMonthlySavings derived above — personalised per customer profile, never negative
    const monthlyGrowth = effectiveMonthlySavings;

    for (let month = 0; month <= 36; month += 3) {
      baselineAccumulated += monthlyGrowth * 3;
      simulatedAccumulated += monthlyGrowth * 3 - (month <= emiMonths ? monthlyEMI * 3 : 0);
      trajectory.push({
        month: month === 0 ? 'Now' : `M${month}`,
        baselineSavings: Math.round(baselineAccumulated),
        simulatedSavings: Math.max(0, Math.round(simulatedAccumulated)),
        earmarkedThreshold: totalEarmarked,
      });
    }

    // Per-goal delay — each goal's contribution vs impact
    const perGoalDelays = goals.map(g => ({
      goalId: g.id,
      goalName: g.name,
      delayMonths: Number((impactAmount / Math.max(2000, g.monthlyContribution * 2.5)).toFixed(1)),
    }));

    const result: SimulationResult = {
      itemName: input.itemName || 'Custom Item',
      purchasePrice: input.price,
      mode: input.mode,
      downPayment,
      monthlyEMI,
      emiMonths,
      todayBalance: user.totalBalance,
      todayEarmarked: totalEarmarked,
      todayBuffer,
      todayRunwayMonths: todayRunway,
      todaySafeSpendToday,
      simulatedBalance,
      simulatedBuffer,
      simulatedRunwayMonths,
      simulatedSafeSpendToday,
      goalDelayMonths,
      perGoalDelays,
      verdict,
      verdictTitle,
      verdictBadge,
      verdictReasoning,
      recommendation,
      trajectory,
    };

    set({ currentSimulation: result });
    return result;
  },

  clearSimulation: () => set({ currentSimulation: null }),

  acceptWaitRecommendation: () => {
    set({ currentSimulation: null });
  },

  confirmPurchaseAnyway: () => {
    const { currentSimulation, user } = get();
    if (!currentSimulation) return;
    set({
      user: {
        ...user,
        totalBalance: currentSimulation.simulatedBalance,
      },
      currentSimulation: null,
    });
  },
}),
    {
      name: 'previse-customer',
      partialize: (state) => ({ activeCustomer: state.activeCustomer }),
      onRehydrateStorage: () => (state) => {
        if (state && state.activeCustomer && CUSTOMERS[state.activeCustomer]) {
          const c = CUSTOMERS[state.activeCustomer];
          state.user = c.user;
          state.goals = c.goals;
        }
      },
    }
  )
);
