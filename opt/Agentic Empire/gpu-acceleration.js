/**
 * GPU Acceleration Configuration for LucaExpress
 * NVIDIA RTX 5090 + CUDA Toolkit
 * 
 * This module provides GPU-accelerated inference and processing
 * for the LLM tier and other computationally intensive tasks.
 */

const os = require('os');
const path = require('path');

// ==================== GPU DETECTION & INITIALIZATION ====================

const GPU_CONFIG = {
  // Detection
  enabled: process.env.ENABLE_GPU === 'true',
  device: parseInt(process.env.CUDA_VISIBLE_DEVICES || '0'),
  
  // Memory management
  memoryFraction: parseFloat(process.env.GPU_MEMORY_FRACTION || '0.8'),  // Use 80% of GPU VRAM
  maxBatchSize: 32,
  inferenceTimeout: 60000,  // 60 seconds max inference time
  
  // CUDA settings
  cuda: {
    enabled: true,
    computeCapability: '9.2',  // RTX 5090
    cudaGraphs: true,  // Enable CUDA graphs for better performance
    nvtx: true,  // NVIDIA Tools Extension for profiling
  },
  
  // Optimization
  tensorRT: {
    enabled: true,  // Use TensorRT for faster inference
    precision: 'FP16',  // Mixed precision (float16 for speed, float32 for accuracy)
    optimization_level: 3,  // 0=none, 1=normal, 2=fast, 3=fastest
  },

  // Model caching
  modelCache: {
    maxModels: 2,  // Keep 2 models in VRAM simultaneously
    preloadModels: ['mistral'],  // Preload these on startup
    autoUnload: true,  // Automatically unload unused models
    unloadTimeout: 600000,  // 10 minutes of inactivity
  },

  // Batch processing
  batchProcessing: {
    enabled: true,
    batchSize: 32,
    batchTimeout: 5000,  // 5 seconds max wait time
    autoFlush: true,  // Automatically flush batches when full
  },

  // Multi-GPU (if available)
  multiGPU: {
    enabled: false,
    strategy: 'data-parallel',  // or 'tensor-parallel'
    gpus: [0],  // Array of GPU IDs to use
  },
};

// ==================== OLLAMA GPU CONFIGURATION ====================

const OLLAMA_GPU_CONFIG = {
  // Service configuration
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  
  // Model settings
  model: process.env.OLLAMA_MODEL || 'mistral',
  variants: {
    fast: 'mistral',  // 7B model - fastest
    balanced: 'neural-chat',  // Balanced speed/quality
    quality: 'neural-chat:13b',  // Better quality responses
  },

  // Inference parameters
  inference: {
    temperature: parseFloat(process.env.LLM_TEMPERATURE || 0.7),
    topP: 0.9,
    topK: 40,
    numPredict: parseInt(process.env.LLM_MAX_TOKENS || 2048),
    numThread: Math.floor(os.cpus().length * 0.75),  // Use 75% of CPU threads
    numGPU: 1,  // Use 1 GPU
    repeatLastN: 64,
    repeatPenalty: 1.1,
    presencePenalty: 0,
    frequencyPenalty: 0,
  },

  // Request pooling
  pooling: {
    maxConnections: 128,
    keepAlive: true,
    keepAliveTimeout: 30000,
  },

  // Timeouts
  timeouts: {
    connect: 5000,
    request: 120000,  // 2 minutes for long inference
  },

  // Retry logic
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  },
};

// ==================== VRAM MANAGEMENT ====================

