# Quick Start: Multi-Company Integration Guide

## Overview
This guide walks you through integrating the completed multi-company architecture components into your existing server.js.

## Components Created

### Core Services (New)
1. `services/company-db.js` - Company database management
2. `services/company-registry.js` - Global company registry
3. `services/industry-templates.js` - Industry templates with positions

### Routes (New)
1. `routes/auth-routes.js` - Authentication & company management
2. `routes/agent-routes.js` - Agent creation & batch deployment

### UI (Updated)
1. `login.html` - Multi-company login with company creation
2. `company-setup.html` - Company setup wizard (in progress)

---

## Integration Steps

### Step 1: Install Dependencies
All required packages are already installed, but verify:
```bash
npm list sqlite3 jsonwebtoken bcryptjs express
```

### Step 2: Update server.js Entry Point

Add these imports at the top (around line 1-20):
```javascript
// New multi-company services
const authRoutes = require('./routes/auth-routes');
const agentRoutes = require('./routes/agent-routes');
const CompanyRegistry = require('./services/company-registry');
const CompanyDB = require('./services/company-db');
```

### Step 3: Register New Routes

Find where existing routes are defined (around line 110) and add:
```javascript
// Multi-company routes (add these BEFORE individual endpoint handlers)
app.use('/api', authRoutes);
app.use('/api', agentRoutes);
```

### Step 4: Update Authentication Middleware

Find the authenticate middleware (around line 85) and UPDATE it:

```javascript
// Updated auth middleware with company context
const authenticate = (req, res, next) => {
  if (process.env.AUTH_ENABLED !== 'true') return next();
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // Contains: id, username, companyId, role, isAdmin
    req.companyId = user.companyId; // Shorthand
    next();
  });
};
```

### Step 5: Replace Global DB Queries

**OLD PATTERN** (current code):
```javascript
db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
  // ...
});
```

**NEW PATTERN** (multi-company):
```javascript
// For logged-in users:
const user = await CompanyDB.get(
  req.user.companyId, 
  'SELECT * FROM users WHERE id = ?', 
  [userId]
);

// For global registry queries:
const company = await CompanyRegistry.getCompany(companyId);
```

### Step 6: Update Existing Endpoints

For any endpoint that currently uses the global `db`, update to use CompanyDB:

**Example: Get user settings**
```javascript
// OLD
app.get('/api/settings', authenticate, (req, res) => {
  db.get('SELECT * FROM settings WHERE user_id = ?', [req.user.id], ...);
});

// NEW
app.get('/api/settings', authenticate, async (req, res) => {
  const settings = await CompanyDB.get(
    req.user.companyId,
    'SELECT * FROM settings WHERE user_id = ?',
    [req.user.id]
  );
  res.json(settings);
});
```

### Step 7: Add Company Context Validation

For all protected endpoints, validate company access:
```javascript
app.get('/api/companies/:companyId/agents', authenticate, async (req, res) => {
  // CRITICAL: Validate user has access to this company
  if (req.user.companyId !== parseInt(req.params.companyId)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Now safe to query company-specific data
  const agents = await CompanyDB.all(req.user.companyId, ...);
  res.json(agents);
});
```

---

## Data Migration (for existing users)

If migrating from single-database to multi-company:

### Option A: Create Default Company
```javascript
// In initialization code, once during migration:
const companyId = await CompanyRegistry.createCompany({
  name: 'Default Company',
  description: 'Migrated from single-database setup',
  industry: 'Technology',
  createdBy: 'system'
});

// Then create company_users entries for all existing users
// And copy their data to the company-specific database
```

### Option B: Keep Single Company
Simply create one company and route all users to it:
```javascript
// In login endpoint
const defaultCompanyId = 1; // Created during init
const token = jwt.sign({
  ...userPayload,
  companyId: defaultCompanyId
}, ...);
```

---

## Testing Checklist

After integration, test these scenarios:

### ✅ Login & Company Selection
- [ ] Navigate to login.html
- [ ] See list of companies
- [ ] Select a company
- [ ] Login with valid credentials
- [ ] Redirected to dashboard.html

### ✅ Company Creation
- [ ] Click "New Company" tab
- [ ] Fill out company details
- [ ] Set admin password
- [ ] Submit
- [ ] Auto-login as admin user

