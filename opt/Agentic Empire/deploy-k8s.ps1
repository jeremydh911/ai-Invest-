# Deploy Agentic Pono to Kubernetes on Windows
# Run with: powershell -ExecutionPolicy Bypass -File deploy-k8s.ps1

param(
    [string]$Action = "deploy",
    [string]$ImageTag = "latest"
)

# Colors
$colors = @{
    Reset = "`e[0m"
    Green = "`e[32m"
    Red = "`e[31m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
}

function Write-Status {
    param([string]$Message, [string]$Color = "Blue")
    Write-Host $colors.$Color + $Message + $colors.Reset
}

function Write-Success {
    param([string]$Message)
    Write-Status "✓ $Message" "Green"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Status "✗ $Message" "Red"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Status "⚠ $Message" "Yellow"
}

Write-Status "🚀 Agentic Pono - Kubernetes Deployment (Windows)" "Blue"
Write-Status "================================================" "Blue"
Write-Host ""

# Check prerequisites
Write-Status "[1/10] Checking prerequisites..." "Blue"

$prerequisites = @("kubectl", "docker")
foreach ($cmd in $prerequisites) {
    try {
        $null = & $cmd --version 2>&1
        Write-Success "$cmd found"
    }
    catch {
        Write-Error-Custom "$cmd not found. Please install it first."
        exit 1
    }
}

# Check Kubernetes cluster
Write-Status "[2/10] Checking Kubernetes cluster..." "Blue"
try {
    $clusterInfo = & kubectl cluster-info 2>&1
    Write-Success "Connected to Kubernetes cluster"
}
catch {
    Write-Warning-Custom "Could not connect to Kubernetes. Ensure Docker Desktop is running with K8s enabled"
}

# Build Docker image
Write-Status "[3/10] Building Docker image..." "Blue"
Write-Host "docker build -t agentic-pono:$ImageTag ."
try {
    & docker build -t "agentic-pono:$ImageTag" -t "agentic-pono:v1.0.0" . 2>&1 | Select-Object -Last 5
    Write-Success "Docker image built"
}
catch {
    Write-Error-Custom "Failed to build Docker image: $_"
    exit 1
}

# Create namespace
Write-Status "[4/10] Creating namespace and configurations..." "Blue"
try {
    & kubectl apply -f k8s/00-namespace-config.yaml 2>&1 | Select-Object -Last 3
    Write-Success "Namespace and configurations created"
}
catch {
    Write-Error-Custom "Failed to create namespace: $_"
    exit 1
}

# Deploy databases
Write-Status "[5/10] Deploying PostgreSQL and Redis..." "Blue"
try {
    & kubectl apply -f k8s/01-databases.yaml 2>&1 | Select-Object -Last 3
    Write-Success "Database manifests applied"
}
catch {
    Write-Error-Custom "Failed to deploy databases: $_"
    exit 1
}

Write-Warning-Custom "Waiting for databases to be ready (this may take 2-3 minutes)..."
Start-Sleep -Seconds 10

# Deploy app
Write-Status "[6/10] Deploying application..." "Blue"
try {
    & kubectl apply -f k8s/02-app-deployment.yaml 2>&1 | Select-Object -Last 3
    Write-Success "Application manifests applied"
}
catch {
    Write-Error-Custom "Failed to deploy application: $_"
    exit 1
}

# Wait for app to be ready
Write-Warning-Custom "Waiting for application pods to be ready..."
$maxRetries = 30
$retryCount = 0
while ($retryCount -lt $maxRetries) {
    $ready = & kubectl get deployment agentic-pono -n agentic-pono -o jsonpath='{.status.readyReplicas}' 2>&1
    if ($ready -eq "2") {
        Write-Success "Application ready"
        break
    }
    $retryCount++
    Start-Sleep -Seconds 5
    if ($retryCount % 6 -eq 0) {
        Write-Host "Waiting... ($retryCount/30 checks)"
    }
}

# Deploy GPU worker
Write-Status "[7/10] Deploying GPU worker..." "Blue"
try {
    & kubectl apply -f k8s/03-gpu-worker.yaml 2>&1 | Select-Object -Last 3
    Write-Success "GPU worker deployed"
}
catch {
    Write-Error-Custom "Failed to deploy GPU worker (non-fatal): $_"
}

# Configure networking
Write-Status "[8/10] Configuring networking and monitoring..." "Blue"
try {
    & kubectl apply -f k8s/04-networking-monitoring.yaml 2>&1 | Select-Object -Last 3
    Write-Success "Networking configured"
}
catch {
    Write-Warning-Custom "Networking configuration partially failed (might be missing monitoring)"
}

# Show deployment status
Write-Status "[9/10] Checking deployment status..." "Blue"
Write-Host ""
Write-Host "=== Deployments ===" -ForegroundColor Cyan
& kubectl get deployment -n agentic-pono | Format-Table

Write-Host ""
Write-Host "=== Services ===" -ForegroundColor Cyan
& kubectl get services -n agentic-pono | Format-Table

Write-Host ""
Write-Host "=== Pods ===" -ForegroundColor Cyan
& kubectl get pods -n agentic-pono | Format-Table

# Final information
Write-Status "[10/10] Deployment complete!" "Blue"
Write-Host ""

Write-Status "ACCESS INFORMATION:" "Blue"
Write-Status "==================" "Blue"

# Try to get external IP
try {
    $externalIP = & kubectl get svc app-loadbalancer -n agentic-pono -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>&1
    if ($externalIP) {
        Write-Host "External IP: $externalIP"
    }
    else {
        Write-Host "External IP: pending (Docker Desktop may show localhost:port)"
        Write-Host "Use port-forward: kubectl port-forward svc/app-loadbalancer 80:3000 -n agentic-pono"
    }
}
catch {
    Write-Host "Could not determine external IP"
}

Write-Host ""
Write-Status "USEFUL COMMANDS:" "Blue"
Write-Status "================" "Blue"
Write-Host "View logs:"
Write-Host "  kubectl logs -f deployment/agentic-pono -n agentic-pono"
Write-Host ""
Write-Host "Shell access:"
Write-Host "  kubectl exec -it (kubectl get pods -n agentic-pono -o name | Select-Object -First 1) -n agentic-pono -- sh"
Write-Host ""
Write-Host "Port forward:"
Write-Host "  kubectl port-forward svc/app-loadbalancer 3000:3000 -n agentic-pono"
Write-Host ""
Write-Host "Watch pods:"
Write-Host "  kubectl get pods -n agentic-pono -w"
Write-Host ""
Write-Host "View resource usage:"
Write-Host "  kubectl top nodes"
Write-Host "  kubectl top pods -n agentic-pono"
Write-Host ""

Write-Status "NEXT STEPS:" "Yellow"
Write-Status "1. Add 'agentic-pono.local' to your Windows hosts file (C:\Windows\System32\drivers\etc\hosts)" "Yellow"
Write-Status "2. Access at http://agentic-pono.local or http://localhost:3000" "Yellow"
Write-Status "3. Check logs for errors: kubectl logs -f deployment/agentic-pono -n agentic-pono" "Yellow"
Write-Status "4. Monitor with: kubectl get events -n agentic-pono --sort-by='.lastTimestamp'" "Yellow"
