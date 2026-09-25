/**
 * Previse — QA Gate
 * Automated tests for rules engine, simulator, firewall, performance, security
 */

const { calculateFinancialState } = require("./engine/rules");
const { simulate, calculateEMI } = require("./engine/simulator");
const { applyFirewall } = require("./engine/firewall");
const { testProfile: testProfile } = require("./data/test-profile");

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.log(`  ❌ ${msg}`); }
}

function runTests() {
  console.log("\n  🔒 Previse QA Gate\n");

  // ═══ Test 1: Simulator Accuracy ═══
  console.log("  ─── Simulator Accuracy ───");

  const startTime = Date.now();
  const proposal = { name: "iPhone 16", amount: 80000, mode: "cash", emiMonths: 12, interestRate: 12 };
  const result = simulate(testProfile, proposal);
  const elapsed = Date.now() - startTime;

  assert(elapsed < 30000, `Time-to-first-simulation < 30s (${elapsed}ms)`);
  assert(result.before && result.after, "Result has before/after");
  assert(result.verdict && result.verdict.action, "Result has verdict");
  assert(result.verdict.action === "wait", `iPhone 80K cash => WAIT (got: ${result.verdict.action})`);

  // ═══ Test 2: Verdict Rules ═══
  console.log("\n  ─── Verdict Rules ───");

  // Small purchase => buy
  const small = simulate(testProfile, { name: "Coffee", amount: 200, mode: "cash" });
  assert(small.verdict.action === "buy", `Small purchase => buy (got: ${small.verdict.action})`);

  // Huge purchase => wait
  const huge = simulate(testProfile, { name: "Car", amount: 1000000, mode: "cash" });
  assert(huge.verdict.action === "wait", `Huge purchase => wait (got: ${huge.verdict.action})`);
  assert(huge.verdict.severity === "critical", `Huge purchase severity => critical (got: ${huge.verdict.severity})`);

  // EMI affordable
  const emiOk = simulate(testProfile, { name: "Phone", amount: 30000, mode: "emi", emiMonths: 12, interestRate: 12 });
  assert(emiOk.verdict.action === "emi", `Affordable EMI => emi (got: ${emiOk.verdict.action})`);

  // EMI > 30% income
  const emiHigh = simulate(testProfile, { name: "Expensive", amount: 500000, mode: "emi", emiMonths: 12, interestRate: 12 });
  assert(emiHigh.verdict.action === "wait", `High EMI => wait (got: ${emiHigh.verdict.action})`);

  // Mid purchase valid
  const mid = simulate(testProfile, { name: "Bike", amount: 50000, mode: "cash" });
  assert(["buy", "wait"].includes(mid.verdict.action), `Mid purchase has valid action (got: ${mid.verdict.action})`);

  // Loan mode
  const loan = simulate(testProfile, { name: "Education", amount: 200000, mode: "loan", emiMonths: 24, interestRate: 10 });
  assert(loan.verdict.action, `Loan mode works (got: ${loan.verdict.action})`);

  // ═══ Test 3: EMI Formula ═══
  console.log("\n  ─── EMI Formula ───");

  const emi0 = calculateEMI(120000, 12, 0);
  assert(emi0 === 10000, `0% interest: 120K/12mo = 10000 (got: ${emi0})`);

  const emi12 = calculateEMI(100000, 12, 12);
  assert(emi12 >= 8800 && emi12 <= 8950, `1L/12mo/12% = 8800-8950 (got: ${emi12})`);

  assert(emi12 * 12 >= 100000, `Total EMI >= principal (got: ${emi12 * 12})`);

  // ═══ Test 4: Firewall / Runway / Safe-to-Spend ═══
  console.log("\n  ─── Firewall / Runway / Safe-to-Spend ───");

  const state = calculateFinancialState(testProfile, 15);
  assert(state.firewall.firewalled > 0, `Firewall has earmarked amount: ${state.firewall.firewalled}`);
  assert(state.buffer.total >= 0, `Buffer >= 0: ${state.buffer.total}`);
  assert(state.runway.months > 0, `Runway > 0: ${state.runway.months}`);
  assert(state.runway.months >= 2.5 && state.runway.months <= 3.5, `Runway ~2.9 months (got: ${state.runway.months})`);
  assert(state.safeToSpend.daily >= 0, `Safe-to-spend >= 0: ${state.safeToSpend.daily}`);

  // Broke user
  const brokeProfile = { ...testProfile, balance: 0 };
  const brokeState = calculateFinancialState(brokeProfile, 15);
  assert(brokeState.runway.status === "critical", `Broke user => critical (got: ${brokeState.runway.status})`);

  // ═══ Test 5: Load Test ═══
  console.log("\n  ─── Load Test ───");

  const loadStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    simulate(testProfile, { name: `Test ${i}`, amount: Math.random() * 100000, mode: "cash" });
  }
  const loadElapsed = Date.now() - loadStart;
  assert(loadElapsed < 10000, `1000 simulations < 10s (${loadElapsed}ms)`);

  // ═══ Test 6: Security Hygiene ═══
  console.log("\n  ─── Security Hygiene ───");

  const fs = require("fs");
  const serverCode = fs.readFileSync(__dirname + "/server.js", "utf-8");
  // No hardcoded secret VALUES: flag `SECRET* = "literal"` assignments, but
  // allow env-based config (process.env.SETU_WEBHOOK_SECRET) + header names.
  const hardcodedSecret = serverCode.split("\n").some((l) => {
    const t = l.trim();
    if (t.startsWith("//") || t.startsWith("*")) return false; // comments
    return /SECRET\w*\s*[:=]\s*["'][^"']+["']/.test(t) && !/process\.env/.test(t);
  });
  assert(!serverCode.includes("password") && !hardcodedSecret, "No hardcoded passwords/secrets");
  assert(serverCode.includes("express.json()"), "express.json() middleware present");

  const serverCode2 = fs.readFileSync(__dirname + "/ledger/ledger.js", "utf-8");
  assert(!serverCode2.includes("demo-fallback") && !serverCode2.includes("mockProfile") && !serverCode2.includes("data/mock"), "No demo fallback in ledger (production mode)");
  const tspCode = fs.readFileSync(__dirname + "/aa/tsp.js", "utf-8");
  assert(tspCode.includes("AA_PROVIDER") && tspCode.includes("(Mock)"), "Mock AA is explicit + labeled (AA_PROVIDER=mock), never silent");

  // ═══ Test 7: Manual Gates ═══
  console.log("\n  ─── Manual Gates ───");
  console.log("  ⏳ Beta 50+ users: Pending");
  console.log("  ⏳ AA accuracy >95%: Mock flow automated; real provider required for beta accuracy sign-off");
  console.log("  ⏳ Security audit signed off: Pending");
  console.log("  ℹ️  (Manual gates not automated)\n");

  // ═══ Summary ═══
  console.log(`  ═══ Results ═══`);
  console.log(`  ${passed}/${passed + failed} checks passed`);
  console.log(`  ${failed > 0 ? "⚠️  Some checks failed — fix before beta" : "✅ All automated checks passed"}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
