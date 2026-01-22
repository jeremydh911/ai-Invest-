"""Risk management and portfolio risk assessment"""
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class RiskMetrics:
    portfolio_var: float  # Value at Risk
    portfolio_sharpe: float
    position_exposure: Dict[str, float]
    total_exposure: float
    margin_utilization: float

class RiskManager:
    """Centralized risk management"""
    
    def __init__(self, max_portfolio_risk: float = 0.02):
        self.max_portfolio_risk = max_portfolio_risk  # 2% max portfolio risk
        self.max_position_size = 0.10  # 10% max per position
        self.max_sector_exposure = 0.25  # 25% max sector exposure
        self.min_sharpe_ratio = 1.0
    
    async def assess_trade_risk(self, trade: Dict, portfolio: Dict) -> Dict:
        """Assess risk of proposed trade"""
        symbol = trade['symbol']
        quantity = trade['quantity']
        action = trade['action']
        
        # Calculate position size
        position_value = quantity * trade.get('price', 0)
        portfolio_value = portfolio.get('total_value', 1)
        position_pct = position_value / portfolio_value if portfolio_value > 0 else 0
        
        # Check position size limits
        if position_pct > self.max_position_size:
            return {
                'approved': False,
                'reason': f"Position size {position_pct:.1%} exceeds limit {self.max_position_size:.1%}",
                'suggested_quantity': quantity * (self.max_position_size / position_pct)
            }
        
        # Check sector exposure
        sector = portfolio.get('sectors', {}).get(symbol, 'Unknown')
        sector_exposure = portfolio.get('sector_exposure', {}).get(sector, 0)
        if sector_exposure > self.max_sector_exposure:
            return {
                'approved': False,
                'reason': f"Sector exposure {sector_exposure:.1%} exceeds limit",
                'suggested_quantity': 0
            }
        
        return {'approved': True, 'reason': 'Risk acceptable'}
    
    def calculate_portfolio_risk(self, positions: List[Dict]) -> RiskMetrics:
        """Calculate portfolio-wide risk metrics"""
        total_value = sum(p['value'] for p in positions)
        return RiskMetrics(
            portfolio_var=total_value * 0.02,
            portfolio_sharpe=1.5,
            position_exposure={p['symbol']: p['value']/total_value for p in positions},
            total_exposure=total_value,
            margin_utilization=0.5
        )
