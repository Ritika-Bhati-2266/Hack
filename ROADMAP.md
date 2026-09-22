# Previse — Roadmap v2

> **"Know Before You Decide"**
> Financial Decision Simulator for India

---

## What is Previse?

Answers one question: **"What will happen to my money if I buy this?"**

Unlike expense trackers (past), Previse simulates the **future** — before you swipe.

| Example | What Happens |
|---|---|
| iPhone ₹80K cash | Runway drops from 3 months to 22 days |
| ₹5L personal loan | Delays wealth creation by 2.5 years |
| Rent upgrade to ₹30K | Zero cash buffer for emergencies |

---

## Current Status

| Phase | Status | Key Metric |
|---|---|---|
| Phase 0 — Concept | Done | Pitch validated |
| Phase 1 — MVP | Done | QA 22/22 green |
| Phase 2 — India Stack | **85% done** | Parser 98.4% coverage, 100% correctness |
| Phase 3 — ML/LLM | Planned | — |
| Phase 4 — Monetization | Planned | — |
| Phase 5 — B2B | Planned | — |

---

## Phase 2 — India Stack (Current) — Weeks 7-12

### ✅ Already Done
- [x] AA consent flow (MockTSP working, Setu/OneMoney stubbed)
- [x] CSV upload fallback with balance input
- [x] Transaction parser — 51 categories, 98.4% coverage, 100% correctness
- [x] Real bank format testing (HDFC, SBI, ICICI, Axis, Kotak, Yes Bank)
- [x] `qa-parse-audit.js` — 33/33 checks, 124 ground truth samples
- [x] Multi-user session isolation (x-session-id headers)
- [x] TTL eviction on all in-memory stores
- [x] Input validation + balance sanity check
- [x] Session expiry toast notification
- [x] UI v5 — Professional dark theme, SVG icons, no glass
- [x] Rate limiting (30 req/min on mutation endpoints)
- [x] CORS restricted to localhost:3001/3000

### Week 7-8 — Hardening & Beta Prep

| Task | Owner | Priority | Status |
|---|---|---|---|
| Visual verification — browser check all 4 tabs (Chrome, Firefox, Safari, mobile) | Aanchal | P0 | Pending |
| Edge case testing — empty CSV, malformed data, huge files, Unicode narration | Ritika | P0 | Pending |
| Error handling cleanup — generic error messages, no internal leakage | Ritika | P1 | Pending |
| Health check endpoint cleanup — remove env var exposure | Ritika | P1 | Pending |
| Add `helmet` middleware for security headers | Ritika | P1 | Pending |
| Session token as `crypto.randomBytes` (already done, verify) | Ritika | P1 | Verify |
| Landing page beta signup → actual storage (not just console.log) | Aanchal | P1 | Pending |
| QA gate run — confirm 22/22 still green after all changes | Ritika | P0 | Pending |

### Week 9-10 — 50-User Beta Launch

| Task | Owner | Priority | Status |
|---|---|---|---|
| Deploy backend (Railway / Render / Fly.io) | Ritika | P0 | Pending |
| Deploy frontend (Vercel / Netlify or same host) | Ritika | P0 | Pending |
| Set up custom domain + SSL | Ritika | P0 | Pending |
| Collect 50 beta users (college network, social media, direct outreach) | Both | P0 | Pending |
| Beta feedback form (Google Form / Tally) | Aanchal | P1 | Pending |
| Monitor error rates + API response times | Ritika | P1 | Pending |
| Fix P0/P1 bugs from beta feedback (target: <5 critical bugs) | Both | P0 | Pending |

### Week 11-12 — Phase 2 Sign-Off

| Task | Owner | Priority | Status |
|---|---|---|---|
| Security audit sign-off (manual review complete) | Ritika | P0 | Pending |
| DPDP compliance review (consent flow, data retention, deletion) | Ritika | P0 | Pending |
| Parser QA re-run — confirm metrics hold at scale | Ritika | P0 | Pending |
| Beta satisfaction survey — target >4.0/5 | Aanchal | P1 | Pending |
| Load test — 10K concurrent users simulation | Ritika | P1 | Pending |
| Documentation — API docs (OpenAPI/Swagger), setup guide | Both | P2 | Pending |
| Phase 2 retrospective + Phase 3 kickoff planning | Both | P1 | Pending |

