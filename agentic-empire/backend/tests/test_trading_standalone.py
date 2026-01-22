"""Standalone tests for trading modules without external dependencies."""
import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.market_data import market_data
from execution.order_manager import order_manager, OrderType
from risk.risk_manager import risk_manager
from compliance.compliance_officer import compliance_officer
from ml.price_prediction import price_predictor
from backtesting.backtest_engine import backtest_engine
from brokers.universal_adapter import create_broker_adapter

# Market Data Tests
@pytest.mark.asyncio
async def test_market_data_get_price():
    """Test real-time price fetching."""
    price = await market_data.get_price("AAPL")
    assert isinstance(price, float)
    assert price > 0

@pytest.mark.asyncio
async def test_market_data_historical():
    """Test historical data retrieval."""
    data = await market_data.get_historical("AAPL")
    assert isinstance(data, list)
    assert len(data) > 0

# Order Manager Tests
@pytest.mark.asyncio
async def test_order_submission():
    """Test order submission."""
    order_id = await order_manager.submit_order("AAPL", 100, OrderType.MARKET)
    assert order_id.startswith("ORD")

@pytest.mark.asyncio
async def test_order_cancellation():
    """Test order cancellation."""
    order_id = await order_manager.submit_order("TSLA", 50, OrderType.LIMIT, price=200.0)
    result = await order_manager.cancel_order(order_id)
    assert result is True

# Risk Manager Tests
def test_position_sizing():
    """Test position size calculation."""
    size = risk_manager.calculate_position_size("AAPL", 150.0)
    assert size > 0

def test_risk_limits():
    """Test risk limit validation."""
    result = risk_manager.check_risk_limits("AAPL", 100, 150.0)
    assert isinstance(result, bool)

# Compliance Tests
def test_trade_validation():
    """Test trade compliance validation."""
    result = compliance_officer.validate_trade("AAPL", 100, "buy")
    assert "approved" in result

# ML Tests
@pytest.mark.asyncio
async def test_ml_prediction():
    """Test ML price prediction."""
    prices = [100.0, 101.0, 102.0]
    predictions = await price_predictor.predict(prices, horizon=1)
    assert len(predictions) > 0

# Broker Tests
@pytest.mark.asyncio
async def test_broker_connection():
    """Test broker adapter connection."""
    adapter = create_broker_adapter("ALPACA", {"api_key": "test"})
    result = await adapter.connect()
    assert result is True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
