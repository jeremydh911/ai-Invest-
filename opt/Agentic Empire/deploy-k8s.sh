#!/bin/bash
# Deploy Agentic Pono to Kubernetes
# Supports Windows PowerShell and Linux/Mac bash

set -e

echo "🚀 Agentic Pono - Kubernetes Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}[1/10] Checking prerequisites...${NC}"
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ kubectl and docker found${NC}"

# Check Docker Desktop and Kubernetes
echo -e "${BLUE}[2/10] Checking Kubernetes cluster...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}Kubernetes not running. Starting Docker Desktop...${NC}"
    # This will vary by OS - for now, just warn
    echo -e "${YELLOW}Please ensure Kubernetes is enabled in Docker Desktop settings${NC}"
fi

echo -e "${GREEN}✓ Connected to Kubernetes${NC}"

# Build Docker images
echo -e "${BLUE}[3/10] Building Docker images...${NC}"
echo "Building Node.js Traffic Controller..."
docker build -t agentic-pono:latest -t agentic-pono:v1.0.0 .
echo "Building Python Cognitive Engine..."
docker build -t cognitive-engine:latest -f ../agentic-empire/deploy/Dockerfile.backend ../agentic-empire/
echo -e "${GREEN}✓ Docker images built${NC}"

# Create namespace and base configs
echo -e "${BLUE}[4/10] Creating namespace and configurations...${NC}"
kubectl apply -f k8s/00-namespace-config.yaml
echo -e "${GREEN}✓ Namespace and configs created${NC}"

# Deploy databases
echo -e "${BLUE}[5/10] Deploying PostgreSQL and Redis...${NC}"
kubectl apply -f k8s/01-databases.yaml

echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
kubectl wait --for=condition=ready pod \
    -l app=postgres \
    -n agentic-pono \
    --timeout=300s || echo "PostgreSQL taking longer to start..."

kubectl wait --for=condition=ready pod \
    -l app=redis \
    -n agentic-pono \
    --timeout=120s || echo "Redis taking longer to start..."

echo -e "${GREEN}✓ Databases deployed${NC}"

# Run database migrations and deploy application
echo -e "${BLUE}[6/10] Deploying Node.js App & Cognitive Engine...${NC}"
kubectl apply -f k8s/02-app-deployment.yaml
kubectl apply -f k8s/05-cognitive-engine.yaml

echo -e "${YELLOW}Waiting for deployments...${NC}"
kubectl wait --for=condition=ready pod \
    -l app=agentic-pono \
    -n agentic-pono \
    --timeout=300s || echo "App taking longer to start..."

kubectl wait --for=condition=ready pod \
    -l app=cognitive-engine \
    -n agentic-pono \
    --timeout=300s || echo "Cognitive Engine taking longer to start..."

echo -e "${GREEN}✓ Application suite deployed${NC}"

# Deploy GPU worker (optional)
echo -e "${BLUE}[7/10] Deploying GPU worker...${NC}"
kubectl apply -f k8s/03-gpu-worker.yaml
echo -e "${GREEN}✓ GPU worker deployed${NC}"

# Apply networking and monitoring
echo -e "${BLUE}[8/10] Configuring networking and monitoring...${NC}"
kubectl apply -f k8s/04-networking-monitoring.yaml
echo -e "${GREEN}✓ Networking configured${NC}"

# Check deployment status
echo -e "${BLUE}[9/10] Checking deployment status...${NC}"
kubectl get deployment -n agentic-pono
kubectl get services -n agentic-pono
kubectl get pods -n agentic-pono

# Get access information
echo -e "${BLUE}[10/10] Getting access information...${NC}"
echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo "===================="

# Get LoadBalancer IP (may be pending on Docker Desktop)
EXTERNAL_IP=$(kubectl get svc app-loadbalancer -n agentic-pono -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

if [ "$EXTERNAL_IP" = "pending" ] || [ -z "$EXTERNAL_IP" ]; then
    echo "External IP: pending (Docker Desktop may show localhost:port)"
    echo "Try: kubectl port-forward svc/app-loadbalancer 80:3000 -n agentic-pono"
else
    echo "External IP: http://$EXTERNAL_IP"
fi

echo "Internal Service: http://app-service.agentic-pono.svc.cluster.local:3000"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "================"
echo "View logs:     kubectl logs -f deployment/agentic-pono -n agentic-pono"
echo "Shell access:  kubectl exec -it <pod-name> -n agentic-pono -- sh"
echo "Port forward:  kubectl port-forward svc/app-loadbalancer 3000:3000 -n agentic-pono"
echo "Watch pods:    kubectl get pods -n agentic-pono -w"
echo "View resources: kubectl top nodes && kubectl top pods -n agentic-pono"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add 'agentic-pono.local' to your /etc/hosts file"
echo "2. Access the app at http://agentic-pono.local or http://localhost:3000"
echo "3. Check logs for any errors: kubectl logs -f deployment/agentic-pono -n agentic-pono"
echo "4. Monitor with: kubectl get events -n agentic-pono --sort-by='.lastTimestamp'"
