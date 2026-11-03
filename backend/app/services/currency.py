from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import ExchangeRate

# Standard currency baseline rates against USD
STATIC_FX_RATES: Dict[str, Decimal] = {
    "USD": Decimal("1.000000"),
    "EUR": Decimal("1.085000"),  # 1 EUR = 1.0850 USD
    "GBP": Decimal("1.295000"),  # 1 GBP = 1.2950 USD
    "INR": Decimal("0.011800"),  # 1 INR = 0.01180 USD (approx 84.75 INR/USD)
    "CAD": Decimal("0.725000"),  # 1 CAD = 0.7250 USD
    "AUD": Decimal("0.655000"),  # 1 AUD = 0.6550 USD
    "SGD": Decimal("0.755000"),  # 1 SGD = 0.7550 USD
    "JPY": Decimal("0.006500"),  # 1 JPY = 0.00650 USD (approx 153 JPY/USD)
}

class CurrencyService:
    @staticmethod
    def get_rate_to_usd(from_currency: str, effective_date: Optional[datetime] = None, db: Optional[Session] = None) -> Decimal:
        from_curr = from_currency.upper().strip()
        if from_curr == "USD":
            return Decimal("1.000000")
        
        # Check DB first if session provided
        if db:
            rate_entry = db.query(ExchangeRate).filter(
                ExchangeRate.from_currency == from_curr,
                ExchangeRate.to_currency == "USD"
            ).order_by(ExchangeRate.effective_date.desc()).first()
            if rate_entry:
                return rate_entry.rate
        
        # Fallback to static rate
        return STATIC_FX_RATES.get(from_curr, Decimal("1.000000"))

    @staticmethod
    def convert(amount: Decimal, from_currency: str, to_currency: str, db: Optional[Session] = None) -> Tuple[Decimal, Decimal]:
        """
        Converts an amount from one currency to another using Decimal arithmetic.
        Returns: (converted_amount, applied_exchange_rate)
        """
        from_curr = from_currency.upper().strip()
        to_curr = to_currency.upper().strip()
        
        if from_curr == to_curr:
            return amount, Decimal("1.000000")
        
        rate_from_usd = CurrencyService.get_rate_to_usd(from_curr, db=db)
        rate_to_usd = CurrencyService.get_rate_to_usd(to_curr, db=db)
        
        # Cross rate: 1 FromCurr = (rate_from_usd / rate_to_usd) ToCurr
        cross_rate = (rate_from_usd / rate_to_usd).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
        converted_amount = (amount * cross_rate).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        
        return converted_amount, cross_rate

    @staticmethod
    def calculate_fx_gain_loss(
        amount: Decimal,
        currency: str,
        booking_rate: Decimal,
        settlement_rate: Decimal
    ) -> Decimal:
        """
        Calculates realized foreign exchange gain or loss in base currency (USD).
        Positive = FX Gain, Negative = FX Loss.
        Formula: Original Amount * (Settlement Rate - Booking Rate)
        """
        if currency.upper() == "USD" or booking_rate == settlement_rate:
            return Decimal("0.0000")
        
        fx_diff = (settlement_rate - booking_rate)
        gain_loss = (amount * fx_diff).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        return gain_loss

