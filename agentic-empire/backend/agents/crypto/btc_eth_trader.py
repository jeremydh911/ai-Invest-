"""Bitcoin and Ethereum specialist trading agent."""
from agents.base_trading_agent import TradingAgent
from typing import Dict, List

class BtcEthTrader(TradingAgent):
    """Specialized agent for major cryptocurrency pairs."""
    
    def __init__(self):
        super().__init__(
            role="BTC/ETH Specialist",
            goal="Trade Bitcoin and Ethereum using on-chain metrics",
            backstory="Expert in blockchain analysis and crypto market dynamics",
            strategy_type="crypto_majors"
        )
        self.supported_pairs = ["BTC/USD", "ETH/USD", "BTC/ETH"]
        self.on_chain_metrics = ["hash_rate", "active_addresses", "nvt_ratio"]
    
    async def analyze_market(self, symbol: str, data: Dict) -> Dict:
        """Analyze crypto market with on-chain data."""
        price = data.get("price", 50000.0)
        hash_rate = data.get("hash_rate", 100)
        volume_24h = data.get("volume_24h", 1000000000)
        
        sentiment = self._analyze_on_chain(hash_rate, volume_24h)
        return {"symbol": symbol, "price": price, "sentiment": sentiment,
                "hash_rate": hash_rate, "volume_24h": volume_24h}
    
    async def generate_signals(self, symbol: str) -> List[Dict]:
        """Generate crypto trading signals."""
        signals = []
        analysis = await self.analyze_market(symbol, {"price": 50000.0})
        
        if analysis["sentiment"] == "bullish":
            signals.append({"action": "buy", "symbol": symbol, "confidence": 0.85})
        elif analysis["sentiment"] == "bearish":
            signals.append({"action": "sell", "symbol": symbol, "confidence": 0.85})
        
        return signals
    
    def _analyze_on_chain(self, hash_rate: float, volume: float) -> str:
        """Analyze on-chain metrics for sentiment."""
        return "bullish" if hash_rate > 80 and volume > 500000000 else "bearish"

# Global instance
btc_eth_trader = BtcEthTrader()
