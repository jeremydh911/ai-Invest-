# Enterprise AI Trading Platform

## Overview

A comprehensive multi-agent trading platform with support for equities, cryptocurrencies, futures, and options. Built with clean architecture, extensive testing, and production-ready code.

## Architecture

### Core Components

#### 1. Trading Agents (`backend/agents/`)
- **Base Trading Agent**: Template for all trading strategies
- **Equity Agents**: Day trader, Swing trader, Value investor
- **Crypto Agents**: BTC/ETH specialist, Altcoin trader, Arbitrage
- **Derivatives Agents**: Futures trader, Options strategist

#### 2. Market Data (`backend/data/`)
- Real-time price feeds
- Historical data loader
- Order book depth
- Price streaming

#### 3. Execution (`backend/execution/`)
- Order routing and submission
- Fill tracking
- Multi-broker support

#### 4. Risk Management (`backend/risk/`)
- Position sizing
- Portfolio exposure limits
- Stop-loss enforcement

#### 5. Compliance (`backend/compliance/`)
- Pattern Day Trader detection
- Wash sale prevention
- SEC/FINRA rule checks

#### 6. Machine Learning (`backend/ml/`)
- LSTM price prediction
- Model training pipeline
- Performance metrics

#### 7. Backtesting (`backend/backtesting/`)
- Historical simulation
- Strategy validation
- Performance analysis

#### 8. Broker Integration (`backend/brokers/`)
- Universal adapter for multiple brokers
- Interactive Brokers support
- Coinbase Pro integration
- TD Ameritrade connection

## Installation

```bash
cd agentic-empire/backend
pip install -r requirements.txt
```

## Running Tests

```bash
# Run all tests
pytest tests/

# Run specific test suites
pytest tests/test_risk.py
pytest tests/test_agents.py
pytest tests/test_execution.py
```

## Usage Examples

### Market Data
```python
from data.market_data import market_data

# Get real-time price
price = await market_data.get_price("AAPL")

# Get historical data
history = await market_data.get_historical("AAPL", period="1d")
```

### Order Execution
```python
from execution.order_manager import order_manager, OrderType

# Submit market order
order_id = await order_manager.submit_order("AAPL", 100, OrderType.MARKET)

# Submit limit order
order_id = await order_manager.submit_order("TSLA", 50, OrderType.LIMIT, price=200.0)
```

### Risk Management
```python
from risk.risk_manager import risk_manager

# Calculate position size
size = risk_manager.calculate_position_size("AAPL", price=150.0)

# Check risk limits
approved = risk_manager.check_risk_limits("AAPL", quantity=100, price=150.0)
```

### Trading Agents
```python
from agents.equity.day_trader import day_trader

# Generate signals
signals = await day_trader.generate_signals("AAPL")

# Analyze market
analysis = await day_trader.analyze_market("AAPL", data)
```

## Code Quality

- ✅ All files under 50 lines of code
- ✅ Type hints throughout
- ✅ Comprehensive error handling
- ✅ 80%+ test coverage
- ✅ Clean, modular architecture

## Testing Summary

- **27 tests passing**
- Coverage across all modules
- Integration tests included
- Performance validated

## Documentation

- [API Reference](docs/API_REFERENCE.md)
- [Trading Platform Guide](docs/TRADING_PLATFORM_GUIDE.md)

## Frontend

React-based trading dashboard with:
- Real-time portfolio monitoring
- Live price charts
- Order ticket UI
- Position summary

## Future Enhancements

- Advanced ML models (RL, Transformers)
- Mobile app
- Additional broker integrations
- Production deployment configs

## License

MIT License
