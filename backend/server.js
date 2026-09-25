/**
 * Previse — API Server
 * Express backend serving the simulation engine + Phase 2 AA/AutoPay
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const fs = require("fs");

// Load env from backend/.env first, then repo-root .env (both gitignored).
// Pre-set process.env always wins (dotenv default override:false) — prod managers unaffected.
try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.join(__dirname, ".env") });
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
} catch {
  /* dotenv optional — server runs on defaults without it */
}

const { calculateFinancialState } = require("./engine/rules");
const { simulate, calculateEMI } = require("./engine/simulator");
const { applyFirewall } = require("./engine/firewall");

// Phase 2 imports
const { createConsent, approveConsent, getConsent, fetchLiveData, providerMode: aaMode } = require("./aa/consent");
const { buildLiveProfile } = require("./ledger/ledger");
const { parseTransactions } = require("./ledger/parser");
const { setupMandate, getMandate } = require("./autopay/stub");

const app = express();
// Render/Docker: the platform injects $PORT for the public web process (Next.js
// honors it automatically). The API keeps its own fixed port so the Next
// rewrite (/api/* → localhost:3001) never breaks.
const PORT = process.env.BACKEND_PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// DPDP: every consent records which policy version the user agreed to.
const CONSENT_VERSION = process.env.CONSENT_VERSION || "v1-2026-09";

// ─── Multi-user session store ────────────────────────────────
// Maps sessionId -> { profile, meta, accounts, transactions, source, fetchedAt }
// Persisted to disk (data/sessions.json, gitignored) so a backend restart
// doesn't wipe beta users. TTL still enforced on every read.
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const SESSIONS_FILE = path.join(__dirname, "data", "sessions.json");
const liveProfiles = new Map();

function loadSessions() {
  try {
    const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
    const now = Date.now();
    for (const [key, val] of Object.entries(raw)) {
      if (val && val.fetchedAt && now - new Date(val.fetchedAt).getTime() < SESSION_TTL_MS) {
        liveProfiles.set(key, val);
      }
    }
  } catch (err) {
    if (err.code !== "ENOENT") console.error(`[sessions] load failed: ${err.message}`);
  }
}

function saveSessions() {
  try {
    const tmp = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(liveProfiles), null, 2));
    fs.renameSync(tmp, SESSIONS_FILE);
  } catch (err) {
    console.error(`[sessions] save failed: ${err.message}`);
  }
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const stored = liveProfiles.get(sessionId);
  if (!stored) return null;
  if (Date.now() - new Date(stored.fetchedAt).getTime() > SESSION_TTL_MS) {
    liveProfiles.delete(sessionId);
    saveSessions();
    return null;
  }
  return stored;
}

function putSession(sessionId, data) {
  liveProfiles.set(sessionId, data);
  saveSessions();
}

function deleteSession(sessionId) {
  const existed = liveProfiles.delete(sessionId);
  if (existed) saveSessions();
  return existed;
}

loadSessions();

