/**
 * Previse — Purchase Simulator
 * Simulates impact of cash/EMI/loan purchases on financial state
 */

const { calculateFinancialState } = require("./rules");

function calculateEMI(principal, months, annualRate) {
  if (annualRate === 0) return Math.ceil(principal / months);
  const r = annualRate / 12 / 100;
  const emi = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  return Math.ceil(emi);
}

function simulate(profile, proposal) {
  const { name, amount, mode, emiMonths, interestRate } = proposal;
  const dayOfMonth = new Date().getDate();

  // BEFORE state
  const before = calculateFinancialState(profile, dayOfMonth);

  // Create modified profile based on mode
  let modifiedProfile = { ...profile };

  if (mode === "cash") {
    modifiedProfile.balance = profile.balance - amount;
  } else if (mode === "emi") {
    const monthlyEMI = calculateEMI(amount, emiMonths, interestRate);
    modifiedProfile.commitments = [
      ...profile.commitments,
      { name: `EMI: ${name}`, amount: monthlyEMI, type: "recurring", dayOfMonth: 1, active: true },
    ];
  } else if (mode === "loan") {
    modifiedProfile.balance = profile.balance + amount;
    const monthlyEMI = calculateEMI(amount, emiMonths, interestRate);
    modifiedProfile.commitments = [
      ...profile.commitments,
      { name: `Loan EMI: ${name}`, amount: monthlyEMI, type: "recurring", dayOfMonth: 1, active: true },
    ];
  }

  // AFTER state
  const after = calculateFinancialState(modifiedProfile, dayOfMonth);

  // Calculate EMI details for EMI/Loan modes
  let emiDetails = null;
  if (mode === "emi" || mode === "loan") {
    const monthlyEMI = calculateEMI(amount, emiMonths, interestRate);
    const totalPayable = monthlyEMI * emiMonths;
    emiDetails = {
      monthlyEMI,
      tenure: emiMonths,
      totalPayable,
      totalInterest: totalPayable - amount,
    };
  }

  // Calculate deltas
  const impact = {
    bufferChange: after.buffer.total - before.buffer.total,
    runwayChange: Math.round((after.runway.months - before.runway.months) * 10) / 10,
    safeToSpendChange: after.safeToSpend.daily - before.safeToSpend.daily,
  };

  // Goal impact
  const goalImpact = (before.goals || []).map((g, i) => ({
    name: g.name,
    delayMonths: after.goals[i] ? Math.max(0, after.goals[i].monthsToGoal - g.monthsToGoal) : 0,
  }));

  // Generate verdict
  const verdict = generateVerdict(before, after, impact, emiDetails);

  return {
    proposal: { name, amount, mode, emiMonths, interestRate, emiDetails },
    before: {
      buffer: before.buffer.total,
      runwayDisplay: before.runway.display,
      runwayMonths: before.runway.months,
      safeToSpendDaily: before.safeToSpend.daily,
    },
    after: {
      buffer: after.buffer.total,
      runwayDisplay: after.runway.display,
      runwayMonths: after.runway.months,
      safeToSpendDaily: after.safeToSpend.daily,
    },
    impact,
    verdict,
    goalImpact,
    profileSource: "mock",
  };
}

function generateVerdict(before, after, impact, emiDetails) {
  // Rule 1: Critical — after runway < 1 month (always blocks)
  if (after.runway.months < 1) {
    const weeksToWait = Math.ceil((1 - after.runway.months) * 4);
    return {
      action: "wait",
      severity: "critical",
      message: "This would leave you broke within weeks.",
      detail: `Your runway drops to ${after.runway.display}. You need at least 1 month of expenses as buffer.`,
      weeksToWait,
    };
  }

  // Rule 2: Warning — after runway < 2 months (all modes, incl. EMI)
  // Must run BEFORE the EMI affordability check, else an affordable EMI
  // with collapsed runway wrongly returns EMI/safe.
  if (after.runway.months < 2) {
    const weeksToWait = Math.ceil((2 - after.runway.months) * 4);
    return {
      action: "wait",
      severity: "warning",
      message: "This is risky — less than 2 months of runway.",
      detail: `Your runway drops to ${after.runway.display}. Wait until you have at least 2 months buffer.`,
      weeksToWait,
    };
  }

  // Rule 3: EMI/Loan — check affordability
  // NOTE: "Rs." (ASCII) instead of ₹ in API strings — non-UTF-8 clients
  // (PowerShell 5.1, some curl builds) render ₹ as "?". Browser UI keeps ₹.
  if (emiDetails) {
    const monthlyIncome = before.runway.months > 0 ? before.buffer.total / before.runway.months : 0;
    if (monthlyIncome > 0 && (emiDetails.monthlyEMI / monthlyIncome) > 0.3) {
      return {
        action: "wait",
        severity: "warning",
        message: "EMI is too high relative to your income.",
        detail: `Rs. ${emiDetails.monthlyEMI.toLocaleString("en-IN")}/mo EMI exceeds 30% of your monthly income.`,
        weeksToWait: 0,
      };
    }
    return {
      action: "emi",
      severity: "safe",
      message: "EMI is affordable within your budget.",
      detail: `Rs. ${emiDetails.monthlyEMI.toLocaleString("en-IN")}/mo for ${emiDetails.tenure} months. Total interest: Rs. ${emiDetails.totalInterest.toLocaleString("en-IN")}.`,
      weeksToWait: 0,
    };
  }

  // Rule 4: Caution — high-priority goal delayed >= 2 months
  const goalDelayed = (before.goals || []).some((g, i) => {
    const afterGoal = after.goals[i];
    return afterGoal && (afterGoal.monthsToGoal - g.monthsToGoal) >= 2;
  });
  if (goalDelayed) {
    return {
      action: "wait",
      severity: "caution",
      message: "This delays your financial goals significantly.",
      detail: "One or more goals are delayed by 2+ months. Consider waiting or reducing the amount.",
      weeksToWait: 0,
    };
  }

  // Rule 5: Safe — after runway >= 3 months
  if (after.runway.months >= 3) {
    return {
      action: "buy",
      severity: "safe",
      message: "Safe to buy — your finances can handle this.",
      detail: `Runway stays at ${after.runway.display} after purchase. Buffer remains healthy.`,
      weeksToWait: 0,
    };
  }

  // Rule 6: Caution — after runway 2-3 months
  return {
    action: "buy",
    severity: "caution",
    message: "You can buy this, but be cautious.",
    detail: `Runway drops to ${after.runway.display}. Consider building more buffer first.`,
    weeksToWait: 0,
  };
}

module.exports = { simulate, calculateEMI };
