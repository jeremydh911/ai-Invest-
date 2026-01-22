# 🔗 Integration Roadmap - Agentic Empire + Aloha Pono

**Date:** January 19, 2026  
**Objective:** Merge Agentic Empire's modern voice-first UX with Aloha Pono's enterprise features  
**Timeline:** 15-20 days (240-340 hours)

---

## 📊 Executive Summary

### Current State
- **Agentic Empire:** Modern voice-first interface, clean architecture, minimal footprint
- **Aloha Pono:** Enterprise-grade backend, advanced voice tech, full tool ecosystem

### Target State
- **Unified System:** "Agentic Pono" - Voice-first UX + Enterprise backend + Advanced tools

### Value Proposition
✅ Advanced voice cloning + emotion detection  
✅ Full DLP & policy governance  
✅ Email, CRM, banking, payment integrations  
✅ Agent memory & orchestration  
✅ Production-ready deployment (Docker/K8s)  
✅ Simple, intuitive voice-first interface  

---

## 🗺️ Detailed Phase Breakdown

### **PHASE 1: Database & Infrastructure (3-4 days)**

#### 1.1 Database Migration
**Files to copy:**
- `Aloha/server/prisma/schema.prisma` → Create new schema

**Tasks:**
- [ ] Create PostgreSQL Prisma schema combining both databases
- [ ] Write migration script: SQLite → PostgreSQL
- [ ] Update `.env` with DATABASE_URL
- [ ] Install Prisma client
- [ ] Run `prisma migrate dev`
- [ ] Seed with initial data
- [ ] Verify all tables created

**Expected Schema:**
```prisma
// Core models (from both)
model User
model Persona
model Conversation
model Message

// Agentic's settings
model SystemSettings
model ToolConfig
model MCPServer

// Aloha's advanced models
model AgentProfile
model AgentMemory
model AgentOverride
model MasterInstruction
model PolicyRule
model AuditLog
model VoiceSession
model VoiceClone

// Integration models
model EmailTemplate
model WorkflowRun
model ToolIntegration
```

#### 1.2 Redis & Cache Setup
**Files to copy:**
- `Aloha/server/services/redisClient.js` → `new/services/redisClient.js`
- `Aloha/server/cache/` → `new/cache/`

**Tasks:**
- [ ] Install redis (via Docker or local)
- [ ] Copy redisClient.js (handle connection pooling)
- [ ] Setup cache keys strategy
- [ ] Configure TTL for voice clips, models, agents
- [ ] Test Redis connection

#### 1.3 Queue System
**Files to copy:**
- `Aloha/server/services/runQueue.js`
- `Aloha/server/workers/runWorker.js`
- `Aloha/server/ecosystem.config.json` (PM2 config)

**Tasks:**
- [ ] Install BullMQ
- [ ] Setup queue definitions
- [ ] Create worker processes
- [ ] Configure job retry logic
- [ ] Test queue processing

#### 1.4 Logging System
**Files to copy:**
- `Aloha/server/services/dlpLogger.js` (uses Winston)

**Tasks:**
- [ ] Install Winston + winston-daily-rotate-file
- [ ] Create logger configuration
- [ ] Setup daily rotation
- [ ] Configure log levels (error, warn, info, debug)
- [ ] Replace all console.log with logger calls

#### 1.5 Package.json Updates
**To add from Aloha:**
```json
{
  "@prisma/adapter-pg": "^7.2.0",
  "@prisma/client": "^7.2.0",
  "bullmq": "^5.66.5",
  "ioredis": "^5.9.2",
  "pg": "^8.17.1",
  "prisma": "^7.2.0",
  "winston": "^3.19.0",
  "winston-daily-rotate-file": "^5.0.0",
  "helmet": "^7.1.0",
  "express-rate-limit": "^8.2.1",
  "csurf": "^1.11.0"
}
```

**Tasks:**
- [ ] Update package.json
- [ ] Run `npm install`
- [ ] Update imports in server.js
- [ ] Remove express-static, add middleware

---

### **PHASE 2: Security & Middleware (2-3 days)**

#### 2.1 Enhanced Authentication
**Files to copy:**
- `Aloha/server/middleware/auth.js`

**Tasks:**
- [ ] Replace auth.js with Aloha's version (better JWT handling)
- [ ] Add session support (express-session)
- [ ] Update authentication checks
- [ ] Test login flow
- [ ] Verify token expiration

