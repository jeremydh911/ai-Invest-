"""Universal broker adapter for multiple brokerages"""
from typing import Dict, Optional
from abc import ABC, abstractmethod
from datetime import datetime

class BrokerAdapter(ABC):
    """Abstract base for broker integrations"""
    
    @abstractmethod
    async def place_order(self, order: Dict) -> Dict:
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        pass
    
    @abstractmethod
    async def get_positions(self) -> Dict:
        pass

class UniversalBrokerAdapter:
    """Unified interface to multiple brokers"""
    
    def __init__(self, broker_configs: Dict[str, Dict]):
        self.brokers = {}
        self.active_broker = None
        self._initialize_brokers(broker_configs)
    
    def _initialize_brokers(self, configs: Dict[str, Dict]):
        """Initialize broker connections"""
        for broker_name, config in configs.items():
            if broker_name == 'alpaca':
                self.brokers[broker_name] = AlpacaAdapter(config)
            elif broker_name == 'interactive_brokers':
                self.brokers[broker_name] = IBAdapter(config)
            elif broker_name == 'coinbase':
                self.brokers[broker_name] = CoinbaseAdapter(config)
    
    async def place_order(self, order: Dict) -> Dict:
        """Route order to appropriate broker"""
        broker = self._select_broker(order)
        try:
            result = await broker.place_order(order)
            return {
                'success': True,
                'broker': broker.__class__.__name__,
                'order_id': result.get('order_id'),
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _select_broker(self, order: Dict) -> BrokerAdapter:
        """Select best broker for order type"""
        symbol = order['symbol']
        if 'BTC' in symbol or 'ETH' in symbol:
            return self.brokers.get('coinbase')
        return self.brokers.get('alpaca', list(self.brokers.values())[0])

# Placeholder implementations
class AlpacaAdapter(BrokerAdapter):
    def __init__(self, config): self.config = config
    async def place_order(self, order): return {'order_id': 'ALP123'}
    async def cancel_order(self, order_id): return True
    async def get_positions(self): return {}

class IBAdapter(BrokerAdapter):
    def __init__(self, config): self.config = config
    async def place_order(self, order): return {'order_id': 'IB123'}
    async def cancel_order(self, order_id): return True
    async def get_positions(self): return {}

class CoinbaseAdapter(BrokerAdapter):
    def __init__(self, config): self.config = config
    async def place_order(self, order): return {'order_id': 'CB123'}
    async def cancel_order(self, order_id): return True
    async def get_positions(self): return {}