### Parser Metrics (Holding Strong)

| Metric | Target | Actual |
|---|---|---|
| Coverage | >95% | **98.4%** (121/123) |
| Correctness | >90% | **100%** (121/121) |
| Categories | >50 | **51** |
| Ground truth | >100 txns | **124** |

---

## Phase 3 — Intelligence (Months 5-8)

> Rules → ML. Deterministic → Predictive.

### Month 5-6: Data Foundation

| Deliverable | Description | Owner |
|---|---|---|
| Event logging | Track every simulation (input, verdict, user action) — anonymized | Ritika |
| Feedback loop | "Did you buy? What happened?" post-verdict follow-up | Aanchal |
| Data pipeline | Aggregate anonymized data for model training | TBD (ML hire) |
| Goal projections | Rule-based "months to goal" with trendline estimation | Ritika |

### Month 7-8: ML Models

| Deliverable | Description | Owner |
|---|---|---|
| Runway prediction | ML model predicting actual runway (not just rule-based) | ML Engineer |
| Spending pattern detection | Cluster user spending into profiles (aggressive/saver/balanced) | ML Engineer |
| Anomaly detection | Flag unusual transactions (fraud-like, impulse spikes) | ML Engineer |
| LLM guidance layer | Natural language "should I buy this?" with context from profile | Ritika + ML |
| A/B testing framework | Test ML verdicts vs rule-based verdicts | Ritika |

