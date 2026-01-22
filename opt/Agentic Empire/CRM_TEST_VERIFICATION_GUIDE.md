# 🧪 CRM Integration System - Comprehensive Test & Verification Guide

**Date**: January 20, 2026  
**Version**: 2.0.0  
**Status**: ✅ READY FOR TESTING

---

## 📋 Pre-Testing Checklist

- [ ] Server is running on port 3000
- [ ] Database is initialized
- [ ] All files are created
- [ ] Environment variables are set
- [ ] Network connectivity is available
- [ ] JWT authentication is working

---

## 🧪 Unit Tests

### 1. File Existence Tests

```bash
# Verify all new files exist
ls -lh opt/agentic-empire/crm-integrations.html
ls -lh opt/agentic-empire/crm-advanced.html
ls -lh opt/agentic-empire/services/crm-integrations.js
```

**Expected**: All files should exist with sizes >20KB

### 2. Syntax Validation

```bash
# Check server.js syntax
cd opt/agentic-empire
node -c server.js

# Check integration module
node -c services/crm-integrations.js
```

**Expected**: No output (success) or error messages (failure)

### 3. Module Loading Test

```bash
# Test that modules can be loaded
node -e "require('./services/crm-integrations.js'); console.log('✅ crm-integrations.js loaded')"
```

**Expected**: `✅ crm-integrations.js loaded`

---

## 🌐 Integration Tests

### 1. Server Startup Test

```bash
# Start the server
cd opt/agentic-empire
node server.js
```

**Expected Output**:
```
🚀 HTTP Server listening on http://localhost:3000
Access the application at:
  Local: http://localhost:3000
```

### 2. Route Access Tests

```bash
# Test dashboard
curl http://localhost:3000/dashboard.html

# Test CRM page
curl http://localhost:3000/crm.html

# Test CRM integrations page
curl http://localhost:3000/crm-integrations.html

# Test advanced CRM
curl http://localhost:3000/crm-advanced.html
```

**Expected**: HTTP 200 responses with HTML content

### 3. Authentication Test

```bash
# Get auth token (use your actual credentials)
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Verify token is valid
echo "Token: $TOKEN"
```

**Expected**: JWT token (long alphanumeric string)

---

## 🔗 API Endpoint Tests

### Setup
```bash
# Set token variable
export TOKEN="your_jwt_token_here"
BASE_URL="http://localhost:3000/api/crm/integrations"
```

### 1. Get Sync Status

```bash
curl "$BASE_URL/sync-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "timestamp": "2026-01-20T10:30:00Z",
  "status": {
    "brivity": {
      "status": "idle",
      "lastSync": null,
      "contactCount": 0,
      "dealCount": 0
    },
    "topproducer": {
      "status": "idle",
      "lastSync": null,
      "contactCount": 0,
      "dealCount": 0
    },
    "local": {
      "contactCount": 0,
      "dealCount": 0
    }
  }
}
```

### 2. Get Cached Data

```bash
curl "$BASE_URL/cached-data" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: All sources with empty arrays initially

### 3. Search (Before Sync)

```bash
curl "$BASE_URL/search?q=test&type=contact" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "success": true,
  "results": {
    "brivity": [],
    "topproducer": [],
    "local": []
  },
  "total": 0
}
```

### 4. Get Contacts

```bash
curl "$BASE_URL/contacts" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "success": true,
  "source": "all",
  "contacts": {},
  "count": 0
}
```

### 5. Get Deals

```bash
curl "$BASE_URL/deals" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "success": true,
  "source": "all",
  "deals": {},
  "count": 0
}
```

### 6. Clear Cache

```bash
curl -X POST "$BASE_URL/cache/clear" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"brivity"}'
```

**Expected**:
```json
{
  "success": true,
  "message": "Cache cleared for brivity",
  "timestamp": "2026-01-20T10:30:00Z"
}
```

---

## 🎯 UI/UX Tests

### 1. Dashboard Navigation
- [ ] Visit http://localhost:3000/dashboard.html
- [ ] Verify "🔗 CRM Integrations" card appears
- [ ] Click card and verify navigation to crm-integrations.html

### 2. CRM Integrations Page
- [ ] Load http://localhost:3000/crm-integrations.html
- [ ] Verify page loads without errors
- [ ] Check both Brivity and TopProducer cards display
- [ ] Verify status badges show "Disconnected"
- [ ] Check sync stats show 0 contacts/deals

### 3. Advanced CRM Page
- [ ] Load http://localhost:3000/crm-advanced.html
- [ ] Verify dashboard tab loads
- [ ] Check statistics display (0 values expected)
- [ ] Test unified search input
- [ ] Verify import buttons appear

### 4. Responsive Design
- [ ] Test on desktop (1920px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Verify all elements scale properly
- [ ] Check navigation remains accessible

---

## 🔄 Sync Tests (With Mock Data)

### 1. Add Test Contact (Local CRM)

```bash
curl -X POST "http://localhost:3000/api/crm/contacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "company": "Acme Corp",
    "status": "prospect"
  }'
```

**Expected**: Contact created with HTTP 200

### 2. Verify Contact Appears

```bash
curl "http://localhost:3000/api/crm/contacts" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Array with one contact

