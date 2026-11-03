from datetime import datetime, timedelta, timezone
from decimal import Decimal
from app.database import SessionLocal
from app.models.models import Organization, BankAccount, Transaction, InternalLedgerEntry
from app.services.reconciliation import ReconciliationService

def test_reconciliation_exact_fuzzy_and_discrepancy():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        account = db.query(BankAccount).filter(BankAccount.organization_id == org.id).first()

        # Reset status for testing reconciliation
        db.query(Transaction).filter(Transaction.bank_account_id == account.id).update({"status": "unmatched"})
        db.query(InternalLedgerEntry).filter(InternalLedgerEntry.organization_id == org.id).update({"status": "unmatched"})
        db.commit()

        service = ReconciliationService(db, org.id)
        now = datetime.now(timezone.utc)

        recon = service.run_reconciliation(
            bank_account_id=account.id,
            period_start=now - timedelta(days=90),
            period_end=now,
            tolerance_days=4
        )

        assert recon.id is not None
        assert recon.reconciled_count > 0
        assert recon.unmatched_count >= 0
        # Discrepancy explanation exists
        assert recon.discrepancy_explanation is not None
    finally:
        db.close()
