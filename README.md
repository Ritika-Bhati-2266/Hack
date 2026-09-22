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
2. **Simulator** (`/simulator`) — type `iPhone 16`, amount `80000`, mode Cash → **Simulate** (instant local engine) → **Verify with backend engine (:3001)** → MATCH badge proves single source of truth
3. **Connect** (`/connect`) — AA mock 3-step flow (consent → approve → fetch) or CSV upload (`date, narration, amount, type`) → live profile + Delete My Data (DPDP)
4. **Goals** (`/goals`) — progress + per-goal delay impact

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
  server.js            # 15 API endpoints + session store (1h TTL)
  engine/              # rules.js, simulator.js, firewall.js, types.js
  ledger/              # parser.js (61 categories), ledger.js, qa-parse-audit.js
  aa/                  # consent.js, tsp.js (mock works, real stubbed)
  autopay/             # stub.js (API-compatible, no real money)
  data/                # mock.js (Priya Sharma profile)
  qa-gate.js           # automated QA
src/
  app/                 # /, /simulator, /connect, /goals
  components/          # Firewall, SplitView, TrajectoryChart, Navbar
  store/               # useFinanceStore (local instant engine)
  lib/api.ts           # backend client + adapter (single source of truth via /api/simulate/custom)
frontend/              # ARCHIVED vanilla reference — NOT served
```

## API (main endpoints)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/profile/live` | Profile + financial state (live or mock fallback) |
| POST | `/api/simulate` | `{name, amount, mode, emiMonths?, interestRate?}` → verdict |
| POST | `/api/aa/consent` → `/approve` → `/fetch` | 3-step AA flow |
| POST | `/api/upload/csv` | Bank statement upload + parse |
| DELETE | `/api/user/data` | DPDP right-to-erasure |
| POST | `/api/beta/signup` | Beta signup capture |

## QA status

| Suite | Result |
|---|---|
| `node qa-gate.js` | **24/24** (verdicts, EMI math, firewall, 1000-sim load, security hygiene) |
| `node ledger/qa-parse-audit.js` | **5/5** — 96 ground-truth samples (HDFC/SBI/ICICI/Axis/Kotak/Yes Bank), 96% coverage, 96% correctness |

Built for hackathon — Phase 2 (India Stack) complete, beta-ready. Real AA/AutoPay providers stubbed pending contracts.
