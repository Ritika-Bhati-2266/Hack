# PREVISE — Judge Q&A Cheat Sheet

> Rule: never defensive. Name the limitation first, then the plan. Judges reward
> "we know this, here's the path" over "it's perfect."

## Q1. "AA integration mock hai — real data kaise aayega?"

**One-liner:** "Mock sirf demo ke liye hai — integration path already designed hai, TSP swap env-var pe hai."

**Proof points (code-backed):**
- `backend/aa/tsp.js` — provider abstraction `AA_PROVIDER` env var pe; mock default, real path stubbed with comment `Real provider integration goes here (Setu / OneMoney)`.
- Consent flow already version-stamped (`v1-2026-09`) — production consent lifecycle ka shape ready hai.
- **CSV upload = interim/manual mode**, not a hack: "AA link hone se pehle bhi user ko value" — same parser (61 categories) + same engine dono paths pe chalta hai.

**Follow-up if asked:** "Setu/Finvu sandbox pe consent-create → FIU-callback flow 2 API calls ka kaam hai; engine untouched rehta hai kyunki woh profile-shape pe chalta hai, source pe nahi."

## Q2. "Single-user demo hai — scale ka kya plan?"

**One-liner:** "Demo single-profile hai, architecture multi-profile-ready hai — auth next layer hai, rework nahi."

**Proof points:**
- `useFinanceStore.switchCustomer` + profiles map — multi-profile switching already working (Live + custom + create/delete).
- Backend sessions disk-persisted, 1h TTL, session-isolated (`backend/server.js`) — per-user isolation ka shape already hai.
- Scale slide pe 2 bullets kaafi: Postgres/Supabase me `users → profiles → simulations` tables; engine pure function hai (profile in → verdict out), horizontally scalable, no session affinity needed.

## Q3. "Scope narrow hai — simulate → verdict only?"

**One-liner (reframe as focus):** "Intentional depth over breadth — ek core loop deeply correct, 10 shallow features nahi."

**Proof points:**
- Engine deterministic hai with 25/25 backend QA + 14/14 frontend↔backend parity tests — correctness narrow scope ka payoff hai.
- Second loop already hai: **goals tracking** (`goalsOnTrack` + per-goal delay impact) — "simulate before spending" + "track goals after."
- History feedback (Bought/Skipped) Phase-3 training data ban raha hai — loop future ML ke liye instrumented hai.

## Q4. "Wow factor kya hai?" (demo se jawab do, shabdon se nahi)

**Demo script (60 sec):**
1. Simulator me `iPhone 16, ₹80,000, Cash` → SIMULATE → verdict **stamp animation** + numbers **count-up** (runway 2.9 → 1.2 mo, buffer girta hua) — deterministic engine, dramatic visual.
2. Same amount, **6 EMI** → verdict flips to **EMI OK** — ek click me "engine samajhta hai" moment.
3. **Before vs After split-view** scroll karo — judges ko comparison pasand hai.
4. "Verify with backend engine (:3001)" dabao → **MATCH badge** — single source of truth, live proof.

**One-liner:** "Wow animation me nahi, *instant truth* me hai — type karo, sach dikhta hai, backend verify karta hai."

## Rapid-fire backups

| Sawal | Jawab |
|---|---|
| "LLM kyun nahi?" | "Paise pe hallucination nahi chalega — deterministic rules, har verdict test-covered. LLM sirf explanation layer ban sakta hai, decision layer nahi." |
| "Monetization?" | "Pro ₹149/mo, UPI AutoPay mandate stub `/pro` pe wired — provider keys aate hi live." |
| "Privacy/DPDP?" | "Session-isolated data, 1h TTL, one-tap Delete My Data (`DELETE /api/user/data`), consent version-stamped." |
| "Competition (Walnut, Moneyview)?" | "Woh past dikhate hain — hum future simulate karte hain, purchase se *pehle*." |
