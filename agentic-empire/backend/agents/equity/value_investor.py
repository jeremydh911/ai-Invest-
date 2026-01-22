"""Value investing agent with fundamental analysis."""
from agents.base_trading_agent import TradingAgent
from typing import Dict, List

class ValueInvestor(TradingAgent):
    """Specialized agent for long-term value investing."""
    
    def __init__(self):
        super().__init__(
            role="Value Investor",
            goal="Identify undervalued stocks with strong fundamentals",
            backstory="Expert in DCF analysis and financial statement review",
            strategy_type="value_investing"
        )
        self.metrics = ["PE", "PB", "ROE", "Debt_Equity"]
    
    async def analyze_market(self, symbol: str, data: Dict) -> Dict:
        """Perform fundamental analysis."""
        pe_ratio = data.get("pe_ratio", 15.0)
        book_value = data.get("book_value", 50.0)
        intrinsic_value = self._calculate_dcf(data)
        current_price = data.get("price", 100.0)
        
        margin_of_safety = (intrinsic_value - current_price) / intrinsic_value if intrinsic_value > 0 else 0
        return {"symbol": symbol, "intrinsic_value": intrinsic_value, 
                "current_price": current_price, "margin_of_safety": margin_of_safety,
                "pe_ratio": pe_ratio}
    
    async def generate_signals(self, symbol: str) -> List[Dict]:
        """Generate value investment signals."""
        signals = []
        analysis = await self.analyze_market(symbol, {"price": 100.0, "pe_ratio": 12.0})
        
        if analysis["margin_of_safety"] > 0.2:
            signals.append({"action": "buy", "symbol": symbol, "confidence": 0.9,
                          "target_price": analysis["intrinsic_value"]})
        
        return signals
    
    def _calculate_dcf(self, data: Dict) -> float:
        """Calculate discounted cash flow valuation."""
        fcf = data.get("free_cash_flow", 10000000)
        growth_rate = 0.05
        discount_rate = 0.10
        return fcf / (discount_rate - growth_rate)

# Global instance
value_investor = ValueInvestor()
