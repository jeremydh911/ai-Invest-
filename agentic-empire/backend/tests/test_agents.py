"""Comprehensive test suite for trading agents."""
import pytest
from agents.equity.day_trader import day_trader
from agents.equity.swing_trader import swing_trader
from agents.equity.value_investor import value_investor
from agents.crypto.btc_eth_trader import btc_eth_trader
from agents.crypto.altcoin_trader import altcoin_trader
from agents.crypto.arbitrage import arbitrage_agent
from agents.futures.futures_trader import futures_trader
from agents.options.options_strategist import options_strategist

@pytest.mark.asyncio
async def test_day_trader_analysis():
    """Test day trader market analysis."""
    analysis = await day_trader.analyze_market("AAPL", {"price": 150.0, "volume": 10000})
    assert "trend" in analysis
    assert "rsi" in analysis
    assert analysis["symbol"] == "AAPL"

@pytest.mark.asyncio
async def test_day_trader_signals():
    """Test day trader signal generation."""
    signals = await day_trader.generate_signals("AAPL")
    assert isinstance(signals, list)

@pytest.mark.asyncio
async def test_swing_trader_analysis():
    """Test swing trader pattern detection."""
    analysis = await swing_trader.analyze_market("TSLA", {"price": 200.0})
    assert "trend" in analysis
    assert "support" in analysis
    assert "resistance" in analysis

@pytest.mark.asyncio
async def test_value_investor_dcf():
    """Test value investor DCF calculation."""
    analysis = await value_investor.analyze_market("BRK.B", {"price": 300.0, "pe_ratio": 10.0})
    assert "intrinsic_value" in analysis
    assert "margin_of_safety" in analysis

@pytest.mark.asyncio
async def test_btc_eth_trader():
    """Test crypto trader on-chain analysis."""
    signals = await btc_eth_trader.generate_signals("BTC/USD")
    assert isinstance(signals, list)

@pytest.mark.asyncio
async def test_arbitrage_detection():
    """Test arbitrage opportunity detection."""
    analysis = await arbitrage_agent.analyze_market("BTC/USD", {})
    assert "opportunity" in analysis
