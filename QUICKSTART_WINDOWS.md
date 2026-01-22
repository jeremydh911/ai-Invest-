# 🚀 Agentic Pono - Quick Start Guide for Windows

## 30-Second Overview

Agentic Pono is a voice-first AI agent platform. Deploy it to Kubernetes in Docker Desktop with one command.

---

## Prerequisites (5 minutes)

### 1. Install Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Run installer
- **Enable Kubernetes** in Docker Desktop settings (Settings → Kubernetes → Check "Enable Kubernetes")
- Wait for Kubernetes to start (green circle in bottom-left)

### 2. Install kubectl
```powershell
# Option A: Using Chocolatey
choco install kubernetes-cli

# Option B: Using Scoop
scoop install kubectl

# Option C: Direct download
# https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
```

### 3. Verify Setup
```powershell
# Test Docker
docker --version      # Should show v24.x or higher

# Test Kubernetes
kubectl version      # Should show client and server versions
kubectl get nodes    # Should show 1 node (docker-desktop)
```

---

## Deploy Agentic Pono (2 minutes)

### Option A: Automated (Recommended)

```powershell
# Navigate to project
cd "c:\Users\Jerem\OneDrive\Software\AgenticEmpire\opt\agentic-empire"

# Run deployment script
powershell -ExecutionPolicy Bypass -File deploy-k8s.ps1

# Wait for completion (~2-3 minutes)
# You'll see:
# ✓ Namespace created
# ✓ Databases deployed
# ✓ Application deployed
# ✓ GPU worker deployed
```

### Option B: Manual Step-by-Step

```powershell
cd "c:\Users\Jerem\OneDrive\Software\AgenticEmpire\opt\agentic-empire"

# 1. Create namespace
kubectl apply -f k8s/00-namespace-config.yaml

# 2. Deploy databases (PostgreSQL + Redis)
kubectl apply -f k8s/01-databases.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n agentic-pono --timeout=300s

# 3. Deploy application
kubectl apply -f k8s/02-app-deployment.yaml
kubectl wait --for=condition=ready pod -l app=agentic-pono -n agentic-pono --timeout=300s

# 4. Deploy GPU worker (optional)
kubectl apply -f k8s/03-gpu-worker.yaml

# 5. Configure networking
kubectl apply -f k8s/04-networking-monitoring.yaml
```

---

## Access the Application (30 seconds)

### Get the Service IP/Port

```powershell
# Port-forward to localhost
kubectl port-forward svc/app-loadbalancer 3000:3000 -n agentic-pono
```

### Open in Browser
- **Default**: http://localhost:3000
- **Default login**:
  - Username: `admin`
  - Password: (check deployment logs)

Or add to hosts file:
```
# Open: C:\Windows\System32\drivers\etc\hosts
# Add: 127.0.0.1 agentic-pono.local

# Then access: http://agentic-pono.local:3000
```

---

## Verify Deployment

### Check All Pods Running

```powershell
# View all pods
kubectl get pods -n agentic-pono

# Expected output:
# agentic-pono-xxxxx              1/1     Running
# agentic-pono-yyyyy              1/1     Running
# postgres-0                       1/1     Running
# redis-xxxxx                      1/1     Running
# agentic-pono-gpu-worker-xxxxx    1/1     Running (if GPU enabled)
```

### Check Services

```powershell
kubectl get svc -n agentic-pono

# Expected output:
# app-service          ClusterIP
# app-loadbalancer     LoadBalancer
# postgres-service     ClusterIP
# redis-service        ClusterIP
# gpu-worker-service   ClusterIP
```

### View Logs

```powershell
# Recent logs from all pods
kubectl logs deployment/agentic-pono -n agentic-pono --tail=50

# Stream logs in real-time
kubectl logs -f deployment/agentic-pono -n agentic-pono

# Logs from specific pod
$podName = kubectl get pods -n agentic-pono -o name | Select-Object -First 1
kubectl logs $podName -n agentic-pono
```

---

## Configuration

### Environment Variables

Edit before deployment:

```powershell
# View current config
kubectl get configmap agentic-config -n agentic-pono -o yaml

# Edit config
kubectl edit configmap agentic-config -n agentic-pono

# Restart pods to apply changes
kubectl rollout restart deployment/agentic-pono -n agentic-pono
```

