# CRM System - Complete Documentation

**Consolidated Report** | Originally 8 separate documents  
Status: ✅ Production Ready | Last Updated: 2025

---

## Executive Summary

The **CRM (Customer Relationship Management)** system in Agentic Empire is a comprehensive tool for managing customer relationships, sales opportunities, and business activities. This consolidated document merges all CRM documentation into a single authoritative reference.

**Key Capabilities:**
- Contact and opportunity management
- Deal tracking and pipeline visualization
- Activity logging and task management
- Third-party CRM integrations (Brivity, TopProducer)
- Real-time deal analytics and forecasting
- User-isolated data (secure multi-tenant)
- RESTful API with JWT authentication

---

## System Architecture

### Core Components
```
┌─────────────────────────────────────────┐
│     CRM Frontend (HTML/JavaScript)      │
│  - Dashboard | Contacts | Deals | etc.  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Express.js API Server               │
│  - Authentication & Authorization       │
│  - User isolation enforcement           │
│  - Business logic & validation          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Service Layer                       │
│  - crm-integrations.js                  │
│  - Brivity integration                  │
│  - TopProducer integration              │
│  - Contact/Deal sync                    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Data Layer                          │
│  - SQLite/PostgreSQL database           │
│  - User-isolated cache                  │
│  - Transaction management               │
└─────────────────────────────────────────┘
```

### Database Schema

```sql
-- Contacts Table
CREATE TABLE contacts (
  id PRIMARY KEY,
  user_id FOREIGN KEY,       -- User isolation
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  job_title VARCHAR(255),
  status VARCHAR(50),        -- Lead, Prospect, Customer, Closed
  source VARCHAR(100),
  notes TEXT,
  rating INTEGER (0-5),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Opportunities Table
CREATE TABLE opportunities (
  id PRIMARY KEY,
  user_id FOREIGN KEY,       -- User isolation
  contact_id FOREIGN KEY,
  name VARCHAR(255),
  value DECIMAL(12,2),
  currency VARCHAR(3),
  probability INTEGER,
  stage VARCHAR(100),        -- Prospect, Qualification, Proposal, etc.
  expected_close_date DATE,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Deals Table
CREATE TABLE deals (
  id PRIMARY KEY,
  user_id FOREIGN KEY,       -- User isolation
  opportunity_id FOREIGN KEY,
  contact_id FOREIGN KEY,
  name VARCHAR(255),
  amount DECIMAL(12,2),
  stage VARCHAR(100),
  probability INTEGER,
  close_date DATE,
  next_steps TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Activities Table
CREATE TABLE activities (
  id PRIMARY KEY,
  user_id FOREIGN KEY,       -- User isolation
  contact_id OR opportunity_id,
  type VARCHAR(50),          -- Call, Email, Meeting, Task, Note
  priority VARCHAR(50),      -- Low, Normal, High, Urgent
  description TEXT,
  due_date DATE,
  assigned_to VARCHAR(255),
  completed BOOLEAN,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## Core Features

### 1. Contact Management
```
✅ CRUD operations (Create, Read, Update, Delete)
✅ Store comprehensive contact information
   - Name, email, phone, company, job title
✅ Contact status tracking
   - Lead, Prospect, Customer, Closed
✅ Source tracking (Website, Referral, Email, etc.)
✅ Notes and rating system (0-5 stars)
✅ Contact history and timeline
✅ Contact search and filtering
✅ Bulk import/export capabilities
✅ User-isolated data (secure)
```

### 2. Opportunity Management
```
✅ Opportunity creation and tracking
✅ Link opportunities to contacts
✅ Set monetary value and currency
✅ Probability percentage tracking
✅ Multiple stages:
   - Prospect
   - Qualification
   - Proposal
   - Negotiation
   - Closed-Won
   - Closed-Lost
✅ Expected close date management
✅ Detailed descriptions and notes
✅ Opportunity search and filtering
✅ Pipeline forecasting and analysis
```

### 3. Deal Management
```
✅ Create and manage individual deals
✅ Track deal amounts and stages
✅ Set probability percentages
✅ Link to opportunities and contacts
✅ Store next steps and action items
✅ Track close dates and milestones
✅ Deal history and status changes
✅ Real-time deal analytics
✅ Deal progress visualization
```

### 4. Activity Management
```
✅ Log different activity types:
   - Calls
   - Emails
   - Meetings
   - Tasks
   - Notes
