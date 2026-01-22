"""Swing trading agent for multi-day position holding."""
from agents.base_trading_agent import TradingAgent
from typing import Dict, List

class SwingTrader(TradingAgent):
    """Specialized agent for swing trading with technical patterns."""
    
    def __init__(self):
        super().__init__(
            role="Swing Trader",
            goal="Capture multi-day price swings using technical patterns",
            backstory="Expert in chart patterns and trend following",
            strategy_type="swing_trading"
        )
        self.timeframe = "4h"
        self.patterns = ["head_shoulders", "double_bottom", "triangle"]
    
    async def analyze_market(self, symbol: str, data: Dict) -> Dict:
        """Identify swing trading opportunities."""
        price = data.get("price", 100.0)
        trend = self._detect_trend(data.get("prices", [price]))
        support = price * 0.95
        resistance = price * 1.05
        
        return {"symbol": symbol, "trend": trend, "support": support, 
                "resistance": resistance, "pattern": "none"}
    
    async def generate_signals(self, symbol: str) -> List[Dict]:
        """Generate swing trading signals."""
        signals = []
        analysis = await self.analyze_market(symbol, {"price": 100.0})
        
        if analysis["trend"] == "uptrend":
            signals.append({"action": "buy", "symbol": symbol, "target": analysis["resistance"],
                          "stop": analysis["support"], "confidence": 0.75})
        
        return signals
    
    def _detect_trend(self, prices: List[float]) -> str:
        """Detect price trend direction."""
        if len(prices) < 2:
            return "sideways"
        return "uptrend" if prices[-1] > prices[0] else "downtrend"

# Global instance
swing_trader = SwingTrader()
