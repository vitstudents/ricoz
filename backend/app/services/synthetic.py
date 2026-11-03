import hashlib
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session

from app.models.models import (
    Organization, User, BankAccount, TransactionCategory, 
    Transaction, InternalLedgerEntry, ExchangeRate
)
from app.services.auth import hash_password
from app.services.currency import CurrencyService, STATIC_FX_RATES
from app.services.categorization import CategorizationService

MERCHANT_TEMPLATES = [
    # Vendor, Category Name, Code, Min Amount, Max Amount, Is Inflow, Recurring
    ("Amazon Web Services", "Software & Cloud Hosting", "EXP-SFT-001", 450, 4200, False, True),
    ("GitHub Enterprise", "Developer Tools & SaaS", "EXP-SFT-002", 210, 850, False, True),
    ("Slack Technologies", "Collaboration & Communication", "EXP-SFT-003", 120, 650, False, True),
    ("Google Workspace", "Collaboration & Communication", "EXP-SFT-003", 180, 520, False, True),
    ("Salesforce Cloud", "CRM & Customer Support", "EXP-SFT-004", 1200, 3800, False, True),
    ("Datadog Monitoring", "Infrastructure Monitoring", "EXP-SFT-005", 350, 1400, False, True),
    ("Figma Design Systems", "Design Software", "EXP-SFT-006", 90, 280, False, True),
    ("Gusto Payroll Transfer", "Salaries & Wages", "EXP-PAY-001", 15000, 32000, False, True),
    ("WeWork Global Office", "Office Rent & Coworking", "EXP-FAC-001", 3500, 7500, False, True),
    ("ConEdison Electricity", "Utilities & Internet", "EXP-FAC-002", 250, 850, False, True),
    ("Uber Corporate Rides", "Local Transportation", "EXP-TRV-001", 25, 95, False, False),
    ("Delta Air Lines", "Air Travel", "EXP-TRV-002", 350, 1400, False, False),
    ("Marriott Hotels Corporate", "Lodging & Hotels", "EXP-TRV-003", 280, 1100, False, False),
    ("DoorDash Team Lunch", "Meals & Entertainment", "EXP-TRV-004", 45, 180, False, False),
    ("Stripe Merchant Payout", "Customer Revenue (Merchant Payout)", "REV-SAL-001", 8000, 45000, True, True),
    ("Enterprise Client Wire Payout", "Accounts Receivable Collection", "REV-SAL-002", 12000, 85000, True, False),
    ("Silicon Valley Bank Fee", "Bank Service Charges", "EXP-BNK-001", 15, 65, False, True),
    ("Cooley LLP Legal Counsel", "Legal & Professional Fees", "EXP-PRO-001", 2500, 8000, False, False),
    ("Upwork Global Freelancer", "Contractor & Consulting", "EXP-CON-001", 600, 2400, False, False)
]

