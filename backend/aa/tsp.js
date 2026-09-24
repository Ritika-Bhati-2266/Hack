/**
 * Previse — Account Aggregator TSP Abstraction
 *
 * AA_PROVIDER=mock (default): explicit, labeled demo bank flow so the 3-step
 * consent → approve → fetch UX works end-to-end without provider contracts.
 * Mock data is clearly stamped "(Mock)" and only served in mock mode — it is
 * never silently mixed into real (CSV/live-provider) profiles.
 *
 * AA_PROVIDER=setu|onemoney + API keys: real provider (integration WIP —
 * per-call error tells the caller to use CSV meanwhile).
 * CSV upload remains fully supported in every mode.
 */

const TSP = process.env.AA_PROVIDER || "mock";

function providerMode() {
  return TSP === "mock" ? "mock" : "live";
}

// Demo identity: monthly salary + repeating household debits across ~3 months.
// Narrations repeat verbatim so commitment detection (≥2 same-narration hits)
// picks up rent/SIP/groceries; credits stay salary-only so inflow is clean.
function mockAccounts() {
  return [
    { accountId: "mock-hdfc-savings", bank: "HDFC Bank (Mock)", balance: 150000, type: "savings" },
  ];
}

function mockDate(monthsAgo, day) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  // Clamp day to month length so Feb never yields an invalid date.
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, dim));
  return d.toISOString().slice(0, 10);
}

function mockTransactions() {
  const txns = [];
  for (let m = 2; m >= 0; m--) {
    txns.push({ date: mockDate(m, 1), narration: "SALARY ACME CORP", amount: 65000, type: "credit" });
    txns.push({ date: mockDate(m, 2), narration: "RENT NEELAM RESIDENCY", amount: -18000, type: "debit" });
    txns.push({ date: mockDate(m, 5), narration: "SIP HDFC MIDCAP", amount: -12000, type: "debit" });
    txns.push({ date: mockDate(m, 8), narration: "GROCERY BIGBASKET", amount: -6000, type: "debit" });
    txns.push({ date: mockDate(m, 12), narration: "FOOD DELIVERY ZOMATO", amount: -1500, type: "debit" });
    txns.push({ date: mockDate(m, 18), narration: "FOOD DELIVERY ZOMATO", amount: -1500, type: "debit" });
    txns.push({ date: mockDate(m, 15), narration: "CAB UBER", amount: -1200, type: "debit" });
    txns.push({ date: mockDate(m, 25), narration: "CAB UBER", amount: -1300, type: "debit" });
    txns.push({ date: mockDate(m, 10), narration: "ELECTRICITY BESCOM", amount: -2200, type: "debit" });
    if (m === 0) {
      // One-offs: unique narrations → correctly NOT detected as recurring.
      txns.push({ date: mockDate(m, 14), narration: "HEADPHONES AMAZON", amount: -4999, type: "debit" });
      txns.push({ date: mockDate(m, 21), narration: "DECATHLON SPORTS", amount: -3200, type: "debit" });
    }
  }
  return txns;
}

async function requestConsent({ customerId, purpose } = {}) {
  if (providerMode() === "mock") {
    return {
      consentId: `mock-${Date.now().toString(36)}`,
      sessionToken: `mock-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    };
  }
  // Real provider integration goes here (Setu / OneMoney).
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

async function fetchAccounts(consentId) {
  if (providerMode() === "mock") return mockAccounts();
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

async function fetchTransactions(consentId, accountId) {
  if (providerMode() === "mock") return mockTransactions();
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

module.exports = { requestConsent, fetchAccounts, fetchTransactions, providerMode, isConfigured: () => true };
