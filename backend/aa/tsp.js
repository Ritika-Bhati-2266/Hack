/**
 * Previse — Account Aggregator TSP Abstraction
 *
 * AA_PROVIDER=mock (default): explicit, labeled demo bank flow so the 3-step
 * consent → approve → fetch UX works end-to-end without provider contracts.
 * Mock data is clearly stamped "(Mock)" and only served in mock mode — it is
 * never silently mixed into real (CSV/live-provider) profiles.
 *
 * AA_PROVIDER=setu: real bank link via Setu FIU sandbox
 * (https://docs.setu.co/data/account-aggregator/quickstart).
 * Needs SETU_CLIENT_ID / SETU_CLIENT_SECRET / SETU_PRODUCT_INSTANCE_ID from
 * the Setu Bridge dashboard (Data → FIU product → API credentials), plus
 * SETU_REDIRECT_URI whitelisted there. Sandbox base: https://fiu-sandbox.setu.co
 * (production: https://fiu.setu.co).
 *
 * CSV upload remains fully supported in every mode.
 */

const TSP = process.env.AA_PROVIDER || "mock";

function providerMode() {
  return TSP === "mock" ? "mock" : "live";
}

function isMock() {
  return providerMode() === "mock";
}

// ─── Mock bank (demo only) ─────────────────────────────────────────────
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

// ─── Setu FIU sandbox (real bank link) ─────────────────────────────────
// Docs: https://docs.setu.co/data/account-aggregator/api-integration/consent-flow
//       https://docs.setu.co/data/account-aggregator/api-integration/data-apis
// VERIFY: Setu versions these paths (e.g. a /v2 prefix). If your Bridge /
// Postman collection shows a prefix, set SETU_API_PREFIX=/v2 — no code change.
function setuConfig() {
  const base = (process.env.SETU_BASE_URL || "https://fiu-sandbox.setu.co").replace(/\/+$/, "");
  const prefix = (process.env.SETU_API_PREFIX || "").replace(/\/+$/, "");
  const cfg = {
    base: base + prefix,
    clientId: process.env.SETU_CLIENT_ID || "",
    clientSecret: process.env.SETU_CLIENT_SECRET || "",
    productInstanceId: process.env.SETU_PRODUCT_INSTANCE_ID || "",
    redirectUri: process.env.SETU_REDIRECT_URI || "http://localhost:3000/connect/callback",
    // No documented default: copy the token URL from Setu's Postman collection
    // (FIU APIs) — set SETU_TOKEN_URL explicitly. Code refuses to guess it.
    tokenUrl: process.env.SETU_TOKEN_URL || "",
  };
  const missing = ["clientId", "clientSecret", "productInstanceId"]
    .filter((k) => !cfg[k])
    .map((k) => "SETU_" + k.replace(/([A-Z])/g, "_$1").toUpperCase());
  if (missing.length) {
    throw new Error(
      `Setu not configured — missing ${missing.join(", ")}. ` +
      `Copy them from Setu Bridge dashboard (Data → FIU product → API credentials). ` +
      `Meanwhile use AA_PROVIDER=mock or CSV upload.`
    );
  }
  return cfg;
}

async function setuToken(cfg) {
  if (!cfg.tokenUrl) {
    throw new Error(
      "SETU_TOKEN_URL not set — copy the auth/token URL from Setu's FIU Postman collection " +
      "into backend/.env (it is Bridge-version specific, so the code does not guess it)."
    );
  }
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret }),
  });
  if (!res.ok) throw new Error(`Setu auth failed (HTTP ${res.status}) — check SETU_CLIENT_ID/SECRET.`);
  const body = await res.json().catch(() => ({}));
  const token = body.access_token || body.accessToken || body.token;
  if (!token) throw new Error("Setu auth gave no access_token — check SETU_TOKEN_URL response shape.");
  return token;
}

