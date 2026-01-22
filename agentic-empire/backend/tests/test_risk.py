"""Test suite for risk management"""
import pytest
from risk.risk_manager import RiskManager

@pytest.mark.asyncio
async def test_position_size_limit():
    """Test position size limits are enforced"""
    risk_mgr = RiskManager(max_portfolio_risk=0.02)
    
    trade = {
        'symbol': 'AAPL',
        'quantity': 1000,
        'price': 150,
        'action': 'BUY'
    }
    
    portfolio = {
        'total_value': 100000,
        'sectors': {'AAPL': 'Technology'},
        'sector_exposure': {'Technology': 0.15}
    }
    
    result = await risk_mgr.assess_trade_risk(trade, portfolio)
    
    # Trade would be 150k on 100k portfolio = 150% - should be rejected
    assert result['approved'] == False

@pytest.mark.asyncio
async def test_acceptable_position():
    """Test acceptable position is approved"""
    risk_mgr = RiskManager()
    
    trade = {
        'symbol': 'AAPL',
        'quantity': 50,
        'price': 150,
        'action': 'BUY'
    }
    
    portfolio = {
        'total_value': 100000,
        'sectors': {'AAPL': 'Technology'},
        'sector_exposure': {'Technology': 0.05}
    }
    
    result = await risk_mgr.assess_trade_risk(trade, portfolio)
    assert result['approved'] == True

def test_portfolio_metrics_calculation():
    """Test portfolio risk metrics are calculated"""
    risk_mgr = RiskManager()
    
    positions = [
        {'symbol': 'AAPL', 'value': 10000},
        {'symbol': 'GOOGL', 'value': 15000},
        {'symbol': 'MSFT', 'value': 12000}
    ]
    
    metrics = risk_mgr.calculate_portfolio_risk(positions)
    assert metrics.total_exposure == 37000
    assert len(metrics.position_exposure) == 3
