/**
 * Previse — Frontend App v2
 * Tabs, Verdict, Validation, Firewalled math fix
 */

const API = "";

let currentMode = "cash";
let lastResult = null;

// Session Management
let hadLiveData = false;

function getSessionId() {
  return localStorage.getItem("previse-session-id");
}

function setSessionId(id) {
  localStorage.setItem("previse-session-id", id);
}

function sessionHeaders(extra = {}) {
  const sid = getSessionId();
  const headers = { ...extra };
  if (sid) headers["x-session-id"] = sid;
  return headers;
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupModeToggle();
  setupSimulate();
  setupReset();
  setupConnect();
  setupDeleteData();
  loadProfile();
});

// Tabs
function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`view-${tab.dataset.view}`).classList.add("active");
    });
  });
}

// Load Dashboard
async function loadProfile() {
  try {
    const res = await fetch(`${API}/api/profile/live`, { headers: sessionHeaders() });
    const data = await res.json();
    renderDashboard(data.state);
    renderFirewall(data.state);
    renderGoals(data.state.goals);
    renderCommitments(data.profile.commitments, data.state);
    renderProfile(data.profile, data.state);

    // Update source badge if on Connect tab
    const badge = document.getElementById("source-badge");
    if (badge) {
      if (data.source === "aa") {
        badge.textContent = "Live (AA)";
        badge.className = "source-badge live";
        hadLiveData = true;
      } else if (data.source === "csv") {
        badge.textContent = "CSV Upload";
        badge.className = "source-badge csv";
        hadLiveData = true;
      } else {
        badge.textContent = "Mock Data";
        badge.className = "source-badge";
        if (hadLiveData) {
          hadLiveData = false;
          showToast("Session expired — live data no longer available. Reconnect via AA or CSV to restore.", 6000);
        }
      }
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
  }
}

function renderDashboard(state) {
  const buffer = document.getElementById("buffer");
  const runway = document.getElementById("runway");
  const spend = document.getElementById("safetospend");

  buffer.textContent = `₹${fmt(state.buffer.total)}`;
  buffer.className = `card-value status-${state.runway.status}`;

  document.getElementById("buffer-sub").textContent =
    `After ₹${fmt(state.firewall.firewalled)} earmarked`;

  runway.textContent = state.runway.display;
  runway.className = `card-value status-${state.runway.status}`;
  document.getElementById("runway-sub").textContent =
    `${state.runway.days} days of expenses`;

  spend.textContent = `₹${fmt(state.safeToSpend.daily)}/day`;
  spend.className = `card-value status-${state.safeToSpend.status}`;
  document.getElementById("safetospend-sub").textContent =
    `Max one-time: ₹${fmt(state.safeToSpend.oneTime)}`;
}

function renderFirewall(state) {
  const balance = state.firewall.firewalled + state.buffer.total;
  const pct = balance > 0 ? (state.firewall.firewalled / balance) * 100 : 0;

  document.getElementById("firewall-earmarked").style.flex =
    `0 0 ${Math.max(18, pct)}%`;
  document.getElementById("firewall-amount").textContent =
    `₹${fmt(state.firewall.firewalled)}`;
  document.getElementById("usable-amount").textContent =
    `₹${fmt(state.buffer.total)}`;

  const breakdown = document.getElementById("firewall-breakdown");
  if (breakdown) {
    breakdown.innerHTML = `
      <span class="firewall-tag">Balance: ₹${fmt(balance)}</span>
      <span class="firewall-tag">− Earmarked: ₹${fmt(state.firewall.firewalled)}</span>
      <span class="firewall-tag">= Usable: ₹${fmt(state.buffer.total)}</span>
    `;
  }
}

function renderGoals(goals) {
  const grid = document.getElementById("goals-grid");
  grid.innerHTML = goals.map((g) => {
    const color = g.onTrack ? "var(--green)" : "var(--red)";
    return `
      <div class="goal-item">
        <div class="goal-info">
          <div class="goal-name">${g.name}</div>
          <div class="goal-amounts">
            ₹${fmt(g.currentAmount)} saved of ₹${fmt(g.targetAmount)} target
          </div>
          <div class="goal-progress-text">${g.progress}% complete · ${g.monthsToGoal} months to target</div>
        </div>
        <div class="goal-bar">
          <div class="goal-bar-fill" style="width:${Math.min(100, g.progress)}%; background:${color};"></div>
        </div>
        <div class="goal-status ${g.onTrack ? "on-track" : "delayed"}">
          ${g.onTrack ? "✓ On Track" : "⚠ Delayed"}
        </div>
      </div>
    `;
  }).join("");
}

function renderCommitments(commitments, state) {
  const active = commitments.filter((c) => c.active);
  const total = active.reduce((sum, c) => sum + c.amount, 0);

  const totalEl = document.getElementById("commitments-total");
  totalEl.innerHTML = `
    <span class="total-label">Total Monthly Outflow</span>
    <span class="total-amount">₹${fmt(total)}/mo</span>
  `;

  const list = document.getElementById("commitments-list");
  list.innerHTML = active.map((c) => `
    <div class="commitment-item">
      <span class="commitment-name">🔒 ${c.name}</span>
      <span class="commitment-amount">₹${fmt(c.amount)}/mo</span>
      <span class="commitment-day">Day ${c.dayOfMonth}</span>
    </div>
  `).join("");
}

function renderProfile(profile, state) {
  document.getElementById("profile-balance").textContent = `₹${fmt(profile.balance)}`;
  document.getElementById("profile-income").textContent = `₹${fmt(profile.monthlyInflow)}/mo`;
  document.getElementById("profile-expenses").textContent = `₹${fmt(state.monthlyExpenses)}/mo`;
  const savings = profile.monthlyInflow - state.monthlyExpenses;
  const savingsEl = document.getElementById("profile-savings");
  savingsEl.textContent = `₹${fmt(savings)}/mo`;
  savingsEl.style.color = savings > 0 ? "var(--green)" : "var(--red)";
}

// Mode Toggle
function setupModeToggle() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      document.getElementById("emi-options").style.display =
        currentMode === "cash" ? "none" : "grid";
    });
  });
}

