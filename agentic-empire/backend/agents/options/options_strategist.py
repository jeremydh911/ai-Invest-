"""Options strategist with Greeks calculation."""
from agents.base_trading_agent import TradingAgent
from typing import Dict, List
import math

class OptionsStrategist(TradingAgent):
    """Specialized agent for options trading strategies."""
    
    def __init__(self):
        super().__init__(
            role="Options Strategist",
            goal="Execute options strategies with Greeks management",
            backstory="Expert in options pricing and spread strategies",
            strategy_type="options_trading"
        )
        self.strategies = ["iron_condor", "butterfly", "calendar_spread"]
        self.greeks = ["delta", "gamma", "theta", "vega"]
    
    async def analyze_market(self, symbol: str, data: Dict) -> Dict:
        """Analyze options market and calculate Greeks."""
        spot_price = data.get("spot_price", 100.0)
        strike = data.get("strike", 100.0)
        volatility = data.get("iv", 0.30)
        dte = data.get("days_to_expiry", 30)
        
        greeks = self._calculate_greeks(spot_price, strike, volatility, dte)
        return {"symbol": symbol, "greeks": greeks, "iv": volatility, "dte": dte}
    
    async def generate_signals(self, symbol: str) -> List[Dict]:
        """Generate options trading signals."""
        signals = []
        analysis = await self.analyze_market(symbol, {"spot_price": 100.0, "strike": 100.0})
        
        if analysis["iv"] > 0.40:  # High volatility
            signals.append({"action": "sell_iron_condor", "symbol": symbol,
                          "confidence": 0.75, "strikes": [95, 100, 100, 105]})
        
        return signals
    
    def _calculate_greeks(self, spot: float, strike: float, vol: float, dte: int) -> Dict:
        """Calculate option Greeks."""
        delta = 0.5  # Simplified
        return {"delta": delta, "gamma": 0.05, "theta": -0.02, "vega": 0.15}

# Global instance
options_strategist = OptionsStrategist()
