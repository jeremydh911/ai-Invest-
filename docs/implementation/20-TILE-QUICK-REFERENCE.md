# Agentic Empire - 20 Tile Quick Reference

## 🎯 Navigation Guide

All tiles are accessible from the main dashboard at `/dashboard.html`. Each tile is a small, responsive square that routes to a feature page.

---

## 📱 Tile Layout

**3 sections with responsive grid:**
1. **Core Features** (8 tiles) - Essential AI communication & config
2. **Admin & Management** (8 tiles) - Team, data, analytics, automation
3. **Configuration** (4 tiles) - System tuning & resource management

---

## 🔗 All 20 Tiles & Routes

### Core Features (Left side, Top section)

| # | Tile | URL | Icon | Purpose |
|---|------|-----|------|---------|
| 1 | Chat | `/chat.html` | 💬 | Text conversations with AI personas |
| 2 | Canvas | `/canvas.html` | 🎨 | Visual diagram/whiteboard workspace |
| 3 | Personas | `/personas.html` | 👤 | Create & manage AI characters |
| 4 | Search | `/search.html` | 🔍 | Global search across all data |
| 5 | Voice | `/voice-chat.html` | 🎤 | Speak to AI, get audio responses |
| 6 | Logs | `/logs.html` | 📜 | Audit trail of all system events |
| 7 | Billing | `/billing.html` | 💰 | Subscription & cost tracking |
| 8 | Settings | `/settings.html` | ⚙️ | System configuration & preferences |

### Admin & Management (Middle section)

| # | Tile | URL | Icon | Purpose |
|---|------|-----|------|---------|
| 9 | Users | `/team.html` | 👥 | Team member management & RBAC |
| 10 | Data | `/data-management.html` | 💾 | RAG documents & embeddings |
| 11 | Analytics | `/analytics.html` | 📈 | Usage metrics & insights |
| 12 | Workflows | `/workflows.html` | ⚡ | Build & execute agent chains |
| 13 | Reports | `/reports.html` | 📊 | Generate reports from templates |
| 14 | Maintenance | `/system-maintenance.html` | 🔧 | Backups, updates, health checks |
| 15 | Permissions | `/permissions.html` | 🔐 | Role-based access control |
| 16 | Org Chart | `/org-chart.html` | 🏢 | Organization structure view |

### Configuration (Bottom section)

| # | Tile | URL | Icon | Purpose |
|---|------|-----|------|---------|
| 17 | Quotas | `/quotas.html` | 📏 | Usage limits & quota management |
| 18 | Templates | `/templates.html` | 📋 | Prompt & workflow templates |
| 19 | Scheduler | `/scheduler.html` | ⏰ | Cron jobs & task scheduling |
| 20 | Files | `/file-manager.html` | 📁 | File upload, browse, manage |

---

## 🚀 Feature Details

### 1. Chat (💬)
- **What**: AI conversation interface
- **Use**: Talk to AI personas in real-time
- **Features**: Multi-turn conversations, streaming responses, persona selection
- **API**: GET `/api/personas`, POST `/api/chat`

### 2. Canvas (🎨) **NEW**
- **What**: Visual workspace for diagramming
- **Use**: Draw workflows, org charts, mind maps
- **Features**: Shapes, connectors, drag-and-drop, export
- **API**: POST `/api/canvas`, GET `/api/canvas/:id`

### 3. Personas (👤)
- **What**: AI character management
- **Use**: Create & customize AI personalities
- **Features**: CRUD personas, system prompts, knowledge injection
- **API**: GET/POST/PUT/DELETE `/api/personas`

### 4. Search (🔍) **NEW**
- **What**: Global search engine
- **Use**: Find conversations, documents, logs quickly
- **Features**: Full-text search, filters, relevance ranking
- **API**: POST `/api/search`, GET `/api/search/results`

### 5. Voice (🎤)
- **What**: Voice interaction mode
- **Use**: Speak to AI, get audio responses
- **Features**: Speech-to-text, text-to-speech, real-time streaming
- **API**: POST `/api/voice/transcribe`, POST `/api/voice/synthesize`

### 6. Logs (📜) **NEW**
- **What**: System audit logs
- **Use**: Track all actions for compliance & debugging
- **Features**: Filter, search, paginate, export CSV
- **API**: GET `/api/logs`, POST `/api/logs/export`

### 7. Billing (💰)
- **What**: Payment & subscription management
- **Use**: Manage plan, track usage, view invoices
- **Features**: Plan comparison, usage tracking, payment methods
- **API**: GET/PUT `/api/billing`, GET `/api/usage`

### 8. Settings (⚙️)
- **What**: System configuration
- **Use**: Configure RAG, LLM models, API keys
- **Features**: RAG settings, model selection, API config
- **API**: GET/PATCH `/api/settings`

### 9. Users (👥)
- **What**: Team management
- **Use**: Add/remove users, assign roles, manage permissions
- **Features**: User CRUD, role assignment, activity logs
- **API**: GET/POST/PUT/DELETE `/api/users`

### 10. Data (💾) **NEW**
- **What**: RAG document management
- **Use**: Upload documents for retrieval-augmented generation
- **Features**: Upload, index, search, manage embeddings
- **API**: POST `/api/documents`, GET `/api/embeddings/status`

