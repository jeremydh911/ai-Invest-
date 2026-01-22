###############################################################################
# LucaExpress Windows Local Deployment Script
# For development/testing on Windows
#
# Usage: powershell -ExecutionPolicy Bypass -File deploy-windows.ps1
###############################################################################

# Enable error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Phase {
    param([string]$Message)
    Write-Host "Phase: $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

Write-Header "LucaExpress Windows Deployment Script"

# ============================================================================
# Phase 1: Check Prerequisites
# ============================================================================

Write-Phase "Checking Prerequisites"

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Success "Node.js installed: $nodeVersion"
} else {
    Write-Error-Custom "Node.js not found. Please install from https://nodejs.org/"
    exit 1
}

# Check npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Success "npm installed: $npmVersion"
} else {
    Write-Error-Custom "npm not found"
    exit 1
}

Write-Host ""

# ============================================================================
# Phase 2: Install Global Dependencies
# ============================================================================

Write-Phase "Installing Global Dependencies"

# Check and install PM2
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    $pm2Version = pm2 --version
    Write-Success "PM2 already installed: $pm2Version"
} else {
    Write-Host "Installing PM2 globally..."
    npm install -g pm2 | Out-Null
    Write-Success "PM2 installed"
}

Write-Host ""

# ============================================================================
# Phase 3: Navigate to Project
# ============================================================================

Write-Phase "Setting Up Project Directory"

$projectPath = "c:\Users\Jerem\OneDrive\Software\LucaExpress 2nd\opt\luca-express"

if (Test-Path $projectPath) {
    Write-Success "Project directory found: $projectPath"
    Set-Location $projectPath
} else {
    Write-Error-Custom "Project directory not found: $projectPath"
    exit 1
}

Write-Host ""

# ============================================================================
# Phase 4: Install Node Dependencies
# ============================================================================

Write-Phase "Installing Node Dependencies"

if (Test-Path "package.json") {
    Write-Host "Running 'npm install'..."
    npm install --quiet
    Write-Success "Dependencies installed"
} else {
    Write-Error-Custom "package.json not found"
    exit 1
}

Write-Host ""

# ============================================================================
# Phase 5: Initialize Database
# ============================================================================

Write-Phase "Initializing Database"

if (Test-Path "setup-database.js") {
    Write-Host "Setting up database..."
    node setup-database.js
    Write-Success "Database initialized"
} else {
    Write-Warning "setup-database.js not found - skipping"
}

Write-Host ""

# ============================================================================
# Phase 6: Create Logs Directory
# ============================================================================

Write-Phase "Creating Logs Directory"

if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

Write-Success "Logs directory ready: $projectPath\logs"

Write-Host ""

# ============================================================================
# Phase 7: Configure Environment
# ============================================================================

Write-Phase "Configuring Environment"

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..."
    
    $envContent = @"
# LucaExpress Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# GPU Configuration (disabled on Windows)
ENABLE_GPU=false

# LLM Configuration
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.7

# Database
DB_PATH=./data
DATABASE_URL=sqlite:///./data/companies.db

# Performance
MAX_CONCURRENT_REQUESTS=64
CONNECTION_POOL_SIZE=32
CACHE_SIZE_MB=2048
WORKER_THREADS=8

# RAG Configuration
RAG_CHUNK_SIZE=1024
RAG_OVERLAP=100
RAG_SIMILARITY_THRESHOLD=0.7
RAG_RETRIEVAL_COUNT=5

# Security
HTTPS=true
CERT_PATH=./certs/certificate.pem
KEY_PATH=./certs/private-key.pem
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success ".env file created"
    Write-Host ""
    Write-Warning "Edit .env file to customize settings"
} else {
    Write-Host ".env file already exists - not overwriting"
}

Write-Host ""

# ============================================================================
# Phase 8: Check for SSL Certificates
# ============================================================================

Write-Phase "Checking SSL Certificates"

if ((Test-Path "certs\certificate.pem") -and (Test-Path "certs\private-key.pem")) {
    Write-Success "SSL certificates found"
} else {
    Write-Warning "SSL certificates not found. Generating..."
    if (Test-Path "generate-certs.js") {
        node generate-certs.js
        Write-Success "SSL certificates generated"
    } else {
        Write-Error-Custom "generate-certs.js not found"
    }
}

Write-Host ""

# ============================================================================
# Phase 9: Start Services with PM2
# ============================================================================

Write-Phase "Starting Services with PM2"

# Check if already running
$pm2List = pm2 list 2>$null
if ($pm2List -match "luca-express") {
    Write-Host "Services already running. Reloading..."
    pm2 reload ecosystem.config.js 2>&1 | Out-Null
    Write-Success "Services reloaded"
} else {
    if (Test-Path "ecosystem.config.js") {
        Write-Host "Starting services..."
        pm2 start ecosystem.config.js 2>&1 | Out-Null
        Write-Success "Services started with PM2"
    } else {
        Write-Warning "ecosystem.config.js not found. Starting with npm instead..."
        Write-Host "Run 'npm start' to start the server"
    }
}

Write-Host ""

# ============================================================================
# Phase 10: Display Status
# ============================================================================

Write-Header "Deployment Complete!"

Write-Host "Service Status:"
Write-Host ""
pm2 status

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check service status:   pm2 monit"
Write-Host "  2. View logs:              pm2 logs"
Write-Host "  3. Test API:               curl http://localhost:3000/health"
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Reload config:             pm2 reload ecosystem.config.js"
Write-Host "  Restart services:          pm2 restart all"
Write-Host "  View specific logs:        pm2 logs luca-express-api"
Write-Host "  Stop services:             pm2 stop all"
Write-Host "  Delete from PM2:           pm2 delete all"
Write-Host ""

Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "  Health:   https://localhost:3000/health"
Write-Host "  API Base: https://localhost:3000/api"
Write-Host ""

Write-Success "Windows deployment ready!"
Write-Host ""
Write-Host "To access the web UI, open: https://localhost:3000" -ForegroundColor Cyan
