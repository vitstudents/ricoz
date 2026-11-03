import re
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import TransactionCategory, Transaction

# Standard Accounting Categories Mapping Rules
MERCHANT_RULES = {
    # Software & SaaS
    r"aws|amazon web services|ec2|s3": ("Software & Cloud Hosting", "EXP-SFT-001", 0.98, True),
    r"github|gitlab|atlassian|jira|confluence": ("Developer Tools & SaaS", "EXP-SFT-002", 0.98, True),
    r"slack|zoom|microsoft 365|google workspace|notion": ("Collaboration & Communication", "EXP-SFT-003", 0.97, True),
    r"salesforce|hubspot|zendesk": ("CRM & Customer Support", "EXP-SFT-004", 0.96, True),
    r"datadog|sentry|pagerduty|new relic": ("Infrastructure Monitoring", "EXP-SFT-005", 0.97, True),
    r"figma|adobe|canva": ("Design Software", "EXP-SFT-006", 0.96, True),
    
    # Payroll & Contractor
    r"gusto|adp|rippling|payroll|direct deposit payroll|trinet": ("Salaries & Wages", "EXP-PAY-001", 0.99, True),
    r"upwork|fiverr|toptal|contractor": ("Contractor & Consulting", "EXP-CON-001", 0.94, False),
    
    # Office & Facilities
    r"wework|regus|industrious|office rent|landlord": ("Office Rent & Coworking", "EXP-FAC-001", 0.97, True),
    r"coned|utility|electric|water dept|internet": ("Utilities & Internet", "EXP-FAC-002", 0.95, True),
    
    # Travel & Entertainment
    r"uber|lyft|taxi|cab": ("Local Transportation", "EXP-TRV-001", 0.92, False),
    r"delta|united airlines|american air|lufthansa|british airways": ("Air Travel", "EXP-TRV-002", 0.95, False),
    r"marriott|hilton|hyatt|airbnb|hotel": ("Lodging & Hotels", "EXP-TRV-003", 0.94, False),
    r"doordash|uber eats|grubhub|starbucks|catering|restaurant": ("Meals & Entertainment", "EXP-TRV-004", 0.90, False),
    
    # Banking & Financial Services
    r"stripe payout|stripe transfer|merchant deposit": ("Customer Revenue (Merchant Payout)", "REV-SAL-001", 0.98, True),
    r"wire fee|monthly service fee|bank charge|overdraft|fx fee": ("Bank Service Charges", "EXP-BNK-001", 0.98, False),
    r"interest income|interest paid": ("Interest Income", "REV-INT-001", 0.96, True),
    r"internal transfer|transfer to|sweep": ("Intercompany / Account Transfer", "AST-TRF-001", 0.95, False),
    r"client invoice|customer payment|invoice paid|wire in": ("Accounts Receivable Collection", "REV-SAL-002", 0.95, False),
    r"legal|law firm|cooley|wilson sonsini|gunderson": ("Legal & Professional Fees", "EXP-PRO-001", 0.95, False),
}

