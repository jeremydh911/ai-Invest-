/**
 * GPU Worker for Agentic Empire
 * 
 * This service runs specialized GPU-intensive tasks such as
 * high-speed inference, batch processing, and vector search.
 */

const express = require('express');
const gpuAcceleration = require('./gpu-acceleration');
const logger = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', worker: 'gpu', timestamp: new Date().toISOString() });
});

// Readiness probe
app.get('/ready', (req, res) => {
  // Check if GPU is initialized and ready
  res.json({ status: 'ready', gpuEnabled: gpuAcceleration.enabled });
});

/**
 * Endpoint for running inference tasks
 */
app.post('/inference', async (req, res) => {
  try {
    const { prompt, model, options } = req.body;
    // In a real implementation, this would call specialized GPU-accelerated code
    // For now, it's a bridge to the GPU acceleration module
    res.json({ success: true, message: 'Inference logic not yet implemented in worker' });
  } catch (error) {
    logger.error('GPU Inference Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GPU Worker listening on port ${PORT}`);
  console.log(`GPU Acceleration: ${gpuAcceleration.enabled ? 'ENABLED' : 'DISABLED'}`);
});
