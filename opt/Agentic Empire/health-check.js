#!/usr/bin/env node

/**
 * Health Check Service for AI Trading Empire
 * 
 * Monitors all services and provides health status
 * Used by PM2 and load balancers for auto-restart/failover
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '60000');  // 60 seconds
const CHECK_ENDPOINTS = (process.env.CHECK_ENDPOINTS || 'localhost:3000').split(',');
const LOG_FILE = path.join(__dirname, 'logs', 'health-check.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ==================== HEALTH CHECK FUNCTIONS ====================

/**
 * Check if a single endpoint is healthy
 */
async function checkEndpoint(host, port, protocol = 'http') {
  return new Promise((resolve) => {
    const timeout = 5000;
    const timerHandle = setTimeout(() => {
      resolve({
        status: 'timeout',
        endpoint: `${protocol}://${host}:${port}`,
        responseTime: timeout,
      });
    }, timeout);

    const client = protocol === 'https' ? https : http;
    const options = {
      hostname: host,
      port: port,
      path: '/health',
      method: 'GET',
      timeout: timeout,
    };

    const req = client.request(options, (res) => {
      clearTimeout(timerHandle);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now();
        resolve({
          status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
          endpoint: `${protocol}://${host}:${port}`,
          statusCode: res.statusCode,
          responseTime: responseTime - Date.now() + timeout,
          timestamp: new Date().toISOString(),
        });
      });
    });

    req.on('error', (error) => {
      clearTimeout(timerHandle);
      resolve({
        status: 'error',
        endpoint: `${protocol}://${host}:${port}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    req.end();
  });
}

/**
 * Check Ollama service
 */
async function checkOllama() {
  return new Promise((resolve) => {
    const timeout = 5000;
    const timerHandle = setTimeout(() => {
      resolve({
        service: 'ollama',
        status: 'timeout',
        endpoint: 'http://localhost:11434',
      });
    }, timeout);

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: timeout,
    };

    const req = http.request(options, (res) => {
      clearTimeout(timerHandle);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            service: 'ollama',
            status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
            statusCode: res.statusCode,
            modelsLoaded: json.models?.length || 0,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          resolve({
            service: 'ollama',
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timerHandle);
      resolve({
        service: 'ollama',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    req.end();
  });
}

/**
 * Check GPU health (if available)
 */
async function checkGPU() {
  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    
    try {
      const output = execSync(
        'nvidia-smi --query-gpu=utilization.gpu,utilization.memory,temperature.gpu --format=csv,nounits,noheader',
        { encoding: 'utf8', timeout: 5000 }
      );

      const [gpuUtil, memUtil, temp] = output.trim().split(',').map(x => parseFloat(x.trim()));

      resolve({
        service: 'gpu',
        status: temp < 80 && memUtil < 95 ? 'healthy' : 'warning',
        metrics: {
          gpuUtilization: gpuUtil,
          memoryUtilization: memUtil,
          temperature: temp,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      resolve({
        service: 'gpu',
        status: 'unavailable',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
}

/**
 * Check system resources
 */
async function checkSystem() {
  const os = require('os');

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = (usedMem / totalMem) * 100;

  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;

  return {
    service: 'system',
    status: memPercent < 90 ? 'healthy' : 'warning',
    memory: {
      total: Math.round(totalMem / 1024 / 1024 / 1024),
      used: Math.round(usedMem / 1024 / 1024 / 1024),
      percent: memPercent.toFixed(2),
    },
    cpu: {
      count: cpuCount,
      load: {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2),
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Perform full health check
 */
async function performHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
    overall: 'unknown',
  };

  // Check API endpoints
  const endpointChecks = [];
  for (const endpoint of CHECK_ENDPOINTS) {
    const [host, port] = endpoint.trim().split(':');
    const check = await checkEndpoint(host, port || 3000);
    endpointChecks.push(check);
  }
  results.checks.api = endpointChecks;

  // Check Ollama
  const ollamaCheck = await checkOllama();
  results.checks.ollama = ollamaCheck;

  // Check GPU
  const gpuCheck = await checkGPU();
  results.checks.gpu = gpuCheck;

  // Check System
  const systemCheck = await checkSystem();
  results.checks.system = systemCheck;

  // Determine overall status
  const hasErrors = [
    endpointChecks.some(c => c.status === 'error'),
    ollamaCheck.status === 'error',
  ].some(v => v);

  const hasTimeouts = [
    endpointChecks.some(c => c.status === 'timeout'),
    ollamaCheck.status === 'timeout',
  ].some(v => v);

  const hasWarnings = [
    endpointChecks.some(c => c.status === 'unhealthy'),
    ollamaCheck.status === 'unhealthy',
    gpuCheck.status === 'warning',
    systemCheck.status === 'warning',
  ].some(v => v);

  if (hasErrors) {
    results.overall = 'error';
  } else if (hasTimeouts) {
    results.overall = 'warning';
  } else if (hasWarnings) {
    results.overall = 'degraded';
  } else {
    results.overall = 'healthy';
  }

  return results;
}

/**
 * Log health check results
 */
function logResults(results) {
  const timestamp = new Date().toISOString();
  const status = results.overall.toUpperCase();
  
  let logMessage = `[${timestamp}] Health Check - Overall Status: ${status}\n`;

  // API endpoints
  if (results.checks.api) {
    logMessage += '  API Endpoints:\n';
    results.checks.api.forEach(check => {
      logMessage += `    - ${check.endpoint}: ${check.status}`;
      if (check.statusCode) logMessage += ` (HTTP ${check.statusCode})`;
      if (check.error) logMessage += ` (${check.error})`;
      logMessage += '\n';
    });
  }

  // Ollama
  if (results.checks.ollama) {
    logMessage += `  Ollama: ${results.checks.ollama.status}`;
    if (results.checks.ollama.modelsLoaded !== undefined) {
      logMessage += ` (${results.checks.ollama.modelsLoaded} models)`;
    }
    if (results.checks.ollama.error) logMessage += ` (${results.checks.ollama.error})`;
    logMessage += '\n';
  }

  // GPU
  if (results.checks.gpu) {
    logMessage += `  GPU: ${results.checks.gpu.status}`;
    if (results.checks.gpu.metrics) {
      logMessage += ` (GPU: ${results.checks.gpu.metrics.gpuUtilization}%, Memory: ${results.checks.gpu.metrics.memoryUtilization}%, Temp: ${results.checks.gpu.metrics.temperature}°C)`;
    }
    logMessage += '\n';
  }

  // System
  if (results.checks.system) {
    const sys = results.checks.system;
    logMessage += `  System: ${sys.status} (Memory: ${sys.memory.percent}%, CPU Load: ${sys.cpu.load['1min']})`;
  }

  logMessage += '\n';

  // Console output
  console.log(logMessage);

  // File logging
  fs.appendFileSync(LOG_FILE, logMessage);
}

/**
 * Alert on critical issues
 */
function sendAlert(results) {
  if (results.overall === 'error') {
    console.error('🚨 CRITICAL: Health check detected errors');
    
    // You can integrate with alerting services here
    // Example: Send to PagerDuty, Slack, email, etc.
  }
}

// ==================== MAIN LOOP ====================

async function runHealthChecks() {
  console.log(`[${new Date().toISOString()}] Starting health check service (interval: ${CHECK_INTERVAL}ms)`);

  // Run initial check
  let results = await performHealthCheck();
  logResults(results);
  sendAlert(results);

  // Set up recurring checks
  setInterval(async () => {
    results = await performHealthCheck();
    logResults(results);
    sendAlert(results);
  }, CHECK_INTERVAL);
}

// ==================== EXPRESS ENDPOINT ====================

/**
 * Optional: Express endpoint for manual health checks
 * Mount at /health in main server
 */
function createHealthEndpoint() {
  return async (req, res) => {
    const results = await performHealthCheck();
    
    const statusCode = results.overall === 'healthy' ? 200 : 
                      results.overall === 'degraded' ? 200 : 
                      results.overall === 'warning' ? 503 : 
                      503;

    res.status(statusCode).json(results);
  };
}

// ==================== START SERVICE ====================

if (require.main === module) {
  runHealthChecks().catch(error => {
    console.error('Health check service error:', error);
    process.exit(1);
  });
}

// ==================== EXPORTS ====================

module.exports = {
  performHealthCheck,
  checkEndpoint,
  checkOllama,
  checkGPU,
  checkSystem,
  createHealthEndpoint,
};

/**
 * To integrate in server.js:
 * 
 * const healthCheck = require('./health-check.js');
 * app.get('/health', healthCheck.createHealthEndpoint());
 */
