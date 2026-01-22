"""Altcoin trading specialist"""
from agents.base_agent import BaseTradingAgent, TradeSignal
from typing import Dict, Any
from datetime import datetime

class AltcoinTrader(BaseTradingAgent):
    """Altcoin momentum and trend trading"""
    
    def __init__(self):
        super().__init__(
            agent_id="altcoin_trader_001",
            name="Altcoin Specialist"
        )
        self.volatility_threshold = 0.05  # 5% volatility
        self.volume_spike_threshold = 2.0  # 2x average volume
    
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Identify altcoin opportunities"""
        symbol = market_data['symbol']
        price = market_data['price']
        volatility = market_data.get('volatility_24h', 0)
        volume_ratio = market_data.get('volume_ratio', 1.0)
        market_cap_rank = market_data.get('market_cap_rank', 999)
        
        # High volatility + volume spike = opportunity
        if volatility > self.volatility_threshold and volume_ratio > self.volume_spike_threshold:
            # Only trade top 100 altcoins by market cap
            if market_cap_rank <= 100:
                return TradeSignal(
                    symbol=symbol,
                    action='BUY',
                    quantity=100,
                    confidence=0.72,
                    reasoning=f"Volume spike {volume_ratio:.1f}x with {volatility:.1%} volatility",
                    timestamp=datetime.now()
                )
        
        # Extreme volatility = reduce position
        elif volatility > self.volatility_threshold * 2:
            return TradeSignal(
                symbol=symbol,
                action='SELL',
                quantity=100,
                confidence=0.70,
                reasoning=f"Extreme volatility {volatility:.1%}",
                timestamp=datetime.now()
            )
        
        return TradeSignal(symbol, 'HOLD', 0, 0.0, "No clear signal", datetime.now())
    
    async def validate(self, signal: TradeSignal) -> bool:
        """Validate altcoin signal"""
        return signal.confidence > 0.68
