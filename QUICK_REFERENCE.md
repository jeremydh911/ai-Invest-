# LucaExpress Quick Reference Card

## 🚀 Start Server (30 seconds)

```bash
cd opt\agentic-empire
npm start
# Visit http://localhost:3000
```

## 🧪 Run Tests (1 minute)

```powershell
.\run-tests.ps1          # PowerShell
bash ../../run-tests.sh  # Bash/WSL
```

---

## 📍 New Pages

| Page | URL | What It Does |
|------|-----|--------------|
| **Advanced Settings** | `/settings-advanced.html` | Configure all 5 features |
| **Fine-Tuning** | `/finetuning-setup.html` | Train custom LLM models |
| **Original Settings** | `/settings.html` | Existing configuration |
| **Chat** | `/chat.html` | Chat with DLP protection |
| **Dashboard** | `/dashboard.html` | Analytics & monitoring |

---

## ⚙️ Core Settings (Quick Buttons)

### Enable Auto-Approval
```javascript
// Settings → Auto-Approval → Enable
{
  "enabled": true,
  "thresholds": { "low_risk": 0, "medium_risk": 1, "high_risk": 2 }
}
```

### Enable DLP (Strict)
```javascript
// Settings → DLP → Select "strict"
// Now blocks: SSN, CC, API keys, passwords, emails
```

### Use Local LLM
```bash
# Install Ollama from https://ollama.ai
ollama pull llama2
ollama serve

# Settings → Ollama → Select "llama2"
```

### Enable Agent Autonomy
```javascript
// Settings → Agent Autonomy → Enable
// Set hours: 9 AM - 5 PM weekdays
// Set proactivity: 7/10
```

---

## 🔌 Key API Endpoints

### Auto-Approval
```
POST   /api/auto-approve/settings       - Configure
GET    /api/auto-approve/history        - View log
POST   /api/auto-approve/override       - Override
```

### DLP
```
POST   /api/dlp/scan                    - Check text
GET    /api/dlp/policies                - List policies
PUT    /api/dlp/policies/:id            - Update
POST   /api/dlp/audit                   - View violations
```

### Ollama LLM
```
GET    /api/ollama/models               - List models
POST   /api/ollama/chat                 - Chat with Ollama
GET    /api/ollama/status               - Check status
```

### Agent Autonomy
```
POST   /api/agents/:id/decide-next      - Ask "What next?"
GET    /api/agents/:id/autonomy-stats   - Metrics
PUT    /api/agents/:id/schedule         - Set hours
```

### Fine-Tuning
```
POST   /api/finetuning/start            - Start training
GET    /api/finetuning/status           - Check progress
GET    /api/finetuning/results/:id      - Get model
```

---

## 🧪 Test Commands

```bash
# Full test suite
node test-suite.js --all

# Individual tests
node test-suite.js --dlp              # DLP feature
node test-suite.js --auto-approval    # Approval system
node test-suite.js --ollama           # Local LLM
node test-suite.js --agent-autonomy   # Agent autonomy
node test-suite.js --compliance       # GDPR/CCPA
```

---

## 🔐 What Gets Protected

### By DLP (Before going to LLM):
- ✅ Social Security Numbers (123-45-6789)
- ✅ Credit Card Numbers (4532-1234-5678-9010)
- ✅ API Keys (sk_live_abc123xyz)
- ✅ Passwords (password=secret)
- ✅ Customer IDs (customer_id=ABC123)
- ✅ Email Addresses (user@company.com)
- ✅ Phone Numbers (555-123-4567)

### By Auto-Approval:
- ✅ All chat actions reviewed
- ✅ Sensitive actions require approval
- ✅ Admin can override if needed
- ✅ All decisions logged

---

## 🧠 Agent Autonomy Quick Demo

```javascript
// 1. Enable in settings
// 2. Agent queries RAG memory every 30 seconds
// 3. Agent asks LLM: "What should I do next?"
// 4. LLM responds with action
// 5. Agent executes (max 5/hour)
// 6. Decision logged to RAG memory
// 7. Repeat at next interval

// Example agent decision:
{
  "decision": "Send weekly report to management",
  "confidence": 0.92,
  "based_on": ["Monday is report day", "Last report 8 days ago"],
  "action": "execute",
  "timestamp": "2024-01-15T09:30:00Z"
}
```

---

