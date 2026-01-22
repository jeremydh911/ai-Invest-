/**
 * GPU Detection and Load Balancing Service
 * Detects available GPUs and distributes workload based on capacity
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

class GPUOptimizationService {
  constructor() {
    this.gpus = [];
    this.workloadQueues = {};
    this.isInitialized = false;
    this.detectionMethod = null;

    // Try to detect GPUs on initialization
    this.detectGPUs();
  }

  /**
   * Detect available GPUs on the system
   */
  detectGPUs() {
    console.log('[GPU] Starting GPU detection...');

    // Try NVIDIA CUDA (most common)
    this.gpus = this.detectNvidia();

    // Try AMD ROCm
    if (this.gpus.length === 0) {
      this.gpus = this.detectAMD();
    }

    // Try Intel GPU (oneAPI)
    if (this.gpus.length === 0) {
      this.gpus = this.detectIntel();
    }

    // Try Metal (macOS)
    if (this.gpus.length === 0) {
      this.gpus = this.detectMetal();
    }

    if (this.gpus.length === 0) {
      console.warn('[GPU] No GPUs detected. Using CPU fallback.');
      this.gpus = [this.createCPUFallback()];
    } else {
      console.log(`[GPU] Detected ${this.gpus.length} GPU(s):`);
      this.gpus.forEach((gpu, idx) => {
        console.log(`  [${idx}] ${gpu.name} - ${gpu.memory}MB - ${gpu.type}`);
      });
    }

    // Initialize workload queues
    this.gpus.forEach((gpu, idx) => {
      this.workloadQueues[idx] = [];
    });

    this.isInitialized = true;
  }

  /**
   * Detect NVIDIA GPUs using nvidia-smi
   */
  detectNvidia() {
    try {
      // Check if nvidia-smi exists
      const nvidiaSmiPath = this.findNvidiaSmi();
      if (!nvidiaSmiPath) {
        return [];
      }

      // Query GPU information
      const output = execSync(
        `"${nvidiaSmiPath}" --query-gpu=index,name,memory.total --format=csv,noheader,nounits`,
        { encoding: 'utf-8', timeout: 5000 }
      );

      const gpus = [];
      const lines = output.trim().split('\n');

      lines.forEach((line) => {
        const [index, name, memory] = line.split(',').map(s => s.trim());
        if (index !== undefined && name !== undefined) {
          gpus.push({
            index: parseInt(index),
            name: name.trim(),
            type: 'NVIDIA',
            memory: parseInt(memory) || 2048,
            computeCapability: this.getNvidiaComputeCapability(name),
            available: true,
            currentLoad: 0,
            temperature: null
          });
        }
      });

      if (gpus.length > 0) {
        this.detectionMethod = 'NVIDIA CUDA';
        console.log('[GPU] NVIDIA GPUs detected');
      }

      return gpus;
    } catch (err) {
      console.warn('[GPU] NVIDIA detection failed:', err.message);
      return [];
    }
  }

  /**
   * Find nvidia-smi executable path
   */
  findNvidiaSmi() {
    const possiblePaths = [
      'nvidia-smi',
      'C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe',
      '/usr/bin/nvidia-smi',
      '/opt/nvidia-utils/bin/nvidia-smi'
    ];

    for (const path of possiblePaths) {
      try {
        execSync(`"${path}" --version`, { 
          encoding: 'utf-8', 
          stdio: 'pipe',
          timeout: 1000 
        });
        return path;
      } catch (e) {
        continue;
      }
    }

    return null;
  }

  /**
   * Get NVIDIA GPU compute capability (for optimization)
   */
  getNvidiaComputeCapability(gpuName) {
    const capabilities = {
      'Tesla': { v100: 7.0, a100: 8.0, p100: 6.1 },
      'GeForce RTX': { '3090': 8.6, '3080': 8.6, '3070': 8.6, '2080': 7.5, '2070': 7.5 },
      'GeForce GTX': { '1080': 6.1, '1070': 6.1 },
      'Quadro': { 'p6000': 6.1, 'a6000': 8.6 }
    };

    for (const [family, specs] of Object.entries(capabilities)) {
      if (gpuName.includes(family)) {
        for (const [model, capability] of Object.entries(specs)) {
          if (gpuName.includes(model)) {
            return capability;
          }
        }
      }
    }

    return 7.0; // Default to reasonable capability
  }

  /**
   * Detect AMD GPUs using rocm-smi
   */
  detectAMD() {
    try {
      const output = execSync('rocm-smi --showproductname --json', {
        encoding: 'utf-8',
        timeout: 5000
      });

      const data = JSON.parse(output);
      const gpus = [];

      data.forEach((gpu, idx) => {
        gpus.push({
          index: idx,
          name: gpu.Card_product_name || `AMD GPU ${idx}`,
          type: 'AMD ROCm',
          memory: gpu.Mem_Info_Total || 4096,
          available: true,
          currentLoad: 0,
          temperature: null
        });
      });

      if (gpus.length > 0) {
        this.detectionMethod = 'AMD ROCm';
        console.log('[GPU] AMD GPUs detected');
      }

      return gpus;
    } catch (err) {
      console.warn('[GPU] AMD detection failed:', err.message);
      return [];
    }
  }

  /**
   * Detect Intel GPUs
   */
  detectIntel() {
    try {
      const output = execSync('clinfo', { encoding: 'utf-8', timeout: 5000 });
      
      // Parse clinfo output for Intel GPU
      if (output.includes('Intel')) {
        return [{
          index: 0,
          name: 'Intel GPU (oneAPI)',
          type: 'Intel',
          memory: 2048, // Default, actual may vary
          available: true,
          currentLoad: 0,
          temperature: null
        }];
      }

      return [];
    } catch (err) {
      console.warn('[GPU] Intel detection failed:', err.message);
      return [];
    }
  }

  /**
   * Detect Metal GPUs (macOS)
   */
  detectMetal() {
    if (os.platform() !== 'darwin') {
      return [];
    }

    try {
      const output = execSync('system_profiler SPDisplaysDataType', {
        encoding: 'utf-8',
        timeout: 5000
      });

      if (output.includes('Metal')) {
        // Extract GPU name from system profiler
        const match = output.match(/Chipset Model: (.*)/);
        const name = match ? match[1] : 'Apple Metal GPU';

        return [{
          index: 0,
          name,
          type: 'Metal',
          memory: 4096, // Estimate for unified memory
          available: true,
          currentLoad: 0,
          temperature: null
        }];
      }

      return [];
    } catch (err) {
      console.warn('[GPU] Metal detection failed:', err.message);
      return [];
    }
  }

  /**
   * Create CPU fallback entry
   */
  createCPUFallback() {
    const cpuCount = os.cpus().length;
    const totalMemory = os.totalmem() / (1024 * 1024); // Convert to MB

    return {
      index: 0,
      name: `CPU Fallback (${cpuCount} cores)`,
      type: 'CPU',
      memory: totalMemory,
      cores: cpuCount,
      available: true,
      currentLoad: 0,
      temperature: null
    };
  }

  /**
   * Get GPU with lowest load for workload distribution
   */
  getOptimalGPU() {
    if (this.gpus.length === 0) {
      return null;
    }

    // Find GPU with lowest memory usage
    let optimal = this.gpus[0];
    let lowestRatio = this.getMemoryUsageRatio(0);

    for (let i = 1; i < this.gpus.length; i++) {
      const ratio = this.getMemoryUsageRatio(i);
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        optimal = this.gpus[i];
      }
    }

    return optimal;
  }

  /**
   * Get memory usage ratio (0-1)
   */
  getMemoryUsageRatio(gpuIndex) {
    const gpu = this.gpus[gpuIndex];
    if (!gpu) return 1.0;

    // Calculate queue memory load
    const queueLoad = (this.workloadQueues[gpuIndex]?.length || 0) * 100; // Estimate per job
    const memoryRatio = (queueLoad / gpu.memory);

    return Math.min(memoryRatio, 1.0);
  }

  /**
   * Get all GPU status
   */
  getStatus() {
    return {
      detected: this.gpus.length,
      detectionMethod: this.detectionMethod,
      gpus: this.gpus.map((gpu, idx) => ({
        ...gpu,
        queueLength: this.workloadQueues[idx]?.length || 0,
        memoryUsageRatio: this.getMemoryUsageRatio(idx)
      })),
      isInitialized: this.isInitialized
    };
  }

  /**
   * Submit workload to optimal GPU
   */
  submitWorkload(workload) {
    const gpu = this.getOptimalGPU();
    
    if (!gpu) {
      throw new Error('No GPUs available');
    }

    const job = {
      id: `${gpu.index}_${Date.now()}_${Math.random()}`,
      gpuIndex: gpu.index,
      workload,
      priority: workload.priority || 'normal',
      submitted: Date.now(),
      status: 'queued'
    };

    this.workloadQueues[gpu.index].push(job);

    console.log(`[GPU] Workload ${job.id} queued on GPU ${gpu.index}`);

    return job;
  }

  /**
   * Get distribution recommendation based on GPU specs
   */
  getDistributionRatio() {
    if (this.gpus.length <= 1) {
      return { 0: 1.0 };
    }

    const ratio = {};
    const totalMemory = this.gpus.reduce((sum, gpu) => sum + gpu.memory, 0);

    this.gpus.forEach((gpu, idx) => {
      // Weight by memory capacity
      ratio[idx] = gpu.memory / totalMemory;
    });

    return ratio;
  }

  /**
   * Get load balancing strategy
   */
  getLoadBalancingStrategy() {
    const distribution = this.getDistributionRatio();
    const strategy = {};

    Object.entries(distribution).forEach(([idx, ratio]) => {
      const gpu = this.gpus[parseInt(idx)];
      const jobsPercentage = Math.round(ratio * 100);

      strategy[parseInt(idx)] = {
        gpu: gpu.name,
        memory: `${gpu.memory}MB`,
        jobDistribution: `${jobsPercentage}%`,
        weights: ratio.toFixed(2)
      };
    });

    return strategy;
  }

  /**
   * Estimate execution time on GPU
   */
  estimateExecutionTime(operation, gpuIndex = null) {
    const gpu = gpuIndex !== null ? this.gpus[gpuIndex] : this.getOptimalGPU();
    
    if (!gpu) {
      return Infinity;
    }

    // Rough estimates based on operation type
    const baseTimes = {
      'inference': 50, // ms per item
      'training': 500, // ms per item
      'synthesis': 100, // ms for TTS
      'embedding': 10, // ms per token
      'analysis': 150 // ms per analysis
    };

    const baseTime = baseTimes[operation.type] || 100;
    const itemCount = operation.itemCount || 1;

    // Adjust for GPU memory (better GPU = faster)
    const memoryFactor = Math.min(gpu.memory / 2048, 2.0); // Normalize to 2GB
    
    // Adjust for current queue
    const queueFactor = 1 + (this.workloadQueues[gpu.index]?.length || 0) * 0.1;

    const estimatedTime = (baseTime * itemCount) / memoryFactor / queueFactor;

    return Math.round(estimatedTime);
  }

  /**
   * Update GPU temperature (for monitoring)
   */
  updateTemperature() {
    if (this.detectionMethod === 'NVIDIA CUDA') {
      try {
        const nvidiaSmiPath = this.findNvidiaSmi();
        if (nvidiaSmiPath) {
          const output = execSync(
            `"${nvidiaSmiPath}" --query-gpu=index,temperature.gpu --format=csv,noheader,nounits`,
            { encoding: 'utf-8', timeout: 5000 }
          );

          output.trim().split('\n').forEach((line) => {
            const [index, temp] = line.split(',').map(s => s.trim());
            const gpuIdx = parseInt(index);
            if (this.gpus[gpuIdx]) {
              this.gpus[gpuIdx].temperature = parseInt(temp) || null;
            }
          });
        }
      } catch (err) {
        console.warn('[GPU] Temperature update failed:', err.message);
      }
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const status = {};

    this.gpus.forEach((gpu, idx) => {
      const health = {
        name: gpu.name,
        status: 'healthy',
        issues: [],
        recommendation: null
      };

      // Check temperature
      if (gpu.temperature) {
        if (gpu.temperature > 85) {
          health.status = 'warning';
          health.issues.push(`High temperature: ${gpu.temperature}°C`);
        }
        if (gpu.temperature > 90) {
          health.status = 'critical';
          health.issues.push(`Critical temperature: ${gpu.temperature}°C`);
          health.recommendation = 'Reduce workload and improve cooling';
        }
      }

      // Check memory
      const memRatio = this.getMemoryUsageRatio(idx);
      if (memRatio > 0.9) {
        health.status = health.status === 'healthy' ? 'warning' : health.status;
        health.issues.push(`Memory nearly full: ${(memRatio * 100).toFixed(1)}%`);
      }

      // Check queue
      const queueLen = this.workloadQueues[idx]?.length || 0;
      if (queueLen > 10) {
        health.status = health.status === 'healthy' ? 'warning' : health.status;
        health.issues.push(`Large queue: ${queueLen} jobs waiting`);
      }

      status[idx] = health;
    });

    return status;
  }
}

module.exports = GPUOptimizationService;