### ✅ User Isolation
- [ ] Create 2 companies
- [ ] Add different users to each
- [ ] Login as User A (Company 1)
- [ ] Verify User A can't see Company 2 agents
- [ ] Logout, login as User B (Company 2)
- [ ] Verify User B can't see Company 1 agents

### ✅ Batch Deployment
- [ ] Login to company
- [ ] Go to company setup
- [ ] Select industry
- [ ] Choose positions
- [ ] Click deploy
- [ ] Agents created and visible in dashboard

### ✅ Admin Limits
- [ ] Create company
- [ ] Add second admin user
- [ ] Try to add third admin
- [ ] Should be blocked (max 2)

---

## Common Integration Errors & Fixes

### Error: "Cannot find module 'company-db.js'"
**Fix**: Ensure files are in correct paths:
- `services/company-db.js` ✅
- `services/company-registry.js` ✅
- `routes/auth-routes.js` ✅

### Error: "companyId is undefined"
**Fix**: Ensure JWT token includes companyId:
```javascript
const token = jwt.sign({
  id: user.id,
  username: user.username,
  companyId: parseInt(companyId), // Add this
  role: user.role
}, ...);
```

### Error: "Database table does not exist"
**Fix**: Ensure company database is initialized:
```javascript
// When creating company, this runs automatically:
await CompanyDB.initializeCompanyDatabase(companyId, companyName);
```

### Error: "User can see other companies' data"
**Fix**: Add company validation to ALL endpoints:
```javascript
// ALWAYS check before querying:
if (req.user.companyId !== parseInt(companyId)) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## Performance Optimization Tips

1. **Cache Company Connections**
   - CompanyDB already caches connections internally ✅
   - Connections persist for the session

2. **Batch Queries**
   - Use `CompanyDB.all()` instead of multiple `.get()` calls
   - Reduces database round trips

3. **Index Creation**
   - Consider adding indexes to company-specific DBs:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
   CREATE INDEX IF NOT EXISTS idx_agents_company ON agents(company_id);
   ```

4. **Connection Pooling**
   - Current implementation (1 connection per company) is efficient for small-medium scale
   - For large scale, consider connection pool per company

---

## Security Checklist

Before deploying to production:

- [ ] All endpoints validate company context
- [ ] No query executes without company scope
- [ ] JWT tokens include companyId
- [ ] Admin count limited to 2 per company
- [ ] Audit logging captures all user actions
- [ ] DLP warnings shown for LLM sharing
- [ ] Settings are per-company, not global
- [ ] Passwords hashed with bcrypt (10 rounds minimum)
- [ ] HTTPS enabled in production
- [ ] CORS properly configured for your domain

---

## Deployment Steps

1. **Backup Current Database**
   ```bash
   cp data/app.db data/app.db.backup.$(date +%s)
   ```

2. **Add New Services & Routes**
   - Copy all new files to appropriate directories
   - Verify file paths in requires()

3. **Update server.js**
   - Add imports
   - Register routes
   - Update middleware
   - Convert endpoints to async/await

4. **Test Thoroughly**
   - Run through all checklist items above
   - Test with multiple users and companies

5. **Deploy**
   - Restart server: `node server.js`
   - Monitor logs for errors
   - Verify all endpoints working

6. **Rollback Plan**
   - Keep backup of old server.js
   - Keep backup of database
   - Have git history to revert changes

---

## File Size Compliance

Current implementation maintains the 1000 LOC code standard:

| File | Lines | Status |
|------|-------|--------|
| server.js | 4000 | ⚠️ NEEDS SPLITTING |
| services/company-db.js | 520 | ✅ OK |
| services/company-registry.js | 560 | ✅ OK |
| services/industry-templates.js | 650 | ✅ OK |
| routes/auth-routes.js | 400 | ✅ OK |
| routes/agent-routes.js | 400 | ✅ OK |

**Next**: Split server.js into multiple route files to comply with standard.

---

## Questions?

Refer to these documents for details:
- [MASTER_PROGRAMMING_GUIDE.md](../MASTER_PROGRAMMING_GUIDE.md) - Code organization
- [MULTI_COMPANY_IMPLEMENTATION_ROADMAP.md](../MULTI_COMPANY_IMPLEMENTATION_ROADMAP.md) - Full roadmap
- [IMPLEMENTATION_STATUS_REPORT.md](../IMPLEMENTATION_STATUS_REPORT.md) - Current status

---

**Version**: 1.0  
**Last Updated**: January 20, 2026  
**Status**: Ready for Integration ✅
