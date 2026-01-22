# Multi-Company Implementation Roadmap

## ✅ COMPLETED IMPLEMENTATION COMPONENTS

### 1. Master Programming Guide
- **File**: [MASTER_PROGRAMMING_GUIDE.md](MASTER_PROGRAMMING_GUIDE.md)
- **Content**: Code organization standards, file splitting rules (1000 LOC threshold), multi-core optimization
- **Status**: COMPLETE

### 2. Database Layer - Company Isolation
- **File**: `services/company-db.js` (520 LOC)
- **Features**:
  - Separate SQLite database per company (app-company-{id}.db)
  - Company-scoped database connections
  - Full schema initialization per company
  - Promise-based query interface (run, get, all)
  - Company database lifecycle (create, close, delete)
- **Status**: COMPLETE

### 3. Global Registry & Company Management  
- **File**: `services/company-registry.js` (560 LOC)
- **Features**:
  - Global registry database (registry.db) tracking all companies
  - Company creation with automatic database init
  - User-to-company mapping
  - Admin approval workflows
  - LLM sharing configuration
  - Company copy/migration requests
  - Admin session tracking
- **Status**: COMPLETE

### 4. Authentication & Company Routes
- **File**: `routes/auth-routes.js` (400 LOC)
- **Endpoints Implemented**:
  - `POST /api/login` - Multi-company login with company selection
  - `POST /api/companies/create` - New company setup (auto-creates admin)
  - `GET /api/companies/list` - Public company listing
  - `GET /api/companies/:id` - Company details
  - `GET /api/companies/:id/admins` - Get company admins
  - `POST /api/companies/:id/users` - Add user (admin only, max 2 admins)
  - `POST /api/companies/:id/copy-request` - Create copy request
  - `POST /api/companies/:id/approve-copy/:requestId` - Approve copy (admin only)
- **Status**: COMPLETE

### 5. Updated Login UI
- **File**: [login.html](login.html)
- **Features**:
  - Tab navigation (Sign In / New Company)
  - Company selection dropdown for login
  - New Company Setup form:
    - Company name, industry, description
    - First user forced as 'admin'
    - Password confirmation
    - Industry selection
  - Tab switching with tab-button styling
- **Status**: COMPLETE

### 6. Company Setup Wizard (Partial)
- **File**: [company-setup.html](company-setup.html)
- **Started**: Structure created for:
  - Industry selection with growth charts
  - Agent hiring batch selection
  - Position-based templates per industry
  - Copy from existing company
  - LLM sharing warnings
- **Status**: IN PROGRESS (needs completion)

---

## 📋 REMAINING TASKS

### Phase 2: Agent Management & Onboarding

#### Task: Create Industry Templates with Charts
```sql
-- Each industry has:
- Required positions (CTO, Engineer, DevOps, etc.)
- Growth stages (Startup → Scale → Enterprise)
- Recommended hiring order
- Chart visualization (SVG or Canvas)
```

**Implementation**:
1. Create `agents/industry-templates.js` (500 LOC)
   - Industry data with positions and growth stages
   - Chart generation for visualization
   - Template management

2. Update `routes/agent-routes.js` with:
   - `GET /api/agents/templates/:industry` - Get template
   - `GET /api/agents/templates/chart/:industry` - Get chart SVG
   - `POST /api/agents/batch-deploy` - Deploy multiple agents

3. Create `models/agent-onboarding.js`:
   - Track onboarding progress per agent
   - Step-by-step progression
   - Training data upload
   - Model fine-tuning status
   - Completion validation

#### Task: Agent Batch Deployment
- Create `POST /api/companies/:id/batch-deploy` endpoint
- Process each agent through creation flow
- Initialize onboarding process
- Assign to default LLM model
- Create default settings per agent

#### Task: Company Copying with Approval
- `POST /api/companies/:sourceId/copy-request` - Request copy
- `GET /api/companies/:id/pending-approvals` - Get pending requests
- `POST /api/companies/:id/approve-copy/:requestId` - Approve
- Copy operation:
  - Duplicate all agents
  - Duplicate settings
  - Create fresh LLM instance OR link to shared LLM
  - Preserve DLP settings

### Phase 3: Agent Onboarding Process

#### Task: Onboarding UI
1. Create `agent-onboarding.html`:
   - Step 1: Upload training data (drag-drop)
   - Step 2: Configure system prompt
   - Step 3: Select voice
   - Step 4: Fine-tune settings
   - Step 5: Test conversation
   - Step 6: Deploy

2. Create `agents/onboarding-steps.js`:
   - Handle each step's logic
   - Validate completion
   - Store progress

3. Update `routes/onboarding-routes.js`:
   - `POST /api/agents/:id/upload-training` - Upload RAG data
   - `POST /api/agents/:id/configure-prompt` - Set system prompt
   - `POST /api/agents/:id/test-chat` - Test conversation
   - `GET /api/agents/:id/onboarding/status` - Get progress
   - `POST /api/agents/:id/onboarding/complete` - Mark complete

### Phase 4: Settings & Company-Specific Configuration

#### Task: Per-Company Settings
- Update `settings.html` to be company-scoped
- Settings stored in company database, not global
- User sees only their company's agents
- Settings apply to all agents in company (with per-agent overrides)

#### Task: Admin Controls
- Create `admin-panel.html`:
  - View all users in company
  - Approve/reject user additions
  - Manage company copy requests
  - Configure LLM sharing
  - View audit logs

### Phase 5: LLM Sharing & DLP

#### Task: LLM Model Management
1. Create `services/llm-manager.js`:
   - Independent LLM per company
   - Shared LLM (with DLP warnings)
   - Fine-tuning tracking per LLM
   - Training data isolation