// Simulate
function setupSimulate() {
  document.getElementById("sim-btn").addEventListener("click", runSimulation);
}

async function runSimulation() {
  const name = document.getElementById("sim-name").value.trim();
  const amount = document.getElementById("sim-amount").value;
  const errorEl = document.getElementById("sim-error");

  errorEl.style.display = "none";

  if (!name) {
    showError("Enter what you want to buy.");
    return;
  }
  if (!amount || Number(amount) <= 0) {
    showError("Enter a valid amount greater than ₹0.");
    return;
  }
  if (Number(amount) > 10000000) {
    showError("Amount seems too high. Max ₹1 crore for simulation.");
    return;
  }

  const body = {
    name,
    amount: Number(amount),
    mode: currentMode,
    emiMonths: Number(document.getElementById("sim-emi-months").value) || 12,
    interestRate: Number(document.getElementById("sim-interest").value) || 12,
  };

  const btn = document.getElementById("sim-btn");
  btn.disabled = true;
  btn.textContent = "Simulating…";

  try {
    const res = await fetch(`${API}/api/simulate`, {
      method: "POST",
      headers: sessionHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    const result = await res.json();
    lastResult = result;
    renderResults(result);

    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.querySelector('[data-view="simulator"]').classList.add("active");
    document.getElementById("view-simulator").classList.add("active");
  } catch (err) {
    console.error("Simulation failed:", err);
    showError("Simulation failed. Is the server running?");
  } finally {
    btn.disabled = false;
    btn.textContent = "Simulate →";
  }
}

function showError(msg) {
  const errorEl = document.getElementById("sim-error");
  errorEl.textContent = msg;
  errorEl.style.display = "block";
}

function renderResults(result) {
  const section = document.getElementById("results");
  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth" });

  const verdict = result.verdict;
  const verdictEl = document.getElementById("verdict");
  verdictEl.className = `verdict ${verdict.severity}`;

  const icons = {
    buy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    wait: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    emi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>'
  };
  document.getElementById("verdict-icon").innerHTML = icons[verdict.action] || "—";
  document.getElementById("verdict-action").textContent =
    verdict.action === "wait" ? "WAIT" :
    verdict.action === "emi" ? "EMI OK" :
    verdict.action === "buy" ? "SAFE TO BUY" : verdict.action.toUpperCase();
  document.getElementById("verdict-message").textContent = verdict.message;
  document.getElementById("verdict-detail").textContent = verdict.detail;

  const timerEl = document.getElementById("verdict-timer");
  if (verdict.weeksToWait && verdict.weeksToWait > 0) {
    timerEl.textContent = `⏳ Rebuild buffer in ~${verdict.weeksToWait} weeks before purchasing`;
    timerEl.style.display = "block";
  } else {
    timerEl.style.display = "none";
  }

  document.getElementById("res-before-buffer").textContent = `₹${fmt(result.before.buffer)}`;
  document.getElementById("res-before-runway").textContent = result.before.runwayDisplay;
  document.getElementById("res-before-spend").textContent = `₹${fmt(result.before.safeToSpendDaily)}/day`;

  document.getElementById("res-after-buffer").textContent = `₹${fmt(result.after.buffer)}`;
  document.getElementById("res-after-runway").textContent = result.after.runwayDisplay;
  document.getElementById("res-after-spend").textContent = `₹${fmt(result.after.safeToSpendDaily)}/day`;

  const impactEl = document.getElementById("impact-bar");
  impactEl.innerHTML = `
    <div class="impact-item">
      <span class="impact-label">Buffer Change</span>
      <span class="impact-value ${result.impact.bufferChange < 0 ? 'status-critical' : 'status-safe'}">${result.impact.bufferChange > 0 ? '+' : ''}${fmt(result.impact.bufferChange)}</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">Runway Change</span>
      <span class="impact-value status-${result.impact.runwayChange < -1 ? 'critical' : 'caution'}">
        ${result.impact.runwayChange > 0 ? '+' : ''}${result.impact.runwayChange} months
      </span>
    </div>
    <div class="impact-item">
      <span class="impact-label">Daily Spend Impact</span>
      <span class="impact-value status-${result.impact.safeToSpendChange < 0 ? 'warning' : 'safe'}">
        ${fmt(result.impact.safeToSpendChange)}
      </span>
    </div>
  `;

  const emiSection = document.getElementById("emi-details");
  if (result.proposal.emiDetails) {
    emiSection.style.display = "block";
    const emi = result.proposal.emiDetails;
    document.getElementById("emi-monthly").textContent = `₹${fmt(emi.monthlyEMI)}`;
    document.getElementById("emi-tenure").textContent = `${emi.tenure} months`;
    document.getElementById("emi-total").textContent = `₹${fmt(emi.totalPayable)}`;
    document.getElementById("emi-interest").textContent = `₹${fmt(emi.totalInterest)}`;
  } else {
    emiSection.style.display = "none";
  }

  const goalEl = document.getElementById("goal-impact");
  if (result.goalImpact && result.goalImpact.length > 0) {
    const hasImpact = result.goalImpact.some((g) => g.delayMonths > 0);
    goalEl.innerHTML = `
      <h3>🎯 Goal Impact</h3>
      ${result.goalImpact.map((g) => `
        <div class="goal-impact-item">
          <span>${g.name}</span>
          <span class="${g.delayMonths > 0 ? 'status-critical' : 'status-safe'}">
            ${g.delayMonths > 0 ? `Delayed ${g.delayMonths} months` : 'No impact'}
          </span>
        </div>
      `).join("")}
    `;
  } else {
    goalEl.innerHTML = "";
  }

  const cashBtn = document.getElementById("switch-to-cash");
  const emiBtn = document.getElementById("switch-to-emi");
  if (result.proposal.mode === "cash") {
    cashBtn.style.display = "none";
    emiBtn.style.display = "block";
    emiBtn.onclick = () => switchMode("emi");
  } else {
    cashBtn.style.display = "block";
    emiBtn.style.display = "none";
    cashBtn.onclick = () => switchMode("cash");
  }
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll(".mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  document.getElementById("emi-options").style.display =
    mode === "cash" ? "none" : "grid";
  runSimulation();
}

// Reset
function setupReset() {
  document.getElementById("sim-again-btn").addEventListener("click", () => {
    document.getElementById("results").style.display = "none";
    document.getElementById("sim-name").value = "";
    document.getElementById("sim-amount").value = "";
    document.getElementById("sim-error").style.display = "none";

    currentMode = "cash";
    document.querySelectorAll(".mode-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === "cash");
    });
    document.getElementById("emi-options").style.display = "none";
    document.getElementById("sim-emi-months").value = "12";
    document.getElementById("sim-interest").value = "12";

    document.getElementById("simulator").scrollIntoView({ behavior: "smooth" });
  });
}

// Delete My Data (DPDP compliance)
function setupDeleteData() {
  const btn = document.getElementById("delete-data-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all your data?\n\nThis will remove:\n- Your profile and financial data\n- Connected bank accounts\n- Transaction history\n\nThis action cannot be undone."
    );
    if (!confirmed) return;

    btn.disabled = true;
    btn.textContent = "Deleting...";

    try {
      const res = await fetch(`${API}/api/user/data`, {
        method: "DELETE",
        headers: sessionHeaders(),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("previse-session-id");
        showToast("All your data has been deleted.", 4000);
        // Reload to mock data
        loadProfile();
      } else {
        showToast(data.error || "Failed to delete data.", 4000);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("Failed to delete data. Is the server running?", 4000);
    } finally {
      btn.disabled = false;
      btn.textContent = "Delete My Data";
    }
  });
}

// Connect (Phase 2 — AA + CSV)
let currentConsentId = null;
let currentSessionToken = null;

function setupConnect() {
  document.getElementById("aa-consent-btn").addEventListener("click", startAAConsent);
  document.getElementById("aa-approve-btn").addEventListener("click", approveAAConsent);
  document.getElementById("aa-fetch-btn").addEventListener("click", fetchAAData);

  const fileInput = document.getElementById("csv-file");
  const dropzone = document.getElementById("csv-dropzone");

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) uploadCSV(e.target.files[0]);
  });

  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--primary)"; });
  dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "var(--border)"; });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--border)";
    if (e.dataTransfer.files.length) uploadCSV(e.dataTransfer.files[0]);
  });

  checkDataSource();
}

