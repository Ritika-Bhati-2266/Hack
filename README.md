# PREVISE — Personal Financial Decision Engine

> Don't just track past spend. **Simulate your future.** RBI Account Aggregator ready.

Prevents impulse purchases by simulating impact on **Safe Buffer + Runway + Goal delays** BEFORE you swipe. Same iPhone ₹80k → different verdict per customer profile (deterministic firewall).

**Live:** `http://localhost:3000` · **Stack:** Next.js 16.3.5 (Turbopack) + Zustand (persist) + Recharts + Tailwind v4

### Demo in 30s (Judges)
1. `npm run dev` → open `/` → Click **Demo: Switch Customer** (Rahul/Priya/Aman) — observe buffer/runway change `src/store/useFinanceStore.ts:62`
2. `Launch What-If Simulator` → `iPhone 16 Pro Max ₹80,000` → **Run Engine**
3. See **SplitView** (Today vs Simulated) `src/components/SplitViewComparison.tsx:10` + **3Y Trajectory** `src/components/TrajectoryChart.tsx:20` + verdict `WAIT|EMI|BUY`
4. `WAIT` → *Wait 6 Weeks* / `EMI` → *Switch to 6 EMI* / `BUY` → *Confirm* (balance deducts `src/store/useFinanceStore.ts:252`)
5. Toggle Firewall ON/OFF + Export PNG for PPT

### Financial Firewall Rule (Deterministic)
```
totalEarmarked = rent + sip + bills  (auto-locked via RBI AA mock)
safeBuffer = totalBalance - totalEarmarked
safeRunway = safeBuffer / (dailyBurn*30)
safeToSpendToday = safeBuffer - (daysRemainingInMonth * dailyBurn)  // dynamic, not hardcoded 15
verdict: <2.0mo→WAIT, 2-3mo→EMI, >3mo→BUY
monthlyGrowth = max(5000, income*0.08 + goals*0.2) per customer  // not 8000
perGoalDelay = impactAmount / (monthlyContribution*2.5)
```

### Customers (Every-Customer Personalisation)
- **Rahul Verma (Spender)** Bal 2.4L, Income 85k, Burn 1.5k/day
- **Priya Sharma (Saver)** Bal 2.9L, Income 95k, Burn 1266/day
- **Aman Singh (Chaser)** Bal 98k, Tight Buffer — always WAIT

### Project Structure
```
src/app/page.tsx              Dashboard + Firewall visualization
src/app/simulator/page.tsx    What-If engine + validation
src/store/useFinanceStore.ts  Engine + persist (previse-customer)
src/components/FinancialFirewall.tsx  Firewall bar + ledger
src/components/TrajectoryChart.tsx    3Y chart + export PNG
src/components/SplitViewComparison.tsx  PPT Slide 5
src/types/index.ts            SimulationResult + perGoalDelays
```

### Scripts
```bash
npm run dev    # http://localhost:3000
npm run build  # static build (3 routes)
npm run lint
```

### Gaps Fixed (Roadmap Phase 0-2)
- Dynamic `daysRemaining` + customer-aware `monthlyGrowth` + per-goal delays
- Removed hardcoded ₹1.4L/₹60k/₹1,500 texts → dynamic `src/components/*`
- Zustand persist + wired verdict actions
- Trajectory toggle + Export PNG + validation + empty-balance guard

### Next (Phase 2-3)
- `src/app/api/simulations` history + Supabase
- RBI AA real SDK consent flow + NLP auto-earmark
- Compare 3 customers side-by-side analytics + PWA + cron daily burn

Built for Hackathon — deterministic, no LLM hallucination, India Stack AA ready (mock).
