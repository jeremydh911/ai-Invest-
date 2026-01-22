# LucaExpress Ubuntu 24+ Deployment Guide

## AMD 9900X + RTX 5090 High-Performance Setup

This guide optimizes LucaExpress for your powerful hardware:
- **CPU**: AMD 9900X (24+ cores)
- **GPU**: NVIDIA RTX 5090
- **RAM**: 128 GB DDR5
- **Storage**: 2 TB

---

## Phase 1: System Preparation (Ubuntu 24.04+)

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git htop tmux
```

### 1.2 Install Node.js (Latest LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs npm
node --version  # Should be v20+
npm install -g pm2
```

### 1.3 Install NVIDIA CUDA Toolkit (for RTX 5090)
```bash
# Add NVIDIA repository
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-ubuntu2404.pin
sudo mv cuda-ubuntu2404.pin /etc/apt/preferences.d/cuda-repository-pin-600
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A4B469963BF863CC

# Install CUDA
sudo apt update
sudo apt install -y cuda-toolkit cuda-drivers

# Verify installation
nvidia-smi  # Should show RTX 5090
nvcc --version
```

### 1.4 Install cuDNN (for GPU acceleration)
```bash
# Download from NVIDIA (requires account)
# Or use apt if available
sudo apt install -y libcudnn9-dev libcudnn9-runtime-dev

# Verify
ldconfig -N -v | grep cudnn
```

### 1.5 Install Ollama (for local LLM inference)
```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Start ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Test with a model
ollama pull mistral
ollama serve  # Will run on localhost:11434
```

### 1.6 Kernel Optimization
```bash
# Edit /etc/sysctl.conf
sudo nano /etc/sysctl.conf

# Add these lines:
# Network optimization
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864
net.core.netdev_max_backlog=5000
net.ipv4.tcp_max_syn_backlog=8192

# File descriptor limits
fs.file-max=2097152

# Apply changes
sudo sysctl -p
```

### 1.7 Increase File Descriptor Limits
```bash
# Edit /etc/security/limits.conf
sudo nano /etc/security/limits.conf

# Add these lines at the end:
# * soft nofile 65535
# * hard nofile 65535
# * soft nproc 65535
# * hard nproc 65535

# Reload
sudo systemctl restart systemd-logind.service
```

---

## Phase 2: LucaExpress Installation

### 2.1 Clone/Copy Project
```bash
cd /opt
sudo mkdir -p luca-express
sudo chown $USER:$USER luca-express
cd luca-express

# Copy your Windows files here or clone repo
```

### 2.2 Install Dependencies
```bash
npm install
npm install -g pm2
```

### 2.3 Initialize Database
```bash
node setup-database.js
```

### 2.4 Configure Environment
```bash
# Create .env file
nano .env
```

**High-Performance .env Settings:**
```env
# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# GPU Configuration
ENABLE_GPU=true
CUDA_VISIBLE_DEVICES=0
GPU_MEMORY_FRACTION=0.8

# LLM Configuration
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.7

# Database
DB_PATH=/var/lib/luca-express/data
DATABASE_URL=sqlite:///var/lib/luca-express/companies.db

# Performance
MAX_CONCURRENT_REQUESTS=128
CONNECTION_POOL_SIZE=64
CACHE_SIZE_MB=8192
WORKER_THREADS=24

# RAG Configuration
RAG_CHUNK_SIZE=1024
RAG_OVERLAP=100
RAG_SIMILARITY_THRESHOLD=0.7
RAG_RETRIEVAL_COUNT=5

# Security
MASTER_PASSWORD_HASH=generated_during_setup
JWT_SECRET=your-secure-jwt-secret
HTTPS=true
CERT_PATH=/opt/luca-express/certs/certificate.pem
KEY_PATH=/opt/luca-express/certs/private-key.pem
```

---

## Phase 3: GPU Acceleration Setup