class CategorizationService:
    def __init__(self, db: Session, organization_id: str):
        self.db = db
        self.org_id = organization_id
        self._category_cache: Dict[str, TransactionCategory] = {}
        self._load_categories()

    def _load_categories(self):
        cats = self.db.query(TransactionCategory).filter(
            TransactionCategory.organization_id == self.org_id
        ).all()
        for cat in cats:
            self._category_cache[cat.name.lower()] = cat
            self._category_cache[cat.code.lower()] = cat

    def clean_text(self, text: str) -> str:
        """Removes card numbers, transaction IDs, timestamps, and noisy punctuation"""
        cleaned = re.sub(r"[\*#\d]{4,}", " ", text)
        cleaned = re.sub(r"\b(pos|auth|card|purchase|ref|txn|ach|debit|credit|payment)\b", " ", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"[^\w\s]", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def categorize(self, description: str, merchant_name: Optional[str] = None, amount: Optional[Decimal] = None) -> Tuple[Optional[str], Decimal, str, bool]:
        """
        Categorizes a transaction.
        Returns: (category_id, confidence, category_status, is_recurring)
        category_status: 'auto_categorized' (>= 0.85) or 'low_confidence_flagged' (< 0.85)
        """
        target_text = f"{merchant_name or ''} {description}".lower()
        
        # 1. Check for accountant learned overrides from previous manually reviewed transactions
        learned = self.db.query(Transaction).filter(
            Transaction.organization_id == self.org_id,
            Transaction.category_status == "manual_reviewed",
            Transaction.category_id.isnot(None)
        ).all()
        for prev in learned:
            if prev.merchant_name and prev.merchant_name.lower() in target_text:
                return prev.category_id, Decimal("0.9900"), "auto_categorized", prev.is_recurring
            if prev.clean_description and prev.clean_description.lower() in target_text:
                return prev.category_id, Decimal("0.9800"), "auto_categorized", prev.is_recurring

        # 2. Rule and regex pattern matching
        best_match = None
        highest_conf = Decimal("0.0000")
        is_recurring = False

        for pattern, (cat_name, code, conf, recurring) in MERCHANT_RULES.items():
            if re.search(pattern, target_text, flags=re.IGNORECASE):
                conf_dec = Decimal(str(conf))
                if conf_dec > highest_conf:
                    highest_conf = conf_dec
                    is_recurring = recurring
                    best_match = self._find_or_create_category(cat_name, code)

        if best_match and highest_conf >= Decimal("0.8500"):
            return best_match.id, highest_conf, "auto_categorized", is_recurring

        # 3. Fallback for ambiguous descriptions
        # Heuristic detection based on words like 'consulting', 'software', 'fee', 'office'
        cleaned = self.clean_text(description).lower()
        if "consult" in cleaned or "advisor" in cleaned:
            cat = self._find_or_create_category("Contractor & Consulting", "EXP-CON-001")
            return cat.id, Decimal("0.7800"), "low_confidence_flagged", False
        elif "software" in cleaned or "tech" in cleaned or "cloud" in cleaned:
            cat = self._find_or_create_category("Software & Cloud Hosting", "EXP-SFT-001")
            return cat.id, Decimal("0.8000"), "low_confidence_flagged", False
        elif "tax" in cleaned or "state" in cleaned:
            cat = self._find_or_create_category("Taxes & Licenses", "EXP-TAX-001")
            return cat.id, Decimal("0.8200"), "low_confidence_flagged", False

        # If completely unknown, assign general 'Uncategorized Expense / Clearing'
        general_cat = self._find_or_create_category("Uncategorized Expense", "EXP-UNC-000", cat_type="expense")
        return general_cat.id, Decimal("0.4500"), "low_confidence_flagged", False

    def _find_or_create_category(self, name: str, code: str, cat_type: str = "expense") -> TransactionCategory:
        name_key = name.lower()
        if name_key in self._category_cache:
            return self._category_cache[name_key]
        
        # Check in DB
        cat = self.db.query(TransactionCategory).filter(
            TransactionCategory.organization_id == self.org_id,
            TransactionCategory.name == name
        ).first()
        
        if not cat:
            cat = TransactionCategory(
                organization_id=self.org_id,
                name=name,
                code=code,
                type="revenue" if "REV" in code or "Revenue" in name else cat_type,
                description=f"Auto-generated category for {name}",
                default_account_code=code,
                is_system=True
            )
            self.db.add(cat)
            self.db.flush()
        
        self._category_cache[name_key] = cat
        self._category_cache[code.lower()] = cat
        return cat

    def learn_from_feedback(self, transaction_id: str, new_category_id: str, user_id: str):
        """Accountant feedback loop: updates category and marks as manual_reviewed"""
        tx = self.db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.organization_id == self.org_id
        ).first()
        if tx:
            tx.category_id = new_category_id
            tx.category_status = "manual_reviewed"
            tx.ai_confidence = Decimal("1.0000")
            self.db.commit()
            return True
        return False

