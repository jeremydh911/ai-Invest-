# 🚀 Agentic Pono - Kubernetes Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Deployment](#deployment)
5. [Configuration](#configuration)
6. [Scaling](#scaling)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [GPU Support](#gpu-support)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      KUBERNETES CLUSTER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              LOAD BALANCER / INGRESS                 │  │
│  │  - External traffic routing                          │  │
│  │  - SSL/TLS termination                               │  │
│  │  - Rate limiting & DDoS protection                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │        CPU NODE (x2 - Main Application)            │    │
│  │                                                     │    │
│  │  Pod 1: agentic-pono (2 replicas)                  │    │
│  │  ├─ Container: Node.js app                         │    │
│  │  ├─ Memory: 512Mi-1Gi                              │    │
│  │  ├─ CPU: 500m-1000m                                │    │
│  │  ├─ Volumes: logs, uploads                         │    │
│  │  └─ Health checks: /api/health                     │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│          ↓ (database writes)    ↓ (cache)                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │        DATA LAYER (Stateful Services)            │      │
│  │                                                  │      │
│  │  PostgreSQL StatefulSet              Redis       │      │
│  │  ├─ Replicas: 1                      ├─ 1 Pod    │      │
│  │  ├─ Storage: 20Gi                    ├─ Memory   │      │
│  │  ├─ Port: 5432                       │  512Mi    │      │
│  │  └─ Persistence: volume               └─ RDB     │      │
│  │                                                  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        GPU NODE (Optional - ML Workloads)          │    │
│  │                                                     │    │
│  │  Pod: agentic-pono-gpu-worker                      │    │
│  │  ├─ Container: CUDA 12.2                           │    │
│  │  ├─ GPU: 1x NVIDIA (Tesla/RTX)                     │    │
│  │  ├─ Memory: 4Gi-8Gi                                │    │
│  │  ├─ CPU: 2-4 cores                                 │    │
│  │  ├─ Purpose: Voice synthesis, inference             │    │
│  │  └─ Health checks: /health, /ready                 │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         MONITORING & LOGGING                       │    │
│  │                                                     │    │
│  │  ├─ Prometheus (metrics collection)                │    │
│  │  ├─ Loki (log aggregation)                         │    │
│  │  ├─ Grafana (visualization)                        │    │
│  │  └─ AlertManager (alerting)                        │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Type | Replicas | Resources | Storage |
|-----------|------|----------|-----------|---------|
| **App (CPU)** | Deployment | 2 | 500m CPU, 512Mi RAM | - |
| **PostgreSQL** | StatefulSet | 1 | 500m CPU, 512Mi RAM | 20Gi PV |
| **Redis** | Deployment | 1 | 100m CPU, 256Mi RAM | 5Gi PV |
| **GPU Worker** | Deployment | 1 | 2 CPU, 4Gi RAM | 30Gi emptyDir |
| **Nginx Ingress** | Ingress | - | - | - |

---

## Prerequisites

### Software Requirements
- **Docker Desktop** (v4.20+) with Kubernetes enabled
- **kubectl** (v1.24+)
- **Helm** (optional, for advanced deployments)
- **Git** (for cloning repos)

### Hardware Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 30GB disk space
- **Recommended**: 8GB RAM, 4 CPU cores, 100GB disk space
- **For GPU**: NVIDIA GPU with CUDA 12.2+ support

### Network Requirements
- Port 3000 (app)
- Port 5432 (PostgreSQL)
- Port 6379 (Redis)
- Port 80/443 (Ingress)

---

## Setup Instructions

### 1. Enable Kubernetes in Docker Desktop (Windows)

1. Open Docker Desktop settings
2. Navigate to **Kubernetes** tab
3. Check "Enable Kubernetes"
4. Wait for Kubernetes to start (5-10 minutes)
5. Verify: `kubectl version`

### 2. Verify Cluster Status

```powershell
# Check cluster info
kubectl cluster-info

# Check nodes
kubectl get nodes

# Check pods
kubectl get pods --all-namespaces
```

### 3. Configure GPU Support (Optional)

#### For Docker Desktop with GPU:
```powershell
# Check for NVIDIA GPU
nvidia-smi

# Install NVIDIA Docker runtime
# (Follow NVIDIA documentation for your OS)

# Verify GPU access
docker run --rm --gpus all nvidia/cuda:12.2.2-runtime-ubuntu22.04 nvidia-smi
```

---

## Deployment

### Quick Start (PowerShell - Windows)

```powershell
# Clone or navigate to project directory
cd "c:\Users\Jerem\OneDrive\Software\AgenticEmpire\opt\agentic-empire"

# Run deployment script
powershell -ExecutionPolicy Bypass -File deploy-k8s.ps1

# Wait for all pods to be ready (2-3 minutes)
kubectl get pods -n agentic-pono -w
```

### Step-by-Step Deployment

#### Step 1: Create Namespace & Configs
```powershell
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl apply -f deploy/k8s/01-configmap.yaml
kubectl apply -f deploy/k8s/02-secrets.yaml
```

#### Step 2: Deploy Infrastructure
```powershell
kubectl apply -f deploy/k8s/03-storage.yaml
kubectl apply -f deploy/k8s/04-postgres.yaml
kubectl apply -f deploy/k8s/05-redis.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -l app=postgres -n agentic-empire --timeout=300s
```

#### Step 3: Deploy Application Services
```powershell
kubectl apply -f deploy/k8s/06-cognitive-engine.yaml
kubectl apply -f deploy/k8s/07-traffic-controller.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -l app=traffic-controller -n agentic-empire --timeout=300s
```

#### Step 4: Configure Networking
```powershell
kubectl apply -f deploy/k8s/08-ingress.yaml
```

---

## Configuration

### Environment Variables

Key environment variables in `deploy/k8s/01-configmap.yaml`:

```yaml
DATABASE_URL: "postgresql://postgres:postgres@postgres-service:5432/agentic_empire?schema=public"
REDIS_URL: "redis://redis-service:6379"
NODE_ENV: "production"
COGNITIVE_ENGINE_URL: "http://cognitive-engine:8000"
```

### Update Configuration

To change environment variables:

```powershell
# Edit ConfigMap
kubectl edit configmap app-config -n agentic-empire

# Edit Secrets
kubectl edit secret app-secrets -n agentic-empire

# Restart pods to apply changes
kubectl rollout restart deployment/traffic-controller -n agentic-empire
kubectl rollout restart deployment/cognitive-engine -n agentic-empire
```

### Database Connection String

Update if using external PostgreSQL:

```powershell
kubectl patch secret agentic-secrets -n agentic-pono \
  -p '{"data":{"DATABASE_URL":"postgresql://user:pass@host:5432/db?schema=public"}}'
```

---

## Scaling

### Horizontal Scaling (Add More Pods)

```powershell
# Scale manually
kubectl scale deployment agentic-pono -n agentic-pono --replicas=5

# Check HPA status
kubectl get hpa -n agentic-pono
kubectl describe hpa agentic-pono-hpa -n agentic-pono
```

### Resource Limits

Current resource requests/limits:

```yaml
# App Container
requests:
  cpu: 500m
  memory: 512Mi
limits:
  cpu: 1000m
  memory: 1Gi

# GPU Worker
requests:
  nvidia.com/gpu: "1"
  cpu: 2
  memory: 4Gi
limits:
  nvidia.com/gpu: "1"
  cpu: 4
  memory: 8Gi
```

Adjust in `k8s/02-app-deployment.yaml` and redeploy.

---

## Monitoring

### View Logs

```powershell
# Recent logs
kubectl logs deployment/agentic-pono -n agentic-pono --tail=100

# Stream logs
kubectl logs -f deployment/agentic-pono -n agentic-pono

# Logs from specific pod
kubectl logs <pod-name> -n agentic-pono

# Include previous logs (if pod crashed)
kubectl logs <pod-name> -n agentic-pono --previous
```

### Metrics

```powershell
# CPU and Memory usage
kubectl top nodes
kubectl top pods -n agentic-pono

# Pod resources
kubectl describe pod <pod-name> -n agentic-pono
```

### Prometheus Metrics

Access app metrics at:
```
http://localhost:3000/metrics
```

Or via port-forward:
```powershell
kubectl port-forward svc/app-service 3000:3000 -n agentic-pono
```

### Events

```powershell
# All events in namespace
kubectl get events -n agentic-pono --sort-by='.lastTimestamp'

# Watch events
kubectl get events -n agentic-pono -w
```

---

## Troubleshooting

### Pod Not Starting

```powershell
# Check pod status
kubectl describe pod <pod-name> -n agentic-pono

# Check recent events
kubectl get events -n agentic-pono --sort-by='.lastTimestamp' | tail -20

# Check logs
kubectl logs <pod-name> -n agentic-pono
kubectl logs <pod-name> -n agentic-pono --previous
```

### Database Connection Issues

```powershell
# Test PostgreSQL connectivity
kubectl exec -it deployment/agentic-pono -n agentic-pono -- \
  psql -h postgres-service -U postgres -d agentic_pono -c "SELECT 1"

# Check PostgreSQL status
kubectl describe statefulset postgres -n agentic-pono
kubectl logs postgres-0 -n agentic-pono
```

### Out of Memory

```powershell
# Check memory usage
kubectl top pods -n agentic-pono --sort-by=memory

# Increase limits
kubectl set resources deployment agentic-pono -n agentic-pono \
  --limits=memory=2Gi
  
# Or edit deployment
kubectl edit deployment agentic-pono -n agentic-pono
```

### Connectivity Issues

```powershell
# Test service DNS resolution
kubectl exec -it <pod-name> -n agentic-pono -- \
  nslookup postgres-service

# Test network policy
kubectl describe networkpolicy agentic-pono-netpol -n agentic-pono

# Temporarily disable network policy for testing
kubectl delete networkpolicy agentic-pono-netpol -n agentic-pono
```

---

## GPU Support

### Enable GPU in Kubernetes

1. **Install NVIDIA GPU Device Plugin**:
```powershell
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.13.0/nvidia-device-plugin.yml
```

2. **Label GPU Nodes**:
```powershell
kubectl label nodes <node-name> accelerator=nvidia-tesla
```

3. **Verify GPU Detection**:
```powershell
kubectl get nodes -L accelerator
kubectl describe node <gpu-node-name> | grep -A 5 "gpu"
```

### Deploy GPU Workloads

GPU worker deployment will automatically use available GPUs:

```powershell
# Check GPU allocation
kubectl describe pod <gpu-pod-name> -n agentic-pono | grep -A 5 "nvidia"

# View GPU metrics
kubectl exec <gpu-pod-name> -n agentic-pono -- nvidia-smi
```

### GPU Job Scheduling

Current setup includes:

```yaml
nodeAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    nodeSelectorTerms:
      - matchExpressions:
          - key: accelerator
            operator: In
            values:
              - nvidia-tesla
              - nvidia-rtx
              - gpu
```

---

## Load Balancing & Distribution

### Traffic Distribution

1. **Service Type**: LoadBalancer
2. **Algorithm**: Round-robin (Kubernetes default)
3. **Session Affinity**: None (stateless)

### High Availability

```yaml
# Pod Anti-Affinity spreads replicas across nodes
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - agentic-pono
          topologyKey: kubernetes.io/hostname
```

### Autoscaling

```powershell
# View HPA metrics
kubectl get hpa -n agentic-pono -w

# Manually scale
kubectl scale deployment agentic-pono -n agentic-pono --replicas=5
```

---

## Performance Tuning

### Database Optimization

```sql
-- Connect to PostgreSQL
kubectl exec -it postgres-0 -n agentic-pono -- psql -U postgres

-- Create indexes for better query performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
```

### Cache Optimization

```powershell
# View Redis info
kubectl exec redis-<pod-id> -n agentic-pono -- redis-cli INFO

# Configure Redis memory limits
kubectl exec redis-<pod-id> -n agentic-pono -- redis-cli CONFIG SET maxmemory 512mb
```

### Network Optimization

- Enable service mesh (Istio) for advanced routing
- Use local storage for frequently accessed data
- Implement caching layers

---

## Cleanup & Undeployment

```powershell
# Delete entire namespace (all resources)
kubectl delete namespace agentic-pono

# Delete specific resource
kubectl delete deployment agentic-pono -n agentic-pono

# Delete everything except namespace
kubectl delete all -n agentic-pono
```

---

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)
- [Prisma Deployment](https://www.prisma.io/docs/orm/prisma-client/deployment)
- [Redis on Kubernetes](https://github.com/bitnami/charts/tree/main/bitnami/redis)
- [NVIDIA GPU Support](https://github.com/NVIDIA/k8s-device-plugin)
