"""Risk management and position sizing system."""
from typing import Dict, Optional

class RiskManager:
    """Portfolio risk management with position limits and stop-loss."""
    
    def __init__(self, max_position_size: float = 0.1, max_portfolio_risk: float = 0.02):
        self.max_position_size = max_position_size
        self.max_portfolio_risk = max_portfolio_risk
        self.positions = {}
        self.portfolio_value = 100000.0
    
    def calculate_position_size(self, symbol: str, price: float, 
                               risk_per_trade: float = 0.01) -> float:
        """Calculate safe position size based on portfolio value."""
        max_risk_amount = self.portfolio_value * risk_per_trade
        position_size = max_risk_amount / price
        max_size = self.portfolio_value * self.max_position_size / price
        return min(position_size, max_size)
    
    def check_risk_limits(self, symbol: str, quantity: float, price: float) -> bool:
        """Validate if trade is within risk limits."""
        position_value = quantity * price
        if position_value > self.portfolio_value * self.max_position_size:
            return False
        total_exposure = sum(pos["value"] for pos in self.positions.values())
        if (total_exposure + position_value) > self.portfolio_value * 0.8:
            return False
        return True
    
    def set_stop_loss(self, symbol: str, entry_price: float, 
                     stop_pct: float = 0.02) -> float:
        """Calculate stop-loss price."""
        return entry_price * (1 - stop_pct)
    
    def update_position(self, symbol: str, quantity: float, price: float):
        """Update position tracking."""
        self.positions[symbol] = {"quantity": quantity, "price": price, 
                                  "value": quantity * price}

# Global instance
risk_manager = RiskManager()
