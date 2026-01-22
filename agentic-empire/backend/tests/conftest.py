"""Pytest configuration and fixtures"""
import pytest
import asyncio

@pytest.fixture
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def sample_market_data():
    """Sample market data for testing"""
    return {
        'symbol': 'AAPL',
        'price': 150.0,
        'volume': 1000000,
        'change_pct': 0.01,
        'rsi': 50,
        'sma_20': 148.0,
        'pe_ratio': 25,
        'dividend_yield': 0.006
    }
