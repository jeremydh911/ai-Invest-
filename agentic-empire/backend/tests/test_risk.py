"""Tests for risk management system."""
import pytest
from risk.risk_manager import risk_manager

def test_position_size_calculation():
    """Test position sizing logic."""
    size = risk_manager.calculate_position_size("AAPL", 150.0)
    assert size > 0
    assert size <= risk_manager.portfolio_value / 150.0

def test_risk_limits_check():
    """Test risk limit validation."""
    result = risk_manager.check_risk_limits("AAPL", 100, 150.0)
    assert isinstance(result, bool)

def test_stop_loss_calculation():
    """Test stop-loss price calculation."""
    stop = risk_manager.set_stop_loss("AAPL", 150.0, 0.02)
    assert stop < 150.0
    assert stop == 150.0 * 0.98

def test_position_update():
    """Test position tracking."""
    risk_manager.update_position("AAPL", 100, 150.0)
    assert "AAPL" in risk_manager.positions
    assert risk_manager.positions["AAPL"]["quantity"] == 100

def test_max_position_size():
    """Test maximum position size enforcement."""
    large_quantity = 10000
    result = risk_manager.check_risk_limits("TSLA", large_quantity, 200.0)
    assert result is False
