# Product Requirements Document (PRD)
# LedgerAI – Continuous Bank Reconciliation & Bookkeeping Agent
## Milestone: Phase 1 Foundation & Core Automation Engine (45% Scope Complete)

---

## 1. Document Control & Executive Summary

| Document Property | Specification |
| :--- | :--- |
| **Product Name** | **LedgerAI – Continuous Bank Reconciliation & Bookkeeping Agent** |
| **Milestone** | **Phase 1 Baseline (45% Work Complete)** |
| **Document Version** | 1.0.0-MVP |
| **Target Customers** | Mid-market enterprises, tech startups, corporate accounting departments |
| **Target Business Model** | B2B SaaS (\$500 – \$1,500 per corporate client / month) |
| **Status** | Approved & Implemented |

### 1.1 Product Vision
**LedgerAI** transforms the labor-intensive, error-prone month-end close into an **autonomous, continuous financial operations pipeline**. By ingesting multi-currency bank feeds in real time, normalizing foreign exchange, categorizing expenses into standard GAAP accounts, matching transactions against internal general ledger records, and intercepting anomalous wires or duplicate charges, LedgerAI reduces manual bookkeeping overhead by up to **80%** while establishing a zero-drift double-entry audit trail.

---

## 2. Market Opportunity & Problem Statement

### 2.1 The Problem
In standard corporate finance operations, reconciliation occurs as a batched event **10 to 18 days after month-end**. This historical approach suffers from critical vulnerabilities:
1. **Reporting Latency:** CFOs and controllers lack visibility into true cash balances until weeks after cash moves.
2. **Multi-Currency Drift:** Companies with operations across USD, EUR, GBP, and INR struggle with timing variance between transaction booking dates and actual bank settlement dates, leading to unverified FX variances.
3. **Financial Leakage & Overpayments:** Duplicate vendor invoices (e.g. paying an office rent or software license twice within 48 hours) frequently escape detection under manual spreadsheet review.
4. **Discrepancy Investigation Costs:** Resolving an unexplained $2,500 mismatch between bank statements and internal accounting records typically consumes 4 to 8 hours of senior CPA time.

### 2.2 Business Impact & ROI
At a SaaS subscription price of **\$500 to \$1,500/month**, LedgerAI pays for itself by:
* Eliminating 40+ hours per month of junior accountant manual matching.
* Intercepting duplicate payments and unauthorized SaaS subscription creep before month-end posting.
* Accelerating financial close from 15 business days to under 48 hours.

---

## 3. Scope Definition: The 45% Milestone (Phase 1 MVP)

The full product roadmap spans 100% across three phases. This PRD governs the **45% Milestone (Phase 1 MVP)**:

```mermaid
pie title LedgerAI Roadmap Scope Allocation
    "Phase 1: Foundation & Core Automation Engine (Completed 45%)" : 45
    "Phase 2: Live ERP Write Connectors & Advanced ML (30%)" : 30
    "Phase 3: Multi-Entity Tax Consolidation & Enterprise SOC2 (25%)" : 25
```

### 3.1 Features IN-SCOPE for 45% Milestone (Delivered)
* **Multi-Currency Bank Feeds & Deduplication:** Ingestion of bank records via CSV uploads and simulated banking APIs with SHA-256 deduplication hashing.
* **Deterministic Multi-Currency Math:** High-precision Python `Decimal` arithmetic (4 decimal places for amounts, 6 decimal places for rates) across USD, EUR, GBP, and INR.
* **Intelligent Rule & NLP Categorization:** Classification into GAAP chart of accounts with confidence scores ($\ge 0.85$ auto-categorized; $< 0.85$ routed to CPA review queue) and continuous feedback learning.
* **3-Tier Reconciliation Engine:** Exact matching, fuzzy tolerance matching ($\pm \$0.50$, $\pm 4$ days), and partial match identification (fee/FX variance $\le 5\%$).
* **Discrepancy Diagnostic Engine:** Mathematical calculation of statement vs. general ledger balance differences with natural-language root-cause explanations (e.g. diagnosing the $2,500 unbooked wire).
* **Anomaly & Fraud Detection Gate:** Real-time interception of duplicate payments within 72 hours, statistical amount outliers ($Z > 3.0$), and off-hour weekend transfers.
* **Double-Entry Journal Generator:** Balanced draft closing entries ($\sum \text{Debits} \equiv \sum \text{Credits}$) with mandatory CPA approval gates.
* **Ground-Truth AI Finance Assistant:** Zero-hallucination conversational interface answering financial queries by querying actual database balances.
* **Complete 8-Page Web Dashboard:** React 19 + TypeScript + Tailwind CSS UI covering Overview, Transactions, Reconciliation Center, Anomaly Detection, Journal Entries, Assistant, Reports, and Settings.

