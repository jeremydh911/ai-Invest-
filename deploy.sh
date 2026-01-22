#!/bin/bash

##############################################################################
# AI Trading Empire Ubuntu 24+ Deployment Quick Start
# AMD 9900X + RTX 5090 + 128GB RAM
#
# Usage: bash deploy.sh
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/ai-trading-empire"
DEPLOY_USER="${DEPLOY_USER:-$(whoami)}"
NODEJS_VERSION="20"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI Trading Empire Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# Phase 1: System Check
# ============================================================================

echo -e "${YELLOW}Phase 1: System Check${NC}"
echo "Checking system specifications..."

# Check CPU
CPU_CORES=$(nproc)
echo -e "  CPU Cores: ${GREEN}$CPU_CORES${NC}"

if [ "$CPU_CORES" -lt 20 ]; then
  echo -e "  ${YELLOW}⚠️  Warning: Less than 24 cores detected${NC}"
fi

# Check RAM
TOTAL_RAM=$(free -g | awk 'NR==2 {print $2}')
echo -e "  RAM: ${GREEN}${TOTAL_RAM}GB${NC}"

if [ "$TOTAL_RAM" -lt 100 ]; then
  echo -e "  ${YELLOW}⚠️  Warning: Less than 128GB RAM detected${NC}"
fi

# Check GPU
if command -v nvidia-smi &> /dev/null; then
  GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
  echo -e "  GPU: ${GREEN}$GPU_NAME${NC}"
else
  echo -e "  GPU: ${RED}Not detected - CUDA may not be installed${NC}"
fi

echo ""

# ============================================================================
# Phase 2: Install Dependencies
# ============================================================================

echo -e "${YELLOW}Phase 2: Installing Dependencies${NC}"

# Update system
echo "Updating system packages..."
sudo apt update -qq

# Check if Node.js is installed
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "  Node.js: ${GREEN}$NODE_VERSION${NC}"
else
  echo "Installing Node.js $NODEJS_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | sudo -E bash -
  sudo apt install -y nodejs
  echo -e "  Node.js: ${GREEN}$(node --version)${NC}"
fi

# Install PM2
if command -v pm2 &> /dev/null; then
  PM2_VERSION=$(pm2 --version)
  echo -e "  PM2: ${GREEN}$PM2_VERSION${NC}"
else
  echo "Installing PM2..."
  sudo npm install -g pm2 -qq
  echo -e "  PM2: ${GREEN}$(pm2 --version)${NC}"
fi

# Install other tools
echo "Installing system tools..."
sudo apt install -y -qq git curl wget htop tmux nginx

echo ""

# ============================================================================
# Phase 3: CUDA/GPU Setup (Optional)
# ============================================================================

echo -e "${YELLOW}Phase 3: GPU Setup (Optional)${NC}"

read -p "Do you want to install/configure NVIDIA CUDA? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Setting up CUDA..."
  
  # Download CUDA pin
  wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-ubuntu2404.pin -O /tmp/cuda-ubuntu2404.pin
  sudo mv /tmp/cuda-ubuntu2404.pin /etc/apt/preferences.d/cuda-repository-pin-600
  
  # Add NVIDIA key
  sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A4B469963BF863CC
  
  # Install CUDA
  sudo apt update -qq
  sudo apt install -y -qq cuda-toolkit cuda-drivers
  
  echo -e "${GREEN}✓ CUDA installed${NC}"
else
  echo "Skipping CUDA installation"
fi

echo ""

# ============================================================================
# Phase 4: Ollama Setup (Optional)
# ============================================================================

echo -e "${YELLOW}Phase 4: Ollama LLM Service (Optional)${NC}"

read -p "Do you want to install Ollama? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Installing Ollama..."
  curl -fsSL https://ollama.ai/install.sh | sh
  
  sudo systemctl enable ollama
  sudo systemctl start ollama
  
  echo "Pulling Mistral model (this may take a few minutes)..."
  ollama pull mistral
  
  echo -e "${GREEN}✓ Ollama installed and Mistral model loaded${NC}"
else
  echo "Skipping Ollama installation"
fi

echo ""

# ============================================================================
# Phase 5: Create Project Directory
# ============================================================================

echo -e "${YELLOW}Phase 5: Setting Up Project Directory${NC}"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Creating $PROJECT_DIR..."
  sudo mkdir -p "$PROJECT_DIR"
  sudo chown $DEPLOY_USER:$DEPLOY_USER "$PROJECT_DIR"
fi

echo -e "  Project Directory: ${GREEN}$PROJECT_DIR${NC}"

echo ""

# ============================================================================
# Phase 6: Install Node Dependencies
# ============================================================================

echo -e "${YELLOW}Phase 6: Installing Node Dependencies${NC}"

cd "$PROJECT_DIR" || exit 1

