"""Day trading agent - scalping and momentum"""
from agents.base_agent import BaseTradingAgent, TradeSignal
from typing import Dict, Any
from datetime import datetime

class DayTrader(BaseTradingAgent):
    """Intraday momentum and scalping strategies"""
    
    def __init__(self):
        super().__init__(
            agent_id="day_trader_001",
            name="Momentum Day Trader"
        )
        self.min_volume = 1000000
        self.momentum_threshold = 0.02  # 2% move
    
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Detect momentum opportunities"""
        symbol = market_data['symbol']
        current_price = market_data['price']
        volume = market_data['volume']
        price_change_pct = market_data.get('change_pct', 0)
        
        # High volume + strong momentum = BUY
        if volume > self.min_volume and price_change_pct > self.momentum_threshold:
            return TradeSignal(
                symbol=symbol,
                action='BUY',
                quantity=100,
                confidence=0.75,
                reasoning=f"Strong momentum: {price_change_pct:.2%} on high volume",
                timestamp=datetime.now()
            )
        
        # Reversal signal = SELL
        elif price_change_pct < -self.momentum_threshold:
            return TradeSignal(
                symbol=symbol,
                action='SELL',
                quantity=100,
                confidence=0.70,
                reasoning=f"Momentum reversal detected",
                timestamp=datetime.now()
            )
        
        return TradeSignal(symbol, 'HOLD', 0, 0.0, "No clear signal", datetime.now())
    
    async def validate(self, signal: TradeSignal) -> bool:
        """Ensure signal meets day trading rules"""
        return signal.confidence > 0.65 and signal.action != 'HOLD'
