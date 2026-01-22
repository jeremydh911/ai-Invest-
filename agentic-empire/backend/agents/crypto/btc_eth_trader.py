"""Bitcoin/Ethereum specialist - major crypto trading"""
from agents.base_agent import BaseTradingAgent, TradeSignal
from typing import Dict, Any
from datetime import datetime

class BtcEthTrader(BaseTradingAgent):
    """Bitcoin and Ethereum trading strategies"""
    
    def __init__(self):
        super().__init__(
            agent_id="btc_eth_trader_001",
            name="Bitcoin/Ethereum Specialist"
        )
        self.ma_short = 7  # 7-day MA
        self.ma_long = 25  # 25-day MA
    
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Analyze BTC/ETH using moving average crossover"""
        symbol = market_data['symbol']
        price = market_data['price']
        ma_7 = market_data.get('ma_7', price)
        ma_25 = market_data.get('ma_25', price)
        volume_24h = market_data.get('volume_24h', 0)
        
        # Golden cross (bullish)
        if ma_7 > ma_25 and volume_24h > 1000000:
            return TradeSignal(
                symbol=symbol,
                action='BUY',
                quantity=0.1,  # Fractional for crypto
                confidence=0.82,
                reasoning=f"Golden cross: MA7 > MA25 with high volume",
                timestamp=datetime.now()
            )
        
        # Death cross (bearish)
        elif ma_7 < ma_25:
            return TradeSignal(
                symbol=symbol,
                action='SELL',
                quantity=0.1,
                confidence=0.78,
                reasoning=f"Death cross: MA7 < MA25",
                timestamp=datetime.now()
            )
        
        return TradeSignal(symbol, 'HOLD', 0, 0.0, "No crossover signal", datetime.now())
    
    async def validate(self, signal: TradeSignal) -> bool:
        """Validate crypto trade signal"""
        return signal.confidence > 0.75 and signal.symbol in ['BTC', 'ETH', 'BTC/USD', 'ETH/USD']