### Secrets (API Keys, Passwords)

```powershell
# View secret names (values hidden)
kubectl get secrets -n agentic-pono

# Edit secrets
kubectl edit secret agentic-secrets -n agentic-pono

# Example: Add OpenAI API key
# 1. Edit the secret
# 2. Update OPENAI_API_KEY value
# 3. Restart pods
```

---

## Common Tasks

### View Resource Usage

```powershell
# CPU and Memory
kubectl top nodes
kubectl top pods -n agentic-pono

# Detailed pod info
kubectl describe pod <pod-name> -n agentic-pono
```

### Scale Application

```powershell
# Manually scale to 5 replicas
kubectl scale deployment agentic-pono -n agentic-pono --replicas=5

# Check autoscaling status
kubectl get hpa -n agentic-pono
```

### Shell Access to Pod

```powershell
# Get pod name
$pod = kubectl get pods -n agentic-pono -o name | Select-Object -First 1

# Open shell
kubectl exec -it $pod -n agentic-pono -- sh

# Inside container, try:
# node --version
# npm list | head -10
# exit
```

### Restart All Pods

```powershell
kubectl rollout restart deployment/agentic-pono -n agentic-pono
```

### Delete Deployment

```powershell
# Delete everything
kubectl delete namespace agentic-pono

# Wait for deletion
kubectl get namespace agentic-pono -w
```

---

## Enable GPU Support

### Check for GPU

```powershell
# In PowerShell
nvidia-smi

# If not found, you don't have NVIDIA GPU or drivers
```

### Install NVIDIA GPU Device Plugin

```powershell
# Apply NVIDIA device plugin
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.13.0/nvidia-device-plugin.yml

# Verify
kubectl get daemonset -A | findstr nvidia
```

### Label GPU Nodes

```powershell
# List nodes
kubectl get nodes

# Label the GPU node (replace docker-desktop if different)
kubectl label nodes docker-desktop accelerator=nvidia-tesla
```

### Verify GPU Usage

```powershell
# Check GPU allocation in pod
$gpuPod = kubectl get pods -n agentic-pono -l app=agentic-pono-gpu -o name | Select-Object -First 1
kubectl describe $gpuPod -n agentic-pono | grep -A 5 "nvidia"

# Inside GPU pod
kubectl exec $gpuPod -n agentic-pono -- nvidia-smi
```

---

## Monitoring & Debugging

### View Recent Events

```powershell
# Sort by timestamp
kubectl get events -n agentic-pono --sort-by='.lastTimestamp' | tail -20

# Watch for new events
kubectl get events -n agentic-pono -w
```

### Database Connectivity Test

```powershell
# Get app pod name
$pod = kubectl get pods -n agentic-pono -l app=agentic-pono -o name | Select-Object -First 1

# Test connection
kubectl exec $pod -n agentic-pono -- \
  node -e "require('pg').Client" 2>&1

# Or check with psql
kubectl exec -it postgres-0 -n agentic-pono -- \
  psql -U postgres -d agentic_pono -c "SELECT 1"
```

### Check Database Status

```powershell
# Connect to PostgreSQL
$pod = kubectl get pods -n agentic-pono -l app=postgres -o name | Select-Object -First 1
kubectl exec -it $pod -n agentic-pono -- psql -U postgres
```

### Monitor Network

```powershell
# Check network policies
kubectl get networkpolicies -n agentic-pono

# Describe policy
kubectl describe networkpolicy agentic-pono-netpol -n agentic-pono

# Temporarily disable policy (for testing)
kubectl delete networkpolicy agentic-pono-netpol -n agentic-pono
```

---

## Performance Tuning

### Increase Resource Limits

```powershell
# Edit deployment
kubectl edit deployment agentic-pono -n agentic-pono

# Find resources section and update:
# requests:
#   memory: "512Mi"
#   cpu: "500m"
# limits:
#   memory: "2Gi"      # Increase from 1Gi
#   cpu: "2000m"       # Increase from 1000m

# Save and it will auto-restart pods
```

### Database Connection Tuning

