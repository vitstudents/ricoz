from decimal import Decimal
from app.database import SessionLocal
from app.services.categorization import CategorizationService
from app.models.models import Organization, TransactionCategory

def test_ai_categorization_and_confidence():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        service = CategorizationService(db, org.id)

        # Known SaaS merchant
        cat_id, conf, status, is_rec = service.categorize(
            description="AWS EMEA Cloud Services Invoice 92830",
            merchant_name="Amazon Web Services"
        )
        assert cat_id is not None
        assert conf >= Decimal("0.9000")
        assert status == "auto_categorized"
        assert is_rec is True

        # Payroll vendor
        cat_id, conf, status, is_rec = service.categorize(
            description="Gusto Direct Deposit Payroll Batch"
        )
        assert conf >= Decimal("0.9500")
        assert is_rec is True

        # Ambiguous description
        cat_id, conf, status, is_rec = service.categorize(
            description="Misc Wire Out 129482 Unknown Counterparty"
        )
        assert conf < Decimal("0.8500")
        assert status == "low_confidence_flagged"
    finally:
        db.close()