async function setuFetch(cfg, token, path, { method = "GET", body } = {}) {
  const res = await fetch(cfg.base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-product-instance-id": cfg.productInstanceId,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Setu ${method} ${path} → HTTP ${res.status}: ${err.message || err.error || "unknown"}`);
  }
  return res.json();
}

// VERIFY against Setu Bridge → Consent Object docs before going live: field
// names (purpose codes, FI types) are product-config specific. Shape below
// follows Setu's Create Consent API (consentDuration / vua / dataRange) +
// standard AA consent Detail (purpose / FIU range / fetchType / redirectUrl).
function buildSetuConsentBody({ vua, purpose }) {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 6);
  const to = new Date(now);
  to.setFullYear(to.getFullYear() + 1);
  return {
    consentDuration: { unit: "MONTH", value: "4" },
    // User's AA handle: "999999999" or "999999999@setu". Frontend sends mobile.
    vua: vua || undefined,
    dataRange: { from: from.toISOString(), to: now.toISOString() },
    context: [],
    additionalParams: { tags: ["Previse"] },
    detail: {
      consentStart: now.toISOString(),
      consentExpiry: to.toISOString(),
      Customer: { id: "{{customerId}}" },
      FIDataRange: { from: from.toISOString(), to: now.toISOString() },
      fetchType: "ONETIME",
      consentTypes: ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      fiTypes: ["DEPOSIT"],
      Frequency: { unit: "MONTH", value: 1 },
      DataLife: { unit: "MONTH", value: 1 },
      purpose: { code: "101", text: purpose || "Wealth management" },
      redirectUrl: (process.env.SETU_REDIRECT_URI || "http://localhost:3000/connect/callback"),
    },
  };
}

async function setuCreateConsent({ customerId, purpose, vua, mobile } = {}) {
  const cfg = setuConfig();
  const token = await setuToken(cfg);
  const body = buildSetuConsentBody({ vua: vua || mobile, purpose });
  if (customerId) body.detail.Customer.id = customerId;
  const res = await setuFetch(cfg, token, "/consents", { method: "POST", body });
  // Docs: created consent → { id, url (approval redirect), status: PENDING }.
  const setuId = res.id || res.consentId;
  const approvalUrl = res.url || res.redirectUrl || res.approvalUrl;
  if (!setuId) throw new Error("Setu /consents gave no consent id — compare body with Consent Object docs.");
  return { setuConsentId: setuId, approvalUrl: approvalUrl || null, rawStatus: res.status || "PENDING" };
}

async function setuConsentStatus(setuConsentId) {
  const cfg = setuConfig();
  const token = await setuToken(cfg);
  const res = await setuFetch(cfg, token, `/consents/${encodeURIComponent(setuConsentId)}`);
  return res; // APPROVED consent reads back as status ACTIVE (per Setu docs).
}

async function setuCreateDataSession(setuConsentId, monthsBack = 6) {
  const cfg = setuConfig();
  const token = await setuToken(cfg);
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - monthsBack);
  // Must sit within the FIDataRange sent at consent creation.
  const res = await setuFetch(cfg, token, "/sessions", {
    method: "POST",
    body: {
      consentId: setuConsentId,
      dataRange: { from: from.toISOString(), to: now.toISOString() },
      format: "json", // Setu returns DECRYPTED FI data (no manual ECDH needed).
    },
  });
  const sessionId = res.id || res.sessionId;
  if (!sessionId) throw new Error("Setu /sessions gave no session id.");
  return { sessionId, cfg, token };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Map Setu decryptedFI (deposit accounts) → Previse ledger shape