### 11. Analytics (📈)
- **What**: Usage & performance dashboard
- **Use**: Track metrics, costs, performance trends
- **Features**: KPIs, charts, custom reports, exports
- **API**: GET `/api/analytics/dashboard`

### 12. Workflows (⚡) **NEW**
- **What**: Workflow automation builder
- **Use**: Chain agents together for complex tasks
- **Features**: Visual builder, triggers, conditions, actions
- **API**: GET/POST/PUT `/api/workflows`

### 13. Reports (📊) **NEW**
- **What**: Report generation system
- **Use**: Create & distribute business reports
- **Features**: Templates, scheduling, PDF export, email delivery
- **API**: POST `/api/reports`, GET `/api/reports/:id`

### 14. Maintenance (🔧) **NEW**
- **What**: System administration console
- **Use**: Backups, updates, health checks
- **Features**: Backup/restore, cache clear, service health, logs
- **API**: POST `/api/system/backup`, GET `/api/system/health`

### 15. Permissions (🔐) **NEW**
- **What**: Access control management
- **Use**: Define roles and permissions
- **Features**: Role CRUD, permission matrix, enforcement
- **API**: GET/POST/PUT `/api/roles`

### 16. Org Chart (🏢) **NEW**
- **What**: Organization structure visualization
- **Use**: View company/agent hierarchy
- **Features**: Org tree, team member cards, reporting lines
- **API**: GET `/api/org/structure`, GET `/api/agents`

### 17. Quotas (📏) **NEW**
- **What**: Usage quota & limit management
- **Use**: Set resource limits per user/department
- **Features**: Quota CRUD, usage tracking, alerts
- **API**: GET/POST/PUT `/api/quotas`

### 18. Templates (📋) **NEW**
- **What**: Reusable template library
- **Use**: Start workflows/reports from templates
- **Features**: Browse, preview, use, create custom
- **API**: GET `/api/templates`, POST `/api/templates/:id/use`

### 19. Scheduler (⏰) **NEW**
- **What**: Task scheduling with cron
- **Use**: Schedule recurring jobs (backups, reports, etc)
- **Features**: Cron editor, execution history, manual trigger
- **API**: GET/POST `/api/jobs`, POST `/api/jobs/:id/run`

### 20. Files (📁) **NEW**
- **What**: File management system
- **Use**: Upload, organize, download files
- **Features**: Browse, search, upload, delete, share
- **API**: POST `/api/files/upload`, GET `/api/files`

---

## 🎨 Visual Design

### Grid Layout
```css
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}
```

### Tile Styling
- **Size**: 120px × 120px squares (aspect-ratio: 1/1)
- **Background**: White cards with subtle shadow
- **Hover**: Slight scale-up (1.05) with enhanced shadow
- **Border**: Rounded corners (8px)
- **Text**: Icon (2.5rem) + Title (0.85rem)

### Color Scheme
- **Icon**: Large emoji (varies by tile)
- **Title**: Purple (#667eea)
- **Background**: White
- **Hover**: Scale effect (no color change)

---

## 🔐 Security & Auth

**Every page includes:**
```javascript
const token = localStorage.getItem('token');
if (!token) window.location.href = '/login.html';
```

All API calls require:
```javascript
headers: { 'Authorization': `Bearer ${token}` }
```

---

## 💻 Code Patterns

### Standard Navbar
```html
<div class="navbar">
  <h1>🎨 Canvas</h1>
  <div class="navbar-menu">
    <a href="/dashboard.html">← Dashboard</a>
    <a href="/settings.html">Settings</a>
    <button onclick="logout()">Logout</button>
  </div>
</div>
```

### Logout Function
```javascript
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}
```

### Form Submission
```javascript
function saveForm(event) {
  event.preventDefault();
  const data = { /* form values */ };
  fetch('/api/endpoint', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(res => res.json()).then(data => alert('✓ Success'));
}
```

---

## 📊 Dashboard Stats

**Current Implementation Status:**
- ✅ All 20 tiles created with UI
- ✅ Responsive grid layout
- ✅ Authentication checks
- ✅ Form handling patterns
- ✅ Navbar navigation on all pages
- ⏳ API backend routes (to implement)
- ⏳ Database schema (to implement)
- ⏳ Feature logic (to implement)

**Files:**
- 20 feature pages (.html)
- 4 enterprise pages (.html)
- 1 main dashboard (dashboard.html)
- Updated styles (styles.css already exists)

**Total Lines of Code:**
- ~150-500 lines per page
- Total: ~8,000+ lines of frontend code
- Ready for backend integration

---

## 🚀 Next Steps

1. **Backend Routes** - Implement all `/api/*` endpoints
2. **Database** - Create tables for each feature
3. **Testing** - Test each tile's functionality
4. **Integration** - Connect frontend to APIs
5. **Features** - Implement core logic (scheduling, reporting, etc)

---

## 📞 Support

All pages are documented with:
- Inline comments explaining key functions
- Descriptive variable names
- Standard error handling
- User-friendly alerts
- Responsive design

**Ready for production after backend implementation.**
