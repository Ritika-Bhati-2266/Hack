# PREVISE — Know Before You Decide

> Expense trackers show the **past**. Previse simulates the **future** — before you swipe.
> Answers one question: **"What will happen to my money if I buy this?"**

iPhone ₹80,000 cash → runway drops from **2.9 → 1.2 months** → verdict: **WAIT**.
Same purchase, different profile → different verdict. Deterministic rules, no LLM hallucination.

## Demo in 60 seconds (Judges) — Option B: Next.js UI + Express API

```bash
cd backend && npm install && node server.js   # API → http://localhost:3001
npm install && npm run dev                     # UI  → http://localhost:3000
```

1. **Dashboard** (`/`) — Emergency Buffer · Runway · Financial Firewall bar · Goals · customer switcher
2. **Simulator** (`/simulator`) — type `iPhone 16`, amount `80000`, mode Cash/EMI/**Loan** + interest-rate + tenure → **Simulate** (instant local engine) → **Verify with backend engine (:3001)** → MATCH badge proves single source of truth
3. **Connect** (`/connect`) — AA 3-step flow when a real provider is wired (Setu/OneMoney; until then the UI says so and points to CSV) or CSV upload (`date, narration, amount, type`) → live profile auto-adopted by Dashboard + Simulator (● Live persona) + Delete My Data (DPDP). No statement handy? Select a sample (Spender/Saver) to try instantly — same upload + parser flow, previous data replaced.
4. **Goals** (`/goals`) — add / edit / delete goals + per-goal delay impact
5. **Transactions** (`/transactions`) — parsed category breakdown + search/filter (live data only)
6. **History** (`/history`) — every simulation auto-logged + Bought/Skipped feedback (Phase 3 training data)
7. **Pro** (`/pro`) — Free vs Pro pricing + UPI AutoPay mandate stub · **Privacy** (`/privacy`) — DPDP policy + grievance · **Admin** (`/admin`) — token-gated beta signups

> Legacy vanilla UI in `frontend/` is ARCHIVED reference only — backend no longer serves it (API-only mode).

## How it works

```
AA / CSV raw data ──▶ Parser (61 categories) ──▶ Feature profile ──▶ Rules engine ──▶ Verdict
                                                        │                              │
                                              Firewall (earmark rent/      BUY · WAIT · EMI OK
                                              EMIs/SIPs first)             + severity + rebuild timer
```

**Verdict rules (deterministic):** runway <1mo → WAIT/critical · <2mo → WAIT/warning ·
goals delayed 2+mo → WAIT/caution · EMI >30% income → WAIT · runway ≥3mo → BUY/safe.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express API-only (no static serve, CORS for :3000) |
| Frontend | Next.js 16 + React 19 + Tailwind 4 + Zustand + Recharts (`src/`) |
| Engine | Deterministic rules (buffer / runway / safe-to-spend / firewall) |
| Data | RBI Account Aggregator (mock TSP; Setu/OneMoney stubbed) + CSV fallback |
| Security | Helmet, CORS allowlist, rate limiting (30 req/min), input validation |

## Project structure

```
backend/
  server.js            # 17 API endpoints + disk-persisted sessions (1h TTL) + admin + OpenAPI
  engine/              # rules.js, simulator.js (cash/emi/loan), firewall.js, types.js
  ledger/              # parser.js (61 categories), ledger.js, qa-parse-audit.js
  aa/                  # consent.js (version-stamped v1-2026-09), tsp.js (mock works, real stubbed)
  autopay/             # stub.js (API-compatible, no real money)
  data/                # mock.js (Priya Sharma profile) + sessions/signups (gitignored, runtime)
  openapi.json         # OpenAPI 3.0 spec → GET /api/openapi.json
  qa-gate.js           # automated QA
src/
  app/                 # /, /simulator, /connect, /goals, /transactions, /history, /pro, /privacy, /admin
  components/          # Firewall, SplitView, TrajectoryChart, Navbar, DataSourceBanner
  store/               # useFinanceStore (personas + live data + goals CRUD + history, persisted)
  lib/api.ts           # backend client + adapter (single source of truth via /api/simulate/custom)
  lib/engine.ts        # frontend engine (backend parity) + engine.test.ts (8/8) + insights.test.ts (6/6) = vitest 14/14
frontend/              # ARCHIVED vanilla reference — NOT served
Dockerfile / .github/workflows/ci.yml / .env.example
```

## API (main endpoints)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/profile/live` | Profile + financial state (live or mock fallback) |
| POST | `/api/simulate` | `{name, amount, mode, emiMonths?, interestRate?}` → verdict |
| POST | `/api/simulate/custom` | `{profile, proposal}` → verdict (frontend parity check) |
| POST | `/api/aa/consent` → `/approve` → `/fetch` | 3-step AA flow (consent stamped `v1-2026-09`) |
| POST | `/api/upload/csv` | Bank statement upload + parse (multipart `statement` + `balance`) |
| GET | `/api/profile/live` | Live profile + parsed transactions + accounts (mock fallback) |
| POST | `/api/autopay/setup` → `GET /api/autopay/:id` | Pro mandate stub (wired to `/pro` page) |
| DELETE | `/api/user/data` | DPDP right-to-erasure |
| POST | `/api/beta/signup` | Beta signup capture |
| GET | `/api/beta/signups` | Signup list (`x-admin-token` gated, emails masked) |
| GET | `/api/openapi.json` | OpenAPI 3.0 spec |

## QA status

| Suite | Result |
|---|---|
| `node qa-gate.js` | **25/25** (verdicts, EMI math, firewall, 1000-sim load, security hygiene) |
| `node ledger/qa-parse-audit.js` | **5/5** — 96 ground-truth samples (HDFC/SBI/ICICI/Axis/Kotak/Yes Bank), 96% coverage, 96% correctness |
| `npx vitest run` | **14/14** — frontend↔backend engine parity (EMI math, verdict rules, loan branch, firewall) + insights |
| `npx eslint src` + `tsc --noEmit` + `next build` | **clean** (backend uses CommonJS `require()` by convention, excluded from web lint) |

Built for hackathon — Phase 2 (India Stack) complete, beta-ready. Real AA/AutoPay providers stubbed pending contracts.
