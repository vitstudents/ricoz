import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import JournalEntry, JournalEntryLine, User
from app.schemas.schemas import JournalEntryResponse, JournalEntryActionRequest
from app.services.auth import get_current_user, require_role
from app.services.journal import JournalService

router = APIRouter(prefix="/journals", tags=["Journal Entries"])

@router.post("/generate", response_model=JournalEntryResponse)
def generate_reconciliation_journal(
    period: str = Query("2026-10", description="Period in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JournalService(db, current_user.organization_id)
    entry = service.generate_reconciliation_journal_entry(period=period, user_id=current_user.id)
    if not entry:
        raise HTTPException(status_code=400, detail="No transactions found for the specified period.")
    return entry

@router.post("/generate-fx", response_model=JournalEntryResponse)
def generate_fx_adjustment(
    period: str = Query("2026-10", description="Period in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JournalService(db, current_user.organization_id)
    entry = service.generate_fx_adjustment_entry(period=period, user_id=current_user.id)
    return entry

@router.get("", response_model=List[JournalEntryResponse])
def list_journal_entries(
    status: Optional[str] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(JournalEntry).filter(JournalEntry.organization_id == current_user.organization_id)
    if status:
        query = query.filter(JournalEntry.status == status)
    if period:
        query = query.filter(JournalEntry.period == period)

    return query.order_by(JournalEntry.created_at.desc()).all()

@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.organization_id == current_user.organization_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry

@router.post("/{entry_id}/action", response_model=JournalEntryResponse)
def perform_journal_action(
    entry_id: str,
    payload: JournalEntryActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = JournalService(db, current_user.organization_id)
    if payload.action == "approve":
        return service.approve_entry(entry_id=entry_id, reviewer_user_id=current_user.id)
    elif payload.action == "reject":
        if not payload.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")
        return service.reject_entry(entry_id=entry_id, reason=payload.rejection_reason, reviewer_user_id=current_user.id)
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action: {payload.action}")

@router.get("/{entry_id}/export")
def export_journal_csv(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.organization_id == current_user.organization_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Standard ERP General Ledger Import Format (NetSuite/QuickBooks/Xero compatible)
    writer.writerow(["Entry Number", "Date", "Period", "Account Code", "Account Name", "Description", "Debit", "Credit", "Currency"])
    
    for line in entry.lines:
        writer.writerow([
            entry.entry_number,
            entry.entry_date.strftime("%Y-%m-%d"),
            entry.period,
            line.account_code,
            line.account_name,
            line.description or entry.description,
            float(line.debit),
            float(line.credit),
            line.currency
        ])
    
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={entry.entry_number}.csv"}
    )

