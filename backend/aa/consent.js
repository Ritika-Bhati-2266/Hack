/**
 * Previse — AA Consent Session Manager
 * In-memory consent flow for Account Aggregator
 */

const { requestConsent, fetchAccounts, fetchTransactions } = require("./tsp");

const CONSENT_TTL_MS = 60 * 60 * 1000; // 1 hour
const consentSessions = new Map();

// Evict expired consent sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of consentSessions) {
    if (now - new Date(val.createdAt).getTime() > CONSENT_TTL_MS) {
      consentSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

async function createConsent({ customerId, purpose } = {}) {
  const result = await requestConsent({ customerId, purpose });
  const session = {
    consentId: result.consentId,
    sessionToken: result.sessionToken,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  consentSessions.set(result.consentId, session);
  return session;
}

function approveConsent(consentId, sessionToken) {
  const session = consentSessions.get(consentId);
  if (!session) throw new Error("Consent not found");
  if (session.sessionToken !== sessionToken) throw new Error("Invalid session token");
  session.status = "active";
  return session;
}

function getConsent(consentId) {
  const session = consentSessions.get(consentId);
  if (!session) return null;
  // Strip session token from response
  return { consentId: session.consentId, status: session.status, createdAt: session.createdAt };
}

async function fetchLiveData(consentId, sessionToken) {
  const session = consentSessions.get(consentId);
  if (!session) throw new Error("Consent not found");
  if (session.sessionToken !== sessionToken) throw new Error("Invalid session token");
  if (session.status !== "active") throw new Error("Consent not approved yet");

  const accounts = await fetchAccounts(consentId);
  const transactions = [];

  for (const acc of accounts) {
    const txns = await fetchTransactions(consentId, acc.accountId);
    transactions.push(...txns);
  }

  return { accounts, transactions };
}

module.exports = { createConsent, approveConsent, getConsent, fetchLiveData };