## 🎛️ Fine-Tuning Quick Start

1. **Collect Training Data**
   ```json
   [
     {"instruction": "What is AI?", "input": "", "output": "AI is..."},
     {"instruction": "Explain ML", "input": "Types?", "output": "ML includes..."}
   ]
   ```

2. **Visit Fine-Tuning Page**
   - URL: `/finetuning-setup.html`

3. **Upload Dataset**
   - Drag-drop or select file
   - Max 1GB
   - JSON format required

4. **Set Parameters**
   - Learning rate: 2e-5 (default)
   - Epochs: 3
   - Batch size: 4

5. **Start Training**
   - Click "Start Training"
   - Monitor progress
   - ETA shows completion time

6. **Deploy Model**
   - Download locally
   - Push to HuggingFace
   - Export to ONNX

---

## 🚨 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| **Ollama not found** | `ollama serve` in another terminal |
| **DLP blocking everything** | Change policy to "moderate" |
| **Agent not deciding** | Check if within autonomous hours |
| **Fine-tuning stuck** | Check dataset format & size |
| **Tests failing** | Make sure Node.js running on port 3000 |
| **Port 3000 busy** | `taskkill /PID <pid> /F` then `npm start` |

---

## 📁 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `dlp-engine.js` | Detects sensitive data | 1200+ |
| `agent-autonomy.js` | Self-directed agents | 900+ |
| `config-advanced.js` | All configuration | 800+ |
| `settings-advanced.html` | Settings UI | 850+ |
| `finetuning-setup.html` | Training UI | 850+ |
| `test-suite.js` | Automated tests | 1800+ |
| `run-tests.ps1` | Test runner | 200+ |

---

## 🎯 Success Indicators

✅ **Auto-Approval Works When:**
- Approval history shows decisions
- Chat executes with approval gates
- Bypass logged with admin info

✅ **DLP Works When:**
- SSN "123-45-6789" gets blocked
- Sanitized version sent to LLM
- Violation appears in audit log

✅ **Ollama Works When:**
- Ollama status shows "connected"
- Chat uses local model
- Falls back to OpenAI if needed

✅ **Agent Autonomy Works When:**
- Agent queries RAG memory
- Makes contextual decisions
- Respects rate limits (5/hour)

✅ **Fine-Tuning Works When:**
- Dataset uploads successfully
- Training starts
- Progress bar updates
- Model downloads

---

## 🔗 Documentation Links

| Document | Purpose |
|----------|---------|
| `QUICKSTART_FEATURES.md` | Complete setup guide |
| `ADVANCED_FEATURES_GUIDE.md` | Technical details |
| `IMPLEMENTATION_COMPLETE_V2.md` | Implementation summary |
| `FILE_MANIFEST.md` | File inventory |
| `FINAL_CHECKLIST.md` | Verification checklist |

---

## 🏃 30-Second Setup

```bash
# 1. Start server (in project directory)
npm start

# 2. Open browser
http://localhost:3000

# 3. Go to settings
http://localhost:3000/settings-advanced.html

# 4. Enable features you want
# - Auto-Approval
# - DLP
# - Ollama (optional)
# - Agent Autonomy
# - Fine-Tuning

# 5. Chat and verify everything works
http://localhost:3000/chat.html
```

---

## 💡 Pro Tips

1. **Use Strict DLP** → Most secure (blocks all PII)
2. **Use Local Ollama** → Fastest, most private
3. **Set Reasonable Agent Hours** → Prevents runaway actions
4. **Monitor Audit Logs** → Verify compliance
5. **Test Everything** → Run `.\run-tests.ps1` after config change

---

## 🎉 You're All Set!

All features are installed and ready to use:

- ✅ Auto-Approval System
- ✅ Data Loss Prevention (DLP)
- ✅ Local LLM Support (Ollama)
- ✅ Agent Autonomy
- ✅ Fine-Tuning Setup
- ✅ Comprehensive Testing
- ✅ Full Documentation

**Start the server and have fun!** 🚀

---

**Quick Start Command:**
```bash
npm start  # Then visit http://localhost:3000
```

**Questions?** Check:
- QUICKSTART_FEATURES.md (setup)
- ADVANCED_FEATURES_GUIDE.md (technical)
- FINAL_CHECKLIST.md (verification)

---

*Version 2.0 | Production Ready ✅*
