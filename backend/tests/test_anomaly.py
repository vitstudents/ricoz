from app.database import SessionLocal
from app.models.models import Organization, AnomalyAlert
from app.services.anomaly import AnomalyDetectionService

def test_anomaly_detection_pipeline():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        service = AnomalyDetectionService(db, org.id)
        
        alerts = service.run_detection()
        assert len(alerts) > 0

        # Check types detected
        alert_types = {a.alert_type for a in alerts}
        assert "duplicate_payment" in alert_types or "unusual_amount" in alert_types

        # Check that every alert has an explanation
        for a in alerts:
            assert len(a.explanation) > 15
            assert a.severity in ["low", "medium", "high", "critical"]

        # Test resolution
        first_alert = alerts[0]
        resolved = service.resolve_alert(
            alert_id=first_alert.id,
            status="resolved",
            resolution_notes="Verified by accountant",
            user_id="test-user"
        )
        assert resolved.status == "resolved"
    finally:
        db.close()

