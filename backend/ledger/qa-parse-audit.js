/**
 * Previse — Parser QA Audit
 * Comprehensive test suite for transaction parser
 */

const { parseTransactions, detectCommitments, listCategories, CATEGORIES } = require("./parser");

const GROUND_TRUTH = [
  // HDFC Bank format
  { narration: "NEFT-HDFC-SALARY MAR24", expected: "salary" },
  { narration: "UPI-SWIGGY/ORDER", expected: "food-delivery" },
  { narration: "AMAZON PAY INDIA", expected: "online-shopping" },
  { narration: "NETFLIX.COM", expected: "netflix" },
  { narration: "SPOTIFY INDIA", expected: "music" },
  { narration: "OLA CAB SERVICES", expected: "cab" },
  { narration: "RELIANCE FRESH", expected: "grocery" },
  { narration: "HDFC BANK CREDIT CARD", expected: "credit-card" },
  { narration: "SIP-HDFC MIDCAP FUND", expected: "sip" },
  { narration: "LIC PREMIUM", expected: "insurance" },
  { narration: "IRCTC TRAIN", expected: "train" },
  { narration: "INDIGO AIRLINES", expected: "flight" },
  { narration: "HP PETROL BUNK", expected: "fuel" },
  { narration: "PVR CINEMAS", expected: "entertainment" },
  { narration: "HOSPITAL BILL", expected: "hospital" },
  { narration: "MEDPLUS PHARMACY", expected: "pharmacy" },
  { narration: "DECATHLON SPORTS", expected: "sports" },
  { narration: "GOVERNMENT COURT FEE", expected: "government" },
  { narration: "GPay TRANSFER", expected: "gpay" },
  { narration: "PHONEPE TRANSFER", expected: "phonepe" },

  // SBI format
  { narration: "SALARY CREDIT", expected: "salary" },
  { narration: "ZOMATO ORDER", expected: "food-delivery" },
  { narration: "FLIPKART PURCHASE", expected: "online-shopping" },
  { narration: "JIO PREPAID", expected: "mobile" },
  { narration: "TATA POWER ELECTRICITY", expected: "electricity" },
  { narration: "INDANE GAS", expected: "gas" },
  { narration: "AIRTEL FIBER", expected: "internet" },
  { narration: "CULT.FIT MEMBERSHIP", expected: "gym" },
  { narration: "HOTSTAR SUBSCRIPTION", expected: "ott" },

  // ICICI format
  { narration: "NEFT CREDIT SALARY", expected: "salary" },
  { narration: "SWIGGY BANGALORE", expected: "food-delivery" },
  { narration: "MEESHO ORDER", expected: "online-shopping" },
  { narration: "APOLLO PHARMACY", expected: "pharmacy" },
  { narration: "BESCOM ELECTRICITY", expected: "electricity" },
  { narration: "BWSSB WATER", expected: "water" },
  { narration: "UBER TRIP", expected: "cab" },
  { narration: "ZOMATO GOLD", expected: "food-delivery" },
  { narration: "CANVA SUBSCRIPTION", expected: "software" },

  // Axis Bank format
  { narration: "SALARY TRANSFER", expected: "salary" },
  { narration: "BIGBASKET ORDER", expected: "grocery" },
  { narration: "BLINKIT DELIVERY", expected: "grocery" },
  { narration: "ZEPTO ORDER", expected: "grocery" },
  { narration: "IKEA PURCHASE", expected: "furniture" },
  { narration: "PEPPERFRY ORDER", expected: "furniture" },
  { narration: "HOME LOAN EMI", expected: "home-loan" },
  { narration: "CAR LOAN EMI", expected: "car-loan" },

  // Kotak format
  { narration: "PAYTM WALLET", expected: "paytm" },
  { narration: "AMAZON PRIME", expected: "amazon-prime" },
  { narration: "APPLE MUSIC", expected: "music" },
  { narration: "MICROSOFT 365", expected: "software" },
  { narration: "PERSONAL LOAN EMI", expected: "personal-loan" },

  // Yes Bank format
  { narration: "NPS CONTRIBUTION", expected: "nps" },
  { narration: "MUTUAL FUND SIP", expected: "sip" },
  { narration: "DONATION TEMPLE", expected: "charity" },
  { narration: "SALON BEAUTY", expected: "personal-care" },
  { narration: "LAUNDRY SERVICE", expected: "laundry" },
  { narration: "MAINTENANCE REPAIR", expected: "home-maintenance" },
  { narration: "BANK SERVICE CHARGE", expected: "bank-fees" },
  { narration: "COURIER DELIVERY", expected: "courier" },

  // Real bank format — HDFC detailed
  { narration: "HDFC BANK NPS DEBIT", expected: "nps" },
  { narration: "HDFC BANK INSURANCE PREMIUM", expected: "insurance" },
  { narration: "HDFC BANK INTERNET BANKING TRANSFER", expected: "other" },
  { narration: "HDFC BANK METRO CARD LOAD", expected: "metro" },
  { narration: "HDFC BANK PARKING PAYMENT", expected: "parking" },
  { narration: "HDFC BANK STATIONERY SHOP", expected: "stationery" },

  // Real bank format — SBI detailed
  { narration: "SBI LIFE INSURANCE PREMIUM", expected: "insurance" },
  { narration: "SBI CARD PAYMENT", expected: "credit-card" },
  { narration: "SBI NPS CONTRIBUTION", expected: "nps" },
  { narration: "SBI SIP DEBIT", expected: "sip" },
  { narration: "SBI METRO RECHARGE", expected: "metro" },
  { narration: "SBI PARKING FEE", expected: "parking" },

  // Real bank format — ICICI detailed
  { narration: "ICICI BANK INSURANCE PREMIUM", expected: "insurance" },
  { narration: "ICICI BANK NPS CONTRIBUTION", expected: "nps" },
  { narration: "ICICI BANK SIP DEBIT", expected: "sip" },
  { narration: "ICICI BANK PARKING PAYMENT", expected: "parking" },
  { narration: "ICICI BANK METRO RECHARGE", expected: "metro" },
  { narration: "ICICI BANK STATIONERY PURCHASE", expected: "stationery" },

  // Real bank format — Axis detailed
  { narration: "AXIS BANK INSURANCE PREMIUM", expected: "insurance" },
  { narration: "AXIS BANK NPS CONTRIBUTION", expected: "nps" },
  { narration: "AXIS BANK SIP DEBIT", expected: "sip" },
  { narration: "AXIS BANK PARKING PAYMENT", expected: "parking" },
  { narration: "AXIS BANK METRO RECHARGE", expected: "metro" },

  // Real bank format — Kotak detailed
  { narration: "KOTAK BANK INSURANCE PREMIUM", expected: "insurance" },
  { narration: "KOTAK BANK NPS CONTRIBUTION", expected: "nps" },
  { narration: "KOTAK BANK SIP DEBIT", expected: "sip" },
  { narration: "KOTAK BANK PARKING PAYMENT", expected: "parking" },

  // Real bank format — Yes Bank detailed
  { narration: "YES BANK INSURANCE PREMIUM", expected: "insurance" },
  { narration: "YES BANK NPS CONTRIBUTION", expected: "nps" },
  { narration: "YES BANK SIP DEBIT", expected: "sip" },

  // Word-boundary edge cases (false positive prevention)
  { narration: "GYMKHANA CLUB membership", expected: "other" },
  { narration: "SIPPED COFFEE cafe", expected: "other" },
  { narration: "JIOCINEMA subscription", expected: "other" },
  { narration: "PREMIUM CAR WASH", expected: "other" },

  // Edge cases
  { narration: "UPI-HDFC-RENT", expected: "rent" },
  { narration: "SCHOOL FEES", expected: "other" },
  { narration: "MISC PAYMENT", expected: "other" },
];