### 3.2 Features OUT-OF-SCOPE for 45% Milestone (Deferred to Phase 2 & 3)
* *Phase 2 (30% Scope):* Production Plaid OAuth integrations with live bank credentialing; direct two-way bi-directional sync APIs with NetSuite, QuickBooks Online, and Xero.
* *Phase 2 (30% Scope):* Deep graph neural network embeddings for complex supply chain counterparty grouping.
* *Phase 3 (25% Scope):* Multi-entity corporate tax consolidation with automated intercompany eliminations.
* *Phase 3 (25% Scope):* SOC2 Type II compliance pack, automated pen-testing harness, and SAML/SSO enterprise directory sync.

---

## 4. User Personas & Workflows

### Persona 1: Sarah Jenkins, CPA (Corporate Senior Accountant)
* **Goal:** Reconcile all corporate bank accounts quickly without manual spreadsheet lookups; ensure every journal entry is balanced and auditable.
* **Pain Points:** Spends hours tracing unposted wires and verifying currency conversions.
* **45% Milestone Workflow:**
  1. Reviews transactions with confidence $< 85\%$ in the Transactions queue and reclassifies them (system learns for future imports).
  2. Resolves partial matches or unreconciled items in the Reconciliation Center.
  3. Inspects draft month-end journal entries and approves them for posting.

### Persona 2: David Miller (VP Finance / Corporate Controller)
* **Goal:** Immediate cash visibility, fraud prevention, and audit-ready month-end packages.
* **Pain Points:** Anxious about duplicate vendor payments and unexplained balance variances.
* **45% Milestone Workflow:**
  1. Reviews the Overview Dashboard for real-time reconciliation percentages (91.2%).
  2. Investigates flagged critical anomaly alerts (e.g. \$98,500 wire outlier or duplicate office rent wires).
  3. Prompts the AI Assistant: *"Why is there a \$2,500 difference in our bank balance?"* to get an instant diagnostic breakdown.

---

## 5. Functional Requirements (Phase 1 Baseline)

### FR-1: Ingestion & Deduplication
* **FR-1.1:** System shall ingest transaction records via CSV files with flexible column headers (`Date`, `Description`, `Amount`, `Reference`, `Currency`).
* **FR-1.2:** System shall compute an idempotent SHA-256 hash for every incoming record: `hash(bank_account_id + date + amount + reference)`.
* **FR-1.3:** System shall prevent duplicate transactions from ever entering the database.

### FR-2: Currency Normalization & FX Accounting
* **FR-2.1:** All monetary values shall be stored as `Decimal(18, 4)` and exchange rates as `Decimal(18, 6)`. Floating-point arithmetic is strictly prohibited.
* **FR-2.2:** Transactions in EUR, GBP, and INR shall be converted into base functional currency (USD) preserving original amounts.
* **FR-2.3:** System shall calculate realized and unrealized FX gain/loss on foreign supplier payments under ASC 830 / IAS 21 principles.

### FR-3: AI Categorization & Continuous Feedback Loop
* **FR-3.1:** System shall tokenize transaction memos and match them against corporate merchant rule dictionaries and NLP token patterns.
* **FR-3.2:** System shall assign confidence scores from `0.0000` to `1.0000`. Scores $\ge 0.8500$ are marked `auto_categorized`; scores $< 0.8500$ are marked `low_confidence_flagged`.
* **FR-3.3:** If an accountant changes a category in the UI, the engine updates merchant memory with `0.9900` confidence for future imports.

