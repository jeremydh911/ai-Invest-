# CRM Integrations Implementation Guide

## Overview

AgenticEmpire now supports enterprise-grade CRM integrations with Brivity, TopProducer, and other major CRM platforms. All data is synced to an in-memory cache for instant access, providing a unified interface for managing customer data across multiple sources.

## Architecture

### Components

1. **CRM Integration Service** (`services/crm-integrations.js`)
   - Handles API connections to external CRMs
   - Manages data synchronization
   - Maintains in-memory cache for fast access
   - Implements field mapping and data transformation

2. **API Endpoints** (server.js)
   - 10 new endpoints for integration management
   - Sync operations for all sources
   - Unified search across all CRMs
   - Data caching and retrieval

3. **Frontend Interfaces**
   - **crm-integrations.html**: Configuration and sync management
   - **crm-advanced.html**: Unified CRM with integration support
   - **crm.html**: Original local CRM interface

### Data Flow

```
External CRM (Brivity/TopProducer)
         ↓
    API Request
         ↓
CRMIntegrationManager (Authentication & Mapping)
         ↓
    In-Memory Cache
         ↓
Local Database & Frontend
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Brivity Integration
BRIVITY_API_BASE_URL=https://api.brivity.com/v1
BRIVITY_API_KEY=your_api_key
BRIVITY_CLIENT_ID=your_client_id
BRIVITY_CLIENT_SECRET=your_client_secret

# TopProducer Integration
TOPPRODUCER_API_BASE_URL=https://api.topproducerpro.com/v2
TOPPRODUCER_API_KEY=your_api_key
TOPPRODUCER_CLIENT_ID=your_client_id
TOPPRODUCER_CLIENT_SECRET=your_client_secret
```

## API Endpoints

### Integration Management