const VRAM_MANAGER = {
  /**
   * Calculate VRAM allocation
   * RTX 5090 has 24GB VRAM
   */
  calculateVRAMAllocation() {
    const totalVRAM = 24 * 1024;  // 24 GB in MB
    const usableVRAM = Math.floor(totalVRAM * GPU_CONFIG.memoryFraction);

    return {
      total: totalVRAM,
      usable: usableVRAM,
      models: Math.floor(usableVRAM * 0.7),  // 70% for model weights
      cache: Math.floor(usableVRAM * 0.2),  // 20% for KV cache
      misc: Math.floor(usableVRAM * 0.1),  // 10% for misc allocations
    };
  },

  /**
   * Monitor VRAM usage in real-time
   */
  async getVRAMUsage() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('nvidia-smi --query-gpu=memory.used,memory.free,memory.total --format=csv,nounits,noheader', 
        { encoding: 'utf8' });
      
      const [used, free, total] = output.trim().split(',').map(x => parseInt(x.trim()));
      
      return {
        used: used * 1024 * 1024,  // Convert to bytes
        free: free * 1024 * 1024,
        total: total * 1024 * 1024,
        utilization: (used / total * 100).toFixed(2),
      };
    } catch (error) {
      console.error('Failed to get VRAM usage:', error.message);
      return null;
    }
  },

  /**
   * Check if model fits in VRAM
   */
  canLoadModel(modelSizeMB) {
    const vram = this.calculateVRAMAllocation();
    return modelSizeMB < vram.models;
  },
};

// ==================== INFERENCE OPTIMIZATION ====================

const INFERENCE_OPTIMIZER = {
  /**
   * Optimize prompt for faster inference
   */
  optimizePrompt(prompt, variant = 'balanced') {
    const maxLength = {
      fast: 200,
      balanced: 500,
      quality: 1000,
    }[variant] || 500;

    // Truncate if too long
    if (prompt.length > maxLength) {
      return prompt.substring(0, maxLength);
    }

    // Remove redundant whitespace
    return prompt.replace(/\s+/g, ' ').trim();
  },

  /**
   * Batch multiple inference requests for efficiency
   */
  async batchInference(requests, options = {}) {
    const {
      maxBatchSize = 32,
      timeout = 5000,
    } = options;

    const batches = [];
    for (let i = 0; i < requests.length; i += maxBatchSize) {
      batches.push(requests.slice(i, i + maxBatchSize));
    }

    const results = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(req => this.inferenceRequest(req))
      );
      results.push(...batchResults);
    }

    return results;
  },

  /**
   * Single inference request with GPU acceleration
   */
  async inferenceRequest(request) {
    const {
      prompt,
      model = OLLAMA_GPU_CONFIG.model,
      temperature = OLLAMA_GPU_CONFIG.inference.temperature,
      maxTokens = OLLAMA_GPU_CONFIG.inference.numPredict,
    } = request;

    const startTime = Date.now();

    try {
      const response = await fetch(`${OLLAMA_GPU_CONFIG.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: this.optimizePrompt(prompt),
          stream: false,
          temperature,
          num_predict: maxTokens,
          num_gpu: 1,
          num_thread: OLLAMA_GPU_CONFIG.inference.numThread,
          top_p: OLLAMA_GPU_CONFIG.inference.topP,
          top_k: OLLAMA_GPU_CONFIG.inference.topK,
          repeat_last_n: OLLAMA_GPU_CONFIG.inference.repeatLastN,
          repeat_penalty: OLLAMA_GPU_CONFIG.inference.repeatPenalty,
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      return {
        success: true,
        text: data.response,
        duration,
        tokensGenerated: data.eval_count,
        tokensPerSecond: (data.eval_count / (duration / 1000)).toFixed(2),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  },

  /**
   * Streaming inference for real-time responses
   */
  async streamingInference(prompt, onChunk) {
    const model = OLLAMA_GPU_CONFIG.model;
    
    try {
      const response = await fetch(`${OLLAMA_GPU_CONFIG.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: this.optimizePrompt(prompt),
          stream: true,
          temperature: OLLAMA_GPU_CONFIG.inference.temperature,
          num_predict: OLLAMA_GPU_CONFIG.inference.numPredict,
          num_gpu: 1,
          num_thread: OLLAMA_GPU_CONFIG.inference.numThread,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line) {
            const data = JSON.parse(line);
            onChunk(data);
          }
        }
        
        buffer = lines[lines.length - 1];
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const data = JSON.parse(buffer);
        onChunk(data);
      }

      return true;
    } catch (error) {
      console.error('Streaming inference failed:', error);
      return false;
    }
  },
};

