"""Options trading strategist"""
from agents.base_agent import BaseTradingAgent, TradeSignal
from typing import Dict, Any
from datetime import datetime

class OptionsStrategist(BaseTradingAgent):
    """Options strategies specialist"""
    
    def __init__(self):
        super().__init__(
            agent_id="options_strategist_001",
            name="Options Strategist"
        )
        self.min_iv_percentile = 20  # Minimum IV percentile for selling
        self.max_dte = 45  # Maximum days to expiration
    
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Identify options strategies"""
        symbol = market_data['symbol']
        price = market_data['price']
        iv = market_data.get('implied_volatility', 0)
        iv_percentile = market_data.get('iv_percentile', 50)
        dte = market_data.get('days_to_expiration', 30)
        
        # High IV - sell premium
        if iv_percentile > 70 and dte <= self.max_dte:
            return TradeSignal(
                symbol=f"{symbol}_PUT",
                action='SELL',
                quantity=1,
                confidence=0.81,
                reasoning=f"High IV ({iv_percentile}%ile) - sell premium strategy",
                timestamp=datetime.now()
            )
        
        # Low IV - buy options
        elif iv_percentile < 30 and dte <= self.max_dte:
            return TradeSignal(
                symbol=f"{symbol}_CALL",
                action='BUY',
                quantity=1,
                confidence=0.77,
                reasoning=f"Low IV ({iv_percentile}%ile) - buy options",
                timestamp=datetime.now()
            )
        
        # Neutral - iron condor
        elif 40 < iv_percentile < 60:
            return TradeSignal(
                symbol=f"{symbol}_CONDOR",
                action='BUY',
                quantity=1,
                confidence=0.74,
                reasoning=f"Neutral IV - iron condor strategy",
                timestamp=datetime.now()
            )
        
        return TradeSignal(symbol, 'HOLD', 0, 0.0, "No optimal strategy", datetime.now())
    
    async def validate(self, signal: TradeSignal) -> bool:
        """Validate options strategy"""
        return signal.confidence > 0.72