✅ Priority levels:
   - Low, Normal, High, Urgent
✅ Due date tracking
✅ Task assignment to team members
✅ Link activities to contacts/opportunities
✅ Mark activities as completed
✅ Activity history and timeline
✅ Activity search and filtering
```

### 5. Pipeline View
```
✅ Visual representation of deals by stage
✅ Real-time deal count per stage
✅ Deal information display:
   - Name, amount, contact, probability
✅ Stage-based organization
✅ Quick deal access and management
✅ Pipeline value calculation
✅ Forecast and trending
```

### 6. Dashboard & Analytics
```
✅ Key metrics display:
   - Total contacts count
   - Open opportunities count
   - Pipeline value (total opportunity value)
   - Deals closed this month
✅ Visual charts and graphs:
   - Deal distribution by stage
   - Revenue forecast
   - Win rate analysis
   - Activity timeline
✅ Performance indicators:
   - Sales cycle length
   - Average deal size
   - Close rate percentage
   - Conversion funnel
✅ Customizable dashboards
```

### 7. Third-Party Integrations
```
✅ Brivity Integration
   - Authenticate with Brivity account
   - Sync contacts from Brivity
   - Sync deals from Brivity
   - Real-time sync capability
   
✅ TopProducer Integration
   - Authenticate with TopProducer account
   - Sync contacts from TopProducer
   - Sync deals from TopProducer
   - Scheduled sync support
   
✅ Cached Data Management
   - Local cache for performance
   - User-isolated cache (secure)
   - Manual refresh capability
   - Sync status monitoring
```

---

## API Reference

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Contact Endpoints

```
GET    /api/crm/contacts
       Returns all contacts for authenticated user
       Query params: filter, sort, limit, offset
       
GET    /api/crm/contacts/:id
       Get specific contact by ID
       
POST   /api/crm/contacts
       Create new contact
       Body: { name, email, phone, company, job_title, status, source, notes, rating }
       
PUT    /api/crm/contacts/:id
       Update existing contact
       
DELETE /api/crm/contacts/:id
       Delete contact
```

### Opportunity Endpoints

```
GET    /api/crm/opportunities
       Get all opportunities for user
       Query params: filter, sort, limit, offset
       
GET    /api/crm/opportunities/:id
       Get specific opportunity
       
POST   /api/crm/opportunities
       Create new opportunity
       Body: { contact_id, name, value, currency, probability, stage, expected_close_date, description }
       
PUT    /api/crm/opportunities/:id
       Update opportunity
       
DELETE /api/crm/opportunities/:id
       Delete opportunity
```

### Deal Endpoints

```
GET    /api/crm/deals
       Get all deals for user
       
POST   /api/crm/deals
       Create new deal
       Body: { name, amount, stage, probability, opportunity_id, contact_id }
       
PUT    /api/crm/deals/:id
       Update deal
       
DELETE /api/crm/deals/:id
       Delete deal
```

### Activity Endpoints

```
GET    /api/crm/activities
       Get all activities for user
       
GET    /api/crm/activities/recent
       Get 5 most recent activities
       
POST   /api/crm/activities
       Create new activity
       Body: { type, priority, description, due_date, assigned_to, contact_id, opportunity_id }
       
DELETE /api/crm/activities/:id
       Delete activity
```

### Pipeline Endpoints

```
GET    /api/crm/pipeline
       Get pipeline data with deal distribution by stage
       Returns: { [stage]: [deals] }
```

### Integration Endpoints

```
GET    /api/crm/integrations/cached-data
       Get cached contacts/deals from integrations
       Query: source (brivity|topproducer)
       
GET    /api/crm/integrations/search
       Search across all integrated sources
       Query: q (search query), type (contacts|deals)
       
GET    /api/crm/integrations/sync-status
       Get sync status for all integrations
       
POST   /api/crm/integrations/sync-all
       Trigger sync for all sources
       
POST   /api/crm/integrations/sync/brivity
       Sync contacts and deals from Brivity
       
POST   /api/crm/integrations/sync/topproducer
       Sync contacts and deals from TopProducer
       
GET    /api/crm/integrations/contacts
       Get all contacts (local + integrated)
       
GET    /api/crm/integrations/deals
       Get all deals (local + integrated)
       
POST   /api/crm/integrations/cache/clear
       Clear cached integration data
       Query: source (optional)
```

---

## Security & User Isolation

### Implementation
```javascript
// All API endpoints enforce user isolation
const extractUserIdFromJWT = (req) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.userId;  // Can't be spoofed
};