#### 1. Get All Cached Data
```
GET /api/crm/integrations/cached-data?source=brivity
```
**Query Parameters:**
- `source` (optional): `brivity`, `topproducer`, or `local`. Omit to get all sources.

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-20T10:30:00Z",
  "data": {
    "brivity": {
      "contacts": [...],
      "deals": [...],
      "lastSync": "2026-01-20T10:00:00Z",
      "syncStatus": "idle"
    },
    "topproducer": {...},
    "local": {...}
  }
}
```

#### 2. Unified Search
```
GET /api/crm/integrations/search?q=john&type=contact
```
**Query Parameters:**
- `q`: Search query (minimum 2 characters)
- `type`: `contact` or `deal`

**Response:**
```json
{
  "success": true,
  "query": "john",
  "type": "contact",
  "results": {
    "brivity": [{contact objects}],
    "topproducer": [{contact objects}],
    "local": [{contact objects}]
  },
  "total": 15
}
```

#### 3. Get Sync Status
```
GET /api/crm/integrations/sync-status
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-20T10:30:00Z",
  "status": {
    "brivity": {
      "status": "idle",
      "lastSync": "2026-01-20T10:00:00Z",
      "contactCount": 245,
      "dealCount": 48
    },
    "topproducer": {...},
    "local": {...}
  }
}
```

#### 4. Sync All Sources
```
POST /api/crm/integrations/sync-all
```

**Response:**
```json
{
  "success": true,
  "message": "Sync initiated for all enabled CRM sources",
  "results": {
    "brivity": {
      "contacts": {
        "success": true,
        "count": 245
      },
      "deals": {
        "success": true,
        "count": 48
      }
    },
    "topproducer": {...},
    "synced_at": "2026-01-20T10:30:00Z"
  }
}
```

#### 5. Sync Specific Source (Brivity)
```
POST /api/crm/integrations/sync/brivity
```

#### 6. Sync Specific Source (TopProducer)
```
POST /api/crm/integrations/sync/topproducer
```

#### 7. Get Cached Contacts
```
GET /api/crm/integrations/contacts?source=brivity
```

#### 8. Get Cached Deals
```
GET /api/crm/integrations/deals?source=topproducer
```

#### 9. Clear Cache
```
POST /api/crm/integrations/cache/clear
```
**Body:**
```json
{
  "source": "brivity"  // Optional: omit to clear all
}
```

## Features

### 1. Unified Data Cache
- Stores all external CRM data in memory
- Zero database queries for cached data
- Lightning-fast access to customer information
- Automatic cleanup and refresh

### 2. Multi-Source Search
- Search across all connected CRMs simultaneously
- Unified results with source indication
- Support for contacts and deals
- Real-time as you type

### 3. Data Synchronization
- Batch sync operations (100 items per batch)
- Automatic field mapping
- Handles API authentication tokens
- Error handling and retry logic
- Detailed sync status reporting

### 4. Field Mapping
- Automatic mapping of Brivity fields to local schema
- Automatic mapping of TopProducer fields to local schema
- Preserves source CRM metadata in JSON format
- Extensible mapping for custom fields

### 5. Enterprise Features
- User-level isolation (all synced data tied to user_id)
- Audit trail for sync operations
- Connection testing
- Configurable sync intervals
- Batch operation support

## Usage Examples

### JavaScript (Frontend)

#### Sync all CRM sources
```javascript
async function syncAllSources() {
  const response = await fetch('/api/crm/integrations/sync-all', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  console.log('Synced', result.results);
}
```

#### Search across all CRMs
```javascript
async function searchAll(query) {
  const response = await fetch(
    `/api/crm/integrations/search?q=${encodeURIComponent(query)}&type=contact`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const result = await response.json();
  
  // Results organized by source
  console.log('Brivity results:', result.results.brivity);
  console.log('TopProducer results:', result.results.topproducer);
  console.log('Local CRM results:', result.results.local);
}
```

#### Get cached data
```javascript
async function getCachedData(source = null) {
  const url = source 
    ? `/api/crm/integrations/contacts?source=${source}`
    : '/api/crm/integrations/contacts';
    
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  console.log('Contacts:', result.contacts);
  console.log('Total:', result.count);
}
```

### cURL (Testing)

#### Sync Brivity
```bash
curl -X POST http://localhost:3000/api/crm/integrations/sync/brivity \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Search for a contact
```bash
curl "http://localhost:3000/api/crm/integrations/search?q=john&type=contact" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get sync status
```bash
curl "http://localhost:3000/api/crm/integrations/sync-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Data Synchronization Details

### Sync Operation Steps

1. **Authentication**: Obtains OAuth token from external CRM
2. **Batch Fetching**: Retrieves data in 100-item batches
3. **Field Mapping**: Transforms external fields to local schema
4. **Metadata Preservation**: Stores original CRM ID and fields in metadata JSON
5. **Cache Update**: Updates in-memory cache
6. **Status Reporting**: Returns sync results and statistics

### Supported Entities

#### Brivity
- **Contacts**: First name, last name, email, phone, company, status, rating
- **Deals**: Name, amount, currency, stage, probability, close date
- **Field Mapping**: Automatic conversion of Brivity-specific fields

#### TopProducer
- **Contacts**: First name, last name, email, phone, company, status
- **Transactions**: Property address, sales price, status, close date
- **Field Mapping**: Handles real estate-specific fields

## Performance Optimization

### Memory Management
- In-memory cache for instant access
- Configurable cache expiration
- Automatic deduplication
- Batch operations to reduce API calls

### Database Queries
- Indexed user_id for fast filtering
- Connection pooling
- Prepared statements for security

### API Calls
- Token caching (1-hour default TTL)
- Batch requests (100 items per request)
- Connection reuse
- Timeout handling (10-15 seconds)

## Error Handling

### Common Errors

**Authentication Failed**
```json
{
  "error": "Brivity authentication failed",
  "details": "Invalid client_id or client_secret"
}
```

**Network Timeout**
```json
{
  "error": "Failed to fetch contacts",
  "details": "Request timeout after 15 seconds"
}
```

**Invalid Search Query**
```json
{
  "error": "Query must be at least 2 characters",
  "statusCode": 400
}
```

## Security

### Authentication
- All endpoints require JWT authentication
- User isolation via user_id
- OAuth token management for external CRMs

### Data Protection
- Credentials stored in environment variables only
- API keys never logged
- User data filtered by user_id on all queries
- Metadata stored as JSON for extensibility

## Monitoring & Logs

### Log Messages
```
[Brivity] Authentication successful
[Brivity] Successfully synced 245 contacts
[Brivity] Failed to fetch deals: Connection timeout
[TopProducer] Starting TopProducer sync...
[CRM] Starting Brivity sync...
```

### Status Tracking
```javascript
// Check sync status
const status = crmManager.getSyncStatus();
// Returns:
// {
//   brivity: {
//     status: 'idle|syncing|error',
//     lastSync: Date,
//     contactCount: 245,
//     dealCount: 48
//   },
//   ...
// }
```

## Troubleshooting

### Sync not starting
1. Verify API credentials in .env
2. Check network connectivity
3. Confirm API endpoints are correct
4. Review server logs for error messages

### Missing data
1. Ensure integration is enabled in settings
2. Check sync status to see if sync completed successfully
3. Verify OAuth token is valid
4. Confirm user has permissions in external CRM

### Slow performance
1. Check cache hit rate
2. Monitor database query times
3. Reduce sync frequency if needed
4. Consider pagination for large datasets

## Future Enhancements

- [ ] Real-time webhooks for live data sync
- [ ] Custom field mapping UI
- [ ] Scheduled sync jobs
- [ ] Duplicate detection and merging
- [ ] Two-way sync (write back to external CRMs)
- [ ] Advanced filtering and segmentation
- [ ] Export capabilities (CSV, Excel)
- [ ] API rate limiting and throttling
- [ ] Audit log for all sync operations
- [ ] Data validation and quality checks

## Testing

Run the included test suite:
```bash
node test-crm.js
```

Test integration endpoints:
```bash
# Test Brivity sync
curl -X POST http://localhost:3000/api/crm/integrations/sync/brivity \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test unified search
curl "http://localhost:3000/api/crm/integrations/search?q=test&type=contact" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For issues or questions:
1. Check the logs: `tail -f server.log`
2. Review sync status endpoint
3. Test API credentials in your CRM dashboard
4. Verify network connectivity to external APIs

## Deployment Checklist

- [ ] Set environment variables for all CRM integrations
- [ ] Test API credentials before going live
- [ ] Verify database tables are created
- [ ] Run initial sync to populate cache
- [ ] Monitor sync status for first 24 hours
- [ ] Set up automated sync jobs (if needed)
- [ ] Configure backup/restore procedures
- [ ] Train users on unified search feature
- [ ] Document custom field mappings
- [ ] Set up monitoring and alerts

---

**Version**: 1.0.0
**Last Updated**: January 20, 2026
**Status**: Production Ready
