import time
from decimal import Decimal
from app.database import SessionLocal
from app.models.models import Organization, JournalEntry
from app.services.journal import JournalService

def test_balanced_double_entry_journal_generation():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        service = JournalService(db, org.id)

        test_period = f"2026-{int(time.time()) % 1000:03d}"
        entry = service.generate_reconciliation_journal_entry(period=test_period, user_id="test-accountant")
        assert entry is not None
        assert entry.status == "draft"

        # Double-entry core rule: Total Debits must exactly equal Total Credits
        assert entry.total_debit == entry.total_credit
        assert entry.total_debit > Decimal("0.00")

        # Lines validation
        assert len(entry.lines) >= 2
        sum_debits = sum((l.debit for l in entry.lines), Decimal("0.0000"))
        sum_credits = sum((l.credit for l in entry.lines), Decimal("0.0000"))
        assert sum_debits == sum_credits

        # Test Approval Workflow
        approved = service.approve_entry(entry.id, reviewer_user_id="cert-cpa-1")
        assert approved.status == "approved"
        assert approved.approved_by_user_id == "cert-cpa-1"
    finally:
        db.close()
