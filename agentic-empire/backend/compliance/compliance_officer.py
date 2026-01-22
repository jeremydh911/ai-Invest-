"""Regulatory compliance and trade validation"""
from typing import Dict, List
from datetime import datetime, timedelta

class ComplianceOfficer:
    """Ensure regulatory compliance"""
    
    def __init__(self):
        self.pattern_day_trader_limit = 4  # Max day trades per 5 days
        self.min_account_equity = 25000  # PDT rule minimum
        self.restricted_symbols = set()  # Symbols under restriction
        self.wash_sale_window = 30  # Days for wash sale rule
    
    async def validate_trade(self, trade: Dict, account: Dict, history: List[Dict]) -> Dict:
        """Validate trade against compliance rules"""
        symbol = trade['symbol']
        action = trade['action']
        
        # Check restricted symbols
        if symbol in self.restricted_symbols:
            return {
                'compliant': False,
                'violations': ['Symbol is restricted from trading']
            }
        
        # Check PDT rule (Pattern Day Trader)
        day_trades = self._count_day_trades(history, days=5)
        account_equity = account.get('equity', 0)
        
        if day_trades >= self.pattern_day_trader_limit and account_equity < self.min_account_equity:
            return {
                'compliant': False,
                'violations': [f'PDT rule: {day_trades} day trades with equity < ${self.min_account_equity:,}']
            }
        
        # Check wash sale rule
        if action == 'BUY':
            recent_sales = [t for t in history 
                          if t['symbol'] == symbol 
                          and t['action'] == 'SELL'
                          and (datetime.now() - t['timestamp']).days <= self.wash_sale_window]
            if recent_sales:
                return {
                    'compliant': True,
                    'warnings': ['Potential wash sale - tax implications']
                }
        
        return {'compliant': True, 'violations': [], 'warnings': []}
    
    def _count_day_trades(self, history: List[Dict], days: int = 5) -> int:
        """Count day trades in last N days"""
        cutoff = datetime.now() - timedelta(days=days)
        day_trades = [t for t in history 
                     if t.get('is_day_trade', False) 
                     and t['timestamp'] > cutoff]
        return len(day_trades)
    
    def generate_compliance_report(self) -> Dict:
        """Generate compliance audit report"""
        return {
            'timestamp': datetime.now(),
            'restricted_symbols': list(self.restricted_symbols),
            'pdt_limit': self.pattern_day_trader_limit,
            'min_equity': self.min_account_equity
        }
