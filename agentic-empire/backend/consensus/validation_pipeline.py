"""Multi-agent consensus validation pipeline."""
from typing import List, Dict

class ValidationPipeline:
    """Coordinates multiple trading agents for consensus decisions."""
    
    def __init__(self, agents: List = None):
        self.agents = agents or []
        self.min_consensus_threshold = 0.6
    
    async def get_consensus(self, symbol: str) -> Dict:
        """Gather signals from all agents and build consensus."""
        all_signals = []
        
        for agent in self.agents:
            signals = await agent.generate_signals(symbol)
            all_signals.extend(signals)
        
        consensus = self._calculate_consensus(all_signals)
        return consensus
    
    def _calculate_consensus(self, signals: List[Dict]) -> Dict:
        """Calculate consensus from multiple agent signals."""
        if not signals:
            return {"action": "hold", "confidence": 0.0, "agents_count": 0}
        
        buy_votes = sum(1 for s in signals if s.get("action") == "buy")
        sell_votes = sum(1 for s in signals if s.get("action") == "sell")
        total_votes = len(signals)
        
        buy_pct = buy_votes / total_votes if total_votes > 0 else 0
        sell_pct = sell_votes / total_votes if total_votes > 0 else 0
        
        if buy_pct >= self.min_consensus_threshold:
            return {"action": "buy", "confidence": buy_pct, "agents_count": total_votes}
        elif sell_pct >= self.min_consensus_threshold:
            return {"action": "sell", "confidence": sell_pct, "agents_count": total_votes}
        else:
            return {"action": "hold", "confidence": max(buy_pct, sell_pct), "agents_count": total_votes}
    
    def add_agent(self, agent):
        """Add agent to consensus pipeline."""
        self.agents.append(agent)
    
    def set_threshold(self, threshold: float):
        """Set minimum consensus threshold."""
        self.min_consensus_threshold = threshold

# Global instance
validation_pipeline = ValidationPipeline()
