# LedgerAI Documentation Suite
## Phase 1 Milestone: 45% Scope Baseline

Welcome to the official documentation directory for **LedgerAI – Continuous Bank Reconciliation & Bookkeeping Agent**.

---

## 📚 Document Index

| Document | Purpose | Target Audience |
| :--- | :--- | :--- |
| [**PRD_45_PERCENT.md**](./PRD_45_PERCENT.md) | Official Product Requirements Document (PRD) defining the 45% Milestone baseline, user personas, problem statement, and acceptance gates. | Product Managers, Executives, Engineering Leads |
| [**ARCHITECTURE_45_PERCENT.md**](./ARCHITECTURE_45_PERCENT.md) | High-level system architecture, autonomous pipeline sequence diagram, database Entity-Relationship Diagram (ERD), and FX formulas. | Software Architects, Backend Developers |
| [**FUNCTIONAL_SPECS_45_PERCENT.md**](./FUNCTIONAL_SPECS_45_PERCENT.md) | Algorithmic specifications for SHA-256 deduplication, AI categorization, 3-tier matching engine, and double-entry balancing logic. | Financial Engineers, AI/ML Engineers |
| [**API_REFERENCE_45_PERCENT.md**](./API_REFERENCE_45_PERCENT.md) | Comprehensive REST API reference guide with request/response schemas, JWT authentication, and curl examples. | Frontend Engineers, API Integrators |

---

## 🎯 Quick Milestone Overview (What is 45% Work?)

The **45% Milestone** establishes the complete functional foundation of LedgerAI:
* **Multi-Currency Processing:** Ingestion across USD, EUR, GBP, and INR with fixed Python `Decimal` arithmetic.
* **3-Tier Matching Engine:** Exact, fuzzy, and partial fee variance matching against internal accounting books.
* **Accounting Controls:** Strict double-entry balance verification ($\sum \text{Debits} \equiv \sum \text{Credits}$) and certified CPA sign-off gates.
* **Full Stack Verification:** 9 automated pytest tests passing, 1,054 benchmark transactions evaluated at **195 transactions/second**, and all 8 frontend dashboard pages interactive.

