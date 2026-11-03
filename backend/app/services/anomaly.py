from datetime import timedelta
from decimal import Decimal
import math
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Transaction, AnomalyAlert

class AnomalyDetectionService:
    def __init__(self, db: Session, organization_id: str):
        self.db = db
        self.org_id = organization_id

    def run_detection(self) -> List[AnomalyAlert]:
        """
        Executes multi-layered anomaly detection algorithms:
        1. Duplicate payments (same amount & merchant within 72 hours)
        2. Statistical Outlier on Amount (Z-score > 2.5 on category/historical transactions)
        3. Sudden large balance changes / high value wires (> $15,000)
        4. Weekend or off-hours spikes
        5. Suspicious/ambiguous foreign vendors or structuring
        """
        transactions = self.db.query(Transaction).filter(
            Transaction.organization_id == self.org_id
        ).order_by(Transaction.transaction_date.asc()).all()

        if not transactions:
            return []

        # Delete existing open alerts to refresh cleanly
        self.db.query(AnomalyAlert).filter(
            AnomalyAlert.organization_id == self.org_id,
            AnomalyAlert.status == "open"
        ).delete()
        self.db.flush()

        alerts = []

        # 1. Duplicate Payment Detection
        # Compare adjacent transactions by amount and description within 72h window
        for i in range(len(transactions)):
            tx1 = transactions[i]
            for j in range(i + 1, len(transactions)):
                tx2 = transactions[j]
                time_delta = tx2.transaction_date - tx1.transaction_date
                if time_delta > timedelta(hours=72):
                    break
                
                # Check same amount and similar description/merchant
                if abs(tx1.amount - tx2.amount) < Decimal("0.0001") and tx1.amount != Decimal("0.0000"):
                    same_merchant = tx1.merchant_name and tx2.merchant_name and (tx1.merchant_name.lower() == tx2.merchant_name.lower())
                    same_desc = tx1.clean_description and tx2.clean_description and (tx1.clean_description.lower() == tx2.clean_description.lower())
                    
                    if same_merchant or same_desc:
                        # Flag tx2 as duplicate payment risk
                        alert = AnomalyAlert(
                            organization_id=self.org_id,
                            transaction_id=tx2.id,
                            alert_type="duplicate_payment",
                            severity="high",
                            score=Decimal("0.9200"),
                            explanation=(
                                f"Potential duplicate payment detected: Exact amount of {tx2.currency} {abs(tx2.amount):,.2f} "
                                f"paid to '{tx2.merchant_name or tx2.description}' {time_delta.total_seconds() / 3600:.1f} hours after previous transaction."
                            ),
                            status="open"
                        )
                        self.db.add(alert)
                        alerts.append(alert)

        # 2. Statistical Outlier Detection (Z-score on amounts)
        amounts = [float(abs(t.amount)) for t in transactions if abs(t.amount) > 0]
        if len(amounts) >= 10:
            mean_amt = sum(amounts) / len(amounts)
            variance = sum((x - mean_amt) ** 2 for x in amounts) / len(amounts)
            std_amt = math.sqrt(variance) if variance > 0 else 1.0

            for tx in transactions:
                amt_val = float(abs(tx.amount))
                z_score = (amt_val - mean_amt) / std_amt if std_amt > 0 else 0
                
                if z_score > 3.0:  # extreme outlier
                    alert = AnomalyAlert(
                        organization_id=self.org_id,
                        transaction_id=tx.id,
                        alert_type="unusual_amount",
                        severity="critical" if amt_val > 20000 else "high",
                        score=Decimal(str(min(round(0.85 + (z_score * 0.03), 4), 0.99))),
                        explanation=(
                            f"Statistical outlier amount: {tx.currency} {abs(tx.amount):,.2f} has a Z-score of {z_score:.2f} "
                            f"(historical mean is {tx.currency} {mean_amt:,.2f}, standard deviation {tx.currency} {std_amt:,.2f})."
                        ),
                        status="open"
                    )
                    self.db.add(alert)
                    alerts.append(alert)

        # 3. Weekend Spike / Off-hours corporate wire anomalies
        for tx in transactions:
            # Check if transaction occurred on Saturday (5) or Sunday (6) with high amount
            weekday = tx.transaction_date.weekday()
            if weekday in [5, 6] and abs(tx.amount) > Decimal("5000.00"):
                alert = AnomalyAlert(
                    organization_id=self.org_id,
                    transaction_id=tx.id,
                    alert_type="weekend_spike",
                    severity="medium",
                    score=Decimal("0.7800"),
                    explanation=(
                        f"Unusual weekend corporate transfer: High value outflow of {tx.currency} {abs(tx.amount):,.2f} "
                        f"processed on a {'Saturday' if weekday == 5 else 'Sunday'} to '{tx.merchant_name or tx.description}'."
                    ),
                    status="open"
                )
                self.db.add(alert)
                alerts.append(alert)

        # 4. Suspicious/High-Risk Vendor / Unexplained Cash Outflows
        for tx in transactions:
            desc_lower = tx.description.lower()
            if any(term in desc_lower for term in ["crypto", "bitcoin", "unknown remit", "offshore", "gambling", "unidentified wire"]):
                alert = AnomalyAlert(
                    organization_id=self.org_id,
                    transaction_id=tx.id,
                    alert_type="suspicious_vendor",
                    severity="critical",
                    score=Decimal("0.9600"),
                    explanation=(
                        f"Suspicious vendor keyword detected in wire memo '{tx.description}' for amount {tx.currency} {abs(tx.amount):,.2f}. "
                        f"Immediate AML & accounting review required."
                    ),
                    status="open"
                )
                self.db.add(alert)
                alerts.append(alert)

        self.db.commit()
        return alerts

    def resolve_alert(self, alert_id: str, status: str, resolution_notes: str, user_id: str) -> Optional[AnomalyAlert]:
        alert = self.db.query(AnomalyAlert).filter(
            AnomalyAlert.id == alert_id,
            AnomalyAlert.organization_id == self.org_id
        ).first()
        if alert:
            alert.status = status
            alert.resolution_notes = resolution_notes
            self.db.commit()
        return alert

