"""Base trading agent template for all trading specialists."""
from abc import abstractmethod
from agents.base import BaseAgent
from typing import Dict, List, Optional

class TradingAgent(BaseAgent):
    """Base class for all trading agents with shared trading logic."""
    
    def __init__(self, role: str, goal: str, backstory: str, strategy_type: str):
        super().__init__(role, goal, backstory)
        self.strategy_type = strategy_type
        self.positions = {}
        self.performance = {"trades": 0, "wins": 0, "losses": 0, "pnl": 0.0}
    
    @abstractmethod
    async def analyze_market(self, symbol: str, data: Dict) -> Dict:
        """Analyze market conditions for trading opportunity."""
        pass
    
    @abstractmethod
    async def generate_signals(self, symbol: str) -> List[Dict]:
        """Generate buy/sell signals based on strategy."""
        pass
    
    async def perform_task(self, task: str) -> Dict:
        """Execute trading task."""
        return {"status": "completed", "agent": self.role, "task": task}
    
    def calculate_risk_reward(self, entry: float, target: float, stop: float) -> float:
        """Calculate risk/reward ratio."""
        risk = abs(entry - stop)
        reward = abs(target - entry)
        return reward / risk if risk > 0 else 0
    
    def update_performance(self, pnl: float):
        """Track trading performance."""
        self.performance["trades"] += 1
        if pnl > 0:
            self.performance["wins"] += 1
        else:
            self.performance["losses"] += 1
        self.performance["pnl"] += pnl

# Global registry for trading agents
trading_agent_registry = {}