### 3. Search for Contact

```bash
curl "http://localhost:3000/api/crm/integrations/search?q=john&type=contact" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Contact found in "local" results

### 4. Test Sync (Requires Valid Credentials)

```bash
# Set Brivity credentials in .env first
curl -X POST "http://localhost:3000/api/crm/integrations/sync/brivity" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Sync status changes to "syncing" then "idle"

---

## ✅ Verification Checklist

### Endpoints Working
- [ ] GET /api/crm/integrations/cached-data → HTTP 200
- [ ] GET /api/crm/integrations/search → HTTP 200
- [ ] GET /api/crm/integrations/sync-status → HTTP 200
- [ ] POST /api/crm/integrations/sync-all → HTTP 200
- [ ] POST /api/crm/integrations/sync/brivity → HTTP 200 or 500
- [ ] POST /api/crm/integrations/sync/topproducer → HTTP 200 or 500
- [ ] GET /api/crm/integrations/contacts → HTTP 200
- [ ] GET /api/crm/integrations/deals → HTTP 200
- [ ] POST /api/crm/integrations/cache/clear → HTTP 200

### Authentication Working
- [ ] Login endpoint returns JWT token
- [ ] Endpoints reject requests without token
- [ ] Endpoints reject invalid tokens
- [ ] Token refresh mechanism works

### Data Isolation Working
- [ ] User 1 only sees own data
- [ ] User 2 only sees own data
- [ ] Cross-user data access blocked
- [ ] User ID validation on all queries

### Caching Working
- [ ] First sync populates cache
- [ ] Second request uses cache (< 100ms)
- [ ] Clear cache endpoint works
- [ ] Cache contains correct data

### UI Working
- [ ] Dashboard loads
- [ ] CRM pages load
- [ ] Integration page loads
- [ ] Advanced CRM loads
- [ ] Forms submit successfully
- [ ] Search works
- [ ] Sync buttons functional

---

## 📊 Performance Benchmarks

### Target Metrics
| Operation | Target | Method |
|-----------|--------|--------|
| Page load | <500ms | Cached |
| API response | <200ms | Memory |
| Search | <100ms | In-memory |
| Dashboard stats | <300ms | Cached |

### Verification
```bash
# Time API request
time curl "$BASE_URL/sync-status" \
  -H "Authorization: Bearer $TOKEN"

# Expected: real < 0.2s
```

---

## 🐛 Debugging Guide

### Check Server Logs
```bash
# Watch server output
tail -f server.log

# Look for errors
grep -i error server.log

# Check CRM operations
grep -i crm server.log
```

### Test Database
```bash
# Open SQLite3 shell
sqlite3 data/app.db

# Check CRM tables exist
.tables crm_*

# Count records
SELECT COUNT(*) FROM crm_contacts;
```

### Test API Directly
```bash
# Test with verbose output
curl -v "$BASE_URL/sync-status" \
  -H "Authorization: Bearer $TOKEN"

# Test with pretty JSON
curl -s "$BASE_URL/sync-status" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Check Environment
```bash
# Verify environment variables
printenv | grep -i crm

# Check Node version
node --version

# Check npm version
npm --version
```

---

## 🔒 Security Tests

### Authentication
- [ ] Endpoints require auth token
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Token refresh works

### Authorization
- [ ] Users can only access own data
- [ ] Users cannot modify other user's data
- [ ] Admin functions require admin role
- [ ] Rate limiting is enforced

### Data Protection
- [ ] Passwords are hashed
- [ ] API keys not logged
- [ ] SQL injection prevented
- [ ] XSS protection enabled

---

## 📝 Test Report Template

```markdown
## Test Execution Report
**Date**: [Date]
**Tester**: [Name]
**Build**: 2.0.0

### Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX
- Pass Rate: XX%

### Failed Tests
1. [Test name] - [Reason]

### Issues Found
1. [Issue] - Severity: [High/Medium/Low]

### Sign-off
Tested by: [Name]
Date: [Date]
Status: [Approved/Pending]
```

---

## 🚀 Deployment Approval Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] API endpoints respond correctly
- [ ] UI pages load without errors
- [ ] Authentication working
- [ ] User isolation verified
- [ ] Performance benchmarks met
- [ ] Security tests pass
- [ ] Documentation complete
- [ ] Rollback plan ready

---

## 📞 Support Contacts

**For Testing Issues**:
- Check server logs first
- Review error messages carefully
- Test with curl to isolate issue
- Check environment variables

**For API Issues**:
- Verify authentication token
- Check request format (JSON)
- Review API documentation
- Test with Postman

**For UI Issues**:
- Check browser console (F12)
- Clear browser cache
- Test in different browser
- Check responsive design

---

## ✨ Next Steps After Testing

1. **Address any failures** - Fix bugs and retest
2. **Performance optimization** - If benchmarks not met
3. **Security hardening** - If vulnerabilities found
4. **Team training** - Document findings and train users
5. **Production deployment** - Deploy to live environment
6. **Monitor closely** - Watch logs for first 24 hours

---

**Test Execution Date**: _____________  
**Tester Name**: _____________  
**Overall Status**: ☐ PASS ☐ FAIL ☐ PENDING

---

*For detailed issues, see server logs and error documentation*
