"""Order routing and execution management"""
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class OrderStatus(Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

@dataclass
class Order:
    order_id: str
    symbol: str
    side: str  # 'BUY' or 'SELL'
    quantity: float
    order_type: str  # 'MARKET', 'LIMIT', 'STOP'
    price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = None

class OrderManager:
    """Manage order lifecycle"""
    
    def __init__(self, broker_adapter):
        self.broker = broker_adapter
        self.active_orders: Dict[str, Order] = {}
    
    async def submit_order(self, order: Order) -> Dict:
        """Submit order to broker"""
        order.status = OrderStatus.SUBMITTED
        self.active_orders[order.order_id] = order
        
        result = await self.broker.place_order(order)
        order.status = OrderStatus.FILLED if result['success'] else OrderStatus.REJECTED
        return result
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel pending order"""
        if order_id in self.active_orders:
            order = self.active_orders[order_id]
            await self.broker.cancel_order(order_id)
            order.status = OrderStatus.CANCELLED
            return True
        return False
    
    def get_order_status(self, order_id: str) -> Optional[OrderStatus]:
        """Get current order status"""
        return self.active_orders.get(order_id)
