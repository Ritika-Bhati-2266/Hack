/**
 * Previse — Test Profile (QA / engine tests ONLY)
 * Never served by the API. Production has no demo data — see ledger.js.
 */

const testProfile = {
  name: "Test User",
  balance: 185000,
  monthlyInflow: 65000,
  commitments: [
    { name: "Rent", amount: 22000, type: "fixed", dayOfMonth: 1, active: true },
    { name: "SIP — HDFC Mid-Cap", amount: 5000, type: "recurring", dayOfMonth: 5, active: true },
    { name: "SIP — Axis Bluechip", amount: 3000, type: "recurring", dayOfMonth: 5, active: true },
    { name: "Car Loan EMI", amount: 12000, type: "recurring", dayOfMonth: 10, active: true },
    { name: "Phone EMI", amount: 2500, type: "recurring", dayOfMonth: 15, active: true },
    { name: "Gym Membership", amount: 2000, type: "recurring", dayOfMonth: 1, active: true },
    { name: "Internet + Netflix", amount: 1500, type: "recurring", dayOfMonth: 5, active: true },
  ],
  goals: [
    { name: "Emergency Fund", targetAmount: 300000, currentAmount: 120000, deadline: 12, priority: "high" },
    { name: "Goa Trip", targetAmount: 80000, currentAmount: 35000, deadline: 6, priority: "medium" },
  ],
};

module.exports = { testProfile };
