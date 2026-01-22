# LucaExpress Advanced Features - Quick Start Guide

## 🚀 What's New

Your LucaExpress system now has 5 major new features:

1. **Auto-Approval System** - Automatically approve chat actions with configurable risk thresholds
2. **Data Loss Prevention (DLP)** - Prevents sensitive data from leaving your environment
3. **Local LLM Support** - Use Ollama + Llama3 locally, fall back to cloud
4. **Agent Autonomy** - Agents can self-direct and ask "What should I do next?"
5. **Fine-Tuning Setup** - Train custom LLM models with your own data

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Start the Server

```bash
# Navigate to the app directory
cd "C:\Users\Jerem\OneDrive\Software\AgenticEmpire\opt\agentic-empire"

# Start Node.js server
npm start
# Server runs at http://localhost:3000
```

### Step 2: Test the System

```powershell
# Run the verification script (PowerShell)
.\run-tests.ps1

# Or bash if you have WSL/Git Bash
bash ../../../run-tests.sh
```

### Step 3: Access New Pages

Open in your browser:

| Page | URL | Purpose |
|------|-----|---------|
| Advanced Settings | http://localhost:3000/settings-advanced.html | Configure all features |
| Fine-Tuning Setup | http://localhost:3000/finetuning-setup.html | Train custom LLM |
| Agent Autonomy | http://localhost:3000/agent-autonomy.html | Set autonomous hours |

---

## ⚙️ Feature Configuration

### Auto-Approval Settings

**Navigate to:** Advanced Settings → Auto-Approval

```json
{
  "enabled": true,
  "thresholds": {
    "low_risk": 0,        // Auto-approve
    "medium_risk": 1,     // Require 1 approval
    "high_risk": 2        // Require 2 approvals
  },
  "approval_chain": "single",  // "single", "dual", or "triple"
  "bypass_level": "admin"       // Only admin can bypass
}
```

**How it works:**
1. Chat action is submitted
2. System calculates risk score (0-3)
3. If score ≤ threshold → Auto-approve
4. If score > threshold → Queue for approval
5. Action executes after approval
6. All decisions logged to audit trail

### DLP (Data Loss Prevention)

**Navigate to:** Advanced Settings → DLP Policies

```json
{
  "enabled": true,
  "policy": "strict",  // "strict", "moderate", "relaxed", or "custom"
  "detection_rules": [
    "ssn",           // Social Security Numbers
    "credit_card",   // Credit card numbers
    "email",         // Email addresses
    "phone",         // Phone numbers
    "api_key",       // API keys and tokens
    "password",      // Passwords in plaintext
    "customer_id",   // Customer identifiers
    "api_credentials" // Auth credentials
  ],
  "action": "mask"  // "mask", "remove", "redact", "encrypt"
}
```

**What it detects:**
- SSN: `123-45-6789`
- Credit Cards: `4532-1234-5678-9010`
- Emails: `user@example.com`
- Phone: `555-123-4567`
- API Keys: `sk_live_...`
- Passwords: `password=secret123`
- Customer IDs: `customer_id=ABC123`

**Important:** Every chat message is automatically scanned before going to the LLM!

### Local LLM with Ollama

**Prerequisites:**
```bash
# Download Ollama from https://ollama.ai
# Install and run Ollama
ollama pull llama2  # or llama3, mistral, etc
```

**Navigate to:** Advanced Settings → Ollama LLM Setup

```json
{
  "ollama_enabled": true,
  "ollama_url": "http://localhost:11434",
  "model": "llama2",  // "llama2", "llama3", "mistral", etc
  "fallback_to_openai": true,
  "timeout_ms": 5000
}
```

**How it works:**
1. When you chat, system tries Ollama first (local, fast, private)
2. If Ollama times out or errors → Falls back to OpenAI (cloud)
3. All prompts sanitized through DLP before going to either LLM
4. System automatically selects fastest available LLM

### Agent Autonomy

**Navigate to:** Advanced Settings → Agent Autonomy

```json
{
  "enabled": true,
  "agents": {
    "ceo": {
      "autonomy_enabled": true,
      "autonomous_hours": {
        "start": 9,
        "end": 17,
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "proactivity_level": 7,  // 1-10, higher = more proactive
      "max_actions_per_hour": 5,
      "require_approval": false
    },
    "cto": {
      "autonomy_enabled": true,
      "autonomous_hours": {
        "start": 0,
        "end": 24,
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      },
      "proactivity_level": 9,
      "max_actions_per_hour": 10,
      "require_approval": false
    }
  }
}
```

