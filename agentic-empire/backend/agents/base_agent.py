"""Base class for all trading agents"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TradeSignal:
    symbol: str
    action: str  # 'BUY', 'SELL', 'HOLD'
    quantity: float
    confidence: float
    reasoning: str
    timestamp: datetime

class BaseTradingAgent(ABC):
    """Abstract base class for all trading agents"""
    
    def __init__(self, agent_id: str, name: str, enabled: bool = True):
        self.agent_id = agent_id
        self.name = name
        self.enabled = enabled
        self.performance_history: List[Dict] = []
    
    @abstractmethod
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Analyze market data and return trade signal"""
        pass
    
    @abstractmethod
    async def validate(self, signal: TradeSignal) -> bool:
        """Validate trade signal meets agent criteria"""
        pass
    
    def log_performance(self, trade_outcome: Dict[str, Any]):
        """Track agent performance"""
        self.performance_history.append({
            'timestamp': datetime.now(),
            'outcome': trade_outcome
        })
    
    def get_metrics(self) -> Dict[str, float]:
        """Calculate performance metrics"""
        if not self.performance_history:
            return {'win_rate': 0.0, 'avg_return': 0.0}
        
        wins = sum(1 for t in self.performance_history if t['outcome'].get('profit', 0) > 0)
        return {
            'win_rate': wins / len(self.performance_history),
            'total_trades': len(self.performance_history)
        }
