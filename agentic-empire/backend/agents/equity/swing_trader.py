"""Swing trading agent - multi-day positions"""
from agents.base_agent import BaseTradingAgent, TradeSignal
from typing import Dict, Any
from datetime import datetime

class SwingTrader(BaseTradingAgent):
    """Technical pattern-based swing trading"""
    
    def __init__(self):
        super().__init__(
            agent_id="swing_trader_001",
            name="Technical Swing Trader"
        )
        self.rsi_oversold = 30
        self.rsi_overbought = 70
    
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Identify swing trade opportunities"""
        symbol = market_data['symbol']
        rsi = market_data.get('rsi', 50)
        price = market_data['price']
        sma_20 = market_data.get('sma_20', price)
        
        # Oversold + price above SMA = BUY
        if rsi < self.rsi_oversold and price > sma_20:
            return TradeSignal(
                symbol=symbol,
                action='BUY',
                quantity=50,
                confidence=0.80,
                reasoning=f"Oversold RSI ({rsi:.1f}) with bullish trend",
                timestamp=datetime.now()
            )
        
        # Overbought = SELL
        elif rsi > self.rsi_overbought:
            return TradeSignal(
                symbol=symbol,
                action='SELL',
                quantity=50,
                confidence=0.75,
                reasoning=f"Overbought RSI ({rsi:.1f})",
                timestamp=datetime.now()
            )
        
        return TradeSignal(symbol, 'HOLD', 0, 0.0, "Neutral indicators", datetime.now())
    
    async def validate(self, signal: TradeSignal) -> bool:
        """Validate swing trade setup"""
        return signal.confidence > 0.70
