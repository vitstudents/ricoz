# System Architecture & Technical Specifications
# LedgerAI – Continuous Bank Reconciliation & Bookkeeping Agent
## Phase 1 Milestone: 45% Scope Baseline

---

## 1. High-Level System Architecture

The LedgerAI platform is structured as a decoupled, multi-tenant financial automation application comprising an asynchronous FastAPI backend and a responsive React 19 / TypeScript single-page application:

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier (Frontend)"]
        UI["React 19 + TypeScript + Tailwind CSS v4"]
        State["Client State & Recharts Visualizations"]
        UI --- State
    end

    subgraph APITier["Application & API Gateway Tier (FastAPI)"]
        Router["FastAPI Router (/api/v1)"]
        AuthM["JWT Authentication & RBAC Middleware"]
        Router --- AuthM
        
        subgraph Endpoints["API Endpoints"]
            EP_Auth["/auth"]
            EP_Tx["/transactions"]
            EP_Recon["/reconciliation"]
            EP_Anom["/anomalies"]
            EP_Jour["/journals"]
            EP_Assist["/assistant"]
            EP_Rep["/reports"]
            EP_Set["/settings"]
        end
        AuthM --> Endpoints
    end

    subgraph ServiceTier["Autonomous Processing Core"]
        S_Ingest["Ingestion & SHA-256 Deduplication"]
        S_Curr["Currency Normalization (Decimal Engine)"]
        S_Cat["Rule & NLP Categorization + Learning Loop"]
        S_Recon["3-Tier Reconciliation (Exact/Fuzzy/Partial)"]
        S_Anom["Statistical Z-Score & 72h Duplicate Interceptor"]
        S_Jour["Balanced Double-Entry Journal Generator"]
        S_Assist["Deterministic SQL Financial Query Assistant"]
    end

    subgraph DataTier["Data Persistence Tier"]
        DB[(Relational DB: SQLite WAL / PostgreSQL)]
        AuditLog[(Immutable Audit Log Trail)]
    end

    Endpoints --> ServiceTier
    ServiceTier --> DataTier
```

---

## 2. Autonomous Financial Pipeline Sequence

The pipeline executes continuously as new transactions arrive:

```mermaid
sequenceDiagram
    autonumber
    actor Bank as Bank API / CSV Upload
    participant Ingest as Ingestion Service
    participant FX as Currency Normalizer
    participant Cat as AI Categorizer
    participant Anom as Anomaly Interceptor
    participant Recon as 3-Tier Reconciliation Engine
    participant Jour as Journal Generator
    actor CPA as Certified Accountant (User)

    Bank->>Ingest: Transmit Raw Transaction Batch
    Ingest->>Ingest: Compute SHA-256 Deduplication Hash
    alt Hash Exists
        Ingest-->>Bank: Discard Duplicate Record
    else Hash Is Unique
        Ingest->>FX: Forward Validated Transaction
        FX->>FX: Convert to USD Base using Decimal Precision
        FX->>Cat: Forward Normalized Record
        Cat->>Cat: NLP Text Clean + Merchant Rule Match
        Cat->>Cat: Assign Confidence Score
        Cat->>Anom: Forward Categorized Transaction
        Anom->>Anom: Scan 72h Window for Duplicates & Z-score Outliers
        Anom->>Recon: Forward to Reconciliation Engine
        Recon->>Recon: Match against Internal General Ledger (Exact/Fuzzy/Partial)
        Recon->>Jour: Trigger Month-End Closing Draft
        Jour->>Jour: Build Balanced Journal (Debits == Credits)
        Jour-->>CPA: Present Draft Journal Entry (JE-202610-0001)
        CPA->>Jour: Review & Approve for Posting
        Jour->>Jour: Commit Entry to Live General Ledger
    end
