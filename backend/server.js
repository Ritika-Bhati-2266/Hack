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

const { calculateFinancialState } = require("./engine/rules");
const { simulate, calculateEMI } = require("./engine/simulator");
const { applyFirewall } = require("./engine/firewall");
const { mockProfile } = require("./data/mock");

// Phase 2 imports
const { createConsent, approveConsent, getConsent, fetchLiveData } = require("./aa/consent");
const { buildLiveProfile } = require("./ledger/ledger");
const { parseTransactions } = require("./ledger/parser");
const { setupMandate, getMandate } = require("./autopay/stub");

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Multi-user session store ────────────────────────────────
// Maps sessionId -> { profile, meta, accounts, transactions, source, fetchedAt }
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const liveProfiles = new Map();

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
app.use(cors({ origin: ["http://localhost:3001", "http://localhost:3000"], credentials: true }));
app.use(express.json());

// Rate limiting — 30 requests per minute per IP on mutation endpoints
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

// Serve static frontend
app.use(express.static(path.join(__dirname, "../frontend")));

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
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════
//  MOCK PROFILE (Phase 1 — always available)
// ═══════════════════════════════════════════════════════════════

app.get("/api/profile", (req, res) => {
  const dayOfMonth = parseInt(req.query.day) || new Date().getDate();
  const state = calculateFinancialState(mockProfile, dayOfMonth);
  res.json({
    profile: {
      name: mockProfile.name,
      balance: mockProfile.balance,
      monthlyInflow: mockProfile.monthlyInflow,
      commitments: mockProfile.commitments,
      goals: mockProfile.goals,
    },
    state,
    source: "mock",
  });
});

app.get("/api/firewall", (req, res) => {
  const dayOfMonth = parseInt(req.query.day) || new Date().getDate();
  const firewall = applyFirewall(mockProfile.balance, mockProfile.commitments, dayOfMonth);
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
app.post("/api/aa/consent", apiLimiter, (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req);
    const session = createConsent({ customerId: sessionId, ...req.body });
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
app.post("/api/aa/fetch", (req, res) => {
  try {
    const { consentId, sessionToken } = req.body;
    if (!consentId) return res.status(400).json({ error: "consentId required" });
    if (!sessionToken) return res.status(400).json({ error: "sessionToken required" });

    const { accounts, transactions } = fetchLiveData(consentId, sessionToken);
    const { profile, meta } = buildLiveProfile({ accounts, transactions });

    const sessionId = getOrCreateSessionId(req);
    liveProfiles.set(sessionId, { profile, meta, accounts, transactions, source: "aa", fetchedAt: new Date().toISOString() });

    res.json({ accounts, transactions, liveProfile: profile, meta, sessionId });
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
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      const amount = parseFloat(cols[amtIdx]);
      if (isNaN(amount)) continue;

      txns.push({
        date: cols[dateIdx],
        narration: cols[narrIdx],
        amount,
        type: typeIdx !== -1 ? cols[typeIdx] : (amount > 0 ? "credit" : "debit"),
      });
    }

    if (!txns.length) return res.status(400).json({ error: "No valid transactions found in CSV" });

    // Balance: use provided value, or derive from transactions (credits - debits)
    let balance = 0;
    if (req.body.balance) {
      balance = parseFloat(req.body.balance);
      if (isNaN(balance) || balance < 0) balance = 0;
    } else {
      // Derive: sum of all credits minus debits (rough estimate)
      balance = txns.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0)
              - txns.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
      balance = Math.max(0, Math.floor(balance));
    }

    const accounts = [{ accountId: "csv-upload", bank: "Uploaded Statement", balance, type: "savings" }];
    const { profile, meta } = buildLiveProfile({ accounts, transactions: txns });

    const sessionId = getOrCreateSessionId(req);
    liveProfiles.set(sessionId, { profile, meta, accounts, transactions: txns, source: "csv", fetchedAt: new Date().toISOString() });

    // Balance sanity check: warn if user-provided balance differs wildly from derived
    const derivedBalance = txns.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0)
            - txns.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
    const derived = Math.max(0, Math.floor(derivedBalance));
    let balanceWarning = null;
    if (req.body.balance && derived > 0) {
      const diff = Math.abs(balance - derived);
      const pct = (diff / derived) * 100;
      if (pct > 50) {
        balanceWarning = `Balance ₹${balance.toLocaleString("en-IN")} differs significantly from derived ₹${derived.toLocaleString("en-IN")} (${Math.round(pct)}% off). Runway calculations may be inaccurate.`;
      }
    }

    res.json({ message: `Parsed ${txns.length} transactions`, liveProfile: profile, meta, sessionId, balanceWarning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  LIVE PROFILE (Phase 2 — uses AA or CSV data)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/profile/live
 * Return the live profile built from AA/CSV data
 * Falls back to mock if no live data available
 */
app.get("/api/profile/live", (req, res) => {
  const dayOfMonth = parseInt(req.query.day) || new Date().getDate();
  const sessionId = req.headers["x-session-id"];
  const stored = sessionId ? liveProfiles.get(sessionId) : null;

  if (stored) {
    const state = calculateFinancialState(stored.profile, dayOfMonth);
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
    });
  }

  // Fallback to mock
  const state = calculateFinancialState(mockProfile, dayOfMonth);
  res.json({
    profile: {
      name: mockProfile.name,
      balance: mockProfile.balance,
      monthlyInflow: mockProfile.monthlyInflow,
      commitments: mockProfile.commitments,
      goals: mockProfile.goals,
    },
    state,
    source: "mock",
    meta: null,
  });
});

// ═══════════════════════════════════════════════════════════════
//  SIMULATION (Phase 1 — works with any profile)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/simulate
 * Simulate a purchase. Uses live profile if available, else mock.
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
  const stored = sessionId ? liveProfiles.get(sessionId) : null;
  const profile = stored ? stored.profile : mockProfile;

  const proposal = { name, amount: Number(amount), mode, emiMonths: Number(emiMonths), interestRate: Number(interestRate) };
  const result = simulate(profile, proposal);
  result.profileSource = stored ? stored.source : "mock";
  res.json(result);
});

/**
 * POST /api/simulate/custom
 * Simulate with custom user profile (for testing)
 */
app.post("/api/simulate/custom", (req, res) => {
  const { profile, proposal } = req.body;

  if (!profile || !proposal) {
    return res.status(400).json({ error: "profile and proposal are required" });
  }

  const result = simulate(profile, proposal);
  res.json(result);
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
  if (sessionId && liveProfiles.has(sessionId)) {
    liveProfiles.delete(sessionId);
  }
  res.json({ message: "All your data has been deleted." });
});

// ─── Catch-all: serve frontend ───────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚡ Previse Engine running at http://localhost:${PORT}`);
  console.log(`  📡 AA Provider: ${process.env.AA_PROVIDER || "mock"}`);
  console.log(`  🔧 Phase: 2 (India Stack)\n`);
});
