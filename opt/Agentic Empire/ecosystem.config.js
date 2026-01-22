/**
 * PM2 Ecosystem Configuration for LucaExpress
 * AMD 9900X (24 cores) + RTX 5090 + 128GB RAM
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 monit
 *   pm2 logs
 */

module.exports = {
  apps: [
    // ==================== API SERVER CLUSTER ====================
    {
      name: 'luca-express-api',
      script: './server.js',
      instances: 8,  // Use 8 of 24 cores for API (leave 16 for GPU/system)
      instance_var: 'INSTANCE_ID',
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENABLE_GPU: 'true',
        CUDA_VISIBLE_DEVICES: '0',
        GPU_MEMORY_FRACTION: '0.8',
        LLM_PROVIDER: 'ollama',
        OLLAMA_BASE_URL: 'http://localhost:11434',
        OLLAMA_MODEL: 'mistral',
        LLM_MAX_TOKENS: '2048',
        LLM_TEMPERATURE: '0.7',
        MAX_CONCURRENT_REQUESTS: '128',
        CONNECTION_POOL_SIZE: '64',
        CACHE_SIZE_MB: '8192',
        WORKER_THREADS: '8',
        RAG_CHUNK_SIZE: '1024',
        RAG_OVERLAP: '100',
        RAG_SIMILARITY_THRESHOLD: '0.7',
        RAG_RETRIEVAL_COUNT: '5',
        LOG_LEVEL: 'info',
        NODE_PROD: 'true',
      },
      
      // Resource limits
      max_memory_restart: '32G',  // Restart if exceeds 32GB
      
      // Advanced clustering
      exec_mode: 'cluster',
      merge_logs: false,
      output: 'logs/api-out.log',
      error: 'logs/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Graceful shutdown
      kill_timeout: 15000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,
      
      // Auto-restart settings
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      max_memory_restart: '32G',
      
      // Development-specific
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
    },

    // ==================== OLLAMA LLM SERVICE ====================
    {
      name: 'ollama-service',
      script: 'none',
      cmd: 'ollama serve',
      autorestart: true,
      max_memory_restart: '64G',  // Allow up to 64GB for GPU inference
      output: 'logs/ollama-out.log',
      error: 'logs/ollama-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Environmental setup for Ollama
      env: {
        OLLAMA_HOST: '127.0.0.1:11434',
        OLLAMA_NUM_PARALLEL: '8',
        OLLAMA_MAX_LOADED_MODELS: '2',
      },
      
      // Note: If Ollama is running as systemd service, remove this and just monitor
      // sudo systemctl enable ollama
      // sudo systemctl start ollama
    },

    // ==================== BACKGROUND WORKER ====================
    {
      name: 'luca-worker',
      script: './services/queue.js',  // Background job processor
      instances: 2,  // 2 workers for async jobs
      instance_var: 'WORKER_ID',
      exec_mode: 'cluster',
      max_memory_restart: '16G',
      
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: '10',
        LOG_LEVEL: 'info',
      },
      
      output: 'logs/worker-out.log',
      error: 'logs/worker-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // ==================== MONITORING SERVICE ====================
    {
      name: 'luca-monitor',
      script: './services/monitor.js',  // Custom monitoring (if exists)
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      
      env: {
        NODE_ENV: 'production',
        MONITOR_INTERVAL: '30000',  // 30 seconds
        ALERT_THRESHOLD_CPU: '80',
        ALERT_THRESHOLD_MEMORY: '90',
        ALERT_THRESHOLD_DISK: '85',
      },
      
      output: 'logs/monitor-out.log',
      error: 'logs/monitor-err.log',
    },

    // ==================== HEALTH CHECK SERVICE ====================
    {
      name: 'health-check',
      script: './health-check.js',  // See next file
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      
      env: {
        NODE_ENV: 'production',
        CHECK_INTERVAL: '60000',  // 60 seconds
        CHECK_ENDPOINTS: 'localhost:3000,localhost:11434',
      },
      
      output: 'logs/health-out.log',
      error: 'logs/health-err.log',
    },
  ],

  // ==================== DEPLOYMENT CONFIG ====================
  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo',
      path: '/opt/luca-express',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --update-env',
      'pre-deploy-local': 'echo "Deploying to production"',
    },
    staging: {
      user: 'node',
      host: 'staging-server-ip',
      ref: 'origin/develop',
      repo: 'your-git-repo',
      path: '/opt/luca-express-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --update-env',
    },
  },

  // ==================== MONITORING & ALERTS ====================
  module_conf: {
    network: true,
    ports: true,
  },

  // ==================== GRACEFUL RELOAD ====================
  // When you run: pm2 reload all
  // PM2 will wait 15 seconds for graceful shutdown
  // Then force kill if needed
};

/**
 * PM2 QUICK COMMANDS:
 * 
 * Start:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --only luca-express-api
 * 
 * Monitor:
 *   pm2 monit
 *   pm2 logs
 *   pm2 logs luca-express-api --tail 100
 * 
 * Restart:
 *   pm2 restart luca-express-api
 *   pm2 reload luca-express-api  # Graceful reload
 * 
 * Stop/Delete:
 *   pm2 stop all
 *   pm2 delete all
 * 
 * Status:
 *   pm2 status
 *   pm2 info luca-express-api
 * 
 * Auto-start on reboot:
 *   pm2 save
 *   sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
 * 
 * Scale instances:
 *   pm2 scale luca-express-api 12  # Scale to 12 instances
 * 
 * Memory limits:
 *   pm2 set max-memory-restart 32G luca-express-api
 */
