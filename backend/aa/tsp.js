/**
 * Previse — Account Aggregator TSP Abstraction
 * Production mode: no mock data. Configure a real provider via AA_PROVIDER + API keys.
 * CSV upload remains the fully-supported fallback.
 */

const TSP = process.env.AA_PROVIDER || "";

function requireProvider() {
  if (!TSP || TSP === "mock") {
    throw new Error(
      'AA provider not configured. Set AA_PROVIDER + provider API keys, or use CSV upload instead.'
    );
  }
}

async function requestConsent({ customerId, purpose } = {}) {
  requireProvider();
  // Real provider integration goes here (Setu / OneMoney).
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

async function fetchAccounts(consentId) {
  requireProvider();
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

async function fetchTransactions(consentId, accountId) {
  requireProvider();
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

module.exports = { requestConsent, fetchAccounts, fetchTransactions };
