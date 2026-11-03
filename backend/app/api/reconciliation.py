from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    ReconciliationRecord, ReconciliationMatch, Transaction, 
    InternalLedgerEntry, BankAccount, User, AuditLog
)
from app.schemas.schemas import (
    ReconciliationRequest, ReconciliationRecordResponse, 
    ReconciliationMatchResponse, ManualMatchRequest
)
from app.services.auth import get_current_user
from app.services.reconciliation import ReconciliationService

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

@router.post("/run", response_model=ReconciliationRecordResponse)
def run_reconciliation(
    payload: ReconciliationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    period_end = payload.period_end or datetime.now(timezone.utc)
    period_start = payload.period_start or (period_end - timedelta(days=90))

    recon_service = ReconciliationService(db, current_user.organization_id)
    recon = recon_service.run_reconciliation(
        bank_account_id=payload.bank_account_id,
        period_start=period_start,
        period_end=period_end,
        tolerance_days=payload.tolerance_days
    )

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="RECONCILE",
        entity_type="ReconciliationRecord",
        entity_id=recon.id,
        details=f"Ran automated reconciliation for account {payload.bank_account_id}. Reconciled: {recon.reconciled_count}, Unmatched: {recon.unmatched_count}."
    )
    db.add(audit)
    db.commit()

    return recon

@router.get("/records", response_model=List[ReconciliationRecordResponse])
def list_reconciliation_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ReconciliationRecord).filter(
        ReconciliationRecord.organization_id == current_user.organization_id
    ).order_by(ReconciliationRecord.created_at.desc()).limit(20).all()

@router.get("/matches")
def list_matches(
    match_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReconciliationMatch).join(
        ReconciliationRecord, ReconciliationMatch.reconciliation_id == ReconciliationRecord.id
    ).filter(ReconciliationRecord.organization_id == current_user.organization_id)

    if match_type:
        query = query.filter(ReconciliationMatch.match_type == match_type)

    matches = query.order_by(ReconciliationMatch.matched_at.desc()).limit(limit).all()
    
    result = []
    for m in matches:
        b_tx = db.query(Transaction).filter(Transaction.id == m.transaction_id).first()
        l_entry = db.query(InternalLedgerEntry).filter(InternalLedgerEntry.id == m.internal_ledger_id).first() if m.internal_ledger_id else None
        
        result.append({
            "id": m.id,
            "match_type": m.match_type,
            "match_confidence": float(m.match_confidence),
            "amount_difference": float(m.amount_difference),
            "date_difference_days": m.date_difference_days,
            "notes": m.notes,
            "matched_at": m.matched_at,
            "bank_transaction": {
                "id": b_tx.id if b_tx else None,
                "date": b_tx.transaction_date if b_tx else None,
                "description": b_tx.description if b_tx else None,
                "amount": float(b_tx.amount) if b_tx else 0,
                "currency": b_tx.currency if b_tx else "USD",
                "reference_number": b_tx.reference_number if b_tx else None
            } if b_tx else None,
            "internal_ledger": {
                "id": l_entry.id if l_entry else None,
                "date": l_entry.entry_date if l_entry else None,
                "description": l_entry.description if l_entry else None,
                "amount": float(l_entry.amount) if l_entry else 0,
                "account_name": l_entry.account_name if l_entry else None
            } if l_entry else None
        })

    return result

@router.get("/unmatched")
def list_unmatched_items(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unmatched_bank = db.query(Transaction).filter(
        Transaction.organization_id == current_user.organization_id,
        Transaction.status.in_(["unmatched", "partial_match"])
    ).order_by(Transaction.transaction_date.desc()).limit(limit).all()

    unmatched_ledger = db.query(InternalLedgerEntry).filter(
        InternalLedgerEntry.organization_id == current_user.organization_id,
        InternalLedgerEntry.status.in_(["unmatched", "partial_match"])
    ).order_by(InternalLedgerEntry.entry_date.desc()).limit(limit).all()

    return {
        "unmatched_bank_transactions": [
            {
                "id": t.id,
                "date": t.transaction_date,
                "description": t.description,
                "amount": float(t.amount),
                "currency": t.currency,
                "status": t.status,
                "ai_confidence": float(t.ai_confidence)
            } for t in unmatched_bank
        ],
        "unmatched_internal_records": [
            {
                "id": l.id,
                "date": l.entry_date,
                "description": l.description,
                "amount": float(l.amount),
                "currency": l.currency,
                "account_name": l.account_name,
                "status": l.status
            } for l in unmatched_ledger
        ]
    }

@router.post("/manual-match")
def manual_match(
    payload: ManualMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recon_service = ReconciliationService(db, current_user.organization_id)
    match = recon_service.manual_match(
        transaction_id=payload.transaction_id,
        internal_ledger_id=payload.internal_ledger_id,
        notes=payload.notes or "Accountant manual override"
    )

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="OVERRIDE",
        entity_type="ReconciliationMatch",
        entity_id=match.id,
        details=f"Accountant manually matched bank transaction {payload.transaction_id} with ledger {payload.internal_ledger_id}."
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "match_id": match.id}

