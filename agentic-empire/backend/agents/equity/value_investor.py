"""Value investing agent - fundamental analysis"""
from agents.base_agent import BaseTradingAgent, TradeSignal
from typing import Dict, Any
from datetime import datetime

class ValueInvestor(BaseTradingAgent):
    """Long-term value investing strategies"""
    
    def __init__(self):
        super().__init__(
            agent_id="value_investor_001",
            name="Fundamental Value Investor"
        )
        self.max_pe_ratio = 15
        self.min_dividend_yield = 0.02
    
    async def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Evaluate fundamental value"""
        symbol = market_data['symbol']
        pe_ratio = market_data.get('pe_ratio', 999)
        dividend_yield = market_data.get('dividend_yield', 0)
        price_to_book = market_data.get('price_to_book', 999)
        
        # Undervalued criteria
        is_undervalued = (
            pe_ratio < self.max_pe_ratio and
            dividend_yield > self.min_dividend_yield and
            price_to_book < 1.5
        )
        
        if is_undervalued:
            return TradeSignal(
                symbol=symbol,
                action='BUY',
                quantity=25,
                confidence=0.85,
                reasoning=f"Undervalued: P/E={pe_ratio:.1f}, Div={dividend_yield:.2%}",
                timestamp=datetime.now()
            )
        
        # Overvalued
        elif pe_ratio > 30 or price_to_book > 5:
            return TradeSignal(
                symbol=symbol,
                action='SELL',
                quantity=25,
                confidence=0.80,
                reasoning="Overvalued fundamentals",
                timestamp=datetime.now()
            )
        
        return TradeSignal(symbol, 'HOLD', 0, 0.0, "Fair valuation", datetime.now())
    
    async def validate(self, signal: TradeSignal) -> bool:
        return signal.confidence > 0.75