if [ -f "package.json" ]; then
  echo "Installing npm packages..."
  npm install -q
  echo -e "  ${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "  ${RED}✗ package.json not found in $PROJECT_DIR${NC}"
  echo "Please copy your project files first"
  exit 1
fi

echo ""

# ============================================================================
# Phase 7: Initialize Database
# ============================================================================

echo -e "${YELLOW}Phase 7: Initializing Database${NC}"

if [ -f "setup-database.js" ]; then
  echo "Setting up database..."
  node setup-database.js
  echo -e "  ${GREEN}✓ Database initialized${NC}"
else
  echo -e "  ${YELLOW}⚠️  setup-database.js not found - skipping${NC}"
fi

echo ""

# ============================================================================
# Phase 8: Create Logs Directory
# ============================================================================

echo -e "${YELLOW}Phase 8: Creating Logs Directory${NC}"

mkdir -p "$PROJECT_DIR/logs"
echo -e "  ${GREEN}✓ Logs directory created${NC}"

echo ""

# ============================================================================
# Phase 9: Configure Environment
# ============================================================================

echo -e "${YELLOW}Phase 9: Configuring Environment${NC}"

if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "Creating .env file..."
  cat > "$PROJECT_DIR/.env" << EOF
# LucaExpress Configuration
NODE_ENV=production
PORT=3000
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
HTTPS=true
CERT_PATH=/opt/luca-express/certs/certificate.pem
KEY_PATH=/opt/luca-express/certs/private-key.pem
EOF
  echo -e "  ${GREEN}✓ .env file created${NC}"
  echo -e "  ${YELLOW}⚠️  Edit $PROJECT_DIR/.env to customize settings${NC}"
else
  echo -e "  ${YELLOW}ℹ️  .env file already exists - not overwriting${NC}"
fi

echo ""

# ============================================================================
# Phase 10: Start Service with PM2
# ============================================================================

echo -e "${YELLOW}Phase 10: Starting Service with PM2${NC}"

cd "$PROJECT_DIR" || exit 1

if [ -f "ecosystem.config.js" ]; then
  echo "Starting LucaExpress cluster..."
  pm2 start ecosystem.config.js
  
  echo "Saving PM2 configuration..."
  pm2 save
  
  echo "Setting up PM2 auto-start on reboot..."
  pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER 2>&1 | tail -n 1 | sudo bash
  
  echo -e "  ${GREEN}✓ PM2 cluster started${NC}"
else
  echo -e "  ${RED}✗ ecosystem.config.js not found${NC}"
  echo "Please create ecosystem.config.js first"
  exit 1
fi

echo ""

# ============================================================================
# Phase 11: Configure Nginx (Optional)
# ============================================================================

echo -e "${YELLOW}Phase 11: Nginx Configuration (Optional)${NC}"

read -p "Do you want to configure Nginx as reverse proxy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Configuring Nginx..."
  
  sudo tee /etc/nginx/sites-available/luca-express > /dev/null << 'EOF'
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
}

server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    ssl_certificate /opt/luca-express/certs/certificate.pem;
    ssl_certificate_key /opt/luca-express/certs/private-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    gzip on;
    gzip_types text/plain text/css application/json;
    gzip_min_length 1024;
    
    client_max_body_size 1G;
    proxy_connect_timeout 300s;
    proxy_read_timeout 300s;
    
    location / {
        proxy_pass http://luca_express;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

  sudo ln -sf /etc/nginx/sites-available/luca-express /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  
  echo -e "  ${GREEN}✓ Nginx configured${NC}"
else
  echo "Skipping Nginx configuration"
fi

echo ""

# ============================================================================
# Phase 12: Final Status
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "✓ ${GREEN}System Check Passed${NC}"
echo -e "✓ ${GREEN}Dependencies Installed${NC}"
echo -e "✓ ${GREEN}Database Initialized${NC}"
echo -e "✓ ${GREEN}PM2 Cluster Started${NC}"
echo ""

echo -e "Next Steps:"
echo -e "  1. Check service status:   ${BLUE}pm2 monit${NC}"
echo -e "  2. View logs:              ${BLUE}pm2 logs${NC}"
echo -e "  3. Test API:               ${BLUE}curl http://localhost:3000/health${NC}"
echo -e "  4. Monitor GPU:            ${BLUE}nvidia-smi dmon${NC}"
echo ""

echo -e "Useful Commands:"
echo -e "  Reload config:             ${BLUE}pm2 reload ecosystem.config.js${NC}"
echo -e "  Restart services:          ${BLUE}pm2 restart all${NC}"
echo -e "  View specific logs:        ${BLUE}pm2 logs luca-express-api${NC}"
echo -e "  Check health:              ${BLUE}curl -k https://localhost/health${NC}"
echo ""

echo -e "${GREEN}Deployment successful!${NC}"
