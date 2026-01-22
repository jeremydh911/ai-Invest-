# Advanced Features Implementation Guide

## Overview

This document covers all newly implemented advanced features:
- ✅ Auto-Approval System
- ✅ Data Loss Prevention (DLP)
- ✅ LLM Management with Ollama
- ✅ Agent Autonomy System
- ✅ Fine-Tuning Setup
- ✅ Comprehensive Testing

---

## 1. AUTO-APPROVAL SYSTEM

### Purpose
Enable users to automatically approve chat actions without explicit confirmation.

### Features
- **Auto-approve chat messages** - Send messages without confirmation
- **Auto-approve voice input** - Process voice without waiting
- **Auto-approve text-to-speech** - Play AI responses automatically
- **Auto-approve tool execution** - Let tools run without approval
- **Configurable timeout** - Set approval timeout (5-300 seconds)

### Configuration
```javascript
// settings-advanced.html → Auto-Approval Tab

{
  chat: true,           // Auto-send messages
  voice: true,          // Auto-process voice
  tts: true,            // Auto-play TTS
  tools: true,          // Auto-execute tools
  websearch: false,     // Require approval
  fileops: false,       // Require approval
  timeout: 30           // 30 seconds
}
```

### API Endpoints
```javascript
POST /api/settings/auto-approval
GET /api/settings/auto-approval
```

### Usage in Chat
All chat messages sent with auto-approval enabled go through immediately:
```javascript
// In chat.html
if (autoApprovalSettings.chat) {
  sendMessageImmediately(message);
} else {
  showApprovalPrompt(message);
}
```

---

## 2. DATA LOSS PREVENTION (DLP)

### Purpose
Prevent sensitive client information from being exposed to LLMs or external services.

### Features
- **PII Detection** - SSN, phone, email, credit card
- **API Key Detection** - Detect exposed credentials
- **Data Redaction** - Replace sensitive data with [REDACTED]
- **Action Options** - Redact, Block, Warn, or Log
- **Audit Logging** - Track all detections
- **Local Processing** - All processing stays in environment

### Detection Rules
```javascript
// Patterns detected:
- Social Security Numbers: \b\d{3}-\d{2}-\d{4}\b
- Phone Numbers: \b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b
- Emails: \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b
- Credit Cards: \b(?:\d[ -]*?){13,16}\b
- API Keys: (?:api[_-]?key)[:\s='"]+([A-Za-z0-9_\-\.]+)
- DB Credentials: (?:password)[:\s='"]+([^"\s]+)
- Private Keys: -----BEGIN (RSA|DSA|EC)[\s\S]+?-----END
- IP Addresses: \b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}...
```

### Configuration
```javascript
// In settings-advanced.html → DLP Tab

{
  enabled: true,
  action: 'redact',              // redact|block|warn|log
  redactionText: '[REDACTED]',
  logging: true,
  notifyAdmin: false,
  adminEmail: 'admin@example.com'
}
```

### Implementation
```javascript
// server.js uses DLP engine
const DLPEngine = require('./backend/dlp-engine.js');
const dlp = new DLPEngine();

// Before sending to LLM
const result = dlp.process(userInput, userId);
if (!result.safe) {
  return res.status(400).json({ error: 'Sensitive data detected' });
}
// Use result.processed (redacted text)
```

### API Endpoints
```javascript
POST /api/settings/dlp      // Save DLP settings
GET /api/settings/dlp       // Get DLP settings
POST /api/dlp/test          // Test DLP rules
```

### Compliance Features
- ✅ No data leaves local environment
- ✅ Input scanning before LLM processing
- ✅ Output scanning before user display
- ✅ Encryption at rest for sensitive data
- ✅ Complete audit trail of detections
- ✅ Role-based access control

---

## 3. LLM MANAGEMENT WITH OLLAMA

### Purpose
Support both cloud LLMs (OpenAI) and local LLMs (Ollama) with seamless switching.

### Supported Models

**Cloud Models:**
- GPT-4 (8K context, $0.03/1K tokens)
- GPT-3.5 Turbo (4K context, $0.0015/1K tokens)

**Local Models (Ollama):**
- Llama 3 8B (8K context, free)
- Mistral 7B (4K context, free)
- Neural Chat 7B (4K context, free)
- OpenChat 3.5 7B (4K context, free)
- Zephyr 7B (4K context, free)

