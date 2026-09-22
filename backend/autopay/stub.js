/**
 * Previse — AutoPay Stub
 * API-compatible UPI AutoPay mandate stub. No real money moves.
 */

const mandates = new Map();
const MANDATE_TTL_MS = 60 * 60 * 1000;

// Evict expired mandates every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of mandates) {
    if (now - new Date(val.createdAt).getTime() > MANDATE_TTL_MS) {
      mandates.delete(key);
    }
  }
}, 5 * 60 * 1000);

function setupMandate({ customerId, amount = 149, frequency = "monthly", purpose = "Pro subscription" } = {}) {
  const provider = process.env.AUTOPAY_PROVIDER;
  if (provider && provider !== "stub") {
    throw new Error(`AutoPay provider "${provider}" — sandbox approved, integration WIP. Remove env var to use stub.`);
  }

  const mandateId = `stub-mandate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const mandate = {
    mandateId,
    customerId,
    amount,
    frequency,
    purpose,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  mandates.set(mandateId, mandate);
  return mandate;
}

function getMandate(mandateId) {
  return mandates.get(mandateId) || null;
}

module.exports = { setupMandate, getMandate };
