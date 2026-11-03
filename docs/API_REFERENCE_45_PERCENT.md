# REST API Reference & Developer Guide
# LedgerAI – Continuous Bank Reconciliation & Bookkeeping Agent
## Phase 1 Milestone: 45% Scope Baseline

Base URL: `http://localhost:8000/api/v1`  
Interactive OpenAPI/Swagger Documentation: `http://localhost:8000/docs`

---

## 1. Authentication & Security

All authenticated endpoints accept a Bearer JWT token in the HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 2. Authentication Endpoints (`/auth`)

### 2.1 Authenticate & Obtain Token
`POST /auth/login`
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "accountant@ledgerai.io", "password": "admin123"}'
```
**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "e9b5f928-8742-498c-8f42-78d10b8cf812",
    "email": "accountant@ledgerai.io",
    "full_name": "Sarah Jenkins, CPA",
    "role": "admin",
    "organization_id": "84829104-org-acme"
  }
}
```

### 2.2 Reset / Re-seed Synthetic Dataset
`POST /auth/seed?force=true`
Populates 1,054 multi-currency transactions, 918 internal ledger records, and intentional anomalies.

---

## 3. Transactions Endpoints (`/transactions`)

### 3.1 List & Filter Transactions
`GET /transactions?currency=USD&status=unmatched&limit=50`

**Query Parameters:**
* `currency` (string, optional): Filter by `USD`, `EUR`, `GBP`, `INR`.
* `category_id` (string, optional): Filter by transaction category UUID.
* `status` (string, optional): `matched`, `unmatched`, `partial_match`, `manual_matched`.
* `search` (string, optional): Full-text search on description, merchant, or reference.
* `limit` (integer, default: 100): Page size.
* `offset` (integer, default: 0): Pagination offset.

### 3.2 Ingest Bank Statement CSV
`POST /transactions/upload?bank_account_id={bank_account_id}`
```bash
curl -X POST "http://localhost:8000/api/v1/transactions/upload?bank_account_id=ACC-123" \
  -H "Authorization: Bearer <token>" \
  -F "file=@october_bank_statement.csv"
```
**Response (200 OK):**
```json
{
  "status": "success",
  "imported_count": 48,
  "duplicate_skipped_count": 2,
  "account_name": "USD Operating Account"
}
```

### 3.3 Reclassify Category (Accountant Feedback Loop)
`PUT /transactions/{id}`
```bash
curl -X PUT "http://localhost:8000/api/v1/transactions/tx-123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"category_id": "EXP-SFT-001", "merchant_name": "Amazon Web Services"}'
```

---

## 4. Reconciliation Endpoints (`/reconciliation`)

### 4.1 Run Continuous Reconciliation
`POST /reconciliation/run`
```bash
curl -X POST "http://localhost:8000/api/v1/reconciliation/run" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"bank_account_id": "ACC-123", "tolerance_days": 4}'
```
**Response (200 OK):**
```json
{
  "id": "rec-8482",
  "statement_ending_balance": 284500.00,
  "book_ending_balance": 282000.00,
  "difference": 2500.00,
  "status": "discrepancy_detected",
  "reconciled_count": 837,
  "unmatched_count": 217,
  "partial_count": 16,
  "discrepancy_explanation": "Discrepancy of USD 2,500.00 detected. Identified 1 unbooked pending wire..."
}
```

### 4.2 Manual Match Override
`POST /reconciliation/manual-match`
```bash
curl -X POST "http://localhost:8000/api/v1/reconciliation/manual-match" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "tx-1", "internal_ledger_id": "led-2", "notes": "Approved timing difference"}'
```

---

## 5. Anomaly Interception Endpoints (`/anomalies`)

### 5.1 Run Anomaly Scan
`POST /anomalies/detect`
Executes duplicate payment detection and Z-score outlier algorithms.

### 5.2 Resolve Anomaly
`PUT /anomalies/{alert_id}/resolve`
```bash
curl -X PUT "http://localhost:8000/api/v1/anomalies/alert-98500/resolve" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "resolution_notes": "Verified pre-approved equipment purchase PO-9482."}'
```

---

## 6. Month-End Journal Endpoints (`/journals`)

### 6.1 Generate Balanced Reconciliation Journal Entry
`POST /journals/generate?period=2026-10`

### 6.2 Approve or Reject Journal Entry
`POST /journals/{entry_id}/action`
```bash
curl -X POST "http://localhost:8000/api/v1/journals/je-123/action" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

### 6.3 Export General Ledger Entry to ERP CSV
`GET /journals/{entry_id}/export`
Returns NetSuite/QuickBooks-formatted CSV download.

---

## 7. AI Finance Assistant Endpoint (`/assistant`)

### 7.1 Execute Ground-Truth Financial Query
`POST /assistant/query`
```bash
curl -X POST "http://localhost:8000/api/v1/assistant/query" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Why is there a $2,500 difference in our bank balance?"}'
```
**Response (200 OK):**
```json
{
  "query": "Why is there a $2,500 difference in our bank balance?",
  "intent": "discrepancy_explanation",
  "answer": "### Balance Discrepancy Analysis\n\n**Total Bank Balance:** $284,500.00\n**Total Book Balance:** $282,000.00\n**Net Discrepancy:** $2,500.00\n\nFound 1 unrecorded pending wire...",
  "financial_data": {
    "bank_balance": 284500.0,
    "book_balance": 282000.0,
    "variance": 2500.0
  },
  "suggested_actions": [
    "Review Unmatched Transactions in Reconciliation Center",
    "Create Adjusting Journal Entry for $2,500 Pending Wire"
  ]
}
```