### ML Architecture (Proposed)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  AA / CSV   │────▶│  Parser (51  │────▶│  Feature    │
│  Raw Data   │     │  categories) │     │  Engineering│
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                              ┌─────▼─────┐          ┌──────▼──────┐
                              │  Rule     │          │  ML Model   │
                              │  Engine   │          │  (XGBoost)  │
                              │  (existing│          │  + LLM      │
                              └─────┬─────┘          └──────┬──────┘
                                    │                       │
                                    └───────────┬───────────┘
                                                │
                                        ┌───────▼───────┐
                                        │  Verdict      │
                                        │  (confidence  │
                                        │   score)      │
                                        └───────────────┘
```

### Hiring: ML Engineer (Start Month 4)

**Requirements:**
- Python, scikit-learn / XGBoost basics
- Familiarity with financial data (transactions, time series)
- Bonus: LLM API integration (OpenAI / Anthropic)

**Where to find:** IIT/NIT placement networks, ML Discord communities, LinkedIn outreach

---

## Phase 4 — Monetization (Months 6-12, Parallel)

### Pricing

| Tier | Price | Features | Limit |
|---|---|---|---|
| Free | ₹0 | 3 simulations/month, basic balance check, mock data only | — |
| Pro | ₹149/mo | Unlimited sims, AA sync, goals, firewall, ML insights | Monthly |
| Pro Annual | ₹1,499/yr | Everything in Pro + priority support | Yearly |

### Revenue Targets

| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Total Users | 1K | 10K | 100K |
| Pro Users | 50 | 500 | 5K |
| MRR | ₹7.5K | ₹75K | ₹7.5L |
| Churn Rate | <10% | <8% | <5% |

### Monetization Milestones

| Milestone | Target Date | Action |
|---|---|---|
| First paying user | Month 6 | Launch Pro tier |
| ₹1L MRR | Month 8 | Double down on acquisition |
| ₹5L MRR | Month 10 | Start B2B outreach |
| ₹10L MRR | Month 12 | Consider Series A / angel round |

### Payment Integration

| Provider | Status | Notes |
|---|---|---|
| Razorpay | Planned | UPI + cards, standard checkout |
| Cashfree | Backup | Better for subscriptions |

---

## Phase 5 — B2B (Post 10K Users, Month 10+)

| Deliverable | Description | Target |
|---|---|---|
| Decision Engine SDK | Embeddable "can I afford this?" widget for fintech apps | Banks, BNPL |
| Bank API Integration | White-label affordability check for loan disbursement | NBFCs |
| Affordability Checkout | "Previse says you can afford this" badge on e-commerce | Flipkart, Amazon |
| Portfolio Dashboard | B2B analytics — what are users buying, what are they waiting on | Investors |

**Bar:** ₹5L+ MRR before B2B outreach. Don't distract from B2C.

---

## DevOps & Production Readiness

### Infrastructure (Phase 2 End)

| Component | Choice | Cost |
|---|---|---|
| Backend hosting | Railway / Render | Free tier → $20/mo |
| Frontend hosting | Vercel / Netlify | Free |
| Database (when needed) | Supabase (Postgres) | Free → $25/mo |
| File storage | S3 / Cloudflare R2 | $5/mo |
| Domain | Cloudflare | ₹500/yr |
| SSL | Let's Encrypt (free) | ₹0 |
| Monitoring | Sentry (errors) + UptimeRobot | Free tier |

### CI/CD Pipeline

```yaml
On push to main:
  1. Run qa-gate.js (backend tests)
  2. Run qa-parse-audit.js (parser tests)
  3. Lint (add ESLint)
  4. Deploy to staging
  5. Manual QA sign-off
  6. Deploy to production
```

### Docker (Phase 3)

```dockerfile
# Add when scaling — not needed for beta
FROM node:20-alpine
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/
RUN cd backend && npm ci --production
EXPOSE 3000
CMD ["node", "backend/server.js"]
```

---

## Developer Experience Improvements

### Phase 2 (Quick Wins)

| Improvement | Time | Impact |
|---|---|---|
| Add `nodemon` for hot reload | 15 min | 10x dev speed |
| Add `dotenv` for env vars | 30 min | Clean config |
| Add ESLint + Prettier | 1 hr | Code consistency |
| Add `jest` for unit tests | 2 hr | Reliable testing |
| API docs with Swagger | 3 hr | Frontend/backend parallel work |

### Phase 3 (When Scaling)

| Improvement | Time | Impact |
|---|---|---|
| TypeScript migration (backend) | 2 days | Type safety |
| Frontend build step (Vite) | 1 day | Modules, minification |
| Database integration (Postgres) | 1 week | Persistence |
| Redis for sessions | 1 day | Multi-instance support |

---

## DPDP Compliance Checklist

India's Digital Personal Data Protection Act — critical for financial data.

| Requirement | Status | Action |
|---|---|---|
| Explicit consent before data collection | ✅ Done | AA consent flow |
| Purpose limitation (use data only for stated purpose) | ✅ Done | Simulation only |
| Data minimization (collect only what's needed) | ✅ Done | Balance + transactions |
| Right to erasure (user can delete data) | ❌ Pending | Add "Delete My Data" endpoint |
| Data breach notification | ❌ Pending | Add error monitoring + notification flow |
| No cross-border transfer without consent | ✅ Done | Hosted in India |
| Children's data protection (if applicable) | ⚠️ Review | Age gate on signup |
| Grievance officer designation | ❌ Pending | Required for production |

**Action Items:**
1. Add "Delete My Data" button in Profile tab (clears session + all stored data)
2. Add data retention policy (auto-delete after 90 days of inactivity)
3. Add consent versioning (track which version user agreed to)
4. Designate grievance officer (can be team member initially)

---

## Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | AA provider (Setu/OneMoney) delays | Medium | High | MockTSP + CSV fallback already working | Ritika |
| 2 | DPDP compliance gaps | Low | Critical | Checklist above, legal review before launch | Ritika |
| 3 | ML model accuracy <80% | Medium | Medium | Rules engine stays as fallback, A/B test | ML Engineer |
| 4 | 2-person team capacity | High | Medium | Hire ML engineer by Month 4, outsource UI polish | Both |
| 5 | Beta user churn | Medium | High | Fast iteration loop, weekly feedback calls | Both |
| 6 | Security breach | Low | Critical | Rate limiting done, helmet + auth before production | Ritika |
| 7 | Razorpay integration issues | Low | Medium | Start integration early, test in sandbox | Ritika |
| 8 | Competitor launches similar product | Medium | Medium | Speed to market, India-specific focus = moat | Both |

---

## Team & Hiring

### Current Team

| Role | Who | Responsibilities | Phase |
|---|---|---|---|
| Lead / Product + Backend | Ritika Bhati | Architecture, API, engine, deployment | All |
| Frontend / Design | Aanchal Pandey | UI/UX, CSS, landing page, beta outreach | All |

### Hiring Plan

| Role | When | Where | Budget |
|---|---|---|---|
| ML Engineer | Month 4 (Phase 2 end) | IIT/NIT networks, LinkedIn, ML communities | ₹15-25K/mo (stipend if intern) |
| UI/UX Intern | Month 6 (if needed) | Design colleges, Dribbble/Behance | ₹8-12K/mo |
| Backend Intern | Month 8 (if scaling) | College networks | ₹10-15K/mo |

---

## Definition of Done

### Phase 2 DONE when:
- [x] AA works 90%+ (or fallback shipping)
- [x] Parser coverage >95% — **98.4%**
- [x] Parser correctness >90% — **100%**
- [ ] 50-user beta, <5 P0/P1 bugs
- [ ] Security audit passed
- [ ] DPDP compliance checklist complete
- [ ] Visual verification across browsers
- [ ] AutoPay stub documented (real integration deferred)

### Launch READY when:
- [ ] All P0/P1 fixed
- [ ] DPDP compliant
- [ ] 100 beta users, satisfaction >4.0/5
- [ ] 10K concurrent users supported
- [ ] Custom domain + SSL live
- [ ] Error monitoring (Sentry) active

### Phase 3 READY when:
- [ ] ML engineer hired
- [ ] Event logging pipeline live
- [ ] 1000+ simulations in database (for training data)
- [ ] A/B testing framework ready

---

## Key Metrics to Track

### Product Metrics

| Metric | Target (Beta) | Target (Launch) | Target (6mo) |
|---|---|---|---|
| DAU | 20 | 200 | 2,000 |
| Simulations/day | 50 | 500 | 5,000 |
| Verdict accuracy (user feedback) | >70% | >80% | >85% |
| CSV upload success rate | >90% | >95% | >98% |
| AA connection rate | >70% | >85% | >90% |

### Business Metrics

| Metric | Target (3mo) | Target (6mo) | Target (12mo) |
|---|---|---|---|
| Total signups | 500 | 5,000 | 50,000 |
| Pro conversion | 2% | 5% | 5% |
| MRR | ₹5K | ₹75K | ₹7.5L |
| NPS | >30 | >40 | >50 |

---

## Weekly Cadence

| Day | Activity |
|---|---|
| Monday | Sprint planning — pick 3-5 tasks for the week |
| Wednesday | Mid-week check — unblock, adjust priorities |
| Friday | Ship day — deploy, test, get feedback |
| Saturday | Beta feedback review + planning for next week |
| Sunday | Rest / light reading / market research |

---

## 12-Month Timeline

```
Month 1-2  ━━━━━━━━━━━━━━━━━━━━━━━ Phase 1 (Done)
Month 3-4  ━━━━━━━━━━━━━━━━━━━━━━━ Phase 2 India Stack (85% done → 100%)
Month 5    ━━━━━━━━━━━━━━━━━━━━━━━ 50-user beta launch
Month 6    ━━━━━━━━━━━━━━━━━━━━━━━ Phase 3 kickoff + ML hire
Month 7-8  ━━━━━━━━━━━━━━━━━━━━━━━ ML models + LLM integration
Month 9    ━━━━━━━━━━━━━━━━━━━━━━━ Pro tier launch (monetization)
Month 10   ━━━━━━━━━━━━━━━━━━━━━━━ 10K users + B2B exploration
Month 11   ━━━━━━━━━━━━━━━━━━━━━━━ Scale + optimize
Month 12   ━━━━━━━━━━━━━━━━━━━━━━━ ₹7.5L MRR target + Series A prep
```

---

*Previse — Simulate before you spend.*
*Last updated: 22 Sep 2026*