#### 2.2 Rate Limiting
**Files to copy:**
- Reference from Aloha's middleware

**Tasks:**
- [ ] Add express-rate-limit to API endpoints
- [ ] Configure limits:
  - `/api/login`: 5 requests/15 min
  - `/api/chat`: 30 requests/1 min per user
  - `/api/voice/synthesize`: 100 requests/1 hour per user
  - `/api/voice/transcribe`: 50 requests/1 hour per user

#### 2.3 CSRF Protection
**Files to copy:**
- Aloha's csurf middleware implementation

**Tasks:**
- [ ] Add csurf middleware
- [ ] Update all forms to include CSRF token
- [ ] Update API endpoints to validate
- [ ] Test CSRF protection

#### 2.4 DLP System
**Files to copy:**
- `Aloha/server/services/dlpScanner.js`
- `Aloha/server/services/dlpLogger.js`
- `Aloha/server/middleware/dlpMiddleware.js`

**Tasks:**
- [ ] Copy DLP files to services/
- [ ] Integrate DLP middleware in server.js
- [ ] Configure scanning rules (PII, secrets, etc.)
- [ ] Setup DLP logging
- [ ] Test DLP detection

#### 2.5 Policy Dispatch
**Files to copy:**
- `Aloha/server/services/policyDispatch.js`

**Tasks:**
- [ ] Copy policy dispatch service
- [ ] Create policy rules database
- [ ] Implement policy enforcement
- [ ] Setup policy logging
- [ ] Create admin policy management API

---

### **PHASE 3: Voice Services (2-3 days)**

#### 3.1 Advanced Voice Synthesis
**Files to copy:**
- `Aloha/Voice Module full/` (entire directory)
- `Aloha/server/services/agentVoiceTuning.js`
- `Aloha/server/services/agentVoiceAutoModulation.js`

**Tasks:**
- [ ] Copy voice reference library (100+ voices)
- [ ] Update voice synthesis endpoint
- [ ] Implement voice cloning support
- [ ] Add voice parameter tuning
- [ ] Create voice model loading system
- [ ] Cache voice models in Redis
- [ ] Update voice-chat.html with new models

#### 3.2 Emotion Detection
**Files to copy:**
- `Aloha/server/services/voiceEmotion.js`

**Tasks:**
- [ ] Copy emotion detection service
- [ ] Integrate with chat API
- [ ] Parse emotion markers in text
- [ ] Update voice synthesis with emotion
- [ ] Create emotion model management
- [ ] Test emotion detection

#### 3.3 Voice Sessions
**Files to copy:**
- `Aloha/server/services/voiceChatSignaling.js`

**Tasks:**
- [ ] Copy voice signaling service
- [ ] Add WebSocket support for voice
- [ ] Implement session tracking
- [ ] Create voice session database model
- [ ] Setup session cleanup jobs

#### 3.4 Voice Endpoints
**New API endpoints:**
- `POST /api/voice/synthesize` (enhanced with cloning)
- `POST /api/voice/transcribe` (same)
- `POST /api/voice/clone` (new - voice cloning)
- `GET /api/voice/models` (new - list available voices)
- `POST /api/voice/emotion` (new - emotion detection)
- `GET /api/voice/sessions` (new - session management)

**Tasks:**
- [ ] Update voice-related routes
- [ ] Implement voice cloning endpoint
- [ ] Create voice model listing
- [ ] Add emotion control to TTS
- [ ] Test all voice endpoints

---

### **PHASE 4: Agent Systems (2-3 days)**

#### 4.1 Agent Memory
**Files to copy:**
- `Aloha/server/services/agentMemory.js`
- `Aloha/server/services/agentProfiles.js`

**Tasks:**
- [ ] Copy agent memory service
- [ ] Create AgentMemory database model
- [ ] Implement memory persistence
- [ ] Add memory context to chat
- [ ] Create memory management API
- [ ] Setup memory cleanup jobs

#### 4.2 Master Instructions
**Files to copy:**
- `Aloha/server/services/masterInstructions.js`

**Tasks:**
- [ ] Copy master instructions service
- [ ] Create MasterInstruction database model
- [ ] Implement instruction parsing
- [ ] Add instructions to system prompt
- [ ] Create instruction management API
- [ ] Test instruction enforcement

#### 4.3 Agent Overrides
**Files to copy:**
- `Aloha/server/services/agentOverridesStore.js`

