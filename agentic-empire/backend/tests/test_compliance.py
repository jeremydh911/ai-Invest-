"""Test suite for compliance"""
import pytest
from datetime import datetime, timedelta
from compliance.compliance_officer import ComplianceOfficer

@pytest.mark.asyncio
async def test_pdt_rule_violation():
    """Test Pattern Day Trader rule enforcement"""
    officer = ComplianceOfficer()
    
    trade = {'symbol': 'AAPL', 'action': 'BUY'}
    account = {'equity': 20000}  # Below PDT minimum
    
    # Create history with 4 day trades in last 5 days
    history = [
        {'symbol': 'AAPL', 'action': 'BUY', 'is_day_trade': True, 
         'timestamp': datetime.now() - timedelta(days=1)}
        for _ in range(4)
    ]
    
    result = await officer.validate_trade(trade, account, history)
    assert result['compliant'] == False
    assert 'PDT rule' in result['violations'][0]

@pytest.mark.asyncio
async def test_restricted_symbol():
    """Test restricted symbols are blocked"""
    officer = ComplianceOfficer()
    officer.restricted_symbols.add('GME')
    
    trade = {'symbol': 'GME', 'action': 'BUY'}
    account = {'equity': 100000}
    history = []
    
    result = await officer.validate_trade(trade, account, history)
    assert result['compliant'] == False

@pytest.mark.asyncio
async def test_wash_sale_warning():
    """Test wash sale rule generates warning"""
    officer = ComplianceOfficer()
    
    trade = {'symbol': 'AAPL', 'action': 'BUY'}
    account = {'equity': 100000}
    history = [
        {'symbol': 'AAPL', 'action': 'SELL', 
         'timestamp': datetime.now() - timedelta(days=15)}
    ]
    
    result = await officer.validate_trade(trade, account, history)
    assert result['compliant'] == True
    assert 'wash sale' in result.get('warnings', [''])[0].lower()