// ({accounts, transactions} — identical to CSV/mock output).
function mapSetuFiData(fiData) {
  const accounts = [];
  const transactions = [];
  for (const fip of fiData || []) {
    for (const item of fip.data || []) {
      const fi = item.decryptedFI || item.decryptedFi || {};
      const acc = fi.account || {};
      const txns = (acc.transactions && acc.transactions.transaction) || [];
      let balance = 0;
      for (const t of txns) {
        const amt = Math.abs(Number(t.amount) || 0);
        const isCredit = String(t.type || "").toUpperCase() === "CREDIT";
        const stamp = t.valueDate || t.transactionTimestamp || "";
        transactions.push({
          date: String(stamp).slice(0, 10),
          narration: String(t.narration || t.reference || "BANK TRANSACTION"),
          amount: isCredit ? amt : -amt,
          type: isCredit ? "credit" : "debit",
        });
        if (t.currentBalance !== undefined) balance = Number(t.currentBalance) || balance;
      }
      accounts.push({
        accountId: acc.linkedAccRef || item.linkRefNumber || `setu-${accounts.length}`,
        bank: String(fip.fipID || "Linked Bank").replace(/-/g, " "),
        balance,
        type: "savings",
      });
    }
  }
  return { accounts, transactions };
}

async function setuFetchLiveData(setuConsentId) {
  // 1. Consent must be APPROVED (reads back ACTIVE) — else tell user to approve.
  const consent = await setuConsentStatus(setuConsentId);
  const status = String(consent.status || "").toUpperCase();
  if (status !== "ACTIVE" && status !== "APPROVED") {
    throw new Error(
      `Setu consent is ${consent.status || "PENDING"} — approve it at the Setu URL first, then Fetch.`
    );
  }
  // 2. Data session → poll until PARTIAL/COMPLETED (Setu notifies via webhook;
  //    polling keeps localhost working with zero public-URL setup).
  const { sessionId, cfg, token } = await setuCreateDataSession(setuConsentId);
  let last = null;
  for (let i = 0; i < 6; i++) {
    last = await setuFetch(cfg, token, `/sessions/${encodeURIComponent(sessionId)}`);
    const combined = String(last.status || "").toUpperCase();
    if (combined === "COMPLETED" || combined === "PARTIAL") break;
    if (combined === "FAILED" || combined === "EXPIRED") {
      throw new Error(`Setu data session ${combined} — create a new consent and retry.`);
    }
    await sleep(5000);
  }
  const fiData = last.fiData || last.fi_data || last.data || [];
  const mapped = mapSetuFiData(fiData);
  if (!mapped.transactions.length) {
    throw new Error("Setu returned no transactions for this session — check FI types / dataRange in Bridge.");
  }
  return mapped;
}

// ─── Public interface (provider-agnostic) ────────────────────────────────
async function requestConsent({ customerId, purpose, vua, mobile } = {}) {
  if (isMock()) {
    return {
      consentId: `mock-${Date.now().toString(36)}`,
      sessionToken: `mock-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    };
  }
  if (TSP === "setu") {
    const { setuConsentId, approvalUrl, rawStatus } = await setuCreateConsent({ customerId, purpose, vua, mobile });
    return {
      // Local id stays stable for our session map; Setu id travels alongside.
      consentId: `setu-${setuConsentId}`,
      sessionToken: `setu-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
      setuConsentId,
      approvalUrl,
      rawStatus,
    };
  }
  // Real provider integration goes here (OneMoney).
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

async function fetchAccounts(consentId) {
  if (isMock()) return mockAccounts();
  if (TSP === "setu") {
    const setuId = String(consentId).replace(/^setu-/, "");
    const { accounts } = await setuFetchLiveData(setuId);
    return accounts;
  }
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

async function fetchTransactions(consentId, accountId) {
  if (isMock()) return mockTransactions();
  if (TSP === "setu") {
    const setuId = String(consentId).replace(/^setu-/, "");
    const { accounts, transactions } = await setuFetchLiveData(setuId);
    if (!accountId) return transactions;
    const acc = accounts.find((a) => a.accountId === accountId);
    return acc ? transactions : transactions; // Setu returns all linked accounts at once.
  }
  throw new Error(`AA provider "${TSP}" not implemented yet. Use CSV upload.`);
}

module.exports = {
  requestConsent,
  fetchAccounts,
  fetchTransactions,
  providerMode,
  isConfigured: () => true,
  // Setu-specific (real mode only):
  setuConsentStatus,
  setuFetchLiveData,
};