**Tasks:**
- [ ] Copy agent overrides service
- [ ] Create AgentOverride database model
- [ ] Implement override logic
- [ ] Add admin override API
- [ ] Create override rules UI
- [ ] Test overrides in chat

#### 4.4 Post-Conversation Workflows
**Files to copy:**
- `Aloha/server/services/postConversationWorkflow.js`

**Tasks:**
- [ ] Copy post-conversation service
- [ ] Create workflow definitions
- [ ] Implement workflow execution
- [ ] Add workflow triggers
- [ ] Create workflow management API
- [ ] Queue workflow jobs

#### 4.5 Agent Routes & Orchestration
**Files to copy:**
- `Aloha/server/routes/agentOverrides.js`
- `Aloha/server/routes/agentsOrchestration.js`
- `Aloha/server/routes/workflows.js`

**Tasks:**
- [ ] Copy agent-related routes
- [ ] Integrate agent endpoints
- [ ] Test agent orchestration
- [ ] Implement agent coordination
- [ ] Create agent status API

---

### **PHASE 5: Tool Integrations (3-4 days)**

#### 5.1 Email Service (Copy Working)
**Files to copy:**
- `Aloha/server/services/emailService.js`
- `Aloha/server/routes/email.js`

**Tasks:**
- [ ] Copy email service (already working in Aloha)
- [ ] Configure email settings
- [ ] Update email routes
- [ ] Test email sending
- [ ] Create email management UI
- [ ] Add email templates

#### 5.2 MCP Client Integration
**Files to copy:**
- `Aloha/server/services/mcpClient.js`

**Tasks:**
- [ ] Copy MCP client service
- [ ] Implement server connection logic
- [ ] Create MCP integration endpoints
- [ ] Setup tool discovery
- [ ] Add tool execution framework
- [ ] Create MCP management API

#### 5.3 IT Workflows
**Files to copy:**
- `Aloha/server/services/itWorkflows.js`
- `Aloha/server/routes/workflows.js`

**Tasks:**
- [ ] Copy IT workflow service
- [ ] Create workflow database models
- [ ] Implement workflow execution
- [ ] Create workflow templates
- [ ] Add workflow monitoring

#### 5.4 HR Integration
**Files to copy:**
- `Aloha/server/services/hr/onboardingService.js`
- `Aloha/server/routes/hr.js`

**Tasks:**
- [ ] Copy HR onboarding service
- [ ] Create onboarding workflow
- [ ] Add HR routes
- [ ] Create HR management UI
- [ ] Test onboarding flows

#### 5.5 Additional Tools
**Files/Code to create:**
- Web Search integration (use Serpapi or similar)
- CRM integration (Salesforce/HubSpot connector)
- Banking API (Stripe, PayPal)
- Payment processing (Stripe SDK)
- Playwright automation (browser control)

**Tasks for each:**
- [ ] Create tool service file
- [ ] Add authentication/credentials
- [ ] Implement API client
- [ ] Create tool routes
- [ ] Add tool management UI
- [ ] Test tool functionality

#### 5.6 Integration Routes
**Copy:**
- `Aloha/server/routes/integrations.js`

**Tasks:**
- [ ] Copy integrations routes
- [ ] Add credential management
- [ ] Implement tool authentication
- [ ] Create integration status API

---

### **PHASE 6: Frontend Integration (2-3 days)**

#### 6.1 Settings Enhancement
**Enhance `settings.html` with:**
- [ ] Agent memory settings
- [ ] Policy configuration
- [ ] Master instructions UI
- [ ] Voice cloning management
- [ ] Emotion model selection
- [ ] Workflow builder
- [ ] Integration credentials

#### 6.2 Voice Chat Enhancement
**Enhance `voice-chat.html` with:**
- [ ] Advanced voice model selection
- [ ] Voice cloning model picker
- [ ] Emotion marker support
- [ ] Real-time session display
- [ ] Voice library browser
- [ ] Recording quality settings
- [ ] Session history

#### 6.3 Dashboard Enhancement
**Update `dashboard.html` with:**
- [ ] Agent memory display
- [ ] Recent workflows
- [ ] Integration status
- [ ] DLP alerts (if any)
- [ ] Voice model status
- [ ] System health

#### 6.4 New Pages (Optional)
- [ ] Agent Roundtable (copy from Aloha)
- [ ] Workflow Builder
- [ ] Policy Management
- [ ] Integration Console
- [ ] Voice Library Manager
- [ ] Memory Inspector