async function checkDataSource() {
  try {
    const res = await fetch(`${API}/api/profile/live`, { headers: sessionHeaders() });
    const data = await res.json();
    const badge = document.getElementById("source-badge");

    if (data.source === "aa") {
      badge.textContent = "Live (AA)";
      badge.className = "source-badge live";
    } else if (data.source === "csv") {
      badge.textContent = "CSV Upload";
      badge.className = "source-badge csv";
    } else {
      badge.textContent = "Mock Data";
      badge.className = "source-badge";
    }
  } catch (err) {
    console.error("Failed to check data source:", err);
  }
}

async function startAAConsent() {
  const errEl = document.getElementById("aa-error");
  errEl.style.display = "none";

  const btn = document.getElementById("aa-consent-btn");
  btn.disabled = true;
  btn.textContent = "Requesting...";

  try {
    const res = await fetch(`${API}/api/aa/consent`, {
      method: "POST",
      headers: sessionHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ purpose: "Financial simulation" }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    currentConsentId = data.consentId;
    currentSessionToken = data.sessionToken;
    document.getElementById("consent-id").textContent = `Consent ID: ${data.consentId}`;
    document.getElementById("aa-step-1").querySelector(".step-num").textContent = "✓";
    document.getElementById("aa-step-2").style.display = "flex";
    btn.style.display = "none";
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Connect via AA →";
  }
}

async function approveAAConsent() {
  const errEl = document.getElementById("aa-error");
  errEl.style.display = "none";

  const btn = document.getElementById("aa-approve-btn");
  btn.disabled = true;
  btn.textContent = "Approving...";

  try {
    const res = await fetch(`${API}/api/aa/consent/${currentConsentId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: currentSessionToken }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    document.getElementById("aa-step-2").querySelector(".step-num").textContent = "✓";
    document.getElementById("aa-step-3").style.display = "flex";
    btn.style.display = "none";
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Approve Consent →";
  }
}

async function fetchAAData() {
  const errEl = document.getElementById("aa-error");
  errEl.style.display = "none";

  const btn = document.getElementById("aa-fetch-btn");
  btn.disabled = true;
  btn.textContent = "Fetching...";

  try {
    const res = await fetch(`${API}/api/aa/fetch`, {
      method: "POST",
      headers: sessionHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ consentId: currentConsentId, sessionToken: currentSessionToken }),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (data.sessionId) setSessionId(data.sessionId);

    document.getElementById("aa-step-3").querySelector(".step-num").textContent = "✓";
    document.getElementById("aa-step-done").style.display = "flex";
    document.getElementById("aa-fetch-result").textContent =
      `Fetched ${data.accounts.length} accounts, ${data.transactions.length} transactions. ` +
      `Coverage: ${data.meta.parsingAccuracy}% | Expenses: ₹${fmt(data.meta.monthlyExpenses)}/mo`;
    btn.style.display = "none";

    if (data.meta.warnings && data.meta.warnings.length) {
      const warnEl = document.getElementById("aa-error");
      warnEl.textContent = "Warning: " + data.meta.warnings.join(" | ");
      warnEl.style.display = "block";
      warnEl.style.background = "var(--yellow-bg)";
      warnEl.style.borderColor = "rgba(234, 179, 8, 0.4)";
      warnEl.style.color = "var(--yellow)";
    }

    const badge = document.getElementById("source-badge");
    badge.textContent = "Live (AA)";
    badge.className = "source-badge live";

    loadProfile();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Fetch My Data →";
  }
}

async function uploadCSV(file) {
  const errEl = document.getElementById("csv-error");
  const progressEl = document.getElementById("csv-progress");
  const resultEl = document.getElementById("csv-result");
  const dropzone = document.getElementById("csv-dropzone");

  errEl.style.display = "none";
  resultEl.style.display = "none";

  if (!file.name.endsWith(".csv")) {
    errEl.textContent = "Please upload a .csv file";
    errEl.style.display = "block";
    return;
  }

  dropzone.style.display = "none";
  progressEl.style.display = "flex";

  const formData = new FormData();
  formData.append("statement", file);

  const balanceInput = document.getElementById("csv-balance");
  const balance = balanceInput ? balanceInput.value.trim() : "";
  if (balance) formData.append("balance", balance);

  try {
    const res = await fetch(`${API}/api/upload/csv`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (data.sessionId) setSessionId(data.sessionId);

    progressEl.style.display = "none";
    resultEl.style.display = "block";
    resultEl.textContent =
      `Parsed ${data.meta.parsedCount} transactions. ` +
      `Coverage: ${data.meta.parsingAccuracy}% | Expenses: ₹${fmt(data.meta.monthlyExpenses)}/mo | ` +
      `${data.meta.accountsCount} account(s)`;

    if (data.meta.warnings && data.meta.warnings.length) {
      errEl.textContent = "Warning: " + data.meta.warnings.join(" | ");
      errEl.style.display = "block";
      errEl.style.background = "var(--yellow-bg)";
      errEl.style.borderColor = "rgba(234, 179, 8, 0.4)";
      errEl.style.color = "var(--yellow)";
    }

    const badge = document.getElementById("source-badge");
    badge.textContent = "CSV Upload";
    badge.className = "source-badge csv";

    loadProfile();
  } catch (err) {
    progressEl.style.display = "none";
    dropzone.style.display = "flex";
    errEl.textContent = err.message;
    errEl.style.display = "block";
  }
}

// Helpers
function fmt(n) {
  return Number(n).toLocaleString("en-IN");
}

function showToast(msg, duration = 5000) {
  let toast = document.getElementById("previse-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "previse-toast";
    toast.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(248,113,113,0.95);color:#fff;padding:0.75rem 1.5rem;border-radius:10px;font-size:0.85rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:opacity 0.3s;backdrop-filter:blur(10px);";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, duration);
}
