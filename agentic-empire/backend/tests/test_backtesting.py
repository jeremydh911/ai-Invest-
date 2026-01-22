"""Tests for backtesting engine."""
import pytest
from backtesting.backtest_engine import backtest_engine
from agents.equity.day_trader import day_trader

@pytest.mark.asyncio
async def test_backtest_execution():
    """Test backtest run with historical data."""
    historical_data = [
        {"symbol": "AAPL", "price": 100.0, "volume": 1000},
        {"symbol": "AAPL", "price": 101.0, "volume": 1100},
        {"symbol": "AAPL", "price": 102.0, "volume": 1200}
    ]
    results = await backtest_engine.run_backtest(day_trader, historical_data)
    assert "total_return" in results
    assert "win_rate" in results
    assert "sharpe_ratio" in results

def test_performance_metrics():
    """Test performance metrics calculation."""
    metrics = backtest_engine._calculate_metrics()
    assert "total_return" in metrics
    assert "max_drawdown" in metrics
    assert "total_trades" in metrics

def test_report_generation():
    """Test backtest report creation."""
    report = backtest_engine.generate_report()
    assert isinstance(report, str)
    assert "Backtest Results" in report