#### 6.5 WebSocket Integration
**Tasks:**
- [ ] Add WebSocket server (ws library)
- [ ] Implement real-time voice signaling
- [ ] Add session updates
- [ ] Create notification system
- [ ] Test WebSocket connections

---

### **PHASE 7: Testing & Quality (2-3 days)**

#### 7.1 Copy Test Suite
**Files to copy:**
- `Aloha/server/scripts/smoke-full.js`
- `Aloha/server/scripts/smoke-voice.js`
- `Aloha/server/scripts/test-auth.js`

**Tasks:**
- [ ] Copy test scripts
- [ ] Adapt tests to new architecture
- [ ] Add integration tests
- [ ] Create test database
- [ ] Run all tests (target: 15+ passing)

#### 7.2 API Testing
**Test endpoints:**
- [ ] POST /api/login
- [ ] GET /api/personas
- [ ] POST /api/text-chat
- [ ] POST /api/voice/synthesize
- [ ] POST /api/voice/transcribe
- [ ] POST /api/voice/clone
- [ ] GET /api/settings
- [ ] POST /api/settings
- [ ] All MCP endpoints
- [ ] All email endpoints
- [ ] All workflow endpoints

#### 7.3 Voice Testing
**Test scenarios:**
- [ ] Basic TTS with OpenAI voices
- [ ] Advanced TTS with cloned voices
- [ ] Emotion detection
- [ ] Voice modulation
- [ ] Real-time transcription
- [ ] Session management

#### 7.4 Integration Testing
**Test workflows:**
- [ ] Email on conversation end
- [ ] Policy violation detection
- [ ] Post-conversation automation
- [ ] MCP tool execution
- [ ] Agent orchestration
- [ ] Memory context usage

#### 7.5 Load Testing
**Tasks:**
- [ ] Benchmark voice endpoints
- [ ] Benchmark chat endpoints
- [ ] Test concurrent users
- [ ] Test Redis performance
- [ ] Monitor memory usage

---

### **PHASE 8: Deployment (2-3 days)**

#### 8.1 Docker Setup
**Files to copy:**
- `Aloha/server/Dockerfile`
- `Aloha/server/docker-compose.yml`
- `Aloha/server/docker-compose.gpu.yml`

**Tasks:**
- [ ] Copy Dockerfile
- [ ] Adapt for new structure
- [ ] Create docker-compose.yml
- [ ] Add PostgreSQL container
- [ ] Add Redis container
- [ ] Test Docker build

#### 8.2 Kubernetes
**Files to copy:**
- `Aloha/k8s/k8s-deployment.yaml`
- `Aloha/k8s/k8s-service.yaml`
- `Aloha/k8s/k8s-ingress.yaml`

**Tasks:**
- [ ] Copy K8s manifests
- [ ] Adapt for new image
- [ ] Configure StatefulSets for DB/Redis
- [ ] Setup Ingress
- [ ] Test K8s deployment

#### 8.3 PM2 Configuration
**Files to copy:**
- `Aloha/server/ecosystem.config.json`

**Tasks:**
- [ ] Copy PM2 config
- [ ] Configure process names
- [ ] Setup workers
- [ ] Configure log rotation
- [ ] Test PM2 startup

#### 8.4 Nginx Configuration
**Files to copy:**
- `Aloha/server/nginx/agentic-empire.conf`

**Tasks:**
- [ ] Copy Nginx config
- [ ] Update upstream servers
- [ ] Configure SSL/TLS
- [ ] Setup reverse proxy
- [ ] Test Nginx

