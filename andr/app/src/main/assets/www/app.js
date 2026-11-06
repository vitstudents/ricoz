// LedgerAI Mobile App Logic
const API_BASE = "https://work-hazel-one.vercel.app/api/v1";

let state = {
  currentTab: "overview",
  kpi: {
    unreconciled: 14,
    anomalies: 6,
    journals: 3,
    cashUsd: 1428500.0,
    compliance: 98.4
  },
  transactions: [
    { id: "1", date: "2026-11-06", desc: "AWS Cloud Infrastructure", amt: -1450.00, curr: "USD", cat: "Cloud Hosting (6040)" },
    { id: "2", date: "2026-11-05", desc: "Stripe Merchant Payout", amt: 18450.00, curr: "USD", cat: "SaaS Revenue (4010)" },
    { id: "3", date: "2026-11-05", desc: "SAP Enterprise License", amt: -4200.00, curr: "EUR", cat: "Software (6020)" },
    { id: "4", date: "2026-11-04", desc: "London Office Lease", amt: -6800.00, curr: "GBP", cat: "Rent & Facilities (6010)" },
    { id: "5", date: "2026-11-04", desc: "Infosys Engineering Contract", amt: -350000.00, curr: "INR", cat: "Contractors (6050)" }
  ],
  anomalies: [
    { id: "a1", type: "duplicate", sev: "high", desc: "Potential duplicate subscription charge ($450.00)", status: "open" },
    { id: "a2", type: "amount_spike", sev: "med", desc: "Vendor invoice 3.8x above 90-day average ($3,800.00)", status: "open" },
    { id: "a3", type: "gaap_violation", sev: "high", desc: "Capital equipment flagged as operating expense ($12,500.00)", status: "open" }
  ]
};

function init() {
  setupNavigation();
  setupBiometrics();
  renderTab("overview");
  fetchCloudData();
}

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      state.currentTab = tab;
      renderTab(tab);
      if (window.LedgerNative && window.LedgerNative.vibrate) {
        window.LedgerNative.vibrate(25);
      }
    });
  });
}

function setupBiometrics() {
  const btn = document.getElementById("btnBiometric");
  btn.addEventListener("click", () => {
    if (window.LedgerNative && window.LedgerNative.requestBiometricJournalApproval) {
      window.LedgerNative.requestBiometricJournalApproval("JE-2026-11-001");
    } else {
      alert("CPA Biometric Identity Verified! Journal Entry JE-2026-11-001 approved.");
    }
  });
}

async function fetchCloudData() {
  try {
    const res = await fetch(`${API_BASE}/overview/summary`);
    if (res.ok) {
      const data = await res.json();
      state.kpi.unreconciled = data.unreconciled_count || state.kpi.unreconciled;
      state.kpi.anomalies = data.open_anomalies_count || state.kpi.anomalies;
      state.kpi.cashUsd = data.total_cash_usd || state.kpi.cashUsd;
      renderTab(state.currentTab);
    }
  } catch (e) {
    console.log("Offline mode, using cached ledger figures");
  }
}