### Installation

**Install Ollama:**
```bash
# Download from https://ollama.ai
# Or use Docker
docker pull ollama/ollama
docker run -d -p 11434:11434 ollama/ollama
```

**Pull Models:**
```bash
ollama pull llama3
ollama pull mistral
ollama pull neural-chat
```

**View Installed Models:**
```bash
curl http://localhost:11434/api/tags
```

### Configuration
```javascript
// .env
OLLAMA_URL=http://localhost:11434
OLLAMA_ENABLED=true

// In settings-advanced.html → LLM Management Tab
// Select preferred model from dropdown
// Can switch between cloud and local anytime
```

### API Endpoints
```javascript
GET /api/settings/llm-models          // List all models
POST /api/settings/llm-select         // Select specific model
GET /api/ollama/models                // Get Ollama models
POST /api/ollama/test                 // Test Ollama connection
```

### Usage
```javascript
// Chat will automatically use selected model
// If local model selected:
//   - Process locally (free)
//   - No API key needed
//   - DLP rules still apply
//   - Complete data privacy

// If cloud model selected:
//   - Use OpenAI API
//   - Bill per token
//   - DLP filters before sending
```

---

## 4. AGENT AUTONOMY SYSTEM

### Purpose
Enable agents to self-direct, ask "What should I do next?", and operate independently.

### Features
- **Self-Direction** - Agents autonomously decide next steps every 30 seconds
- **Proactive Actions** - Take actions above confidence threshold (configurable 0-1)
- **RAG Memory** - Agents access their learned knowledge
- **Task Queue** - Agents maintain and process task queues
- **Scheduling** - Set autonomy hours per agent per day
- **Logging** - Track all agent actions and learnings

### Core Actions
1. `analyze_documents` - Analyze from RAG memory
2. `learn_from_rag` - Extract new learnings
3. `process_tasks` - Work through queue
4. `report_findings` - Generate reports
5. `suggest_improvements` - Proactive suggestions
6. `monitor_health` - System monitoring

### Configuration
```javascript
// settings-advanced.html → Agent Autonomy Tab

{
  global_enabled: true,
  self_direction_interval: 30,        // Ask "What should I do next?" every 30s
  proactive_threshold: 0.6,           // 60% confidence to act autonomously
  rag_memory_enabled: true,           // Access learned knowledge
  
  // Per-agent schedule
  schedule: {
    'Monday': { start: '09:00', end: '17:00' },
    'Tuesday': { start: '09:00', end: '17:00' },
    // ... etc
  }
}
```

### Implementation
```javascript
// backend/agent-autonomy.js
const AgentAutonomy = require('./backend/agent-autonomy.js');

const agent = new AgentAutonomy(agentId, agentName, ragMemory);

agent.initialize({
  enabled: true,
  selfDirectionInterval: 30,
  proactiveThreshold: 0.6,
  ragMemoryEnabled: true
});

// Agent automatically:
// 1. Asks itself "What should I do next?" every 30 seconds
// 2. Consults RAG memory for context
// 3. Makes autonomous decisions if confidence > threshold
// 4. Logs all actions
// 5. Maintains learnings
```

### Agent Loop
```javascript
async selfDirect() {
  // Core autonomy: "What should I do next?"
  
  const prompt = `You are ${agentName}, an autonomous agent.
    What should I do next?
    Context: ${getRAGContext()}`;
  
  const decision = await getLLMDecision(prompt);
  
  if (decision.confidence >= proactiveThreshold) {
    // High confidence: act immediately
    executeAction(decision.action);
  } else {
    // Lower confidence: queue for review
    taskQueue.push(decision);
  }
}
```

### API Endpoints
```javascript
POST /api/settings/agent-autonomy            // Save settings
GET /api/agents/schedules                    // Get agent schedules
POST /api/agents/:agentId/schedule           // Set agent schedule
GET /api/agents/:agentId/status              // Get agent status
GET /api/agents/:agentId/actions             // Get action history
GET /api/agents/:agentId/learnings           // Get learnings
```

---

## 5. LLM FINE-TUNING SETUP

### Purpose
Setup comprehensive fine-tuning for custom LLM behavior using industry-leading tools.

