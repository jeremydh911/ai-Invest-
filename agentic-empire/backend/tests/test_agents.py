"""Test suite for trading agents"""
import pytest
from datetime import datetime
from agents.base_agent import BaseTradingAgent, TradeSignal
from agents.equity.day_trader import DayTrader
from agents.equity.swing_trader import SwingTrader
from agents.crypto.btc_eth_trader import BtcEthTrader

@pytest.mark.asyncio
async def test_day_trader_momentum_buy():
    """Test day trader detects momentum buy signal"""
    trader = DayTrader()
    market_data = {
        'symbol': 'AAPL',
        'price': 150.0,
        'volume': 2000000,
        'change_pct': 0.025  # 2.5% gain
    }
    
    signal = await trader.analyze(market_data)
    assert signal.action == 'BUY'
    assert signal.confidence > 0.7

@pytest.mark.asyncio
async def test_swing_trader_rsi_oversold():
    """Test swing trader detects oversold condition"""
    trader = SwingTrader()
    market_data = {
        'symbol': 'TSLA',
        'price': 200.0,
        'rsi': 25,
        'sma_20': 195.0
    }
    
    signal = await trader.analyze(market_data)
    assert signal.action == 'BUY'
    assert signal.confidence > 0.75

@pytest.mark.asyncio
async def test_btc_trader_golden_cross():
    """Test BTC trader detects golden cross"""
    trader = BtcEthTrader()
    market_data = {
        'symbol': 'BTC',
        'price': 50000,
        'ma_7': 50500,
        'ma_25': 49000,
        'volume_24h': 2000000
    }
    
    signal = await trader.analyze(market_data)
    assert signal.action == 'BUY'
    assert 'Golden cross' in signal.reasoning

def test_agent_performance_tracking():
    """Test agent tracks performance correctly"""
    trader = DayTrader()
    
    # Log some trades
    trader.log_performance({'profit': 100})
    trader.log_performance({'profit': -50})
    trader.log_performance({'profit': 75})
    
    metrics = trader.get_metrics()
    assert metrics['total_trades'] == 3
    assert 0 < metrics['win_rate'] < 1
