from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import AnomalyAlert, Transaction, User, AuditLog
from app.schemas.schemas import AnomalyAlertResponse, AnomalyResolveRequest
from app.services.auth import get_current_user
from app.services.anomaly import AnomalyDetectionService

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.post("/detect")
def trigger_anomaly_detection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AnomalyDetectionService(db, current_user.organization_id)
    alerts = service.run_detection()
    
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="DETECT",
        entity_type="AnomalyAlert",
        details=f"Ran anomaly detection engine. Flagged {len(alerts)} suspicious transactions."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "detected_count": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity,
                "explanation": a.explanation
            } for a in alerts
        ]
    }

@router.get("", response_model=List[AnomalyAlertResponse])
def list_anomalies(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AnomalyAlert).filter(
        AnomalyAlert.organization_id == current_user.organization_id
    )
    if status:
        query = query.filter(AnomalyAlert.status == status)
    if severity:
        query = query.filter(AnomalyAlert.severity == severity)

    return query.order_by(AnomalyAlert.created_at.desc()).limit(limit).all()

@router.get("/summary")
def get_anomaly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alerts = db.query(AnomalyAlert).filter(
        AnomalyAlert.organization_id == current_user.organization_id,
        AnomalyAlert.status == "open"
    ).all()

    return {
        "total_open": len(alerts),
        "critical": sum(1 for a in alerts if a.severity == "critical"),
        "high": sum(1 for a in alerts if a.severity == "high"),
        "medium": sum(1 for a in alerts if a.severity == "medium"),
        "low": sum(1 for a in alerts if a.severity == "low")
    }

@router.put("/{alert_id}/resolve", response_model=AnomalyAlertResponse)
def resolve_anomaly(
    alert_id: str,
    payload: AnomalyResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AnomalyDetectionService(db, current_user.organization_id)
    alert = service.resolve_alert(
        alert_id=alert_id,
        status=payload.status,
        resolution_notes=payload.resolution_notes,
        user_id=current_user.id
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Anomaly alert not found")

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE",
        entity_type="AnomalyAlert",
        entity_id=alert.id,
        details=f"Accountant marked anomaly {alert.alert_type} as '{payload.status}'. Notes: {payload.resolution_notes}"
    )
    db.add(audit)
    db.commit()

    return alert