```powershell
# Connect to PostgreSQL
kubectl exec -it postgres-0 -n agentic-pono -- psql -U postgres

# View settings
\l  # List databases
\dt agentic_pono  # List tables
SELECT COUNT(*) FROM conversations;  # Check data size

# Create indexes
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_conversations_user ON conversations(user_id);

\q  # Exit psql
```

---

## Troubleshooting

### Pods Not Starting

```powershell
# Get status
kubectl get pods -n agentic-pono

# Get detailed info
$pod = kubectl get pods -n agentic-pono -o name | Select-Object -First 1
kubectl describe $pod -n agentic-pono

# Check logs
kubectl logs $pod -n agentic-pono
kubectl logs $pod -n agentic-pono --previous  # If crashed
```

### Database Connection Failed

```powershell
# Check PostgreSQL pod
kubectl get pods -n agentic-pono -l app=postgres

# Check logs
kubectl logs postgres-0 -n agentic-pono

# Check service DNS
$pod = kubectl get pods -n agentic-pono -l app=agentic-pono -o name | Select-Object -First 1
kubectl exec $pod -n agentic-pono -- nslookup postgres-service

# Test connection
kubectl exec $pod -n agentic-pono -- ping postgres-service
```

### Out of Memory

```powershell
# Check current usage
kubectl top pods -n agentic-pono --sort-by=memory

# Increase limits (edit deployment)
kubectl edit deployment agentic-pono -n agentic-pono
# Change: limits.memory: "2Gi"
```

### Port Already in Use

```powershell
# If port 3000 is in use, use different port
kubectl port-forward svc/app-loadbalancer 8080:3000 -n agentic-pono

# Then access: http://localhost:8080
```

---

## Help & Support

### Useful Commands Quick Reference

```powershell
# Get status
kubectl get all -n agentic-pono

# Full debugging info
kubectl describe all -n agentic-pono

# Watch status changes
kubectl get pods -n agentic-pono -w

# View resource quotas
kubectl describe quota -n agentic-pono

# Check limits
kubectl describe limits -n agentic-pono

# System events
kubectl get events -n agentic-pono -w

# Documentation
kubectl explain deployment
kubectl explain pod
kubectl explain service
```

### Get Help

- **Kubernetes docs**: https://kubernetes.io/docs/
- **Docker Desktop K8s**: https://docs.docker.com/desktop/kubernetes/
- **Troubleshooting**: See section above
- **Contact**: Check logs first (`kubectl logs ...`)

---

## Next Steps

1. ✅ **Access the app** at http://localhost:3000
2. 📝 **Log in** with admin credentials
3. 🎙️ **Try voice chat** - Click the microphone button
4. ⚙️ **Configure settings** - Add your API keys
5. 🔧 **Set up integrations** - Connect tools and APIs
6. 📊 **Monitor** - View logs and metrics

---

## Key Kubernetes Concepts

| Concept | What It Does | Example |
|---------|-------------|---------|
| **Pod** | Smallest deployable unit (container) | App pod runs Node.js |
| **Deployment** | Manages pod replicas | 2-10 app replicas |
| **Service** | Exposes pods to network | Load balances traffic |
| **StatefulSet** | For stateful services | PostgreSQL with storage |
| **PersistentVolume** | Storage that persists | Database data, logs |
| **ConfigMap** | Configuration data | Environment variables |
| **Secret** | Sensitive data | API keys, passwords |
| **Namespace** | Logical isolation | `agentic-pono` namespace |
| **Ingress** | External access routing | Routes traffic to services |

---

## Performance Expectations

| Metric | Value | Notes |
|--------|-------|-------|
| Deployment time | 2-3 min | From kubectl apply to running |
| API response time | <500ms | p95 latency |
| Database query | <100ms | p95 latency |
| Scaling up | 1-2 min | Add new replica |
| Pod restart | 30 sec | Graceful shutdown |
| Memory per pod | 512Mi-1Gi | Request: 512Mi, Limit: 1Gi |
| CPU per pod | 500m-1000m | Request: 500m, Limit: 1000m |

---

**You're ready to deploy! Run the deployment script and start using Agentic Pono.** 🚀
