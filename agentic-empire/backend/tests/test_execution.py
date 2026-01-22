"""Test suite for order execution"""
import pytest
from execution.order_manager import OrderManager, Order, OrderStatus
from datetime import datetime

class MockBroker:
    """Mock broker for testing"""
    async def place_order(self, order):
        return {'success': True, 'order_id': 'TEST123'}
    
    async def cancel_order(self, order_id):
        return True

@pytest.mark.asyncio
async def test_order_submission():
    """Test order is submitted correctly"""
    broker = MockBroker()
    manager = OrderManager(broker)
    
    order = Order(
        order_id='ORD001',
        symbol='AAPL',
        side='BUY',
        quantity=100,
        order_type='MARKET',
        created_at=datetime.now()
    )
    
    result = await manager.submit_order(order)
    assert result['success'] == True
    assert order.status == OrderStatus.FILLED

@pytest.mark.asyncio
async def test_order_cancellation():
    """Test order can be cancelled"""
    broker = MockBroker()
    manager = OrderManager(broker)
    
    order = Order(
        order_id='ORD002',
        symbol='TSLA',
        side='BUY',
        quantity=50,
        order_type='LIMIT',
        price=200.0,
        created_at=datetime.now()
    )
    
    await manager.submit_order(order)
    cancelled = await manager.cancel_order('ORD002')
    
    assert cancelled == True
    assert order.status == OrderStatus.CANCELLED