**What agents do:**
- Every 30 seconds: Query their RAG memory and LLM context
- Ask themselves: "What should I do next?"
- LLM responds with decision based on context
- Agent executes action (within limits)
- Decision is logged and added to RAG memory
- System learns from decisions over time

### Fine-Tuning Setup

**Navigate to:** http://localhost:3000/finetuning-setup.html

```json
{
  "base_model": "llama2",
  "dataset": "training_data.json",
  "hyperparameters": {
    "learning_rate": 2e-5,
    "num_epochs": 3,
    "batch_size": 4,
    "validation_split": 0.1
  },
  "huggingface_token": "hf_xxxxx...",
  "upload_to_hub": true
}
```

**Dataset format (JSON):**
```json
[
  {
    "instruction": "What is machine learning?",
    "input": "",
    "output": "Machine learning is a type of artificial intelligence..."
  },
  {
    "instruction": "Explain neural networks",
    "input": "What are the layers?",
    "output": "Neural networks have multiple layers..."
  }
]
```

---

## 🧪 API Endpoints

### Auto-Approval APIs

```javascript
// Get current auto-approval settings
GET /api/auto-approve/settings

// Update auto-approval settings
POST /api/auto-approve/settings
Body: { enabled: true, thresholds: {...} }

// View approval history
GET /api/auto-approve/history

// Admin override (bypass approval requirement)
POST /api/auto-approve/override
Body: { actionId: "abc123", reason: "Emergency override" }
```

### DLP APIs

```javascript
// Scan text for sensitive data
POST /api/dlp/scan
Body: { text: "My SSN is 123-45-6789" }
Response: { violations: [{type: "ssn", text: "123-45-6789"}] }

// Get DLP policies
GET /api/dlp/policies

// Update DLP policy
PUT /api/dlp/policies/strict
Body: { rules: ["ssn", "credit_card"], action: "mask" }

// View DLP violations log
GET /api/dlp/audit
```

### Ollama LLM APIs

```javascript
// List available Ollama models
GET /api/ollama/models

// Switch to different model
POST /api/ollama/models/select
Body: { model: "mistral" }

// Test Ollama connection
POST /api/ollama/test
Response: { status: "connected", latency: 45 }

// Chat using local LLM
POST /api/ollama/chat
Body: { messages: [{role: "user", content: "Hello"}] }
Response: { reply: "Hi there!" }
```

### Agent Autonomy APIs

```javascript
// Configure agent autonomy
POST /api/agents/autonomy/config
Body: {
  agent_id: "ceo",
  autonomy_enabled: true,
  autonomous_hours: { start: 9, end: 17 }
}

// Get agent autonomy status
GET /api/agents/ceo/autonomy-status

// Trigger agent decision ("What should I do next?")
POST /api/agents/ceo/decide-next
Response: { decision: "Send quarterly report", confidence: 0.92 }

// Get agent's RAG memory context
GET /api/agents/ceo/memory/rag
Response: { recent_context: [...], patterns: [...] }

// View agent proactivity score
GET /api/agents/ceo/autonomy-stats
Response: { proactivity_score: 7.5, actions_initiated: 14 }
```

### Fine-Tuning APIs

```javascript
// List available base models
GET /api/finetuning/models

// Upload training dataset
POST /api/finetuning/datasets/upload
Body: multipart form data with JSON file

// Start fine-tuning job
POST /api/finetuning/jobs
Body: {
  base_model: "llama2",
  dataset_id: "123",
  learning_rate: 2e-5,
  epochs: 3
}
Response: { job_id: "ft_abc123", status: "queued" }

// Check training progress
GET /api/finetuning/jobs/ft_abc123
Response: { status: "training", progress: 45, eta_seconds: 3600 }

// Download fine-tuned model
GET /api/finetuning/jobs/ft_abc123/model

// Push to HuggingFace Hub
POST /api/finetuning/jobs/ft_abc123/push-hub
Body: { hf_token: "...", repo_name: "my-llama-custom" }
```

---

## 📊 Testing

### Run All Tests

```bash
# PowerShell (Windows)
.\run-tests.ps1

# Bash (WSL/Git Bash)
bash run-tests.sh

# Node.js test suite
node test-suite.js --all
```

### Run Specific Test Category

```bash
# Test specific feature
node test-suite.js --dlp
node test-suite.js --auto-approval
node test-suite.js --ollama
node test-suite.js --agent-autonomy
node test-suite.js --compliance
```

### Manual Testing Checklist

