"""Tests for order execution and management."""
import pytest
from execution.order_manager import order_manager, OrderType

@pytest.mark.asyncio
async def test_submit_market_order():
    """Test market order submission."""
    order_id = await order_manager.submit_order("AAPL", 100, OrderType.MARKET)
    assert order_id.startswith("ORD")
    status = order_manager.get_order_status(order_id)
    assert status is not None
    assert status["symbol"] == "AAPL"

@pytest.mark.asyncio
async def test_submit_limit_order():
    """Test limit order submission."""
    order_id = await order_manager.submit_order("TSLA", 50, OrderType.LIMIT, price=200.0)
    assert order_id is not None
    status = order_manager.get_order_status(order_id)
    assert status["price"] == 200.0

@pytest.mark.asyncio
async def test_cancel_order():
    """Test order cancellation."""
    order_id = await order_manager.submit_order("GOOG", 10, OrderType.MARKET)
    result = await order_manager.cancel_order(order_id)
    assert result is True
    status = order_manager.get_order_status(order_id)
    assert status["status"] == "cancelled"

def test_order_tracking():
    """Test order status tracking."""
    assert hasattr(order_manager, "orders")
    assert isinstance(order_manager.orders, dict)
