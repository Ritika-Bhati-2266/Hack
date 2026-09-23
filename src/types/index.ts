export interface EarmarkedExpense {
  id: string;
  name: string;
  amount: number;
  category: 'rent' | 'sip' | 'bill' | 'emi';
  dueDate: string;
  autoDebit: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  category: 'emergency' | 'tech' | 'travel' | 'asset';
  delayInMonths?: number;
}

export interface UserFinancialState {
  totalBalance: number;
  monthlyIncome: number;
  dailyBurnRate: number;
  earmarkedExpenses: EarmarkedExpense[];
}

export type PaymentMode = 'CASH' | 'EMI_3' | 'EMI_6' | 'EMI_12';

export interface SimulationInput {
  itemName: string;
  price: number;
  mode: PaymentMode;
}

export interface SimulationResult {
  itemName: string;
  purchasePrice: number;
  mode: PaymentMode;
  downPayment: number;
  monthlyEMI: number;
  emiMonths: number;
  
  // Today's metrics
  todayBalance: number;
  todayEarmarked: number;
  todayBuffer: number;
  todayRunwayMonths: number;
  todaySafeSpendToday: number;

  // Simulated metrics
  simulatedBalance: number;
  simulatedBuffer: number;
  simulatedRunwayMonths: number;
  simulatedSafeSpendToday: number;
  goalDelayMonths: number;

  // Decision Verdict
  verdict: 'WAIT' | 'EMI' | 'BUY';
  verdictTitle: string;
  verdictBadge: string;
  verdictReasoning: string;
  recommendation: string;

  // Per-goal delay (Phase 2: real delay per goal, not global only)
  perGoalDelays?: Array<{ goalId: string; goalName: string; delayMonths: number }>;

  // 36 month trajectory array
  trajectory: Array<{
    month: string;
    baselineSavings: number;
    simulatedSavings: number;
    earmarkedThreshold: number;
  }>;
}