- [ ] Settings page loads (http://localhost:3000/settings)
- [ ] Advanced settings page loads
- [ ] Can enable/disable auto-approval
- [ ] Can change DLP policy
- [ ] Can select local LLM (if Ollama running)
- [ ] Can configure agent autonomy
- [ ] Chat works with auto-approval
- [ ] DLP blocks SSN in chat
- [ ] Fine-tuning page loads
- [ ] All pages responsive on mobile

---

## 🔒 Security Notes

### What's Protected by DLP

Your system now prevents these from going to ANY LLM:
- ✅ Social Security Numbers
- ✅ Credit Card Numbers
- ✅ API Keys and Tokens
- ✅ Passwords and Credentials
- ✅ Customer IDs
- ✅ Email Addresses
- ✅ Phone Numbers
- ✅ And 3+ custom patterns

### How DLP Works

```
User Input → DLP Scan → Detects PII?
   ↓
   ├─ YES → Sanitize (mask/remove/encrypt) → LLM
   └─ NO → Pass through → LLM
```

### Auto-Approval Security

```
Chat Action → Calculate Risk Score (0-3)
   ↓
   ├─ Low Risk (score ≤ threshold) → Auto-approve
   ├─ Medium Risk → Wait for 1 approval
   ├─ High Risk → Wait for 2 approvals
   └─ ALL → Log to audit trail
```

---

## 📈 Performance Tips

### Ollama Optimization

```bash
# Use quantized models for faster inference
ollama pull llama2:13b-q4_0  # Much faster than full size

# Increase context window
OLLAMA_NUM_THREAD=8 ollama serve

# Monitor performance
curl http://localhost:11434/api/ps  # Shows running models
```

### DLP Optimization

- Strict policy = slower (checks every pattern)
- Moderate policy = balanced
- Relaxed policy = faster (only checks credentials)

### Agent Autonomy Tuning

```javascript
// Adjust decision frequency
decision_interval: 30000  // Check every 30s (default)

// Limit proactive actions
max_actions_per_hour: 5  // Prevents runaway behavior

// Require approval for sensitive actions
require_approval: true  // For CEO/CFO roles
```

---

## 🐛 Troubleshooting

### Ollama Not Connecting

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not found, start Ollama
ollama serve

# Test model
ollama run llama2 "Hello"
```

### DLP Blocking Legitimate Content

- Change policy from "strict" to "moderate"
- Add to whitelist (if safe patterns)
- Use custom policy with fewer rules

### Agent Autonomy Not Triggering

- Check if autonomy is enabled for agent
- Check if within autonomous hours
- Check logs for errors
- Ensure RAG memory has context

### Fine-Tuning Errors

- Verify JSON dataset format
- Check file size (keep under 1GB)
- Ensure HuggingFace token is valid
- Check disk space for model

---

## 📚 Configuration Files

### Main Configuration

Location: `config-advanced.js`

```javascript
// Import in any module
const config = require('./config-advanced.js');

// Access settings
config.AUTO_APPROVAL_CONFIG.enabled
config.DLP_CONFIG.policy
config.OLLAMA_CONFIG.model
config.AGENT_AUTONOMY_CONFIG.decision_interval
config.FINETUNING_CONFIG.max_dataset_size
```

---

## 🎯 Next Steps

1. **Test Everything** → Run `.\run-tests.ps1`
2. **Read DLP Patterns** → Review `backend/dlp-engine.js`
3. **Configure Agents** → Open `settings-advanced.html`
4. **Enable Ollama** → Install from https://ollama.ai
5. **Fine-Tune Model** → Visit `finetuning-setup.html`
6. **Monitor Operations** → Check dashboard for audit logs

---

## 📞 Support

### Common Issues

**Q: DLP is blocking everything**
A: Change policy to "moderate" or "relaxed"

**Q: Ollama not working**
A: Make sure it's running with `ollama serve`

**Q: Agent autonomy not deciding**
A: Check if within autonomous hours and autonomy enabled

**Q: Fine-tuning is slow**
A: Use quantized model (e.g., llama2:13b-q4_0)

**Q: Can't connect to local LLM**
A: System falls back to OpenAI automatically

---

## 🚀 You're Ready!

Your system is now configured with:
- ✅ Auto-approval for chat actions
- ✅ DLP preventing data leakage
- ✅ Local LLM support with fallback
- ✅ Agent autonomy with self-direction
- ✅ Fine-tuning for custom models
- ✅ Comprehensive testing framework
- ✅ Audit logging for compliance

Start the server and visit http://localhost:3000 to begin!

---

**Last Updated:** $(date)
**Version:** 2.0
**Status:** Production Ready ✅
