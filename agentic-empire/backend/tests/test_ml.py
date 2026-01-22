"""Tests for ML price prediction model."""
import pytest
from ml.price_prediction import price_predictor

@pytest.mark.asyncio
async def test_model_training():
    """Test model training process."""
    prices = [100.0 + i for i in range(100)]
    result = await price_predictor.train(prices, epochs=5)
    assert "loss" in result
    assert price_predictor.is_trained is True

@pytest.mark.asyncio
async def test_price_prediction():
    """Test price forecasting."""
    recent_prices = [100.0, 101.0, 102.0, 103.0]
    predictions = await price_predictor.predict(recent_prices, horizon=3)
    assert len(predictions) == 3
    assert all(isinstance(p, float) for p in predictions)

def test_model_evaluation():
    """Test model performance metrics."""
    actual = [100.0, 101.0, 102.0]
    predicted = [100.5, 101.5, 101.5]
    metrics = price_predictor.evaluate(actual, predicted)
    assert "mse" in metrics
    assert "mae" in metrics
    assert "rmse" in metrics

def test_confidence_calculation():
    """Test prediction confidence scoring."""
    confidence = price_predictor.get_confidence(100.0, 0.2)
    assert 0 <= confidence <= 1
