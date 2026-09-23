/**
 * Engine parity — frontend src/lib/engine.ts must mirror backend/engine/*.js.
 * These cases replicate backend qa-gate.js verdict rules (rules-v1).
 */
import { describe, it, expect } from 'vitest';
import { previewSimulation, backendEMI, usableBalance } from './engine';
import type { UserFinancialState, Goal } from '../types';

const user: UserFinancialState = {
  totalBalance: 240000,
  monthlyIncome: 85000,
  dailyBurnRate: 1500,
  earmarkedExpenses: [
    { id: '1', name: 'Apartment Rent', amount: 35000, category: 'rent', dueDate: '1st of month', autoDebit: true },
    { id: '2', name: 'Mutual Fund SIPs', amount: 15000, category: 'sip', dueDate: '5th of month', autoDebit: true },
    { id: '3', name: 'Electricity & Wifi', amount: 10000, category: 'bill', dueDate: '10th of month', autoDebit: true },
  ],
};

const goals: Goal[] = [
  { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: 210000, monthlyContribution: 15000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
];

describe('backendEMI (reducing balance)', () => {
  it('matches known EMI math: 80000 @12% x12', () => {
    // r=0.01: 80000*0.01*1.01^12/(1.01^12-1) = 7107.9… -> ceil 7108
    expect(backendEMI(80000, 12, 12)).toBe(7108);
  });
  it('zero interest splits evenly', () => {
    expect(backendEMI(90000, 3, 0)).toBe(30000);
  });
});

describe('verdict rules (backend parity)', () => {
  it('runway <1mo after cash buy -> WAIT/critical', () => {
    const broke: UserFinancialState = { ...user, totalBalance: 70000 };
    const r = previewSimulation(broke, goals, { itemName: 'Bike', price: 60000, mode: 'CASH' }, 15);
    expect(r.verdict).toBe('WAIT');
    expect(r.verdictTitle).toMatch(/Keep Buffer Safe/);
  });

  it('affordable EMI -> EMI verdict with matching monthly math', () => {
    const r = previewSimulation(user, goals, { itemName: 'Phone', price: 80000, mode: 'EMI_12', interestRate: 12 }, 15);
    expect(r.verdict).toBe('EMI');
    expect(r.monthlyEMI).toBe(backendEMI(80000, 12, 12));
  });

  it('EMI >30% of income -> WAIT (backend rule 3)', () => {
    // NOTE: backend derives "income" as beforeUsable/beforeRunway (= monthly
    // commitments here: 60000). EMI 26655/60000 = 44% -> WAIT.
    const r = previewSimulation(user, goals, { itemName: 'Laptop', price: 300000, mode: 'EMI_12', interestRate: 12 }, 15);
    expect(r.monthlyEMI).toBe(backendEMI(300000, 12, 12));
    expect(r.verdict).toBe('WAIT');
  });

  it('loan credits balance and adds EMI commitment (backend loan branch)', () => {
    const r = previewSimulation(user, goals, { itemName: 'Car', price: 100000, mode: 'LOAN', interestRate: 12, loanMonths: 24 }, 15);
    expect(r.simulatedBalance).toBe(user.totalBalance + 100000);
    expect(r.monthlyEMI).toBe(backendEMI(100000, 24, 12));
    // EMI 4707 vs derived income 60000 = 7.8% -> affordable loan verdict
    expect(r.verdict).toBe('EMI');
    expect(r.verdictTitle).toBe('Loan Affordable');
  });

  it('healthy profile small cash buy -> BUY', () => {
    const r = previewSimulation(user, goals, { itemName: 'Shoes', price: 5000, mode: 'CASH' }, 15);
    expect(r.verdict).toBe('BUY');
  });
});

describe('usableBalance (firewall parity)', () => {
  it('locks only commitments due on/before today', () => {
    // day 1: only rent (day 1) locked
    expect(usableBalance(user, 1)).toBe(240000 - 35000);
    // day 10: rent + sip + bills locked
    expect(usableBalance(user, 10)).toBe(240000 - 60000);
  });
});