function renderTab(tab) {
  const container = document.getElementById("mainContent");
  if (tab === "overview") {
    container.innerHTML = `
      <div class="card">
        <div class="card-title">Total Multi-Currency Cash Balance</div>
        <div class="card-hero-val">$${state.kpi.cashUsd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD</div>
        <div class="kpi-grid">
          <div>
            <div class="kpi-stat-lbl">Unreconciled</div>
            <div class="kpi-stat-val" style="color: var(--warning)">${state.kpi.unreconciled}</div>
          </div>
          <div>
            <div class="kpi-stat-lbl">Anomalies</div>
            <div class="kpi-stat-val" style="color: var(--danger)">${state.kpi.anomalies}</div>
          </div>
          <div>
            <div class="kpi-stat-lbl">GAAP Health</div>
            <div class="kpi-stat-val" style="color: var(--success)">${state.kpi.compliance}%</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Autonomous Close Actions</div>
        <button id="btnPostJournals" class="btn-primary">
          <span>🔒 Post Month-End Closing Journals (CPA Gate)</span>
        </button>
      </div>

      <div class="card">
        <div class="card-title">Connected Institutional Vaults</div>
        <div class="tx-row">
          <div>
            <div class="tx-desc">Silicon Valley Bank (SVB)</div>
            <div class="tx-sub">USD Operating • API Active</div>
          </div>
          <div class="tx-amt pos">$850,000.00</div>
        </div>
        <div class="tx-row">
          <div>
            <div class="tx-desc">Deutsche Bank</div>
            <div class="tx-sub">EUR Operating • API Active</div>
          </div>
          <div class="tx-amt">€320,000.00</div>
        </div>
        <div class="tx-row">
          <div>
            <div class="tx-desc">Barclays UK</div>
            <div class="tx-sub">GBP Operating • API Active</div>
          </div>
          <div class="tx-amt">£145,000.00</div>
        </div>
      </div>
    `;

    document.getElementById("btnPostJournals")?.addEventListener("click", () => {
      document.getElementById("btnBiometric").click();
    });

  } else if (tab === "transactions") {
    container.innerHTML = `
      <div class="card">
        <div class="card-title">Multi-Currency Transaction Stream (${state.transactions.length})</div>
        ${state.transactions.map(tx => `
          <div class="tx-row">
            <div>
              <div class="tx-desc">${tx.desc}</div>
              <div class="tx-sub">${tx.date} • ${tx.cat}</div>
            </div>
            <div class="tx-amt ${tx.amt >= 0 ? 'pos' : 'neg'}">
              ${tx.amt >= 0 ? '+' : ''}${tx.amt.toLocaleString()} ${tx.curr}
            </div>
          </div>
        `).join("")}
      </div>
    `;

  } else if (tab === "reconciliation") {
    container.innerHTML = `
      <div class="card" style="border-color: var(--secondary)">
        <div class="tag" style="background: rgba(6,182,212,0.2); color: #67e8f9; margin-bottom: 8px;">99.4% Match Suggested</div>
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Bank Payout vs Stripe Settlement</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
          Bank deposit #DEP-9912 of $18,450.00 matches Batch #ST-8821 in Accounts Receivable.
        </div>
        <button class="btn-primary" style="background: var(--success)" onclick="alert('Match approved and committed to ledger!')">
          Approve Match & Lock Audit Trail
        </button>
      </div>
    `;

  } else if (tab === "anomalies") {
    container.innerHTML = `
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">Autonomous Fraud & Anomaly Watch</div>
      ${state.anomalies.map(a => `
        <div class="card" style="border-left: 4px solid ${a.sev === 'high' ? 'var(--danger)' : 'var(--warning)'}">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="tag ${a.sev}">${a.sev.toUpperCase()} SEVERITY</span>
            <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${a.type}</span>
          </div>
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">${a.desc}</div>
          <div style="display: flex; gap: 8px;">
            <button style="flex: 1; padding: 8px; border-radius: 8px; background: var(--card-color); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 12px; cursor: pointer;" onclick="dismissAnomaly('${a.id}')">Dismiss</button>
            <button style="flex: 1; padding: 8px; border-radius: 8px; background: var(--danger); border: none; color: white; font-size: 12px; font-weight: 600; cursor: pointer;" onclick="alert('Flagged for CPA investigation.')">Audit Flag</button>
          </div>
        </div>
      `).join("")}
    `;

  } else if (tab === "assistant") {
    container.innerHTML = `
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">LedgerAI Autonomous Copilot</div>
      <div class="chat-bubble">
        👋 Hello! I am your Autonomous Continuous Bookkeeper. Ask me about cash positions, ASC 830 foreign exchange revaluations, trial balance discrepancies, or SOX audit logs.
      </div>
      <div id="chatHistory"></div>
      <div class="input-box">
        <input id="chatInput" type="text" placeholder="Ask financial question..." />
        <button id="btnSendChat">Send</button>
      </div>
      <div style="margin-top: 14px;">
        <button class="btn-primary" style="background: var(--surface-color); border: 1px solid var(--border-color); color: var(--secondary); margin-bottom: 6px;" onclick="sendSamplePrompt('What is our multi-currency balance across USD, EUR, GBP, INR?')">
          "What is our multi-currency balance across all vaults?"
        </button>
        <button class="btn-primary" style="background: var(--surface-color); border: 1px solid var(--border-color); color: var(--secondary);" onclick="sendSamplePrompt('Are there any duplicate SaaS charges this month?')">
          "Are there any duplicate SaaS charges this month?"
        </button>
      </div>
    `;

    document.getElementById("btnSendChat")?.addEventListener("click", () => {
      const input = document.getElementById("chatInput");
      if (input && input.value.trim()) {
        sendSamplePrompt(input.value.trim());
        input.value = "";
      }
    });
  }
}

function sendSamplePrompt(prompt) {
  const history = document.getElementById("chatHistory");
  if (!history) return;

  history.innerHTML += `
    <div class="chat-bubble" style="background: var(--primary); color: white; margin-left: 24px; text-align: right;">
      ${prompt}
    </div>
    <div class="chat-bubble" style="color: var(--secondary); font-style: italic;">
      Analyzing General Ledger & ASC 830 conversion rates...
    </div>
  `;

  setTimeout(() => {
    history.innerHTML = history.innerHTML.replace("Analyzing General Ledger & ASC 830 conversion rates...", `
      <strong>Autonomous Ledger Analysis:</strong><br>
      Total consolidated vault balance is <strong>$1,428,500.00 USD</strong>. All foreign currency transactions (EUR @ 1.08, GBP @ 1.26, INR @ 0.012) have been translated under ASC 830 with zero trial balance variance.
    `);
  }, 600);
}

function dismissAnomaly(id) {
  state.anomalies = state.anomalies.filter(a => a.id !== id);
  const badge = document.getElementById("anomalyBadge");
  if (badge) badge.innerText = state.anomalies.length;
  renderTab("anomalies");
  if (window.LedgerNative && window.LedgerNative.showToast) {
    window.LedgerNative.showToast("Anomaly dismissed from active watch list");
  }
}

window.addEventListener("DOMContentLoaded", init);
