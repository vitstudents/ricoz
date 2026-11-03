import csv
import io
import hashlib
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.models import Transaction, BankAccount, TransactionCategory, User, AuditLog
from app.schemas.schemas import TransactionResponse, TransactionUpdate
from app.services.auth import get_current_user
from app.services.currency import CurrencyService
from app.services.categorization import CategorizationService

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    currency: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.organization_id == current_user.organization_id)

    if currency:
        query = query.filter(Transaction.currency == currency.upper())
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if status:
        query = query.filter(Transaction.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_filter),
                Transaction.merchant_name.ilike(search_filter),
                Transaction.reference_number.ilike(search_filter)
            )
        )

    return query.order_by(Transaction.transaction_date.desc()).offset(offset).limit(limit).all()

@router.get("/summary")
def get_transaction_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.organization_id == current_user.organization_id).all()
    
    total_count = len(txs)
    matched_count = sum(1 for t in txs if t.status in ["matched", "manual_matched"])
    unmatched_count = sum(1 for t in txs if t.status == "unmatched")
    partial_count = sum(1 for t in txs if t.status == "partial_match")
    
    total_inflow = sum((t.base_amount for t in txs if t.base_amount > 0), Decimal("0.00"))
    total_outflow = sum((abs(t.base_amount) for t in txs if t.base_amount < 0), Decimal("0.00"))

    return {
        "total_count": total_count,
        "matched_count": matched_count,
        "unmatched_count": unmatched_count,
        "partial_count": partial_count,
        "reconciliation_rate": round(matched_count / total_count * 100, 1) if total_count > 0 else 0.0,
        "total_inflow_usd": float(total_inflow),
        "total_outflow_usd": float(total_outflow)
    }

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.organization_id == current_user.organization_id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.organization_id == current_user.organization_id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    old_category_id = tx.category_id
    if payload.category_id:
        tx.category_id = payload.category_id
        tx.category_status = "manual_reviewed"
        tx.ai_confidence = Decimal("1.0000")
        
        # Trigger feedback learning mechanism
        cat_service = CategorizationService(db, current_user.organization_id)
        cat_service.learn_from_feedback(tx.id, payload.category_id, current_user.id)

    if payload.merchant_name:
        tx.merchant_name = payload.merchant_name

    # Create audit record
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE",
        entity_type="Transaction",
        entity_id=tx.id,
        details=f"Updated category from '{old_category_id}' to '{payload.category_id}' with manual accountant review."
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)
    return tx

@router.post("/upload")
async def upload_transactions_csv(
    bank_account_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests CSV bank transaction file:
    Validates structure, enforces deduplication, converts foreign currency, and runs AI categorization.
    """
    bank_acc = db.query(BankAccount).filter(
        BankAccount.id == bank_account_id,
        BankAccount.organization_id == current_user.organization_id
    ).first()
    if not bank_acc:
        raise HTTPException(status_code=404, detail="Bank account not found")

    content = await file.read()
    decoded = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    cat_service = CategorizationService(db, current_user.organization_id)
    imported = 0
    duplicates = 0

    for row in reader:
        # Flexible column resolution
        date_str = row.get("Date") or row.get("date") or row.get("Transaction Date")
        desc = row.get("Description") or row.get("description") or row.get("Memo") or "Imported Transaction"
        amt_str = row.get("Amount") or row.get("amount") or "0"
        ref_num = row.get("Reference") or row.get("reference") or row.get("Ref") or ""
        curr = row.get("Currency") or row.get("currency") or bank_acc.currency

        try:
            amt = Decimal(amt_str.replace(",", "").replace("$", "").strip())
        except Exception:
            continue

        try:
            tx_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            tx_date = datetime.now(timezone.utc)

        # Deduplication Hash check
        hash_input = f"{bank_acc.id}-{tx_date.strftime('%Y-%m-%d')}-{amt}-{ref_num or desc}"
        dedup_hash = hashlib.sha256(hash_input.encode()).hexdigest()

        existing = db.query(Transaction).filter(
            Transaction.organization_id == current_user.organization_id,
            Transaction.dedup_hash == dedup_hash
        ).first()
        if existing:
            duplicates += 1
            continue

        # Currency Conversion
        rate_to_usd = CurrencyService.get_rate_to_usd(curr, db=db)
        base_amt = (amt * rate_to_usd).quantize(Decimal("0.0001"))

        # AI Categorization
        cat_id, conf, cat_status, is_recurring = cat_service.categorize(desc, amount=amt)

        new_tx = Transaction(
            organization_id=current_user.organization_id,
            bank_account_id=bank_acc.id,
            transaction_date=tx_date,
            description=desc,
            clean_description=cat_service.clean_text(desc),
            merchant_name=None,
            reference_number=ref_num or f"IMP-{imported+1:04d}",
            currency=curr,
            amount=amt,
            original_amount=amt,
            base_amount=base_amt,
            exchange_rate=rate_to_usd,
            category_id=cat_id,
            ai_category_id=cat_id,
            ai_confidence=conf,
            category_status=cat_status,
            status="unmatched",
            is_recurring=is_recurring,
            dedup_hash=dedup_hash
        )
        db.add(new_tx)
        imported += 1

    # Update bank account sync timestamp
    bank_acc.last_synced_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "imported_count": imported,
        "duplicate_skipped_count": duplicates,
        "account_name": bank_acc.account_name
    }

