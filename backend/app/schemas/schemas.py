from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal

# --- Auth & User ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    organization_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "accountant"
    organization_name: Optional[str] = "Acme Corp Global"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Bank Account ---
class BankAccountBase(BaseModel):
    account_number: str
    account_name: str
    bank_name: str
    currency: str = "USD"
    current_balance: Decimal = Decimal("0.00")

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountResponse(BankAccountBase):
    id: str
    organization_id: str
    calculated_balance: Decimal
    last_synced_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Category ---
class CategoryBase(BaseModel):
    name: str
    code: str
    type: str  # asset, liability, equity, revenue, expense
    description: Optional[str] = None
    default_account_code: str

class CategoryResponse(CategoryBase):
    id: str
    organization_id: str
    is_system: bool

    class Config:
        from_attributes = True


# --- Transactions ---
class TransactionBase(BaseModel):
    transaction_date: datetime
    description: str
    merchant_name: Optional[str] = None
    reference_number: Optional[str] = None
    currency: str = "USD"
    amount: Decimal

class TransactionCreate(TransactionBase):
    bank_account_id: str

class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    merchant_name: Optional[str] = None
    category_status: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    bank_account_id: str
    transaction_date: datetime
    description: str
    clean_description: Optional[str]
    merchant_name: Optional[str]
    reference_number: Optional[str]
    currency: str
    amount: Decimal
    original_amount: Decimal
    base_amount: Decimal
    exchange_rate: Decimal
    category_id: Optional[str]
    ai_category_id: Optional[str]
    ai_confidence: Decimal
    category_status: str
    status: str
    is_recurring: bool
    created_at: datetime
    category: Optional[CategoryResponse] = None
    ai_category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


# --- Reconciliation ---
class ReconciliationRequest(BaseModel):
    bank_account_id: str
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    tolerance_days: int = 4
    amount_tolerance_percent: Decimal = Decimal("0.01")  # 1% tolerance for partial match

class ReconciliationMatchResponse(BaseModel):
    id: str
    reconciliation_id: str
    transaction_id: str
    internal_ledger_id: Optional[str]
    match_type: str
    match_confidence: Decimal
    amount_difference: Decimal
    date_difference_days: int
    notes: Optional[str]
    matched_at: datetime
    transaction: Optional[TransactionResponse] = None

    class Config:
        from_attributes = True

class ReconciliationRecordResponse(BaseModel):
    id: str
    bank_account_id: str
    period_start: datetime
    period_end: datetime
    statement_ending_balance: Decimal
    book_ending_balance: Decimal
    difference: Decimal
    status: str
    reconciled_count: int
    unmatched_count: int
    partial_count: int
    discrepancy_explanation: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ManualMatchRequest(BaseModel):
    transaction_id: str
    internal_ledger_id: Optional[str] = None
    notes: Optional[str] = "Manual match confirmed by accountant"


# --- Anomaly ---
class AnomalyAlertResponse(BaseModel):
    id: str
    transaction_id: str
    alert_type: str
    severity: str
    score: Decimal
    explanation: str
    status: str
    resolution_notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    transaction: Optional[TransactionResponse] = None

    class Config:
        from_attributes = True

class AnomalyResolveRequest(BaseModel):
    status: str  # resolved, false_positive
    resolution_notes: str


# --- Journal Entry ---
class JournalEntryLineCreate(BaseModel):
    account_code: str
    account_name: str
    description: Optional[str] = None
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    currency: str = "USD"
    exchange_rate: Decimal = Decimal("1.000000")

class JournalEntryLineResponse(BaseModel):
    id: str
    account_code: str
    account_name: str
    description: Optional[str]
    debit: Decimal
    credit: Decimal
    currency: str
    base_debit: Decimal
    base_credit: Decimal
    exchange_rate: Decimal

    class Config:
        from_attributes = True

class JournalEntryCreate(BaseModel):
    entry_date: datetime
    period: str
    description: str
    reference_type: str = "manual"
    reference_id: Optional[str] = None
    currency: str = "USD"
    lines: List[JournalEntryLineCreate]

class JournalEntryResponse(BaseModel):
    id: str
    entry_number: str
    entry_date: datetime
    period: str
    description: str
    reference_type: str
    reference_id: Optional[str]
    total_debit: Decimal
    total_credit: Decimal
    currency: str
    status: str
    rejection_reason: Optional[str]
    created_by_user_id: Optional[str]
    approved_by_user_id: Optional[str]
    created_at: datetime
    lines: List[JournalEntryLineResponse] = []

    class Config:
        from_attributes = True

class JournalEntryActionRequest(BaseModel):
    action: str  # approve, reject, post
    rejection_reason: Optional[str] = None


# --- AI Assistant ---
class AssistantQueryRequest(BaseModel):
    query: str
    period: Optional[str] = None
    bank_account_id: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str
    intent: str
    financial_data: Optional[dict] = None
    suggested_actions: List[str] = []


# --- Reports & Summary ---
class MonthlyReportResponse(BaseModel):
    period: str
    total_inflow: Decimal
    total_outflow: Decimal
    net_cash_flow: Decimal
    reconciled_percentage: float
    category_breakdown: List[dict]
    currency_exposure: List[dict]
    anomalies_detected: int
    pending_journals: int


# --- Audit Logs ---
class AuditLogResponse(BaseModel):
    id: str
    user_email: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