2. Endpoints:
   - `GET /api/llms/config` - Get company's LLM config
   - `POST /api/llms/share` - Setup sharing
   - `GET /api/llms/health` - Check LLM status

#### Task: DLP Warnings
- When company A wants to share LLM with company B:
  - Display warning: "This may share proprietary data training"
  - Require explicit acknowledgment
  - Log in audit trail
  - Allow company admin to revoke sharing

### Phase 6: Database Migration & User Management

#### Task: First User Setup (Admin Enforcement)
- When creating company, auto-create 'admin' user
- First real user must have username 'admin'
- Allow password setting
- First login creates admin account

#### Task: Max Admin Limit
- Prevent adding >2 admins per company
- If 2 admins exist, only admins can add users
- Audit log admin additions

### Phase 7: Testing & Validation

#### Task: End-to-End Tests
1. Company creation with admin user
2. Login to company
3. View company-specific agents
4. Deploy batch of agents
5. Run agent onboarding
6. Test agent conversations
7. Verify user isolation (User A can't see Company B's data)
8. Test copy request workflow
9. Test admin approval flows
10. Test LLM sharing with warnings

---

## 🔧 SERVER.JS INTEGRATION POINTS

The main `server.js` file needs these changes:

```javascript
// At top level, import new services
const authRoutes = require('./routes/auth-routes');
const agentRoutes = require('./routes/agent-routes');
const onboardingRoutes = require('./routes/onboarding-routes');
const adminRoutes = require('./routes/admin-routes');

// Update authenticate middleware to include companyId
const authenticate = (req, res, next) => {
  // ... verify token
  // Extract companyId from token
  // Add to req.user.companyId
}

// Register routes
app.use('/api', authRoutes);
app.use('/api', agentRoutes);
app.use('/api', onboardingRoutes);
app.use('/api', adminRoutes);

// Update all existing endpoints to use CompanyDB
// Example: Instead of db.get(...), use CompanyDB.get(req.user.companyId, ...)
```

## 📊 DATA FLOW DIAGRAM

```
LOGIN PAGE
├─ Select existing company → Login with credentials
└─ New Company Setup → Enter company info → Create admin

COMPANY DASHBOARD (Company-specific)
├─ View Company Agents (from company-specific DB)
├─ Add New Agent
│  └─ Choose Industry → Select Positions → Batch Deploy
│     └─ Agent Onboarding Flow
├─ Manage Team Members
│  └─ Add User (max 2 admins)
├─ Copy from Another Company
│  ├─ Request copy
│  └─ (Source company admin approves)
│     ├─ Copy agents config
│     └─ Link/Share LLM (with DLP warning)
└─ Company Settings
   ├─ LLM Configuration
   ├─ RAG Settings
   ├─ Voice Settings
   └─ Tool Integrations
```

---

## 🚀 PRIORITY IMPLEMENTATION ORDER

1. **HIGH PRIORITY** (Users blocked without these):
   - Complete company-setup.html
   - Agent batch deployment endpoint
   - Agent creation endpoints
   - User isolation verification

2. **MEDIUM PRIORITY** (Core features):
   - Onboarding process
   - Copy/approval workflow
   - Admin panel
   - Settings management

3. **LOW PRIORITY** (Nice to have):
   - LLM sharing UI/flows
   - Advanced chart visualization
   - Analytics dashboards
   - Audit logging UI

---

## ✅ CHECKLIST FOR COMPLETION

- [ ] Company setup page fully functional
- [ ] Agent batch deployment working
- [ ] Agent onboarding process complete
- [ ] Copy request with admin approval
- [ ] LLM sharing configured
- [ ] User isolation verified (User A can't access Company B data)
- [ ] Admin user limit enforced (max 2 per company)
- [ ] All endpoints use CompanyDB for company isolation
- [ ] Server.js refactored to <1000 LOC (split into route files)
- [ ] Full end-to-end testing of all workflows
- [ ] Production database backup strategy

---

## 📁 NEW FILE STRUCTURE AFTER COMPLETION

```
opt/luca-express/
├─ server.js (refactored, <1000 LOC)
├─ login.html (✅ updated)
├─ company-setup.html (⏳ needs completion)
├─ company-dashboard.html (new)
├─ agent-onboarding.html (new)
├─ admin-panel.html (new)
├─ routes/
│  ├─ auth-routes.js (✅ created)
│  ├─ agent-routes.js (new)
│  ├─ onboarding-routes.js (new)
│  └─ admin-routes.js (new)
├─ services/
│  ├─ company-db.js (✅ created)
│  ├─ company-registry.js (✅ created)
│  ├─ industry-templates.js (new)
│  ├─ llm-manager.js (new)
│  └─ agent-manager.js (new)
├─ models/
│  ├─ agent-onboarding.js (new)
│  └─ company-copy.js (new)
└─ data/
   ├─ registry.db (✅ created at runtime)
   └─ companies/
      ├─ app-company-1.db (✅ created per company)
      └─ app-company-2.db
```

---

## 🎯 SUCCESS CRITERIA

1. ✅ Each user only sees their own company's data
2. ✅ Settings persist per-user, per-company
3. ✅ Can create multiple companies with different settings
4. ✅ Can copy company with approval workflow
5. ✅ Admin limit enforced (max 2 per company)
6. ✅ Agent hiring via charts and batch deployment
7. ✅ Complete onboarding flow for each agent
8. ✅ LLM sharing with DLP warnings
9. ✅ All code complies with 1000 LOC file limit
10. ✅ Zero data leakage between companies

