from decimal import Decimal
from app.services.currency import CurrencyService

def test_currency_conversion():
    # 100 EUR to USD (1.0850)
    usd_val, rate = CurrencyService.convert(Decimal("100.00"), "EUR", "USD")
    assert usd_val == Decimal("108.5000")
    assert rate == Decimal("1.085000")

    # 1000 INR to USD (0.0118)
    inr_val, inr_rate = CurrencyService.convert(Decimal("1000.00"), "INR", "USD")
    assert inr_val == Decimal("11.8000")

    # Same currency conversion should return 1.0 rate
    same_val, same_rate = CurrencyService.convert(Decimal("500.00"), "USD", "USD")
    assert same_val == Decimal("500.00")
    assert same_rate == Decimal("1.000000")

def test_fx_gain_loss():
    # Booking at 1.05, settling at 1.085 -> FX Gain on 10,000 EUR
    gain = CurrencyService.calculate_fx_gain_loss(
        amount=Decimal("10000.00"),
        currency="EUR",
        booking_rate=Decimal("1.050000"),
        settlement_rate=Decimal("1.085000")
    )
    assert gain == Decimal("350.0000")

    # Booking at 1.30, settling at 1.28 -> FX Loss on 5,000 GBP
    loss = CurrencyService.calculate_fx_gain_loss(
        amount=Decimal("5000.00"),
        currency="GBP",
        booking_rate=Decimal("1.300000"),
        settlement_rate=Decimal("1.280000")
    )
    assert loss == Decimal("-100.0000")

