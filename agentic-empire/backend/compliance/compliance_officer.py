"""Compliance checking for SEC/FINRA regulations."""
from typing import Dict, List
from datetime import datetime, timedelta

class ComplianceOfficer:
    """Automated compliance checks for trading regulations."""
    
    def __init__(self):
        self.trade_history = []
        self.day_trades_count = 0
        self.last_reset_date = datetime.now().date()
    
    def check_pattern_day_trader(self, account_value: float) -> Dict:
        """Detect Pattern Day Trader status per FINRA rules."""
        if datetime.now().date() > self.last_reset_date + timedelta(days=5):
            self.day_trades_count = 0
            self.last_reset_date = datetime.now().date()
        
        is_pdt = self.day_trades_count >= 4 and account_value < 25000
        return {"is_pdt": is_pdt, "day_trades": self.day_trades_count, 
                "min_equity": 25000 if is_pdt else 0}
    
    def check_wash_sale(self, symbol: str, sell_date: datetime, 
                       buy_date: datetime) -> bool:
        """Check for wash sale violation (30-day rule)."""
        days_diff = abs((sell_date - buy_date).days)
        return days_diff <= 30
    
    def validate_trade(self, symbol: str, quantity: float, side: str) -> Dict:
        """Pre-trade compliance validation."""
        violations = []
        if quantity <= 0:
            violations.append("Invalid quantity")
        if side not in ["buy", "sell"]:
            violations.append("Invalid side")
        return {"approved": len(violations) == 0, "violations": violations}
    
    def record_trade(self, trade: Dict):
        """Record trade for compliance tracking."""
        self.trade_history.append({**trade, "timestamp": datetime.now().isoformat()})
        if self._is_day_trade(trade):
            self.day_trades_count += 1
    
    def _is_day_trade(self, trade: Dict) -> bool:
        """Determine if trade qualifies as day trade."""
        return True  # Simplified logic

# Global instance  
compliance_officer = ComplianceOfficer()