```

---

## 3. Database Entity-Relationship Diagram (ERD)

The database schema is fully normalized and enforces referential integrity:

```mermaid
erDiagram
    ORGANIZATIONS {
        string id PK
        string name
        string base_currency
        datetime created_at
    }

    USERS {
        string id PK
        string organization_id FK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }

    BANK_ACCOUNTS {
        string id PK
        string organization_id FK
        string account_number
        string account_name
        string bank_name
        string currency
        numeric current_balance
        numeric calculated_balance
        datetime last_synced_at
        boolean is_active
    }

    TRANSACTIONS {
        string id PK
        string organization_id FK
        string bank_account_id FK
        datetime transaction_date
        string description
        string clean_description
        string merchant_name
        string reference_number
        string currency
        numeric amount
        numeric original_amount
        numeric base_amount
        numeric exchange_rate
        string category_id FK
        numeric ai_confidence
        string category_status
        string status
        boolean is_recurring
        string dedup_hash UK
    }

    INTERNAL_LEDGER_ENTRIES {
        string id PK
        string organization_id FK
        datetime entry_date
        string description
        string reference_number
        string account_code
        string account_name
        string currency
        numeric amount
        numeric base_amount
        string status
        string matched_transaction_id
    }

    RECONCILIATION_RECORDS {
        string id PK
        string organization_id FK
        string bank_account_id FK
        datetime period_start
        datetime period_end
        numeric statement_ending_balance
        numeric book_ending_balance
        numeric difference
        string status
        int reconciled_count
        int unmatched_count
        int partial_count
        text discrepancy_explanation
    }

    RECONCILIATION_MATCHES {
        string id PK
        string reconciliation_id FK
        string transaction_id FK
        string internal_ledger_id FK
        string match_type
        numeric match_confidence
        numeric amount_difference
        int date_difference_days
        text notes
        datetime matched_at
    }

    ANOMALY_ALERTS {
        string id PK
        string organization_id FK
        string transaction_id FK
        string alert_type
        string severity
        numeric score
        text explanation
        string status
        text resolution_notes
        datetime created_at
        datetime resolved_at
    }

    JOURNAL_ENTRIES {
        string id PK
        string organization_id FK
        string entry_number UK
        datetime entry_date
        string period
        string description
        string reference_type
        numeric total_debit
        numeric total_credit
        string currency
        string status
        text rejection_reason
        string created_by_user_id
        string approved_by_user_id
        datetime created_at
    }

    JOURNAL_ENTRY_LINES {
        string id PK
        string journal_entry_id FK
        string account_code
        string account_name
        string description
        numeric debit
        numeric credit
        string currency
        numeric base_debit
        numeric base_credit
        numeric exchange_rate
    }

    AUDIT_LOGS {
        string id PK
        string organization_id FK
        string user_id
        string user_email
        string action
        string entity_type
        string entity_id
        text details
        string ip_address
        datetime created_at
    }

    ORGANIZATIONS ||--o{ USERS : "contains"
    ORGANIZATIONS ||--o{ BANK_ACCOUNTS : "owns"
    ORGANIZATIONS ||--o{ TRANSACTIONS : "records"
    ORGANIZATIONS ||--o{ INTERNAL_LEDGER_ENTRIES : "maintains"
    ORGANIZATIONS ||--o{ RECONCILIATION_RECORDS : "tracks"
    ORGANIZATIONS ||--o{ JOURNAL_ENTRIES : "owns"
    ORGANIZATIONS ||--o{ AUDIT_LOGS : "logs"
    BANK_ACCOUNTS ||--o{ TRANSACTIONS : "receives"
    BANK_ACCOUNTS ||--o{ RECONCILIATION_RECORDS : "reconciles"
    RECONCILIATION_RECORDS ||--o{ RECONCILIATION_MATCHES : "aggregates"
    TRANSACTIONS ||--o{ RECONCILIATION_MATCHES : "matches"
    TRANSACTIONS ||--o{ ANOMALY_ALERTS : "flags"
    JOURNAL_ENTRIES ||--o{ JOURNAL_ENTRY_LINES : "contains"
```

---

## 4. Multi-Currency Calculation Logic (ASC 830 / IAS 21)

All currency operations use Python `Decimal` to avoid binary floating-point rounding issues:

### 4.1 Cross-Rate Formula
$$\text{Applied Rate} = \frac{\text{Rate}(\text{From Currency} \to \text{USD})}{\text{Rate}(\text{To Currency} \to \text{USD})}$$
$$\text{Base Amount (USD)} = \text{Round}\Big(\text{Original Amount} \times \text{Applied Rate},\; 4\text{ decimals}\Big)$$

### 4.2 Realized FX Gain/Loss Formula
When settling a foreign payable or receivable, the gain or loss in USD is:
$$\Delta_{\text{FX}} = \text{Original Amount} \times (\text{Settlement Rate} - \text{Booking Rate})$$
* If $\Delta_{\text{FX}} > 0$: **Realized Foreign Exchange Gain** (Credit Revenue Account 8200).
* If $\Delta_{\text{FX}} < 0$: **Realized Foreign Exchange Loss** (Debit Expense Account 8100).

---

## 5. Security & Audit Logging Architecture

Every mutation to the financial state is captured in the immutable `audit_logs` table:
* **Capture Attributes:** User UUID, User Email, Timestamp (UTC), Action (`CREATE`, `UPDATE`, `APPROVE`, `REJECT`, `RECONCILE`, `OVERRIDE`), Entity Type, Entity ID, and detailed context.
* **Separation of Duties:** Approval requests enforce that the accountant approving a journal entry or manual override cannot bypass balanced debit/credit validation rules.

