/**
 * Previse — Transaction Parser
 * Keyword-rule categorization engine with 50+ categories
 */

const CATEGORIES = [
  // Income
  { name: "salary", patterns: [/salary/i, /payroll/i, /wages/i], type: "income" },
  { name: "freelance", patterns: [/freelance/i, /contract/i, /gig/i], type: "income" },
  { name: "dividend", patterns: [/dividend/i], type: "income" },
  { name: "interest", patterns: [/interest earned/i, /credit interest/i], type: "income" },
  { name: "refund", patterns: [/refund/i, /reversed/i], type: "income" },
  { name: "transfer-in", patterns: [/transfer.*credit/i, /neft.*credit/i, /imps.*credit/i, /upi.*credit/i], type: "income" },

  // Utilities
  { name: "electricity", patterns: [/electricity/i, /bescom/i, /adani electricity/i, /tata power/i], type: "expense" },
  { name: "water", patterns: [/water bill/i, /bwssb/i], type: "expense" },
  { name: "gas", patterns: [/gas bill/i, /lpg/i, /indane/i, /bharat gas/i], type: "expense" },
  { name: "internet", patterns: [/internet/i, /broadband/i, /jio fiber/i, /airtel fiber/i], type: "expense" },
  { name: "mobile", patterns: [/mobile.*recharge/i, /jio prepaid/i, /airtel prepaid/i, /vi prepaid/i], type: "expense" },

  // Housing
  { name: "rent", patterns: [/rent/i, /house rent/i, /flat rent/i], type: "expense" },

  // Subscriptions
  { name: "gym", patterns: [/\bgym\b/i, /fitness/i, /cult\.fit/i, /gold.*gym/i], type: "expense" },
  { name: "netflix", patterns: [/netflix/i], type: "expense" },
  { name: "ott", patterns: [/hotstar/i, /prime video/i, /zee5/i, /sonyliv/i, /voot/i, /jio cinema/i, /jiocinema/i], type: "expense" },
  { name: "amazon-prime", patterns: [/amazon prime/i], type: "expense" },
  { name: "music", patterns: [/spotify/i, /apple music/i, /gaana/i, /wynk/i], type: "expense" },
  { name: "software", patterns: [/adobe/i, /microsoft 365/i, /canva/i, /notion/i], type: "expense" },
  { name: "subscription", patterns: [/subscription/i, /monthly plan/i], type: "expense" },

  // Food
  { name: "food-delivery", patterns: [/swiggy/i, /zomato/i, /food.*delivery/i], type: "expense" },
  { name: "grocery", patterns: [/bigbasket/i, /blinkit/i, /zepto/i, /instamart/i, /dmart/i, /reliance fresh/i], type: "expense" },
  { name: "dineout", patterns: [/restaurant/i, /cafe/i, /dineout/i, /eating house/i], type: "expense" },

  // Investments
  { name: "sip", patterns: [/\bsip\b/i, /systematic investment/i], type: "expense" },
  { name: "mutual-fund", patterns: [/mutual fund/i, /nippon/i, /hdfc amc/i, /icici prudential/i], type: "expense" },
  { name: "insurance", patterns: [/insurance/i, /life premium/i, /lic/i, /health insurance/i], type: "expense" },
  { name: "nps", patterns: [/nps/i, /national pension/i], type: "expense" },

  // EMIs (specific before generic)
  { name: "phone-emi", patterns: [/phone emi/i, /mobile emi/i, /iphone emi/i], type: "expense" },
  { name: "home-loan", patterns: [/home loan/i, /housing loan/i], type: "expense" },
  { name: "car-loan", patterns: [/car loan/i, /auto loan/i, /vehicle loan/i], type: "expense" },
  { name: "education-loan", patterns: [/education loan/i, /student loan/i], type: "expense" },
  { name: "personal-loan", patterns: [/personal loan/i, /loan emi/i], type: "expense" },
  { name: "emi", patterns: [/\bemi\b/i], type: "expense" },

  // Credit cards
  { name: "credit-card", patterns: [/credit card/i, /cc payment/i, /card payment/i], type: "expense" },

  // Healthcare
  { name: "hospital", patterns: [/hospital/i, /clinic/i, /apollo/i, /fortis/i, /max healthcare/i], type: "expense" },
  { name: "pharmacy", patterns: [/pharmacy/i, /medicine/i, /chemist/i, /apollo pharmacy/i, /medplus/i], type: "expense" },

  // Travel
  { name: "cab", patterns: [/uber/i, /ola/i, /rapido/i, /cab/i], type: "expense" },
  { name: "bike-rental", patterns: [/bike rental/i, /bounc/i, /vogo/i], type: "expense" },
  { name: "train", patterns: [/irctc/i, /train/i, /railway/i], type: "expense" },
  { name: "flight", patterns: [/indigo/i, /spicejet/i, /air india/i, /vistara/i, /akasa/i, /flight/i], type: "expense" },
  { name: "metro", patterns: [/metro/i, /delhi metro/i, /bangalore metro/i], type: "expense" },
  { name: "fuel", patterns: [/petrol/i, /diesel/i, /fuel/i, /hpcl/i, /bpcl/i, /\bioc\b/i], type: "expense" },
  { name: "parking", patterns: [/parking/i], type: "expense" },

  // Shopping
  { name: "online-shopping", patterns: [/amazon/i, /flipkart/i, /meesho/i, /ajio/i, /myntra/i], type: "expense" },
  { name: "electronics", patterns: [/croma/i, /reliance digital/i, /electronics/i], type: "expense" },
  { name: "sports", patterns: [/decathlon/i, /sports/i], type: "expense" },
  { name: "furniture", patterns: [/ikea/i, /pepperfry/i, /urban ladder/i, /furniture/i], type: "expense" },

  // Government/Tax
  { name: "gst", patterns: [/gst/i, /goods.*services.*tax/i], type: "expense" },
  { name: "income-tax", patterns: [/income tax/i, /tax payment/i, /advance tax/i], type: "expense" },
  { name: "government", patterns: [/government.*fee/i, /court fee/i, /stamp duty/i], type: "expense" },

  // Entertainment
  { name: "entertainment", patterns: [/movie/i, /pvr/i, /inox/i, /bookmyshow/i, /entertainment/i], type: "expense" },

  // Wallets
  { name: "paytm", patterns: [/paytm/i], type: "expense" },
  { name: "phonepe", patterns: [/phonepe/i, /phone pe/i], type: "expense" },
  { name: "gpay", patterns: [/gpay/i, /google pay/i], type: "expense" },

  // Personal
  { name: "pet", patterns: [/pet.*food/i, /pet.*store/i, /veterinary/i], type: "expense" },
  { name: "charity", patterns: [/donation/i, /charity/i, /temple/i, /church/i, /mosque/i], type: "expense" },
  { name: "personal-care", patterns: [/salon/i, /beauty/i, /parlour/i, /grooming/i], type: "expense" },
  { name: "laundry", patterns: [/laundry/i, /dry clean/i], type: "expense" },
  { name: "home-maintenance", patterns: [/maintenance/i, /repair/i, /plumber/i, /electrician/i], type: "expense" },
  { name: "bank-fees", patterns: [/bank.*charge/i, /service charge/i, /maintenance fee/i, /atm.*charge/i], type: "expense" },
  { name: "stationery", patterns: [/stationery/i, /pen/i, /notebook/i], type: "expense" },
  { name: "courier", patterns: [/courier/i, /delivery.*charge/i, /shipping/i], type: "expense" },
];

