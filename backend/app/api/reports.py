import csv
import io
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    Transaction, BankAccount, AnomalyAlert, JournalEntry, User
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Summaries"])

@router.get("/monthly-summary")
def get_monthly_summary(
    period: Optional[str] = Query(None, description="e.g. 2026-10"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx_query = db.query(Transaction).filter(Transaction.organization_id == current_user.organization_id)
    txs = tx_query.all()

    total_inflow = sum((t.base_amount for t in txs if t.base_amount > 0), Decimal("0.00"))
    total_outflow = sum((abs(t.base_amount) for t in txs if t.base_amount < 0), Decimal("0.00"))
    net_cash_flow = total_inflow - total_outflow

    total_count = len(txs)
    matched_count = sum(1 for t in txs if t.status in ["matched", "manual_matched"])
    recon_pct = round(matched_count / total_count * 100, 1) if total_count > 0 else 0.0

    # Category breakdown
    cat_totals = {}
    for t in txs:
        if t.amount < 0:
            c_name = t.category.name if t.category else "Uncategorized"
            cat_totals[c_name] = cat_totals.get(c_name, Decimal("0.00")) + abs(t.base_amount)
    
    category_breakdown = [
        {"name": k, "amount": float(v), "percentage": round(float(v / total_outflow * 100), 1) if total_outflow > 0 else 0}
        for k, v in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    # Currency exposure
    curr_totals = {}
    for t in txs:
        curr = t.currency
        if curr not in curr_totals:
            curr_totals[curr] = {"currency": curr, "tx_count": 0, "volume_original": Decimal("0.00"), "volume_usd": Decimal("0.00")}
        curr_totals[curr]["tx_count"] += 1
        curr_totals[curr]["volume_original"] += abs(t.amount)
        curr_totals[curr]["volume_usd"] += abs(t.base_amount)

    currency_exposure = [
        {
            "currency": k,
            "tx_count": v["tx_count"],
            "volume_original": float(v["volume_original"]),
            "volume_usd": float(v["volume_usd"])
        }
        for k, v in curr_totals.items()
    ]

    anomalies_count = db.query(AnomalyAlert).filter(
        AnomalyAlert.organization_id == current_user.organization_id,
        AnomalyAlert.status == "open"
    ).count()

    pending_journals = db.query(JournalEntry).filter(
        JournalEntry.organization_id == current_user.organization_id,
        JournalEntry.status == "draft"
    ).count()

    return {
        "period": period or "Current Financial Quarter",
        "total_inflow": float(total_inflow),
        "total_outflow": float(total_outflow),
        "net_cash_flow": float(net_cash_flow),
        "reconciled_percentage": recon_pct,
        "category_breakdown": category_breakdown,
        "currency_exposure": currency_exposure,
        "anomalies_detected": anomalies_count,
        "pending_journals": pending_journals
    }

@router.get("/export")
def export_financial_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.organization_id == current_user.organization_id).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Date", "Description", "Merchant", "Reference", "Currency", "Original Amount", "USD Amount", "Exchange Rate", "Category", "Status", "AI Confidence"])
    for t in txs:
        writer.writerow([
            t.transaction_date.strftime("%Y-%m-%d"),
            t.description,
            t.merchant_name or "",
            t.reference_number or "",
            t.currency,
            float(t.amount),
            float(t.base_amount),
            float(t.exchange_rate),
            t.category.name if t.category else "Uncategorized",
            t.status,
            float(t.ai_confidence)
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=LedgerAI_Reconciliation_Report.csv"}
    )

