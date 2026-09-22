/**
 * Previse — Account Aggregator TSP Abstraction
 * MockTSP works out of the box. Setu/OneMoney need API keys.
 */

const { mockProfile } = require("../data/mock");

const TSP = process.env.AA_PROVIDER || "mock";

function generateMockTransactions() {
  const txns = [];
  const now = new Date();

  // 3 months of data
  for (let m = 2; m >= 0; m--) {
    const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthStr = month.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

    // Salary credit
    txns.push({
      date: `${monthStr}`,
      narration: "SALARY CREDITS PRIVATE LIMITED",
      amount: 65000,
      type: "credit",
    });

    // Commitment debits
    mockProfile.commitments.forEach((c) => {
      txns.push({
        date: `${monthStr}`,
        narration: c.name.toUpperCase(),
        amount: -c.amount,
        type: "debit",
      });
    });

    // Noise transactions
    const noise = [
      { narration: "SWIGGY BANGALORE", amount: -450 },
      { narration: "AMAZON PAY INDIA", amount: -1200 },
      { narration: "OLA CAB SERVICES", amount: -280 },
      { narration: "ZOMATO ONLINE", amount: -650 },
      { narration: "RELIANCE FRESH", amount: -1800 },
    ];
    noise.forEach((n) => {
      txns.push({ date: `${monthStr}`, narration: n.narration, amount: n.amount, type: "debit" });
    });
  }

  return txns;
}

async function requestConsent({ customerId, purpose }) {
  if (TSP !== "mock") throw new Error(`AA provider "${TSP}" not configured. Set ${TSP.toUpperCase()}_API_KEY.`);
  const consentId = `consent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sessionToken = Math.random().toString(36).slice(2);
  return { consentId, sessionToken, status: "pending", redirectUrl: `https://mock-tsp.example/consent/${consentId}` };
}

async function fetchAccounts(consentId) {
  if (TSP !== "mock") throw new Error(`AA provider "${TSP}" not configured.`);
  return [
    { accountId: "acc-001", bank: "HDFC Bank", balance: 185000, type: "savings" },
  ];
}

async function fetchTransactions(consentId, accountId) {
  if (TSP !== "mock") throw new Error(`AA provider "${TSP}" not configured.`);
  return generateMockTransactions();
}

module.exports = { requestConsent, fetchAccounts, fetchTransactions };
