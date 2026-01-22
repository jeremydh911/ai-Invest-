# Trading Platform API Reference

## Core Trading Infrastructure

### Market Data API

#### Get Real-time Price
```python
from data.market_data import market_data

price = await market_data.get_price("AAPL", "NASDAQ")
```

#### Get Historical Data
```python
historical = await market_data.get_historical("AAPL", period="1d")
```

### Order Management API

#### Submit Order
```python
from execution.order_manager import order_manager, OrderType

order_id = await order_manager.submit_order(
    symbol="AAPL",
    quantity=100,
    order_type=OrderType.MARKET
)
```

#### Cancel Order
```python
result = await order_manager.cancel_order(order_id)
```

### Risk Management API

#### Calculate Position Size
```python
from risk.risk_manager import risk_manager

size = risk_manager.calculate_position_size("AAPL", price=150.0)
```

#### Check Risk Limits
```python
approved = risk_manager.check_risk_limits("AAPL", quantity=100, price=150.0)
```

### Compliance API

#### Validate Trade
```python
from compliance.compliance_officer import compliance_officer

result = compliance_officer.validate_trade("AAPL", 100, "buy")
```

## Trading Agents

### Day Trader
```python
from agents.equity.day_trader import day_trader

signals = await day_trader.generate_signals("AAPL")
```

### Crypto Specialist
```python
from agents.crypto.btc_eth_trader import btc_eth_trader

analysis = await btc_eth_trader.analyze_market("BTC/USD", data)
```

## Backtesting

```python
from backtesting.backtest_engine import backtest_engine

results = await backtest_engine.run_backtest(strategy, historical_data)
```
