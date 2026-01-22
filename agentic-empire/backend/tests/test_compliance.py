"""Tests for compliance checking system."""
import pytest
from compliance.compliance_officer import compliance_officer
from datetime import datetime

def test_pattern_day_trader_detection():
    """Test PDT rule enforcement."""
    result = compliance_officer.check_pattern_day_trader(20000)
    assert "is_pdt" in result
    assert "day_trades" in result

def test_wash_sale_check():
    """Test wash sale violation detection."""
    sell_date = datetime(2024, 1, 15)
    buy_date = datetime(2024, 1, 1)
    is_wash_sale = compliance_officer.check_wash_sale("AAPL", sell_date, buy_date)
    assert isinstance(is_wash_sale, bool)
    assert is_wash_sale is True  # Within 30 days

def test_trade_validation():
    """Test pre-trade compliance validation."""
    result = compliance_officer.validate_trade("AAPL", 100, "buy")
    assert "approved" in result
    assert result["approved"] is True

def test_invalid_trade_validation():
    """Test rejection of invalid trades."""
    result = compliance_officer.validate_trade("AAPL", -100, "buy")
    assert result["approved"] is False
    assert len(result["violations"]) > 0

def test_trade_recording():
    """Test trade history recording."""
    trade = {"symbol": "AAPL", "quantity": 100, "side": "buy"}
    compliance_officer.record_trade(trade)
    assert len(compliance_officer.trade_history) > 0