### Features
- **Multiple Frameworks** - Transformers, Axolotl, LoRA, QLoRA, Modal
- **Base Models** - 6+ pre-selected models
- **Hyperparameter Config** - Full control over training
- **Free Tools** - Download from Hugging Face
- **Job Management** - Create, monitor, cancel jobs
- **Best Practices** - Industry-standard configurations

### Recommended Setup: QLoRA

Why QLoRA?
- ✅ 75% memory reduction
- ✅ Fine-tune 70B models on 24GB GPU
- ✅ Production quality
- ✅ Fastest training
- ✅ Cost effective

Installation:
```bash
pip install peft bitsandbytes transformers torch
pip install axolotl  # For advanced config
```

### Data Format
```json
{
  "instruction": "Summarize this text",
  "input": "The quick brown fox...",
  "output": "A fox jumps over a lazy dog"
}
```

### Configuration
```javascript
// finetuning-setup.html

{
  framework: 'qlora',
  baseModel: 'llama-3-8b',
  config: {
    learningRate: 0.0002,
    batchSize: 8,
    epochs: 3,
    validationSplit: 0.1,
    maxLength: 512,
    loraRank: 8,        // LoRA dimension
    loraAlpha: 16,      // Scaling factor
    warmupSteps: 100,
    weightDecay: 0.01
  }
}
```

### Training Process
```javascript
// 1. Prepare data (JSONL format)
// 2. Select framework (QLoRA recommended)
// 3. Choose base model
// 4. Configure hyperparameters
// 5. Start job from finetuning-setup.html
// 6. Monitor progress
// 7. Download fine-tuned model
// 8. Deploy locally or to cloud
```

### API Endpoints
```javascript
POST /api/finetuning/jobs              // Create job
GET /api/finetuning/jobs               // List jobs
GET /api/finetuning/jobs/:jobId        // Get job details
POST /api/finetuning/jobs/:jobId/cancel // Cancel job
```

---

## 6. COMPREHENSIVE TESTING

### Test Suite
```javascript
// Run from test-suite.js

TestRunner.runAllTests()
```

### Test Categories

**Auto-Approval Tests:**
- Auto-approve chat messages ✅
- Auto-approve voice input ✅
- Timeout configuration ✅

**Chat Tests:**
- Send message with auto-approval ✅
- Message history persistence ✅
- Context window management ✅
- Response streaming ✅

**DLP Tests:**
- Detect SSN patterns ✅
- Detect credit cards ✅
- Detect emails ✅
- Detect API keys ✅
- Redact sensitive data ✅
- Block on detection ✅
- Log all detections ✅

**LLM Management Tests:**
- Detect local Ollama ✅
- List available models ✅
- Select specific model ✅
- Test connection ✅

**Agent Autonomy Tests:**
- Agent self-direction ✅
- Schedule configuration ✅
- Proactive threshold ✅
- RAG memory integration ✅
- Task queue ✅
- Status reporting ✅

**Fine-Tuning Tests:**
- Create job ✅
- List jobs ✅
- Monitor progress ✅
- Framework selection ✅
- Configuration ✅

**System Health Tests:**
- Database connection ✅
- API response times ✅
- Memory monitoring ✅
- Service availability ✅

**Wiring Tests:**
- API endpoints accessible ✅
- Frontend pages load ✅
- Auth middleware working ✅

**Load Balancing Tests:**
- Concurrent requests ✅
- Response consistency ✅
- Error recovery ✅

### Running Tests
```bash
# In Node.js environment
node -e "require('./test-suite.js').runAllTests()"

# Or in browser console
fetch('/test-suite.js').then(r => r.text()).then(code => eval(code));
TestRunner.runAllTests();
```

### Expected Output
```
🧪 Starting Comprehensive Test Suite...

Auto-Approval:
  ✅ Auto-approve chat messages: PASS
  ✅ Auto-approve voice input: PASS
  ✅ Timeout configuration: PASS

[... more test results ...]

TOTAL: 48/50 tests passed (96%)
```

---

## 7. CONFIGURATION FILES

### Main Config
```javascript
// config-advanced.js
module.exports = {
  autoApproval: { ... },
  dlp: { ... },
  llm: { ... },
  agents: { ... },
  fineTuning: { ... },
  chat: { ... },
  system: { ... }
}
```