function categorize(narration) {
  if (!narration || typeof narration !== "string") return { category: "other", type: "unknown" };
  const text = narration.trim();
  for (const cat of CATEGORIES) {
    for (const pattern of cat.patterns) {
      if (pattern.test(text)) {
        return { category: cat.name, type: cat.type };
      }
    }
  }
  return { category: "other", type: "unknown" };
}

function normalizeTxnType(raw, amount) {
  const s = String(raw == null ? "" : raw).trim().toLowerCase().replace(/\./g, "");
  const credit = new Set(["credit", "credited", "cr", "c", "inflow", "deposit", "deposited", "received", "refund", "reversed"]);
  const debit = new Set(["debit", "debited", "dr", "d", "outflow", "withdrawal", "withdrawn", "paid", "expense", "purchase", "spent", "wd"]);
  if (credit.has(s)) return "credit";
  if (debit.has(s)) return "debit";
  return amount < 0 ? "debit" : "credit";
}

function parseTransactions(transactions) {
  let categorized = 0;
  let total = 0;
  const warnings = [];

  const parsed = transactions.map((txn) => {
    total++;
    const { category, type } = categorize(txn.narration);
    if (category !== "other") categorized++;

    // Defense-in-depth: normalize type (case-insensitive, cr/dr variants) and
    // sign the amount by type, so all-positive-amount CSVs classify correctly
    const txnType = normalizeTxnType(txn.type, txn.amount);
    const amount = Math.abs(txn.amount);
    const signedAmount = txnType === "credit" ? amount : -amount;

    return {
      ...txn,
      amount: signedAmount,
      type: txnType,
      parsedCategory: category,
      parsedType: txnType,
      parsedAmount: amount,
    };
  });

  const accuracy = total > 0 ? Math.round((categorized / total) * 100) : 0;
  if (accuracy < 95) warnings.push(`Low categorization accuracy: ${accuracy}%`);

  return { transactions: parsed, accuracy, categorized, total, warnings };
}

function detectMonthlyInflow(transactions) {
  const credits = transactions
    .filter((t) => t.amount > 0)
    .map((t) => t.amount)
    .sort((a, b) => a - b);

  if (credits.length === 0) return 0;
  const median = credits[Math.floor(credits.length / 2)];
  return Math.round(median);
}

function detectCommitments(transactions) {
  const debits = transactions.filter((t) => t.amount < 0);
  const byNarration = {};

  debits.forEach((d) => {
    const key = d.narration.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (!byNarration[key]) byNarration[key] = [];
    byNarration[key].push({ amount: Math.abs(d.amount), date: d.date });
  });

  const commitments = [];
  for (const [key, items] of Object.entries(byNarration)) {
    if (items.length >= 2) {
      const amounts = items.map((i) => i.amount).sort((a, b) => a - b);
      const median = amounts[Math.floor(amounts.length / 2)];
      commitments.push({
        name: key.split(" ").slice(0, 3).join(" "),
        amount: median,
        occurrences: items.length,
        type: "recurring",
        dayOfMonth: 1,
        active: true,
      });
    }
  }

  return commitments;
}

function listCategories() {
  return CATEGORIES.map((c) => c.name);
}

module.exports = { categorize, parseTransactions, detectMonthlyInflow, detectCommitments, listCategories, CATEGORIES };