### FR-4: 3-Tier Reconciliation Engine
* **FR-4.1 (Exact Match):** Match transactions where amount difference $\equiv \$0.00$ and reference number or booking date ($\pm 2$ days) matches with 1.0 confidence.
* **FR-4.2 (Fuzzy Match):** Match transactions where amount difference $\le \$0.50$, date variance $\le 4$ days, and token text similarity $\ge 0.60$.
* **FR-4.3 (Partial Match):** Flag transactions with percentage variance $\le 5\%$ caused by bank wire fees or currency settlement deltas.
* **FR-4.4 (Manual Override):** Certified accountants can manually pair unmatched bank items with internal ledger entries with auditable notes.

### FR-5: Anomaly & Fraud Interception
* **FR-5.1:** Flag identical payments sent to the same counterparty within 72 hours as `duplicate_payment` (Severity: High).
* **FR-5.2:** Compute category Z-scores; flag amounts where $Z > 3.0$ as `unusual_amount` (Severity: Critical).
* **FR-5.3:** Flag high-value weekend outflows ($> \$5,000$ on Saturday/Sunday) as `weekend_spike`.
* **FR-5.4:** Every anomaly alert must provide a clear natural-language explanation and support `resolved` or `false_positive` resolution workflows.

### FR-6: Balanced Double-Entry Journal Preparation
* **FR-6.1:** System shall generate balanced draft journal entries where $\sum \text{Debits} \equiv \sum \text{Credits}$.
* **FR-6.2:** System shall create balancing cash lines against `Account 1000 - Operating Cash`.
* **FR-6.3:** Entries shall initialize in `draft` status. System shall architecturally block unapproved entries from posting to live ledgers.
* **FR-6.4:** Certified accountants can approve or reject entries (with mandatory rejection reasons).
* **FR-6.5:** System shall export approved entries to standard NetSuite / QuickBooks general ledger CSV format.

### FR-7: Ground-Truth AI Finance Assistant
* **FR-7.1:** Assistant shall answer accountant questions regarding discrepancies, unmatched items, software spend, and anomaly summaries.
* **FR-7.2:** Assistant shall compute ground-truth analytics from the database rather than delegating calculations to an LLM.

---

## 6. Non-Functional Requirements & Security

| Category | Specification |
| :--- | :--- |
| **Data Integrity** | Strict database transactions with SQLite WAL mode / PostgreSQL relational integrity |
| **Calculation Accuracy** | Python `Decimal` fixed-point arithmetic across all currency conversions |
| **Authentication** | JWT Bearer authentication with HMAC-SHA256 and salted PBKDF2 password hashing |
| **Role-Based Access** | Segregated permissions: Admin, Accountant, Auditor, and Viewer |
| **Audit Trail** | Immutable log of every manual override, category change, anomaly resolution, and journal approval in `audit_logs` |
| **Throughput** | Benchmark verified at **195 transactions/second** |

---

## 7. Phase 1 Exit Criteria & Acceptance Sign-off

| Acceptance Gate | Target | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Synthetic Dataset** | $\ge 1,000$ txs | **1,054 txs (USD, EUR, GBP, INR)** | PASSED |
| **Deduplication** | 0 Duplicates Ingested | **100% Prevention** | PASSED |
| **Categorization Accuracy** | $\ge 90\%$ | **100.00%** | PASSED |
| **Reconciliation Precision** | $\ge 95\%$ | **100.00%** | PASSED |
| **Reconciliation Recall** | $\ge 85\%$ | **91.18%** | PASSED |
| **Double-Entry Balance** | $\text{Debits} \equiv \text{Credits}$ | **100.00% Balanced** | PASSED |
| **Approval Safety Gate** | Zero unapproved live posts | **Strictly Enforced** | PASSED |
| **Automated Tests** | $\ge 8$ tests | **9 of 9 Pytest Passed (5.17s)** | PASSED |
| **Dashboard UI** | 8 functional pages | **100% Delivered & Compiled** | PASSED |