#### 8.5 Environment Configuration
**Create `.env` with:**
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/agentic
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-strong-secret>
OPENAI_API_KEY=<from-env>
PORT=3000
```

**Tasks:**
- [ ] Create .env.example
- [ ] Document all env vars
- [ ] Setup secure credential storage
- [ ] Test environment loading

---

## 📋 Copy Checklist

### Critical Files (Must Copy)
- [ ] `Aloha/server/services/redisClient.js`
- [ ] `Aloha/server/services/dlpScanner.js`
- [ ] `Aloha/server/services/dlpLogger.js`
- [ ] `Aloha/server/services/policyDispatch.js`
- [ ] `Aloha/server/services/agentMemory.js`
- [ ] `Aloha/server/services/agentProfiles.js`
- [ ] `Aloha/server/services/mcpClient.js`
- [ ] `Aloha/server/services/emailService.js`
- [ ] `Aloha/server/middleware/auth.js`
- [ ] `Aloha/server/middleware/dlpMiddleware.js`
- [ ] `Aloha/prisma/schema.prisma`

### Voice Files (High Priority)
- [ ] `Aloha/Voice Module full/` (entire directory)
- [ ] `Aloha/server/services/agentVoiceTuning.js`
- [ ] `Aloha/server/services/agentVoiceAutoModulation.js`
- [ ] `Aloha/server/services/voiceEmotion.js`
- [ ] `Aloha/server/services/voiceChatSignaling.js`

### Route Files (Medium Priority)
- [ ] `Aloha/server/routes/email.js`
- [ ] `Aloha/server/routes/agentsOrchestration.js`
- [ ] `Aloha/server/routes/workflows.js`
- [ ] `Aloha/server/routes/integrations.js`

### Deployment Files (Lower Priority)
- [ ] `Aloha/server/Dockerfile`
- [ ] `Aloha/server/docker-compose.yml`
- [ ] `Aloha/server/docker-compose.gpu.yml`
- [ ] `Aloha/k8s/` (all K8s files)
- [ ] `Aloha/server/ecosystem.config.json`
- [ ] `Aloha/server/nginx/luca-express.conf`

### Test Files
- [ ] `Aloha/server/scripts/smoke-full.js`
- [ ] `Aloha/server/scripts/smoke-voice.js`
- [ ] `Aloha/server/test-auth.js`

---

## 🚀 Getting Started

### Prerequisites
- [ ] PostgreSQL 14+
- [ ] Redis 7+
- [ ] Node.js 18+
- [ ] Docker (for containerization)
- [ ] git (for version control)

### Setup Steps
```bash
# 1. Backup both projects
cp -r Agentic\ Empire backup-agentic-$(date +%Y%m%d)
cp -r Aloha\ Pono backup-aloha-$(date +%Y%m%d)

# 2. Create feature branch
git checkout -b integration/v2

# 3. Install new dependencies
cd Agentic-Empire
npm install

# 4. Setup databases
createdb agentic_empire
redis-server --daemonize yes

# 5. Run migrations
npx prisma migrate dev

# 6. Copy Aloha files (see checklist)
cp -r ../Aloha\ Pono/server/services/redisClient.js server/services/
# ... (copy each file from checklist)

# 7. Update server.js imports
# Add new middleware, services, routes

# 8. Test
npm test
npm run smoke:full

# 9. Deploy
docker build -t agentic-pono .
docker-compose up -d
```

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Tests Passing | 15+ | 0 |
| Voice Features | All 5 (TTS, cloning, emotion, library, sessions) | 1 (TTS) |
| Tool Integrations | 7+ (email, web, CRM, API, banking, payment, playwright) | 0 |
| DLP Coverage | 100% of messages | 0% |
| Performance | <500ms avg response | TBD |
| Uptime | 99.9% | TBD |

---

## ⚠️ Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database migration fails | Medium | High | Backup first, test migration script |
| Voice library licensing | High | Medium | Check Fish Speech / OpenAudio licenses |
| PostgreSQL performance | Low | Medium | Load test during Phase 1 |
| Redis connection issues | Low | Medium | Setup connection pooling |
| Breaking API changes | Medium | Medium | Maintain backwards compatibility |
| TypeScript compilation errors | Medium | Low | Gradual TS migration (not all at once) |

---

## 📅 Timeline Estimates

```
Week 1:  Phase 1-2 (Database, Security)        5 days
Week 2:  Phase 3-4 (Voice, Agents)            5 days
Week 3:  Phase 5-6 (Tools, Frontend)          5 days
Week 4:  Phase 7-8 (Testing, Deployment)      3-5 days

TOTAL: 18-20 days (can be parallelized)
```

---

## 🎯 Final Deliverables

1. ✅ Unified `Agentic Pono` system
2. ✅ Production Docker images (CPU + GPU)
3. ✅ Kubernetes manifests
4. ✅ Comprehensive test suite (15+ tests)
5. ✅ Updated documentation
6. ✅ Migration guide from old system
7. ✅ Deployment runbook
8. ✅ API documentation
9. ✅ Voice feature guide
10. ✅ Architecture decision record

---

**Status:** Ready for Phase 1 kickoff  
**Prepared by:** Integration Planning  
**Date:** January 19, 2026