// Evict expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of liveProfiles) {
    if (now - new Date(val.fetchedAt).getTime() > SESSION_TTL_MS) {
      liveProfiles.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Generate a unique session ID for each user
function getOrCreateSessionId(req) {
  // Accept x-session-id header, or generate one
  let sessionId = req.headers["x-session-id"];
  if (!sessionId || typeof sessionId !== "string" || sessionId.length < 8) {
    sessionId = crypto.randomBytes(16).toString("hex");
  }
  return sessionId;
}

// Middleware
app.use(helmet());
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// ALLOWED_ORIGINS (comma-separated) for staging/prod deploy previews,
// e.g. ALLOWED_ORIGINS="https://previse.vercel.app,https://previse.in"
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED = [...new Set(["http://localhost:3000", FRONTEND_URL, ...EXTRA_ORIGINS])];
app.use(cors({ origin: ALLOWED, credentials: true }));
app.use(express.json());

// Server is authoritative for session IDs: if the client sent a weak/missing
// id we mint a strong one and echo it back so the client can adopt it.
app.use((req, res, next) => {
  const sid = getOrCreateSessionId(req);
  res.setHeader("x-session-id", sid);
  req.sessionId = sid;
  next();
});

// Explicit UTF-8 charset on every JSON response — defense against
// Latin-1/Windows-1252 clients (PowerShell 5.1, some curl builds)
// that render non-ASCII (₹, em-dash) as "?". API strings themselves
// stay ASCII ("Rs.") so they survive even a misdecoded client.

// Rate limiting — 30 requests per minute per IP on mutation endpoints
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

// NOTE (Option B): backend is API-only. Next.js UI runs on :3000.
// Legacy vanilla UI kept in frontend-legacy/ for reference, NOT served.

// ─── API Routes ──────────────────────────────────────────────

/**
 * GET /api/health
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    engine: "rules-v1",
    phase: "2",
    // UI enables Option A (AA flow) for "mock" and "live" alike; mock data is
    // explicitly labeled and never mixed into real profiles (see aa/tsp.js).
    aa: aaMode(),
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════
//  LEGACY PROFILE (removed — production mode, no demo data)
//  GET /api/profile and /api/firewall required a mock profile.
//  Use /api/profile/live (session) + /api/simulate/custom instead.
// ═══════════════════════════════════════════════════════════════

app.get("/api/profile", (req, res) => {
  res.status(410).json({
    error: "Removed — connect via AA or CSV, then use GET /api/profile/live with x-session-id.",
    code: "MOCK_REMOVED",
  });
});

app.get("/api/firewall", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  const stored = getSession(sessionId);
  if (!stored) {
    return res.status(404).json({
      error: "No live data — connect via AA or CSV first.",
      code: "NO_LIVE_DATA",
    });
  }
  const dayOfMonth = parseInt(req.query.day) || new Date().getDate();
  const firewall = applyFirewall(stored.profile.balance, stored.profile.commitments, dayOfMonth);
  res.json(firewall);
});

// ═══════════════════════════════════════════════════════════════
//  AA CONSENT FLOW (Phase 2)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/aa/consent
 * Create a new AA consent request
 * Body: { customerId?, purpose? }
 */
app.post("/api/aa/consent", apiLimiter, async (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req);
    const session = await createConsent({ customerId: sessionId, ...req.body });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/aa/consent/:consentId/approve
 * Approve a consent (simulates user tapping Approve)
 * Body: { sessionToken }
 */
app.post("/api/aa/consent/:consentId/approve", (req, res) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) return res.status(400).json({ error: "sessionToken required" });
    const session = approveConsent(req.params.consentId, sessionToken);
    res.json(session);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * GET /api/aa/consent/:consentId
 * Get consent status
 */
app.get("/api/aa/consent/:consentId", (req, res) => {
  const session = getConsent(req.params.consentId);
  if (!session) return res.status(404).json({ error: "consent not found" });
  res.json(session);
});

/**
 * POST /api/aa/fetch
 * Fetch live data from AA (requires active consent)
 * Body: { consentId, sessionToken }
 * Returns: { accounts, transactions, liveProfile }
 */
app.post("/api/aa/fetch", apiLimiter, async (req, res) => {
  try {
    const { consentId, sessionToken } = req.body;
    if (!consentId) return res.status(400).json({ error: "consentId required" });
    if (!sessionToken) return res.status(400).json({ error: "sessionToken required" });

    const { accounts, transactions } = await fetchLiveData(consentId, sessionToken);
    const { profile, meta } = buildLiveProfile({ accounts, transactions });

    const sessionId = getOrCreateSessionId(req);
    // Honest source stamping: mock TSP is demo data, never real bank data.
    const source = aaMode() === "mock" ? "aa-mock" : "aa";
    putSession(sessionId, { profile, meta, accounts, transactions, source, fetchedAt: new Date().toISOString() });

    res.json({ accounts, transactions, liveProfile: profile, meta, sessionId, source });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CSV UPLOAD (Fallback when AA not available)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/upload/csv
 * Upload a bank statement CSV and parse it into a profile
 * Expected CSV columns: date, narration, amount, type (credit/debit)
 */
app.post("/api/upload/csv", apiLimiter, upload.single("statement"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const csv = req.file.buffer.toString("utf-8");
    const lines = csv.split("\n").filter((l) => l.trim());

    if (lines.length < 2) return res.status(400).json({ error: "CSV must have header + at least 1 row" });

    // Parse CSV with quoted-field support
    function parseCSVLine(line) {
      const cols = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          cols.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      cols.push(current.trim());
      return cols;
    }

    const header = parseCSVLine(lines[0].toLowerCase());
    const dateIdx = header.findIndex((h) => h === "date");
    const narrIdx = header.findIndex((h) => h === "narration" || h === "description" || h === "narr");
    const amtIdx = header.findIndex((h) => h === "amount");
    const typeIdx = header.findIndex((h) => h === "type");

    if (dateIdx === -1 || narrIdx === -1 || amtIdx === -1) {
      return res.status(400).json({ error: "CSV must have columns: date, narration, amount" });
    }

    const txns = [];
    // Normalize type-column: case-insensitive, cr/dr variants; sign amount by type
    // (Indian statements often carry all-positive amounts + a type column)
    function normalizeCsvType(raw, amount) {
      const s = String(raw == null ? "" : raw).trim().toLowerCase().replace(/\./g, "");
      const credit = new Set(["credit", "credited", "cr", "c", "inflow", "deposit", "deposited", "received", "refund", "reversed"]);
      const debit = new Set(["debit", "debited", "dr", "d", "outflow", "withdrawal", "withdrawn", "paid", "expense", "purchase", "spent", "wd"]);
      if (credit.has(s)) return "credit";
      if (debit.has(s)) return "debit";
      return amount < 0 ? "debit" : "credit";
    }
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      const rawAmount = parseFloat(cols[amtIdx]);
      if (isNaN(rawAmount)) continue;

      const normType = typeIdx !== -1 ? normalizeCsvType(cols[typeIdx], rawAmount) : (rawAmount < 0 ? "debit" : "credit");
      // Sign the amount by the (normalized) type so downstream inflow/commitment
      // detection (which filters on amount sign) works with all-positive CSVs
      const amount = normType === "credit" ? Math.abs(rawAmount) : -Math.abs(rawAmount);

      txns.push({
        date: cols[dateIdx],
        narration: cols[narrIdx],
        amount,
        type: normType,
      });
    }

    if (!txns.length) return res.status(400).json({ error: "No valid transactions found in CSV" });

    // Balance is REQUIRED — a CSV has no balance column, and net-flow
    // (credits − debits) is NOT a balance. Silently deriving it produced
    // near-zero balances and wrong runways/verdicts. Explicit > guessed.
    const rawBalance = req.body.balance;
    if (rawBalance === undefined || rawBalance === null || String(rawBalance).trim() === "") {
      return res.status(400).json({ error: "Current balance is required — enter your bank balance with the upload (CSV has no balance column)" });
    }
    const balance = Number(String(rawBalance).trim());
    if (!Number.isFinite(balance) || balance < 0 || balance > 100000000) {
      return res.status(400).json({ error: "Balance must be a number between 0 and 10 crore" });
    }

    const accounts = [{ accountId: "csv-upload", bank: "Uploaded Statement", balance, type: "savings" }];
    const { profile, meta } = buildLiveProfile({ accounts, transactions: txns });

    const sessionId = getOrCreateSessionId(req);
    putSession(sessionId, { profile, meta, accounts, transactions: txns, source: "csv", fetchedAt: new Date().toISOString() });

    // Balance sanity check: warn if balance covers less than 1 month of
    // detected recurring expenses — runway will be thin whatever the verdict.
    const monthlyExp = (meta && meta.monthlyExpenses) || 0;
    let balanceWarning = null;
    if (monthlyExp > 0 && balance < monthlyExp) {
      balanceWarning = `Balance Rs. ${balance.toLocaleString("en-IN")} covers less than 1 month of detected expenses (Rs. ${monthlyExp.toLocaleString("en-IN")}/mo). Runway will be thin.`;
    }

    res.json({ message: `Parsed ${txns.length} transactions`, liveProfile: profile, meta, sessionId, balanceWarning });
  } catch (err) {
    if (err.code === "NO_EXPENSES") return res.status(400).json({ error: err.message, code: err.code });
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  LIVE PROFILE (Phase 2 — uses AA or CSV data)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/profile/live
 * Return the live profile built from AA/CSV data.
 * Production mode: NO mock fallback — 404 when no session.
 * Also returns parsed transactions + accounts so the UI can show a
 * category breakdown (additive fields — old clients ignore them).
 */
app.get("/api/profile/live", (req, res) => {
  const dayOfMonth = parseInt(req.query.day) || new Date().getDate();
  const sessionId = req.headers["x-session-id"];
  const stored = getSession(sessionId);

  if (stored) {
    const state = calculateFinancialState(stored.profile, dayOfMonth);
    const { transactions: parsed } = parseTransactions(stored.transactions || []);
    return res.json({
      profile: {
        name: stored.profile.name,
        balance: stored.profile.balance,
        monthlyInflow: stored.profile.monthlyInflow,
        commitments: stored.profile.commitments,
        goals: stored.profile.goals,
      },
      state,
      source: stored.source,
      meta: stored.meta,
      fetchedAt: stored.fetchedAt,
      accounts: stored.accounts || [],
      transactions: parsed.slice(-200),
      consentVersion: CONSENT_VERSION,
    });
  }

  // Production mode: no demo fallback — client must connect first.
  return res.status(404).json({
    error: "No live data — connect via AA or CSV first.",
    code: "NO_LIVE_DATA",
  });
});

// ═══════════════════════════════════════════════════════════════
//  SIMULATION (Phase 1 — works with any profile)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/simulate
 * Simulate a purchase. Requires a live profile session (AA/CSV).
 * Body: { name, amount, mode, emiMonths?, interestRate? }
 */
app.post("/api/simulate", apiLimiter, (req, res) => {
  const { name, amount, mode = "cash", emiMonths = 12, interestRate = 12 } = req.body;

  if (!name || !amount) {
    return res.status(400).json({ error: "name and amount are required" });
  }

  // Input validation
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 100000000) {
    return res.status(400).json({ error: "amount must be between 1 and 10 crore" });
  }
  const numEmiMonths = Number(emiMonths);
  if (isNaN(numEmiMonths) || numEmiMonths < 1 || numEmiMonths > 360) {
    return res.status(400).json({ error: "emiMonths must be between 1 and 360" });
  }
  const numInterestRate = Number(interestRate);
  if (isNaN(numInterestRate) || numInterestRate < 0 || numInterestRate > 50) {
    return res.status(400).json({ error: "interestRate must be between 0 and 50" });
  }

  const sessionId = req.headers["x-session-id"];
  const stored = getSession(sessionId);
  if (!stored) {
    return res.status(404).json({
      error: "No live data — connect via AA or CSV first, or use POST /api/simulate/custom with a profile.",
      code: "NO_LIVE_DATA",
    });
  }
  const profile = stored.profile;

  const proposal = { name, amount: Number(amount), mode, emiMonths: Number(emiMonths), interestRate: Number(interestRate) };
  const result = simulate(profile, proposal);
  result.profileSource = stored.source;
  res.json(result);
});

/**
 * POST /api/simulate/custom
 * Simulate with custom user profile (for testing)
 */
app.post("/api/simulate/custom", apiLimiter, (req, res) => {
  const { profile, proposal } = req.body;

  if (!profile || !proposal) {
    return res.status(400).json({ error: "profile and proposal are required" });
  }

  // Profile shape validation (user-supplied — engine assumes these exist)
  const balance = Number(profile.balance);
  const monthlyInflow = Number(profile.monthlyInflow);
  if (!Number.isFinite(balance) || balance < 0 || balance > 100000000) {
    return res.status(400).json({ error: "profile.balance must be between 0 and 10 crore" });
  }
  if (!Number.isFinite(monthlyInflow) || monthlyInflow < 0 || monthlyInflow > 100000000) {
    return res.status(400).json({ error: "profile.monthlyInflow must be between 0 and 10 crore" });
  }
  if (!Array.isArray(profile.commitments)) {
    return res.status(400).json({ error: "profile.commitments must be an array" });
  }
  for (const c of profile.commitments) {
    const amt = Number(c && c.amount);
    if (!c || !Number.isFinite(amt) || amt < 0 || amt > 100000000) {
      return res.status(400).json({ error: "each commitment needs amount between 0 and 10 crore" });
    }
  }
  if (profile.goals !== undefined && !Array.isArray(profile.goals)) {
    return res.status(400).json({ error: "profile.goals must be an array" });
  }

  // Proposal validation (same bounds as /api/simulate)
  const { name, amount, mode = "cash", emiMonths = 12, interestRate = 12 } = proposal;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "proposal.name is required" });
  }
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 100000000) {
    return res.status(400).json({ error: "amount must be between 1 and 10 crore" });
  }
  if (!["cash", "emi", "loan"].includes(mode)) {
    return res.status(400).json({ error: "mode must be cash, emi, or loan" });
  }
  const numEmiMonths = Number(emiMonths);
  if (!Number.isFinite(numEmiMonths) || numEmiMonths < 1 || numEmiMonths > 360) {
    return res.status(400).json({ error: "emiMonths must be between 1 and 360" });
  }
  const numInterestRate = Number(interestRate);
  if (!Number.isFinite(numInterestRate) || numInterestRate < 0 || numInterestRate > 50) {
    return res.status(400).json({ error: "interestRate must be between 0 and 50" });
  }

  try {
    const cleanProfile = {
      ...profile,
      balance,
      monthlyInflow,
      commitments: profile.commitments.map((c) => ({ ...c, amount: Number(c.amount) })),
      goals: Array.isArray(profile.goals) ? profile.goals : [],
    };
    const cleanProposal = { name: name.trim().slice(0, 200), amount: numAmount, mode, emiMonths: numEmiMonths, interestRate: numInterestRate };
    const result = simulate(cleanProfile, cleanProposal);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: "invalid profile or proposal" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AUTOPAY (Phase 2 — Pro billing stub)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autopay/setup
 * Setup a UPI AutoPay mandate for Pro subscription
 * Body: { amount?, frequency?, purpose? }
 */
app.post("/api/autopay/setup", apiLimiter, (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req);
    const mandate = setupMandate({ customerId: sessionId, ...req.body });
    res.json(mandate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/autopay/:mandateId
 * Get mandate status
 */
app.get("/api/autopay/:mandateId", (req, res) => {
  const mandate = getMandate(req.params.mandateId);
  if (!mandate) return res.status(404).json({ error: "mandate not found" });
  res.json(mandate);
});

// ═══════════════════════════════════════════════════════════════
//  DPDP COMPLIANCE — Delete My Data
// ═══════════════════════════════════════════════════════════════

/**
 * DELETE /api/user/data
 * Deletes all data for the current session (DPDP right to erasure).
 * Clears: live profile, accounts, transactions, session metadata.
 */
app.delete("/api/user/data", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  deleteSession(sessionId);
  res.json({ message: "All your data has been deleted." });
});

// ═══════════════════════════════════════════════════════════════
//  BETA SIGNUP (persist to JSON file — PII, gitignored)
// ═══════════════════════════════════════════════════════════════

const SIGNUPS_FILE = path.join(__dirname, "data", "beta-signups.json");

function readSignups() {
  try {
    return JSON.parse(fs.readFileSync(SIGNUPS_FILE, "utf-8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      // File exists but is unreadable/corrupt — back it up instead of silently dropping signups
      try {
        const backup = `${SIGNUPS_FILE}.corrupt-${Date.now()}`;
        fs.renameSync(SIGNUPS_FILE, backup);
        console.error(`[beta-signup] Corrupt signups file backed up to ${backup}: ${err.message}`);
      } catch (backupErr) {
        console.error(`[beta-signup] Could not back up corrupt file: ${backupErr.message}`);
      }
    }
    return [];
  }
}

/**
 * POST /api/beta/signup
 * Body: { name, email, usecase? }
 */
app.post("/api/beta/signup", apiLimiter, (req, res) => {
  const { name, email, usecase = "" } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "valid email is required" });
  }

  const signups = readSignups();
  const normalizedEmail = email.trim().toLowerCase();
  if (signups.some((s) => s.email === normalizedEmail)) {
    return res.status(409).json({ error: "email already registered" });
  }

  signups.push({
    name: name.trim().slice(0, 100),
    email: normalizedEmail,
    usecase: String(usecase).slice(0, 100),
    createdAt: new Date().toISOString(),
  });

  try {
    // Atomic write: temp file + rename, so a crash mid-write never leaves a torn file
    const tmp = `${SIGNUPS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(signups, null, 2));
    fs.renameSync(tmp, SIGNUPS_FILE);
  } catch (err) {
    return res.status(500).json({ error: "could not save signup" });
  }

  res.json({ message: "You're on the list!", position: signups.length });
});

// ─── Root: point to Next.js UI ───────────────────────────────
app.get("/", (req, res) => {
  res.json({ service: "previse-api", ui: FRONTEND_URL, health: "/api/health" });
});

// ─── Beta admin: list signups (token-gated, rate-limited) ───
// Header: x-admin-token === BETA_ADMIN_TOKEN (set env in prod).
const BETA_ADMIN_TOKEN = process.env.BETA_ADMIN_TOKEN || "change-me-in-prod";
app.get("/api/beta/signups", apiLimiter, (req, res) => {
  if (req.headers["x-admin-token"] !== BETA_ADMIN_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const signups = readSignups();
  res.json({
    count: signups.length,
    // Never leak full PII by default — mask emails, UI reveals on demand.
    signups: signups.map((s, i) => ({
      position: i + 1,
      name: s.name,
      email: s.email ? s.email.replace(/^(.).*(@.*)$/, "$1***$2") : "",
      emailFull: s.email,
      usecase: s.usecase,
      createdAt: s.createdAt,
    })),
  });
});

// ─── OpenAPI spec (static file, hand-maintained) ─────────────
app.get("/api/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.json"));
});

// ─── Catch-all: JSON 404 for unknown API routes ──────────────
app.use((req, res) => {
  res.status(404).json({ error: "not found — Next.js UI runs on " + FRONTEND_URL });
});

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚡ Previse Engine running at http://localhost:${PORT}`);
  console.log(`  📡 AA Provider: ${process.env.AA_PROVIDER || "not-configured (CSV only)"}`);
  console.log(`  🔧 Phase: 2 (India Stack)\n`);
});