// ==================== MONITORING & PROFILING ====================

const GPU_MONITOR = {
  /**
   * Get real-time GPU metrics
   */
  async getGPUMetrics() {
    try {
      const { execSync } = require('child_process');
      
      // Query GPU info
      const output = execSync(
        'nvidia-smi --query-gpu=utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,clocks.current.graphics,clocks.current.memory --format=csv,nounits,noheader',
        { encoding: 'utf8', timeout: 5000 }
      );

      const metrics = output.trim().split(',').map(x => x.trim());

      return {
        timestamp: Date.now(),
        utilization: {
          gpu: parseFloat(metrics[0]),  // %
          memory: parseFloat(metrics[1]),  // %
        },
        temperature: parseFloat(metrics[2]),  // °C
        power: {
          current: parseFloat(metrics[3]),  // W
          limit: parseFloat(metrics[4]),  // W
        },
        clocks: {
          gpu: parseFloat(metrics[5]),  // MHz
          memory: parseFloat(metrics[6]),  // MHz
        },
      };
    } catch (error) {
      console.error('Failed to get GPU metrics:', error.message);
      return null;
    }
  },

  /**
   * Monitor GPU health and alert on issues
   */
  async healthCheck() {
    const metrics = await this.getGPUMetrics();
    
    if (!metrics) {
      return { healthy: false, reason: 'Unable to query GPU' };
    }

    const alerts = [];

    // Temperature alert
    if (metrics.temperature > 80) {
      alerts.push(`High temperature: ${metrics.temperature}°C`);
    }

    // Thermal throttling
    if (metrics.power.current > metrics.power.limit * 0.95) {
      alerts.push(`High power usage: ${metrics.power.current}W / ${metrics.power.limit}W`);
    }

    // Memory pressure
    if (metrics.utilization.memory > 95) {
      alerts.push(`Memory pressure: ${metrics.utilization.memory}%`);
    }

    return {
      healthy: alerts.length === 0,
      metrics,
      alerts,
    };
  },

  /**
   * Profile inference performance
   */
  profileInference(results) {
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const avgTokensPerSec = results.reduce((sum, r) => sum + parseFloat(r.tokensPerSecond || 0), 0) / results.length;

    return {
      totalRequests: results.length,
      averageDuration: avgDuration.toFixed(2),
      averageTokensPerSecond: avgTokensPerSec.toFixed(2),
      successRate: (results.filter(r => r.success).length / results.length * 100).toFixed(2),
    };
  },
};

// ==================== EXPORTS ====================

module.exports = {
  GPU_CONFIG,
  OLLAMA_GPU_CONFIG,
  VRAM_MANAGER,
  INFERENCE_OPTIMIZER,
  GPU_MONITOR,

  /**
   * Initialize GPU acceleration
   */
  async initialize() {
    console.log('🚀 Initializing GPU acceleration...');

    if (!GPU_CONFIG.enabled) {
      console.log('⚠️  GPU acceleration disabled');
      return;
    }

    // Check VRAM
    const vram = VRAM_MANAGER.calculateVRAMAllocation();
    console.log(`✓ VRAM allocation: ${vram.usable}MB available`);

    // Check GPU health
    const health = await GPU_MONITOR.healthCheck();
    if (!health.healthy) {
      console.error('⚠️  GPU health issues:', health.alerts);
    } else {
      console.log('✓ GPU health check passed');
    }

    // Test Ollama connection
    try {
      const response = await fetch(`${OLLAMA_GPU_CONFIG.baseUrl}/api/tags`);
      const data = await response.json();
      console.log(`✓ Ollama service running with ${data.models?.length || 0} models`);
    } catch (error) {
      console.error('✗ Ollama service not available:', error.message);
    }

    console.log('✓ GPU acceleration ready');
  },
};
