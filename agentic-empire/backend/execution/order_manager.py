"""Order execution and tracking system."""
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime

class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"

class OrderStatus(Enum):
    PENDING = "pending"
    FILLED = "filled"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class OrderManager:
    """Manages order routing and fill tracking."""
    
    def __init__(self):
        self.orders = {}
        self.fills = []
        self.order_id_counter = 1000
    
    async def submit_order(self, symbol: str, quantity: float, order_type: OrderType, 
                          price: Optional[float] = None) -> str:
        """Submit order to broker."""
        order_id = f"ORD{self.order_id_counter}"
        self.order_id_counter += 1
        self.orders[order_id] = {
            "id": order_id, "symbol": symbol, "quantity": quantity,
            "type": order_type.value, "price": price, "status": OrderStatus.PENDING.value,
            "timestamp": datetime.now().isoformat()
        }
        return order_id
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel pending order."""
        if order_id in self.orders:
            self.orders[order_id]["status"] = OrderStatus.CANCELLED.value
            return True
        return False
    
    def get_order_status(self, order_id: str) -> Optional[Dict]:
        """Check order status."""
        return self.orders.get(order_id)

# Global instance
order_manager = OrderManager()