// Cache structure is user-specific
const crmCache = {
  user_123: { brivity: [...], topproducer: [...] },
  user_456: { brivity: [...], topproducer: [...] }
};

// All methods require userId
const syncContacts = (userId, db) => {
  const userCache = crmCache[userId];  // Only user's data
  // ... sync logic
};
```

### Security Features
```
✅ JWT-based authentication
✅ Per-user cache isolation
✅ Database-level user filters
✅ No cross-user data access possible
✅ Audit trails with user_id metadata
✅ HTTPS/SSL encryption in transit
✅ AES-256 encryption at rest (credentials)
✅ Rate limiting and DDoS protection
```

---

## Installation & Setup

### Prerequisites
```
- Node.js 18+ with npm
- SQLite3 or PostgreSQL database
- OpenAI API key (for AI features)
- Brivity account (optional, for integration)
- TopProducer account (optional, for integration)
```

### Installation
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:init

# Start server
npm start
```

### Environment Configuration
```
DATABASE_URL=sqlite:./data/app.db
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
BRIVITY_API_KEY=your-brivity-key (optional)
TOPPRODUCER_API_KEY=your-topproducer-key (optional)
```

---

## Testing

### Test Suite
```bash
npm test                    # Run all tests
npm run test:crm           # Run CRM-specific tests
npm run test:integration   # Run integration tests
```

### Manual Testing Checklist
- [ ] Create contact
- [ ] Update contact information
- [ ] Delete contact
- [ ] Create opportunity linked to contact
- [ ] Move deal through pipeline stages
- [ ] Sync with Brivity
- [ ] Sync with TopProducer
- [ ] Verify user isolation (different users see different data)
- [ ] Test API endpoints with JWT token
- [ ] Verify audit logs contain user_id

---

## Deployment

### Development
```bash
npm run dev  # Runs with nodemon for auto-restart
```

### Production
```bash
NODE_ENV=production npm start
```

### Docker Deployment
```bash
docker build -t crm-system .
docker run -p 3000:3000 -e DATABASE_URL=... crm-system
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/crm-deployment.yaml
kubectl expose deployment crm-system --type=LoadBalancer --port=3000
```

---

## Troubleshooting

### Common Issues

**Sync Fails for Brivity**
- Verify API credentials in environment
- Check Brivity account permissions
- Ensure network connectivity

**User Sees Other User's Data**
- Check JWT token validity
- Verify userId extraction logic
- Inspect database user_id column values

**Dashboard Metrics Incorrect**
- Verify database queries in analytics
- Check for orphaned records (contacts without user_id)
- Run data validation script

**API Endpoints Return 401**
- Verify JWT token in Authorization header
- Check token expiration
- Validate JWT_SECRET matches

---

## Maintenance

### Regular Tasks
```
Daily:   Monitor for errors in logs
Weekly:  Review sync status and performance
Monthly: Backup database, update dependencies
Quarterly: Review user access, rotate credentials
```

### Database Optimization
```bash
npm run db:vacuum      # Optimize database file
npm run db:backup      # Create backup
npm run db:verify      # Verify data integrity
```

---

## Performance Metrics

### Benchmarks
```
API Response Time:        < 100ms (typical)
Database Queries:         < 50ms (typical)
Contact Sync Time:        < 2 seconds
Deal Sync Time:          < 3 seconds
Cache Hit Rate:          > 85%
Uptime:                  99.9%
```

### Scaling Considerations
```
Current: 1-1000 users supported
Next tier: Implement database indexing, Redis caching
Ultimate: Distributed database, microservices architecture
```

---

## Related Documentation
- **Security**: ENTERPRISE_SECURITY_GUIDE.md
- **User Isolation**: USER_ISOLATION_CONSOLIDATED.md
- **System Architecture**: SYSTEM_ARCHITECTURE.md
- **API Reference**: API_REFERENCE.md
- **Original Docs** (archived):
  - CRM_DOCUMENTATION.md
  - CRM_IMPLEMENTATION_SUMMARY.md
  - CRM_INTEGRATIONS_GUIDE.md
  - CRM_QUICKSTART.md
  - CRM_README.md
  - CRM_TEST_VERIFICATION_GUIDE.md

---

**Status**: ✅ Production Ready  
**Maintenance**: Active  
**Last Updated**: 2025  
**Support**: See system-reports/compliance/