def seed_database_if_empty(db: Session, force_reset: bool = False):
    """
    Seeds database with 1,000+ realistic synthetic transactions,
    internal accounting books, exchange rates, and intentional discrepancies.
    """
    existing_org = db.query(Organization).first()
    if existing_org and not force_reset:
        return existing_org

    # Clear existing if force_reset
    if force_reset:
        db.query(Transaction).delete()
        db.query(InternalLedgerEntry).delete()
        db.query(BankAccount).delete()
        db.query(User).delete()
        db.query(Organization).delete()
        db.commit()

    # 1. Create Organization
    org = Organization(name="Acme Global Technologies Inc.", base_currency="USD")
    db.add(org)
    db.flush()

    # 2. Create Users
    admin_user = User(
        organization_id=org.id,
        email="accountant@ledgerai.io",
        full_name="Sarah Jenkins, CPA",
        hashed_password=hash_password("admin123"),
        role="admin"
    )
    auditor_user = User(
        organization_id=org.id,
        email="auditor@kpmg.com",
        full_name="David Miller, Senior Auditor",
        hashed_password=hash_password("auditor123"),
        role="auditor"
    )
    db.add_all([admin_user, auditor_user])
    db.flush()

    # 3. Create Bank Accounts
    usd_acc = BankAccount(
        organization_id=org.id,
        account_number="US-SVB-8492048",
        account_name="USD Operating Account",
        bank_name="Silicon Valley Bank",
        currency="USD",
        current_balance=Decimal("284500.0000"),
        calculated_balance=Decimal("282000.0000")  # Intentionally $2,500 discrepancy
    )
    eur_acc = BankAccount(
        organization_id=org.id,
        account_number="EU-DB-9382103",
        account_name="EUR European Treasury",
        bank_name="Deutsche Bank",
        currency="EUR",
        current_balance=Decimal("145000.0000"),
        calculated_balance=Decimal("145000.0000")
    )
    gbp_acc = BankAccount(
        organization_id=org.id,
        account_number="UK-BARC-284019",
        account_name="GBP UK Commercial Account",
        bank_name="Barclays UK",
        currency="GBP",
        current_balance=Decimal("92000.0000"),
        calculated_balance=Decimal("92000.0000")
    )
    inr_acc = BankAccount(
        organization_id=org.id,
        account_number="IN-HDFC-992014",
        account_name="INR Bangalore Tech Center",
        bank_name="HDFC Bank",
        currency="INR",
        current_balance=Decimal("4200000.0000"),
        calculated_balance=Decimal("4200000.0000")
    )
    db.add_all([usd_acc, eur_acc, gbp_acc, inr_acc])
    db.flush()

    # 4. Create Historical Exchange Rates
    for curr, rate in STATIC_FX_RATES.items():
        if curr != "USD":
            fx_entry = ExchangeRate(
                from_currency=curr,
                to_currency="USD",
                rate=rate,
                effective_date=datetime.now(timezone.utc) - timedelta(days=30),
                source="ECB_HISTORICAL"
            )
            db.add(fx_entry)
    db.flush()

    # 5. Populate Standard Categories
    categorization_service = CategorizationService(db, org.id)
    cat_lookup = {}
    for merchant, cat_name, code, _, _, is_inflow, _ in MERCHANT_TEMPLATES:
        cat_type = "revenue" if is_inflow else "expense"
        cat = categorization_service._find_or_create_category(cat_name, code, cat_type)
        cat_lookup[cat_name] = cat
    db.flush()

    # 6. Generate 1,000+ Synthetic Transactions
    random.seed(42)  # Deterministic seed for reproducible evaluation metrics
    now = datetime.now(timezone.utc)
    accounts = [usd_acc, eur_acc, gbp_acc, inr_acc]

    created_txs = []
    created_ledgers = []

    total_target = 1050

    for idx in range(1, total_target + 1):
        # Pick account
        acc = random.choices(accounts, weights=[0.55, 0.20, 0.15, 0.10])[0]
        tpl = random.choice(MERCHANT_TEMPLATES)
        vendor, cat_name, code, min_amt, max_amt, is_inflow, is_recurring = tpl

        # Amount calculation with currency adjustment
        raw_amt = random.uniform(min_amt, max_amt)
        if acc.currency == "INR":
            raw_amt *= 80  # scale up for INR
        elif acc.currency in ["EUR", "GBP"]:
            raw_amt *= 0.9

        amt_decimal = Decimal(str(round(raw_amt, 2)))
        final_amount = amt_decimal if is_inflow else -amt_decimal

        # Converted base amount (USD)
        rate_to_usd = CurrencyService.get_rate_to_usd(acc.currency)
        base_amt = (final_amount * rate_to_usd).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

        # Transaction date distributed across past 60 days
        days_ago = random.randint(1, 60)
        tx_date = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        ref_num = f"TXN-{acc.currency}-{tx_date.strftime('%Y%m%d')}-{idx:04d}"

        # Dedup hash
        hash_input = f"{acc.id}-{tx_date.strftime('%Y-%m-%d')}-{final_amount}-{ref_num}"
        dedup_hash = hashlib.sha256(hash_input.encode()).hexdigest()

        # Category and confidence assignment
        category_obj = cat_lookup.get(cat_name)
        confidence = Decimal(str(round(random.uniform(0.92, 0.99), 4)))

        # Create Transaction
        tx = Transaction(
            organization_id=org.id,
            bank_account_id=acc.id,
            transaction_date=tx_date,
            value_date=tx_date + timedelta(days=1),
            description=f"{vendor} Ref: {ref_num}",
            clean_description=vendor,
            merchant_name=vendor,
            reference_number=ref_num,
            currency=acc.currency,
            amount=final_amount,
            original_amount=final_amount,
            base_amount=base_amt,
            exchange_rate=rate_to_usd,
            category_id=category_obj.id if category_obj else None,
            ai_category_id=category_obj.id if category_obj else None,
            ai_confidence=confidence,
            category_status="auto_categorized",
            status="unmatched",
            is_recurring=is_recurring,
            dedup_hash=dedup_hash
        )
        created_txs.append(tx)

        # Internal Ledger Matching logic:
        # Create corresponding internal ledger entry for 88% of transactions (exact/fuzzy matches)
        # 12% remain unmatched to test discrepancy & missing record detection
        if random.random() < 0.88:
            # Add slight date or amount variation for realistic reconciliation
            match_scenario = random.random()
            if match_scenario < 0.70:
                # Exact match
                ledger_amt = final_amount
                ledger_date = tx_date
                ledger_desc = f"{vendor} / Invoice {ref_num}"
            elif match_scenario < 0.88:
                # Fuzzy match (+/- 1-2 days)
                ledger_amt = final_amount
                ledger_date = tx_date + timedelta(days=random.choice([-2, -1, 1, 2]))
                ledger_desc = f"{vendor} Payment {ref_num}"
            else:
                # Partial match (small fee variance $1-$15)
                fee = Decimal(str(random.randint(1, 10)))
                ledger_amt = final_amount + fee if final_amount < 0 else final_amount - fee
                ledger_date = tx_date + timedelta(days=1)
                ledger_desc = f"{vendor} Gross Settlement"

            ledger_entry = InternalLedgerEntry(
                organization_id=org.id,
                entry_date=ledger_date,
                description=ledger_desc,
                reference_number=ref_num,
                account_code=code,
                account_name=cat_name,
                currency=acc.currency,
                amount=ledger_amt,
                base_amount=(ledger_amt * rate_to_usd).quantize(Decimal("0.0001")),
                status="unmatched"
            )
            created_ledgers.append(ledger_entry)

    # 7. Add Specific Intentionally Introduced Anomalies & Edge Cases:
    # A. Specific $2,500.00 Unmatched Discrepancy (user query target!)
    discrepancy_tx = Transaction(
        organization_id=org.id,
        bank_account_id=usd_acc.id,
        transaction_date=now - timedelta(days=5),
        description="Wire Transfer Out: Unrecorded Vendor Deposit Ref: WT-2500-DISC",
        clean_description="Unrecorded Vendor Deposit",
        merchant_name="Apex Logistics Corp",
        reference_number="WT-2500-DISC",
        currency="USD",
        amount=Decimal("-2500.0000"),
        original_amount=Decimal("-2500.0000"),
        base_amount=Decimal("-2500.0000"),
        exchange_rate=Decimal("1.000000"),
        category_id=cat_lookup.get("Contractor & Consulting").id,
        ai_category_id=cat_lookup.get("Contractor & Consulting").id,
        ai_confidence=Decimal("0.7800"),
        category_status="low_confidence_flagged",
        status="unmatched",
        is_recurring=False,
        dedup_hash=hashlib.sha256(b"discrepancy-2500-test").hexdigest()
    )
    created_txs.append(discrepancy_tx)

    # B. Duplicate Payment Anomaly (Within 12 hours)
    dup_date = now - timedelta(days=8)
    dup_tx1 = Transaction(
        organization_id=org.id,
        bank_account_id=usd_acc.id,
        transaction_date=dup_date,
        description="WeWork Global Office Rent Oct 2026",
        clean_description="WeWork Global Office",
        merchant_name="WeWork Global Office",
        reference_number="WEWORK-OCT-991A",
        currency="USD",
        amount=Decimal("-6800.0000"),
        original_amount=Decimal("-6800.0000"),
        base_amount=Decimal("-6800.0000"),
        exchange_rate=Decimal("1.000000"),
        category_id=cat_lookup.get("Office Rent & Coworking").id,
        ai_confidence=Decimal("0.9700"),
        category_status="auto_categorized",
        status="unmatched",
        is_recurring=True,
        dedup_hash=hashlib.sha256(b"wework-dup-1").hexdigest()
    )
    dup_tx2 = Transaction(
        organization_id=org.id,
        bank_account_id=usd_acc.id,
        transaction_date=dup_date + timedelta(hours=14),
        description="WeWork Global Office Rent Oct 2026 - DUPLICATE WIRE",
        clean_description="WeWork Global Office",
        merchant_name="WeWork Global Office",
        reference_number="WEWORK-OCT-991B",
        currency="USD",
        amount=Decimal("-6800.0000"),
        original_amount=Decimal("-6800.0000"),
        base_amount=Decimal("-6800.0000"),
        exchange_rate=Decimal("1.000000"),
        category_id=cat_lookup.get("Office Rent & Coworking").id,
        ai_confidence=Decimal("0.9700"),
        category_status="auto_categorized",
        status="unmatched",
        is_recurring=True,
        dedup_hash=hashlib.sha256(b"wework-dup-2").hexdigest()
    )
    created_txs.extend([dup_tx1, dup_tx2])

    # C. Statistical Extreme Outlier Anomaly ($98,500 Wire)
    outlier_tx = Transaction(
        organization_id=org.id,
        bank_account_id=usd_acc.id,
        transaction_date=now - timedelta(days=12),
        description="Special Equipment Acquisition Wire Ref: OUTLIER-98500",
        clean_description="Special Equipment Acquisition",
        merchant_name="Industrial Automation Ltd",
        reference_number="OUTLIER-98500",
        currency="USD",
        amount=Decimal("-98500.0000"),
        original_amount=Decimal("-98500.0000"),
        base_amount=Decimal("-98500.0000"),
        exchange_rate=Decimal("1.000000"),
        category_id=cat_lookup.get("Contractor & Consulting").id,
        ai_confidence=Decimal("0.6200"),
        category_status="low_confidence_flagged",
        status="unmatched",
        is_recurring=False,
        dedup_hash=hashlib.sha256(b"outlier-98500-test").hexdigest()
    )
    created_txs.append(outlier_tx)

    # Bulk insert
    db.bulk_save_objects(created_txs)
    db.bulk_save_objects(created_ledgers)
    db.commit()

    return org

