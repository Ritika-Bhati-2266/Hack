/**
 * Previse — AA Consent Session Manager
 * In-memory consent flow for Account Aggregator.
 *
 * Mock mode: 1-click demo (create → approve → fetch), unchanged.
 * Setu mode: create returns a Setu approval URL (user approves on Setu
 * screens); local session activates via /api/aa/callback or /api/aa/webhook.
 */

const { requestConsent, fetchAccounts, fetchTransactions, providerMode, setuFetchLiveData } = require("./tsp");

const CONSENT_TTL_MS = 60 * 60 * 1000; // 1 hour
const CONSENT_VERSION = process.env.CONSENT_VERSION || "v1-2026-09";
const consentSessions = new Map();

// Setu ↔ local link: setuConsentId -> local consentId (+ latest status).
// Lets the callback/webhook activate the right local session.
const setuLinks = new Map();

// Evict expired consent sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of consentSessions) {
    if (now - new Date(val.createdAt).getTime() > CONSENT_TTL_MS) {
      consentSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

async function createConsent({ customerId, purpose, vua, mobile } = {}) {
  const result = await requestConsent({ customerId, purpose, vua, mobile });
  const session = {
    consentId: result.consentId,
    sessionToken: result.sessionToken,
    status: "pending",
    consentVersion: CONSENT_VERSION,
    createdAt: new Date().toISOString(),
  };
  // Setu mode: carry the approval URL + provider id alongside (additive —
  // mock sessions never have these fields).
  if (result.setuConsentId) {
    session.setuConsentId = result.setuConsentId;
    session.approvalUrl = result.approvalUrl || null;
    session.setuStatus = result.rawStatus || "PENDING";
    setuLinks.set(result.setuConsentId, {
      localConsentId: result.consentId,
      status: session.setuStatus,
      updatedAt: new Date().toISOString(),
    });
  }
  consentSessions.set(result.consentId, session);
  return session;
}

function approveConsent(consentId, sessionToken) {
  const session = consentSessions.get(consentId);
  if (!session) throw new Error("Consent not found");
  if (session.sessionToken !== sessionToken) throw new Error("Invalid session token");
  // Setu mode: approval happens on Setu's screens, not here. Never
  // auto-activate — hand back the URL so the UI can redirect the user.
  if (session.setuConsentId) {
    return {
      consentId: session.consentId,
      status: session.status,
      setuStatus: session.setuStatus || "PENDING",
      approvalUrl: session.approvalUrl,
      consentVersion: session.consentVersion || CONSENT_VERSION,
      createdAt: session.createdAt,
    };
  }
  session.status = "active";
  return session;
}

function getConsent(consentId) {
  const session = consentSessions.get(consentId);
  if (!session) return null;
  // Strip session token from response
  const out = { consentId: session.consentId, status: session.status, consentVersion: session.consentVersion || CONSENT_VERSION, createdAt: session.createdAt };
  if (session.approvalUrl) out.approvalUrl = session.approvalUrl;
  if (session.setuStatus) out.setuStatus = session.setuStatus;
  return out;
}

// Activate a local session from a Setu-side status (callback / webhook).
// Returns the local session, or null when the Setu id is unknown.
function activateConsentBySetu(setuConsentId, status) {
  const link = setuLinks.get(setuConsentId);
  if (!link) return null;
  const s = String(status || "").toUpperCase();
  const approved = s === "APPROVED" || s === "ACTIVE";
  const rejected = s === "REJECTED" || s === "REVOKED" || s === "EXPIRED";
  link.status = s;
  link.updatedAt = new Date().toISOString();
  const session = consentSessions.get(link.localConsentId);
  if (!session) return null;
  session.setuStatus = s;
  if (approved) session.status = "active";
  if (rejected) session.status = "rejected";
  return session;
}

function getSetuLink(setuConsentId) {
  return setuLinks.get(setuConsentId) || null;
}

async function fetchLiveData(consentId, sessionToken) {
  const session = consentSessions.get(consentId);
  if (!session) throw new Error("Consent not found");
  if (session.sessionToken !== sessionToken) throw new Error("Invalid session token");
  if (session.status !== "active") throw new Error("Consent not approved yet");

  // Setu mode: single session-based fetch (all linked accounts at once).
  if (session.setuConsentId && providerMode() !== "mock") {
    return setuFetchLiveData(session.setuConsentId);
  }

  const accounts = await fetchAccounts(consentId);
  const transactions = [];

  for (const acc of accounts) {
    const txns = await fetchTransactions(consentId, acc.accountId);
    transactions.push(...txns);
  }

  return { accounts, transactions };
}

module.exports = {
  createConsent,
  approveConsent,
  getConsent,
  fetchLiveData,
  providerMode,
  activateConsentBySetu,
  getSetuLink,
};
