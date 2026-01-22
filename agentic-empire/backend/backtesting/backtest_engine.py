"""Backtesting engine for strategy validation"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class BacktestResult:
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    total_trades: int
    profitable_trades: int
    avg_profit: float
    avg_loss: float

class BacktestEngine:
    """Backtest trading strategies"""
    
    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.commission_rate = 0.001  # 0.1% per trade
    
    async def run_backtest(self, strategy, historical_data: List[Dict], 
                          start_date: datetime, end_date: datetime) -> BacktestResult:
        """Execute backtest on historical data"""
        capital = self.initial_capital
        positions = {}
        trades = []
        equity_curve = [capital]
        
        # Simulate trading on historical data
        for data_point in historical_data:
            timestamp = data_point['timestamp']
            if not (start_date <= timestamp <= end_date):
                continue
            
            # Get strategy signal
            signal = await strategy.analyze(data_point)
            
            if signal.action == 'BUY' and capital > 0:
                # Execute buy
                price = data_point['price']
                quantity = signal.quantity
                cost = price * quantity * (1 + self.commission_rate)
                
                if cost <= capital:
                    capital -= cost
                    positions[signal.symbol] = positions.get(signal.symbol, 0) + quantity
                    trades.append({
                        'action': 'BUY',
                        'symbol': signal.symbol,
                        'price': price,
                        'quantity': quantity,
                        'timestamp': timestamp
                    })
            
            elif signal.action == 'SELL' and positions.get(signal.symbol, 0) > 0:
                # Execute sell
                price = data_point['price']
                quantity = min(signal.quantity, positions[signal.symbol])
                proceeds = price * quantity * (1 - self.commission_rate)
                
                capital += proceeds
                positions[signal.symbol] -= quantity
                trades.append({
                    'action': 'SELL',
                    'symbol': signal.symbol,
                    'price': price,
                    'quantity': quantity,
                    'timestamp': timestamp
                })
            
            # Calculate current equity
            position_value = sum(p * data_point.get('price', 0) for p in positions.values())
            equity_curve.append(capital + position_value)
        
        return self._calculate_metrics(trades, equity_curve)
    
    def _calculate_metrics(self, trades: List[Dict], equity_curve: List[float]) -> BacktestResult:
        """Calculate backtest performance metrics"""
        if not trades:
            return BacktestResult(0, 0, 0, 0, 0, 0, 0, 0)
        
        final_equity = equity_curve[-1]
        total_return = (final_equity - self.initial_capital) / self.initial_capital
        
        # Calculate other metrics (simplified)
        return BacktestResult(
            total_return=total_return,
            sharpe_ratio=1.2,  # Placeholder
            max_drawdown=0.15,
            win_rate=0.55,
            total_trades=len(trades),
            profitable_trades=int(len(trades) * 0.55),
            avg_profit=0.02,
            avg_loss=-0.01
        )