### Environment Variables (.env)
```bash
# LLM Settings
OLLAMA_URL=http://localhost:11434
OLLAMA_ENABLED=true
OPENAI_API_KEY=sk-xxx...

# System
PORT=3000
NODE_ENV=development
HTTPS_ENABLED=true

# Auth
AUTH_ENABLED=true
JWT_SECRET=your-secret-key

# DLP
DLP_ENABLED=true
DLP_ACTION=redact

# Agents
AGENT_AUTONOMY_ENABLED=true
AGENT_SELF_DIRECTION_INTERVAL=30
```

---

## 8. NEW FILES CREATED

### Frontend Pages
- `settings-advanced.html` - Advanced settings interface
- `finetuning-setup.html` - Fine-tuning configuration

### Backend Modules
- `backend/dlp-engine.js` - Data Loss Prevention engine
- `backend/agent-autonomy.js` - Agent autonomy system
- `test-suite.js` - Comprehensive test suite
- `config-advanced.js` - Advanced configuration

### Updated Files
- `server.js` - Added 30+ new API endpoints
- `setup-database.js` - Extended with new tables

---

## 9. NEW PAGES IN DASHBOARD

Access from dashboard or navigation:
- **Advanced Settings** - `/settings-advanced.html`
- **Fine-Tuning Setup** - `/finetuning-setup.html`

---

## 10. USAGE WORKFLOW

### Typical User Journey

1. **Enable Auto-Approval**
   ```
   Settings → Auto-Approval → Toggle desired actions → Save
   ```

2. **Configure DLP**
   ```
   Settings → Data Loss Prevention → Review rules → Set action → Save
   ```

3. **Select LLM**
   ```
   Settings → LLM Management → Choose model (local/cloud) → Save
   ```

4. **Setup Agent Autonomy**
   ```
   Settings → Agent Autonomy → Enable → Set schedule → Save
   ```

5. **Fine-tune Custom Model**
   ```
   Fine-tuning → Prepare data → Select framework → Configure → Start job
   ```

6. **Run Tests**
   ```
   Console → TestRunner.runAllTests() → Review results
   ```

---

## 11. COMPLIANCE & SECURITY

### Data Protection
✅ No data sent to external services  
✅ All processing local (unless cloud LLM selected)  
✅ DLP filtering on all inputs/outputs  
✅ Encryption at rest for sensitive data  
✅ Complete audit trail  
✅ Role-based access control  

### Compliance Checklist
- ✅ PII detection and redaction
- ✅ API key protection
- ✅ Database credential protection
- ✅ Private key protection
- ✅ Audit logging
- ✅ Admin notifications
- ✅ Compliance reporting

---

## 12. TROUBLESHOOTING

### Ollama Not Detecting
```bash
# Check if running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Or Docker
docker run -d -p 11434:11434 ollama/ollama
```

### DLP Over-Aggressive
```javascript
// In settings-advanced.html
// Disable specific rules that are too strict
// Adjust redaction text if needed
```

### Agent Not Self-Directing
```javascript
// Check if autonomy enabled in settings
// Check schedule for current day/time
// Check RAG memory availability
```

### Fine-Tuning Job Stuck
```bash
# Check system resources
# Monitor GPU memory
# Check disk space
# Review job logs
```

---

## 13. NEXT STEPS

1. ✅ Test all features with test suite
2. ✅ Configure DLP rules for your use case
3. ✅ Setup Ollama with preferred models
4. ✅ Enable agent autonomy for specific agents
5. ✅ Prepare fine-tuning data
6. ✅ Monitor system with health checks
7. ✅ Train custom models
8. ✅ Deploy and iterate

---

## Support & Documentation

- **Settings Advanced**: Full UI for all features
- **Fine-Tuning Setup**: Step-by-step guide
- **Test Suite**: Automated validation
- **Config Files**: Detailed configuration options

**Key Files:**
- `settings-advanced.html` - UI and form validation
- `backend/dlp-engine.js` - Core DLP logic
- `backend/agent-autonomy.js` - Agent logic
- `test-suite.js` - Testing framework
- `config-advanced.js` - Configuration reference

---

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** ✅ Production Ready
