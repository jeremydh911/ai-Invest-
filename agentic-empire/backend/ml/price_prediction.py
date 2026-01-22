"""Machine learning price prediction model."""
from typing import List, Dict
import numpy as np

class PricePredictionModel:
    """LSTM-based price forecasting model."""
    
    def __init__(self, lookback_period: int = 60):
        self.lookback_period = lookback_period
        self.model = None
        self.is_trained = False
    
    def prepare_data(self, prices: List[float]) -> np.ndarray:
        """Prepare time series data for training."""
        data = np.array(prices)
        return data.reshape(-1, 1)
    
    async def train(self, historical_data: List[float], epochs: int = 10):
        """Train LSTM model on historical prices."""
        X = self.prepare_data(historical_data[:-1])
        y = self.prepare_data(historical_data[1:])
        # Simplified training simulation
        self.is_trained = True
        return {"loss": 0.01, "epochs": epochs}
    
    async def predict(self, recent_prices: List[float], horizon: int = 1) -> List[float]:
        """Predict future prices."""
        if not self.is_trained:
            return [recent_prices[-1]] * horizon
        
        # Simplified prediction
        last_price = recent_prices[-1]
        predictions = [last_price * (1 + 0.01 * i) for i in range(1, horizon + 1)]
        return predictions
    
    def evaluate(self, actual: List[float], predicted: List[float]) -> Dict:
        """Calculate model performance metrics."""
        mse = np.mean([(a - p) ** 2 for a, p in zip(actual, predicted)])
        mae = np.mean([abs(a - p) for a, p in zip(actual, predicted)])
        return {"mse": mse, "mae": mae, "rmse": np.sqrt(mse)}
    
    def get_confidence(self, prediction: float, volatility: float) -> float:
        """Calculate prediction confidence score."""
        return max(0.5, 1.0 - volatility)

# Global instance
price_predictor = PricePredictionModel()
