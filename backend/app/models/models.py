import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, String, Boolean, DateTime, Numeric, ForeignKey, Text, Integer, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    base_currency = Column(String(10), default="USD", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="organization", cascade="all, delete-orphan")
    categories = relationship("TransactionCategory", back_populates="organization", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="organization", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="accountant", nullable=False)  # admin, accountant, auditor, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="users")


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    account_number = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=False)
    bank_name = Column(String(255), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    current_balance = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    calculated_balance = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="bank_accounts")
    transactions = relationship("Transaction", back_populates="bank_account", cascade="all, delete-orphan")
    reconciliations = relationship("ReconciliationRecord", back_populates="bank_account", cascade="all, delete-orphan")


class TransactionCategory(Base):
    __tablename__ = "transaction_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False)  # asset, liability, equity, revenue, expense
    description = Column(Text, nullable=True)
    default_account_code = Column(String(50), nullable=False)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="categories")
    transactions = relationship("Transaction", primaryjoin="TransactionCategory.id==Transaction.category_id", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    bank_account_id = Column(String(36), ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False)
    
    transaction_date = Column(DateTime(timezone=True), nullable=False, index=True)
    value_date = Column(DateTime(timezone=True), nullable=True)
    description = Column(String(500), nullable=False)
    clean_description = Column(String(500), nullable=True)
    merchant_name = Column(String(255), nullable=True)
    reference_number = Column(String(100), nullable=True, index=True)
    
    currency = Column(String(10), default="USD", nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)  # positive = deposit/credit, negative = withdrawal/debit
    original_amount = Column(Numeric(18, 4), nullable=False)
    base_amount = Column(Numeric(18, 4), nullable=False)
    exchange_rate = Column(Numeric(18, 6), default=Decimal("1.000000"), nullable=False)
    
    category_id = Column(String(36), ForeignKey("transaction_categories.id"), nullable=True)
    ai_category_id = Column(String(36), ForeignKey("transaction_categories.id"), nullable=True)
    ai_confidence = Column(Numeric(5, 4), default=Decimal("0.0000"), nullable=False)
    category_status = Column(String(50), default="auto_categorized")  # auto_categorized, manual_reviewed, low_confidence_flagged
    
    status = Column(String(50), default="unmatched", index=True)  # unmatched, matched, partial_match, manual_matched
    is_recurring = Column(Boolean, default=False)
    dedup_hash = Column(String(64), nullable=False, index=True)
    
    raw_payload = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="transactions")
    bank_account = relationship("BankAccount", back_populates="transactions")
    category = relationship("TransactionCategory", foreign_keys=[category_id], back_populates="transactions")
    ai_category = relationship("TransactionCategory", foreign_keys=[ai_category_id])
    anomalies = relationship("AnomalyAlert", back_populates="transaction", cascade="all, delete-orphan")
    matches = relationship("ReconciliationMatch", back_populates="transaction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_org_tx_hash", "organization_id", "dedup_hash", unique=True),
    )


class InternalLedgerEntry(Base):
    __tablename__ = "internal_ledger_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    reference_number = Column(String(100), nullable=True, index=True)
    account_code = Column(String(50), nullable=False)
    account_name = Column(String(255), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)
    base_amount = Column(Numeric(18, 4), nullable=False)
    status = Column(String(50), default="unmatched", index=True)  # unmatched, matched, partial_match
    matched_transaction_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    from_currency = Column(String(10), nullable=False, index=True)
    to_currency = Column(String(10), nullable=False, index=True)
    rate = Column(Numeric(18, 6), nullable=False)
    effective_date = Column(DateTime(timezone=True), nullable=False, index=True)
    source = Column(String(50), default="ECB_HISTORICAL")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_fx_pair_date", "from_currency", "to_currency", "effective_date"),
    )


class ReconciliationRecord(Base):
    __tablename__ = "reconciliation_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    bank_account_id = Column(String(36), ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    statement_ending_balance = Column(Numeric(18, 4), nullable=False)
    book_ending_balance = Column(Numeric(18, 4), nullable=False)
    difference = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    
    status = Column(String(50), default="in_progress")  # in_progress, completed, discrepancy_detected
    reconciled_count = Column(Integer, default=0)
    unmatched_count = Column(Integer, default=0)
    partial_count = Column(Integer, default=0)
    
    discrepancy_explanation = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    bank_account = relationship("BankAccount", back_populates="reconciliations")
    matches = relationship("ReconciliationMatch", back_populates="reconciliation", cascade="all, delete-orphan")


class ReconciliationMatch(Base):
    __tablename__ = "reconciliation_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reconciliation_id = Column(String(36), ForeignKey("reconciliation_records.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    internal_ledger_id = Column(String(36), ForeignKey("internal_ledger_entries.id", ondelete="CASCADE"), nullable=True)
    
    match_type = Column(String(50), nullable=False)  # exact, fuzzy, partial, manual
    match_confidence = Column(Numeric(5, 4), default=Decimal("1.0000"), nullable=False)
    amount_difference = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    date_difference_days = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    matched_at = Column(DateTime(timezone=True), default=utc_now)

    reconciliation = relationship("ReconciliationRecord", back_populates="matches")
    transaction = relationship("Transaction", back_populates="matches")
    internal_ledger = relationship("InternalLedgerEntry")


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    
    alert_type = Column(String(100), nullable=False)  # unusual_amount, duplicate_payment, unexpected_balance_change, unusual_frequency, suspicious_vendor, weekend_spike
    severity = Column(String(50), default="medium")  # low, medium, high, critical
    score = Column(Numeric(5, 4), default=Decimal("0.8500"))
    explanation = Column(Text, nullable=False)
    status = Column(String(50), default="open")  # open, under_investigation, resolved, false_positive
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    transaction = relationship("Transaction", back_populates="anomalies")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    entry_number = Column(String(50), nullable=False, unique=True, index=True)
    entry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    period = Column(String(20), nullable=False)  # e.g. "2026-10"
    description = Column(String(500), nullable=False)
    reference_type = Column(String(50), default="reconciliation")  # reconciliation, fx_adjustment, manual, monthly_close
    reference_id = Column(String(36), nullable=True)
    
    total_debit = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    total_credit = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(String(50), default="draft")  # draft, pending_approval, approved, rejected, posted
    rejection_reason = Column(Text, nullable=True)
    created_by_user_id = Column(String(36), nullable=True)
    approved_by_user_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="journal_entries")
    lines = relationship("JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    journal_entry_id = Column(String(36), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_code = Column(String(50), nullable=False)
    account_name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    debit = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    credit = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    base_debit = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    base_credit = Column(Numeric(18, 4), default=Decimal("0.0000"), nullable=False)
    exchange_rate = Column(Numeric(18, 6), default=Decimal("1.000000"), nullable=False)

    journal_entry = relationship("JournalEntry", back_populates="lines")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, APPROVE, REJECT, RECONCILE, OVERRIDE
    entity_type = Column(String(100), nullable=False)  # Transaction, JournalEntry, Reconciliation, Anomaly
    entity_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="audit_logs")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(36), nullable=False)
    requester_user_id = Column(String(36), nullable=True)
    reviewer_user_id = Column(String(36), nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
