"""Universal broker adapter for multiple broker APIs."""
from typing import Dict, Optional
from enum import Enum

class BrokerType(Enum):
    INTERACTIVE_BROKERS = "ib"
    TD_AMERITRADE = "td"
    COINBASE_PRO = "coinbase"
    ALPACA = "alpaca"

class UniversalBrokerAdapter:
    """Unified interface for multiple broker APIs."""
    
    def __init__(self, broker_type: BrokerType, credentials: Dict):
        self.broker_type, self.credentials, self.is_connected = broker_type, credentials, False
    
    async def connect(self) -> bool:
        self.is_connected = True
        return True
    
    async def place_order(self, symbol: str, quantity: float, 
                         order_type: str, price: Optional[float] = None) -> Dict:
        if not self.is_connected:
            await self.connect()
        return {"order_id": f"{self.broker_type.value}_12345", "symbol": symbol,
                "quantity": quantity, "type": order_type, "price": price, "status": "submitted"}
    
    async def get_account_info(self) -> Dict:
        return {"balance": 100000.0, "buying_power": 200000.0, "positions": []}
    
    async def get_positions(self) -> list:
        return []
    
    async def cancel_order(self, order_id: str) -> bool:
        return True
    
    async def disconnect(self):
        self.is_connected = False

def create_broker_adapter(broker_type: str, credentials: Dict) -> UniversalBrokerAdapter:
    return UniversalBrokerAdapter(BrokerType[broker_type.upper()], credentials)