function runAudit() {
  let passed = 0;
  let failed = 0;

  console.log("\n  🔍 Parser QA Audit\n");

  // 1. Coverage test
  const txns = GROUND_TRUTH.map((g) => ({ narration: g.narration, amount: -100 }));
  const { accuracy, categorized } = parseTransactions(txns);
  console.log(`  Coverage: ${categorized}/${txns.length} (${accuracy}%)`);
  if (accuracy >= 95) { passed++; console.log("  ✅ Coverage >= 95%"); }
  else { failed++; console.log("  ❌ Coverage < 95%"); }

  // 2. Correctness test
  let correct = 0;
  let total = 0;
  GROUND_TRUTH.forEach((g) => {
    const result = parseTransactions([{ narration: g.narration, amount: -100 }]);
    const category = result.transactions[0].parsedCategory;
    if (category === g.expected) correct++;
    total++;
  });
  const correctness = Math.round((correct / total) * 100);
  console.log(`\n  Correctness: ${correct}/${total} (${correctness}%)`);
  if (correctness >= 90) { passed++; console.log("  ✅ Correctness >= 90%"); }
  else { failed++; console.log("  ❌ Correctness < 90%"); }

  // 3. Category inventory
  const categories = listCategories();
  console.log(`\n  Categories: ${categories.length}`);
  if (categories.length >= 40) { passed++; console.log("  ✅ >= 40 categories"); }
  else { failed++; console.log("  ❌ < 40 categories"); }

  // 4. Commitment detection
  const recurringTxns = [
    { narration: "RENT PAYMENT", amount: -22000, date: "2024-01-01" },
    { narration: "RENT PAYMENT", amount: -22000, date: "2024-02-01" },
    { narration: "RENT PAYMENT", amount: -22000, date: "2024-03-01" },
    { narration: "SIP HDFC", amount: -5000, date: "2024-01-05" },
    { narration: "SIP HDFC", amount: -5000, date: "2024-02-05" },
    { narration: "SIP HDFC", amount: -5000, date: "2024-03-05" },
  ];
  const detected = detectCommitments(recurringTxns);
  console.log(`\n  Commitment detection: ${detected.length} commitments found`);
  if (detected.length >= 2) { passed++; console.log("  ✅ Detected >= 2 commitments"); }
  else { failed++; console.log("  ❌ Detected < 2 commitments"); }

  // 5. Edge cases
  const edgeCases = [
    { narration: "", amount: -100 },
    { narration: "A".repeat(500), amount: -100 },
    { narration: "ALL CAPS NARRATION", amount: -100 },
    { narration: "mixed Case Narrative", amount: -100 },
  ];
  const edgeResults = parseTransactions(edgeCases);
  console.log(`\n  Edge cases: ${edgeResults.transactions.length} handled`);
  if (edgeResults.transactions.length === edgeCases.length) { passed++; console.log("  ✅ All edge cases handled"); }
  else { failed++; console.log("  ❌ Edge case handling failed"); }

  // Summary
  console.log(`\n  ─── Results ───`);
  console.log(`  ${passed}/${passed + failed} checks passed`);
  console.log(`  ${failed > 0 ? "⚠️  Some checks failed" : "✅ All checks passed"}\n`);

  return { passed, failed, total: passed + failed };
}

runAudit();
