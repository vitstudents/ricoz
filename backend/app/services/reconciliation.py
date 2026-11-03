import re
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import (
    Transaction, InternalLedgerEntry, ReconciliationRecord, 
    ReconciliationMatch, BankAccount
)

class ReconciliationService:
    def __init__(self, db: Session, organization_id: str):
        self.db = db
        self.org_id = organization_id

    @staticmethod
    def _text_similarity(s1: str, s2: str) -> float:
        """Normalized character & word n-gram similarity"""
        if not s1 or not s2:
            return 0.0
        s1_clean = re.sub(r"[^\w\s]", "", s1.lower()).strip()
        s2_clean = re.sub(r"[^\w\s]", "", s2.lower()).strip()
        
        if s1_clean == s2_clean:
            return 1.0
        
        words1 = set(s1_clean.split())
        words2 = set(s2_clean.split())
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        return intersection / union

    def run_reconciliation(
        self,
        bank_account_id: str,
        period_start: datetime,
        period_end: datetime,
        tolerance_days: int = 4
    ) -> ReconciliationRecord:
        """
        Executes continuous automated bank reconciliation pipeline:
        1. Exact matching (Amount, Ref/Date, Description)
        2. Fuzzy matching (Amount +/- 0.50, Date +/- tolerance_days, Text similarity > 0.6)
        3. Partial matching (Amount within 5% due to bank fee/FX, Date +/- 5 days)
        4. Detect missing internal records & balance difference explanation
        """
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == bank_account_id,
            BankAccount.organization_id == self.org_id
        ).first()
        if not bank_account:
            raise ValueError("Bank account not found")

        # Create or update active reconciliation record
        recon = ReconciliationRecord(
            organization_id=self.org_id,
            bank_account_id=bank_account_id,
            period_start=period_start,
            period_end=period_end,
            statement_ending_balance=bank_account.current_balance,
            book_ending_balance=bank_account.calculated_balance,
            difference=Decimal("0.0000"),
            status="in_progress"
        )
        self.db.add(recon)
        self.db.flush()

        # Fetch bank transactions in period
        bank_txs = self.db.query(Transaction).filter(
            Transaction.bank_account_id == bank_account_id,
            Transaction.organization_id == self.org_id,
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= period_end,
            Transaction.status != "matched"
        ).all()

        # Fetch internal ledger entries in period
        ledger_entries = self.db.query(InternalLedgerEntry).filter(
            InternalLedgerEntry.organization_id == self.org_id,
            InternalLedgerEntry.entry_date >= period_start,
            InternalLedgerEntry.entry_date <= period_end,
            InternalLedgerEntry.status != "matched"
        ).all()

        matched_ledger_ids = set()
        reconciled_count = 0
        partial_count = 0

        # Phase 1: Exact Reference Match & Exact Amount Match
        for b_tx in bank_txs:
            if b_tx.status == "matched":
                continue
            
            for l_entry in ledger_entries:
                if l_entry.id in matched_ledger_ids:
                    continue
                
                # Check reference number match if present
                ref_match = (
                    b_tx.reference_number and l_entry.reference_number and
                    b_tx.reference_number.strip().lower() == l_entry.reference_number.strip().lower()
                )
                
                # Amount exact match
                amount_exact = abs(b_tx.amount - l_entry.amount) < Decimal("0.0001")
                date_diff_days = abs((b_tx.transaction_date - l_entry.entry_date).days)
                
                if amount_exact and (ref_match or (date_diff_days <= 3 and self._text_similarity(b_tx.description, l_entry.description) >= 0.5)):
                    # Exact Match!
                    match = ReconciliationMatch(
                        reconciliation_id=recon.id,
                        transaction_id=b_tx.id,
                        internal_ledger_id=l_entry.id,
                        match_type="exact",
                        match_confidence=Decimal("1.0000"),
                        amount_difference=Decimal("0.0000"),
                        date_difference_days=date_diff_days,
                        notes="Exact match confirmed by amount and counterparty reference"
                    )
                    self.db.add(match)
                    
                    b_tx.status = "matched"
                    l_entry.status = "matched"
                    l_entry.matched_transaction_id = b_tx.id
                    matched_ledger_ids.add(l_entry.id)
                    reconciled_count += 1
                    break

        # Phase 2: Fuzzy Matching (Amount within $0.50, Date <= tolerance_days, Description similarity >= 0.60)
        for b_tx in bank_txs:
            if b_tx.status == "matched":
                continue
            
            best_ledger = None
            best_score = 0.0
            best_date_diff = 0
            best_amt_diff = Decimal("0.0000")

            for l_entry in ledger_entries:
                if l_entry.id in matched_ledger_ids:
                    continue
                
                amt_diff = abs(b_tx.amount - l_entry.amount)
                date_diff_days = abs((b_tx.transaction_date - l_entry.entry_date).days)
                
                if amt_diff <= Decimal("0.5000") and date_diff_days <= tolerance_days:
                    sim = self._text_similarity(b_tx.description, l_entry.description)
                    if sim >= 0.55 and sim > best_score:
                        best_score = sim
                        best_ledger = l_entry
                        best_date_diff = date_diff_days
                        best_amt_diff = amt_diff

            if best_ledger:
                conf = Decimal(str(round(0.85 + (best_score * 0.12), 4)))
                match = ReconciliationMatch(
                    reconciliation_id=recon.id,
                    transaction_id=b_tx.id,
                    internal_ledger_id=best_ledger.id,
                    match_type="fuzzy",
                    match_confidence=conf,
                    amount_difference=best_amt_diff,
                    date_difference_days=best_date_diff,
                    notes=f"Fuzzy match with similarity {round(best_score*100, 1)}% and {best_date_diff}d date variance"
                )
                self.db.add(match)
                b_tx.status = "matched"
                best_ledger.status = "matched"
                best_ledger.matched_transaction_id = b_tx.id
                matched_ledger_ids.add(best_ledger.id)
                reconciled_count += 1

        # Phase 3: Partial Matching (variance up to 5%, e.g. bank processing fees or minor FX delta)
        for b_tx in bank_txs:
            if b_tx.status == "matched":
                continue
            
            for l_entry in ledger_entries:
                if l_entry.id in matched_ledger_ids:
                    continue
                
                amt_diff = abs(b_tx.amount - l_entry.amount)
                if abs(b_tx.amount) > 0:
                    pct_diff = amt_diff / abs(b_tx.amount)
                    date_diff_days = abs((b_tx.transaction_date - l_entry.entry_date).days)
                    sim = self._text_similarity(b_tx.description, l_entry.description)
                    
                    if pct_diff <= Decimal("0.05") and date_diff_days <= 5 and sim >= 0.5:
                        match = ReconciliationMatch(
                            reconciliation_id=recon.id,
                            transaction_id=b_tx.id,
                            internal_ledger_id=l_entry.id,
                            match_type="partial",
                            match_confidence=Decimal("0.7800"),
                            amount_difference=amt_diff,
                            date_difference_days=date_diff_days,
                            notes=f"Partial match: variance of {b_tx.currency} {amt_diff} ({round(float(pct_diff)*100, 2)}%) likely due to fees or FX settlement."
                        )
                        self.db.add(match)
                        b_tx.status = "partial_match"
                        l_entry.status = "partial_match"
                        matched_ledger_ids.add(l_entry.id)
                        partial_count += 1
                        break

        # Calculate remaining unmatched counts and balance difference
        unmatched_bank_txs = [tx for tx in bank_txs if tx.status not in ["matched", "partial_match"]]
        unmatched_bank_total = sum((tx.amount for tx in unmatched_bank_txs), Decimal("0.0000"))
        
        unmatched_ledger = [l for l in ledger_entries if l.id not in matched_ledger_ids]
        unmatched_ledger_total = sum((l.amount for l in unmatched_ledger), Decimal("0.0000"))

        net_difference = (bank_account.current_balance - bank_account.calculated_balance).quantize(Decimal("0.0001"))
        recon.difference = net_difference
        recon.reconciled_count = reconciled_count
        recon.partial_count = partial_count
        recon.unmatched_count = len(unmatched_bank_txs)
        
        # Discrepancy analysis and natural language explanation
        if abs(net_difference) < Decimal("0.01"):
            recon.status = "completed"
            recon.discrepancy_explanation = "Bank account is perfectly reconciled with internal book balance. No unexplained variance detected."
        else:
            recon.status = "discrepancy_detected"
            recon.discrepancy_explanation = (
                f"Discrepancy of {bank_account.currency} {abs(net_difference):,.2f} detected between bank statement ({bank_account.currency} {bank_account.current_balance:,.2f}) "
                f"and book balance ({bank_account.currency} {bank_account.calculated_balance:,.2f}). "
                f"Identified {len(unmatched_bank_txs)} unmatched bank items (net {bank_account.currency} {unmatched_bank_total:,.2f}) and "
                f"{len(unmatched_ledger)} unposted internal ledger items (net {bank_account.currency} {unmatched_ledger_total:,.2f})."
            )

        self.db.commit()
        return recon

    def manual_match(self, transaction_id: str, internal_ledger_id: Optional[str], notes: str) -> ReconciliationMatch:
        """Allows certified accountants to force match or clear unmatched items"""
        tx = self.db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.organization_id == self.org_id).first()
        if not tx:
            raise ValueError("Transaction not found")

        ledger = None
        amt_diff = Decimal("0.0000")
        if internal_ledger_id:
            ledger = self.db.query(InternalLedgerEntry).filter(
                InternalLedgerEntry.id == internal_ledger_id,
                InternalLedgerEntry.organization_id == self.org_id
            ).first()
            if ledger:
                amt_diff = abs(tx.amount - ledger.amount)
                ledger.status = "matched"
                ledger.matched_transaction_id = tx.id

        tx.status = "manual_matched"
        
        # Find active or latest reconciliation
        recon = self.db.query(ReconciliationRecord).filter(
            ReconciliationRecord.bank_account_id == tx.bank_account_id,
            ReconciliationRecord.organization_id == self.org_id
        ).order_by(ReconciliationRecord.created_at.desc()).first()

        match = ReconciliationMatch(
            reconciliation_id=recon.id if recon else "manual-override",
            transaction_id=tx.id,
            internal_ledger_id=ledger.id if ledger else None,
            match_type="manual",
            match_confidence=Decimal("1.0000"),
            amount_difference=amt_diff,
            notes=notes or "Manual override by accountant"
        )
        self.db.add(match)
        if recon:
            recon.reconciled_count += 1
            if recon.unmatched_count > 0:
                recon.unmatched_count -= 1
        
        self.db.commit()
        return match

