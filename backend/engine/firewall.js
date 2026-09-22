/**
 * Previse — Financial Firewall
 * Earmarks committed expenses before calculating usable balance
 */

function calculateFirewall(commitments, dayOfMonth) {
  const active = commitments.filter((c) => c.active);
  const dueThisMonth = active.filter((c) => c.dayOfMonth <= dayOfMonth);
  const upcoming = active.filter((c) => c.dayOfMonth > dayOfMonth);

  const firewalled = dueThisMonth.reduce((sum, c) => sum + c.amount, 0);
  const upcomingTotal = upcoming.reduce((sum, c) => sum + c.amount, 0);

  return { firewalled, upcomingTotal, dueThisMonth: dueThisMonth.length, upcomingCount: upcoming.length };
}

function applyFirewall(balance, commitments, dayOfMonth) {
  const { firewalled } = calculateFirewall(commitments, dayOfMonth);
  const usableBalance = Math.max(0, balance - firewalled);
  return { usableBalance, firewalled };
}

module.exports = { calculateFirewall, applyFirewall };