### 3.1 Enable CUDA in LLM Tier
Update [llm_tier.js](llm_tier.js#L1):

```javascript
// GPU Configuration
const GPU_CONFIG = {
  enabled: process.env.ENABLE_GPU === 'true',
  device: parseInt(process.env.CUDA_VISIBLE_DEVICES || '0'),
  memoryFraction: parseFloat(process.env.GPU_MEMORY_FRACTION || '0.8'),
  batchSize: 32,  // Increased batch size for GPU
  cudaGraphs: true,  // Enable CUDA graphs for performance
};

// Model inference with GPU
async function inferWithGPU(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'mistral',
        prompt,
        stream: false,
        temperature: parseFloat(process.env.LLM_TEMPERATURE || 0.7),
        num_predict: parseInt(process.env.LLM_MAX_TOKENS || 2048),
        // GPU-specific parameters
        num_gpu: 1,  // Use one GPU
        num_thread: 24,  // Use 24 CPU threads for auxiliary tasks
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    return data.response;
  } catch (error) {
    clearTimeout(timeout);
    throw new Error(`GPU inference failed: ${error.message}`);
  }
}
```

### 3.2 Monitor GPU Usage
```bash
# Watch GPU utilization in real-time
watch -n 1 nvidia-smi

# Or use gpustat (install first)
sudo apt install -y gpustat
gpustat --watch
```

---

## Phase 4: PM2 Clustering Setup

### 4.1 Create PM2 Ecosystem Config

**File: `ecosystem.config.js`** (created automatically - see next section)

### 4.2 Start Cluster
```bash
# Start with clustering (uses all CPU cores)
pm2 start ecosystem.config.js

# Monitor cluster
pm2 monit

# View logs
pm2 logs
pm2 logs luca-express-api --lines 100
```

### 4.3 PM2 Management Commands
```bash
# Reload without downtime
pm2 reload luca-express-api

# Restart all
pm2 restart all

# Stop cluster
pm2 stop all

# Delete from PM2
pm2 delete all

# Save PM2 config to auto-restart on reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

---

## Phase 5: Reverse Proxy (Nginx)

### 5.1 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.2 Configure Nginx as Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/luca-express
```

**Configuration:**
```nginx
upstream luca_express {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
    server 127.0.0.1:3005;
    server 127.0.0.1:3006;
    server 127.0.0.1:3007;
    
    # Health check
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_http_send "GET /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=10r/s;

server {
    listen 80;
    server_name _;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    ssl_certificate /opt/luca-express/certs/certificate.pem;
    ssl_certificate_key /opt/luca-express/certs/private-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1024;
    gzip_proxied any;
    
    # Timeouts for large uploads
    client_max_body_size 1G;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    # File upload endpoint - higher limits
    location /api/companies/*/files/upload {
        limit_req zone=upload_limit burst=5;
        proxy_pass http://luca_express;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Regular API endpoints - normal rate limits
    location /api/ {
        limit_req zone=api_limit burst=20;
        proxy_pass http://luca_express;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;  # Disable buffering for streaming responses
    }
    
    # WebSocket support
    location /api/ws/ {
        proxy_pass http://luca_express;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://luca_express;
        access_log off;
    }
    
    # Static files
    location / {
        proxy_pass http://luca_express;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Deny access to sensitive files
    location ~ /\.env {
        deny all;
    }
    
    location ~ /\.git {
        deny all;
    }
}

# Status page (optional, for monitoring)
server {
    listen 127.0.0.1:8080;
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### 5.3 Enable Nginx Config
```bash
sudo ln -s /etc/nginx/sites-available/luca-express /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## Phase 6: Monitoring & Logging

### 6.1 PM2 Plus (Optional but Recommended)
```bash
pm2 install pm2-auto-pull
pm2 install pm2-logrotate
pm2 install pm2-github-webhook
```

### 6.2 Systemd Logging
```bash
# View PM2 service logs
sudo journalctl -u pm2-$USER -f

# Check if PM2 is registered as service
sudo systemctl list-units | grep pm2
```

### 6.3 Monitor CPU/GPU Usage
```bash
# Install monitoring tools
sudo apt install -y glances

# Run glances
glances

# Watch specific metrics
top -b -n 1 | head -20  # CPU/Memory
nvidia-smi dmon -s pcm  # GPU memory
```

### 6.4 Set Up Log Rotation
```bash
# Create log rotation config
sudo nano /etc/logrotate.d/luca-express
```

**Config:**
```
/opt/luca-express/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        pm2 reload luca-express-api > /dev/null || true
    endscript
}
```

---

## Phase 7: Production Hardening

### 7.1 Firewall Configuration
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 11434/tcp   # Ollama (local only)
```

### 7.2 Fail2Ban (Prevent Brute Force)
```bash
sudo apt install -y fail2ban

# Create jail config
sudo nano /etc/fail2ban/jail.local
```

**Config:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
port = http,https

[nginx-limit-req]
enabled = true
port = http,https
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 7.3 SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (if you have a domain)
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Phase 8: Performance Tuning

### 8.1 CPU Affinity (Pin processes to cores)
Update `ecosystem.config.js` with CPU affinity (see next section).

### 8.2 Memory Tuning
```bash
# Check memory usage
free -h

# Enable swap (if needed)
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 8.3 Database Optimization
```sql
-- Inside SQLite database
PRAGMA cache_size = 1000000;  -- Use 1GB for cache
PRAGMA synchronous = NORMAL;  -- Balance safety and speed
PRAGMA journal_mode = WAL;     -- Write-Ahead Logging
PRAGMA temp_store = MEMORY;    -- Use RAM for temp tables
PRAGMA optimize;               -- Optimize query plans
```

---

## Deployment Checklist

- [ ] Ubuntu 24.04+ installed
- [ ] NVIDIA CUDA Toolkit + cuDNN installed
- [ ] Node.js v20+ installed
- [ ] Ollama running with Mistral model
- [ ] LucaExpress cloned/copied
- [ ] Dependencies installed (`npm install`)
- [ ] Database initialized (`node setup-database.js`)
- [ ] `.env` configured with GPU settings
- [ ] PM2 ecosystem config created
- [ ] PM2 cluster started (`pm2 start ecosystem.config.js`)
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates in place
- [ ] Firewall configured
- [ ] Fail2Ban enabled
- [ ] Monitoring tools installed
- [ ] Log rotation configured
- [ ] System hardened

---

## Quick Start Commands

```bash
# SSH into server
ssh user@your-server

# Navigate to project
cd /opt/luca-express

# Start cluster
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs luca-express-api

# Test API
curl -k https://localhost/api/files/master-status

# Check GPU
nvidia-smi

# Check Ollama
curl http://localhost:11434/api/tags
```

---

## Troubleshooting

### GPU Not Being Used
```bash
# Check CUDA is working
nvidia-smi
nvcc --version

# Test Ollama with GPU
ollama pull mistral
ollama serve
# Check output for GPU memory allocation
```

### Server Not Responding
```bash
# Check PM2 status
pm2 status
pm2 logs

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :443
```

### High Memory Usage
```bash
# Check memory per process
ps aux --sort=-%mem | head -20

# Adjust PM2 max-memory-restart
pm2 set max-memory-restart 32G luca-express-api
```

### Slow Performance
```bash
# Check system load
uptime
top

# Check disk I/O
iostat -x 1 5

# Check network
iftop -i eth0
```

---

## Advanced Configurations

See additional files:
- `PM2_ECOSYSTEM_CONFIG.js` - Detailed PM2 clustering
- `GPU_ACCELERATION_CONFIG.js` - GPU settings
- `PERFORMANCE_CONFIG.json` - Tuning parameters

