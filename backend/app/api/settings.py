from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import BankAccount, TransactionCategory, ExchangeRate, AuditLog, User
from app.schemas.schemas import BankAccountResponse, CategoryResponse, AuditLogResponse
from app.services.auth import get_current_user
from app.services.currency import STATIC_FX_RATES

router = APIRouter(prefix="/settings", tags=["Settings & Management"])

@router.get("/accounts", response_model=List[BankAccountResponse])
def list_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(BankAccount).filter(BankAccount.organization_id == current_user.organization_id).all()

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(TransactionCategory).filter(TransactionCategory.organization_id == current_user.organization_id).all()

@router.get("/currencies")
def list_currencies():
    return [
        {"currency": k, "rate_to_usd": float(v), "description": f"1 {k} = {float(v)} USD"}
        for k, v in STATIC_FX_RATES.items()
    ]

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AuditLog).filter(
        AuditLog.organization_id == current_user.organization_id
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()

