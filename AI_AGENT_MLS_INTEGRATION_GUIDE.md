# AI Agent Integration Guide for MLS

**For:** AI Agent Developers  
**Version:** 1.0  
**Date:** January 20, 2026

---

## Overview

This guide shows how to integrate MLS agent tools into your AI assistant for real estate transaction management.

---

## Quick Integration

### 1. Initialize Tools

```javascript
const MLSAgentTools = require('./services/mls-agent-tools');
const mlsTools = new MLSAgentTools('http://localhost:3000');
```

### 2. Get Tool Definitions

```javascript
const toolDefinitions = mlsTools.getToolDefinitions();

// Use in your agent system prompt
console.log(JSON.stringify(toolDefinitions, null, 2));
```

### 3. Call Tools from Agent

```javascript
// In your agent's action handler
const result = await mlsTools.searchListings(userToken, {
  city: "Seattle",
  minPrice: 300000,
  maxPrice: 800000,
  bedrooms: 3
});

if (result.success) {
  // Process listings
  agent.respond(`Found ${result.count} listings matching your criteria.`);
} else {
  // Handle error
  agent.error(`Search failed: ${result.error}`);
}
```

---

## Tool Reference

### 1. checkMLSStatus()

**Purpose:** Verify MLS connection and user permissions

**Signature:**
```javascript
checkMLSStatus(token: string): Promise<{
  connected: boolean,
  capabilities: object,
  dataAvailable: object,
  lastSync: string,
  summary: string
}>
```

**Usage:**
```javascript
const status = await mlsTools.checkMLSStatus(userToken);

if (status.connected) {
  agent.respond(`Connected to MLS. You have ${status.dataAvailable.listings} listings.`);
} else {
  agent.respond("You're not connected to MLS yet. Please set up your credentials.");
}
```

**Example Response:**
```javascript
{
  success: true,
  connected: true,
  capabilities: {
    canCreateListings: true,
    canWriteAgreements: true,
    canSubmitOffers: true,
    canWriteExtensions: true,
    canAccessDocuments: true
  },
  dataAvailable: {
    listings: 5,
    offers: 2,
    agreements: 3,
    extensions: 0,
    documents: 8
  },
  lastSync: "2024-01-20T14:30:00.000Z",
  summary: "Connected: true, Listings: 5, Offers: 2"
}
```

---

### 2. searchListings()

**Purpose:** Find properties matching criteria

**Signature:**
```javascript
searchListings(token: string, params: {
  city?: string,
  county?: string,
  minPrice?: number,
  maxPrice?: number,
  bedrooms?: number,
  bathrooms?: number,
  propertyType?: string,
  status?: string
}): Promise<{
  count: number,
  listings: array,
  searchUsed: object,
  summary: string
}>
```

**Usage:**
```javascript
const listings = await mlsTools.searchListings(userToken, {
  city: "Seattle",
  minPrice: 500000,
  maxPrice: 1000000,
  bedrooms: 3,
  status: "active"
});

agent.respond(`Found ${listings.count} three-bedroom homes in Seattle.`);

// Show top 3
listings.listings.slice(0, 3).forEach((listing, i) => {
  agent.respond(`${i+1}. ${listing.address} - $${listing.price}`);
});
```

**Example Response:**
```javascript
{
  success: true,
  count: 47,
  listings: [
    {
      mls: "2024001234",
      address: "123 Main St, Seattle, WA 98101",
      price: "$750,000",
      bedrooms: "3",
      bathrooms: "2",
      sqft: "2,500",
      status: "active",
      daysOnMarket: "12"
    },
    // ... more listings
  ],
  searchUsed: {
    city: "Seattle",
    minPrice: 500000,
    maxPrice: 1000000,
    bedrooms: 3
  },
  summary: "Found 47 listings matching criteria"
}
```

---

### 3. getListingDetails()

**Purpose:** Get comprehensive info about a specific property

**Signature:**
```javascript
getListingDetails(token: string, mlsNumber: string): Promise<{
  mls: string,
  address: string,
  price: string,
  bedrooms: string,
  bathrooms: string,
  sqft: string,
  yearBuilt: string,
  propertyType: string,
  listAgent: string,
  description: string,
  photoCount: number,
  summary: string
}>
```

**Usage:**
```javascript
const details = await mlsTools.getListingDetails(userToken, "2024001234");

agent.respond(`
Property Details:
${details.address}
Price: ${details.price}
${details.bedrooms} bedrooms, ${details.bathrooms} bathrooms
Built: ${details.yearBuilt}
Days on Market: ${details.dom}

Description:
${details.description}
`);
```

---

### 4. submitOffer()

**Purpose:** Submit a purchase offer on a property

**Signature:**
```javascript
submitOffer(token: string, data: {
  mlsNumber: string,           // Required
  offerPrice: number,          // Required (in dollars)
  earnestMoney?: number,
  closingDate?: string,        // YYYY-MM-DD format
  contingencies?: string[],    // ['inspection', 'appraisal', 'financing']
  buyerAgent?: string,
  notes?: string
}): Promise<{
  offerId: string,
  mlsNumber: string,
  status: string,
  message: string,
  summary: string
}>
```

**Usage:**
```javascript
const offer = await mlsTools.submitOffer(userToken, {
  mlsNumber: "2024001234",
  offerPrice: 700000,
  earnestMoney: 20000,
  closingDate: "2024-02-28",
  contingencies: ["inspection", "appraisal", "financing"],
  notes: "Strong buyer, clean transaction"
});

if (offer.success) {
  agent.respond(`Offer submitted! ID: ${offer.offerId}`);
} else {
  agent.error(`Offer submission failed: ${offer.error}`);
}
```

**Validation Rules:**
- `earnestMoney` cannot exceed 20% of `offerPrice`
- `offerPrice` must be reasonable (>0)
- `closingDate` must be in future
- All dates must be YYYY-MM-DD format

---

### 5. createListingAgreement()

**Purpose:** Generate a professional listing agreement document

**Signature:**
```javascript
createListingAgreement(token: string, data: {
  sellerName: string,           // Required
  propertyAddress: string,      // Required
  listPrice: number,            // Required
  sellerPhone?: string,
  sellerEmail?: string,
  commissionPercent?: number,   // Default: 5, Max: 10
  listingDays?: number          // Default: 90
}): Promise<{
  status: string,
  sellerName: string,
  propertyAddress: string,
  documentUrl: string,
  message: string,
  summary: string
}>
```

**Usage:**
```javascript
const agreement = await mlsTools.createListingAgreement(userToken, {
  sellerName: "John Smith",
  sellerPhone: "(206) 555-1234",
  propertyAddress: "123 Main St, Seattle, WA 98101",
  listPrice: 750000,
  commissionPercent: 5.0,
  listingDays: 90
});

if (agreement.success) {
  agent.respond(`
    Agreement generated for ${agreement.sellerName}!
    Download: ${agreement.documentUrl}
  `);
} else {
  agent.error(`Failed: ${agreement.error}`);
}
```

**Validation Rules:**
- `commissionPercent` must be 0-10%
- `listPrice` must be positive integer
- `listingDays` typically 30, 60, 90, or 180
- All required fields must be provided

---

### 6. createExtension()

**Purpose:** Request a close date extension

**Signature:**
```javascript
createExtension(token: string, data: {
  mlsNumber: string,            // Required
  newCloseDate: string,         // Required (YYYY-MM-DD)
  additionalDays?: number,
  reason?: string
}): Promise<{
  mlsNumber: string,
  newCloseDate: string,
  status: string,
  message: string,
  summary: string
}>
```

**Usage:**
```javascript
const extension = await mlsTools.createExtension(userToken, {
  mlsNumber: "2024001234",
  newCloseDate: "2024-03-15",
  additionalDays: 7,
  reason: "Inspection repairs in progress"
});

if (extension.success) {
  agent.respond(`
    Extension submitted!
    New close date: ${extension.newCloseDate}
  `);
} else {
  agent.error(`Extension failed: ${extension.error}`);
}
```

**Validation Rules:**
- `newCloseDate` must be in future
- Format must be YYYY-MM-DD
- `mlsNumber` must be valid
- Can typically request 7-14 day extensions

---

### 7. getDocuments()

**Purpose:** Retrieve all documents (agreements, offers, etc.)

**Signature:**
```javascript
getDocuments(token: string, documentType?: string): Promise<{
  count: number,
  documents: array,
  summary: string
}>
```

**Usage:**
```javascript
// Get all documents
const all = await mlsTools.getDocuments(userToken, "all");

// Get only agreements
const agreements = await mlsTools.getDocuments(userToken, "agreements");

// Get only offers
const offers = await mlsTools.getDocuments(userToken, "offers");

// Get only extensions
const extensions = await mlsTools.getDocuments(userToken, "extensions");

agent.respond(`
Documents on file:
- Total: ${all.count}
- Agreements: ${agreements.count}
- Offers: ${offers.count}
- Extensions: ${extensions.count}
`);
```

**Document Types:**
- `"all"` - All documents (default)
- `"agreements"` - Listing/purchase agreements
- `"offers"` - Offer documents
- `"extensions"` - Extension requests

---

### 8. getAllMLSData()

**Purpose:** Get comprehensive MLS data summary

**Signature:**
```javascript
getAllMLSData(token: string): Promise<{
  authenticated: boolean,
  capabilities: object,
  listings: {count, items},
  offers: {count, items},
  agreements: {count, items},
  extensions: {count, items},
  documents: {count, items},
  lastSync: string,
  summary: string
}>
```

**Usage:**
```javascript
const data = await mlsTools.getAllMLSData(userToken);

agent.respond(`
Your MLS Dashboard:
${data.summary}

Active Listings: ${data.listings.count}
Pending Offers: ${data.offers.count}
Agreements: ${data.agreements.count}
Extensions: ${data.extensions.count}
Documents: ${data.documents.count}

Last Updated: ${new Date(data.lastSync).toLocaleString()}
`);
```

---

### 9. logoutFromMLS()

**Purpose:** End MLS session

**Signature:**
```javascript
logoutFromMLS(token: string): Promise<{
  status: string,
  message: string,
  summary: string
}>
```

**Usage:**
```javascript
await mlsTools.logoutFromMLS(userToken);
agent.respond("Logged out of MLS. Session ended.");
```

---

## Error Handling

All tools return consistent error format:

```javascript
{
  success: false,
  error: "User-friendly error message",
  code: "ERROR_CODE",    // HTTP_400, TIMEOUT, NETWORK_ERROR, etc.
  timestamp: "2024-01-20T14:30:00.000Z"
}
```

**Handling Errors:**

```javascript
const result = await mlsTools.searchListings(token, params);

if (result.success) {
  // Process success
} else {
  // Handle error
  switch (result.code) {
    case 'HTTP_400':
      agent.error(`Invalid search parameters: ${result.error}`);
      break;
    case 'HTTP_401':
      agent.error("Authentication failed. Please re-enter credentials.");
      break;
    case 'TIMEOUT':
      agent.error("Request timed out. Please try again.");
      break;
    case 'NETWORK_ERROR':
      agent.error("Network error. Check your connection.");
      break;
    default:
      agent.error(`MLS error: ${result.error}`);
  }
}
```

---

## Retry Logic

Tools automatically retry on failure:
- **Retry Attempts:** 3
- **Backoff Strategy:** Exponential (1s, 2s, 4s)
- **Timeout:** 30 seconds per request

No need to manually implement retries - the tools handle it.

---

## Security Best Practices

### For Agents Using These Tools

1. **Token Management**
   - Always use valid JWT tokens
   - Tokens expire after 24 hours
   - Never pass token in logs

2. **Error Messages**
   - Never expose full error details to users
   - Sanitize sensitive data
   - Log errors securely

3. **Data Validation**
   - Always validate input before passing to tools
   - Check response data before using
   - Implement rate limiting

4. **Audit Trail**
   - All MLS operations are logged
   - Include context in agent responses
   - Document user intent

### Example:

```javascript
// Bad: Exposes token and error details
agent.respond(`${userToken} failed with error: ${error.message}`);

// Good: Secure error handling
agent.respond("MLS operation failed. Please try again.");
console.error(`[MLS Error] ${error.code}: ${error.error}`);
```

---

## Common Agent Workflows

### Real Estate Assistant

```javascript
async function helpUserFindHome(userToken, preferences) {
  // 1. Search for properties
  const listings = await mlsTools.searchListings(userToken, {
    city: preferences.city,
    minPrice: preferences.minPrice,
    maxPrice: preferences.maxPrice,
    bedrooms: preferences.bedrooms
  });

  if (!listings.success) {
    agent.respond("Search failed. Please try again.");
    return;
  }

  // 2. Get details on top matches
  const topListings = listings.listings.slice(0, 3);
  for (const listing of topListings) {
    const details = await mlsTools.getListingDetails(userToken, listing.mls);
    agent.respond(`Found: ${details.address} - ${details.summary}`);
  }

  // 3. Help submit offer
  if (preferences.wantToOffer) {
    const offer = await mlsTools.submitOffer(userToken, {
      mlsNumber: preferences.selectedMLS,
      offerPrice: preferences.offerPrice,
      earnestMoney: preferences.earnestMoney
    });
    
    if (offer.success) {
      agent.respond(`Offer submitted! Your offer ID: ${offer.offerId}`);
    }
  }
}
```

### Listing Management

```javascript
async function manageListings(userToken) {
  // 1. Check status
  const status = await mlsTools.checkMLSStatus(userToken);
  
  // 2. Get all data
  const data = await mlsTools.getAllMLSData(userToken);
  
  // 3. Show summary
  agent.respond(`
    Listings: ${data.listings.count}
    Pending Offers: ${data.offers.count}
    Need Extension: ${data.extensions.count}
  `);
}
```

### Transaction Coordination

```javascript
async function handleTransaction(userToken, mlsNumber) {
  // 1. Get listing details
  const details = await mlsTools.getListingDetails(userToken, mlsNumber);
  
  // 2. Create agreement
  const agreement = await mlsTools.createListingAgreement(userToken, {
    sellerName: "Seller Name",
    propertyAddress: details.address,
    listPrice: parseInt(details.price)
  });
  
  // 3. Handle extension if needed
  if (needsExtension) {
    const extension = await mlsTools.createExtension(userToken, {
      mlsNumber: mlsNumber,
      newCloseDate: "2024-03-15",
      reason: "Inspection repairs"
    });
  }
  
  // 4. Get all documents
  const docs = await mlsTools.getDocuments(userToken, "all");
  agent.respond(`Transaction ready. ${docs.count} documents available.`);
}
```

---

## Testing Your Integration

### Unit Test Example

```javascript
async function testMLSTools() {
  const tools = new MLSAgentTools('http://localhost:3000');
  const testToken = 'test-jwt-token';

  // Test 1: Check status
  const status = await tools.checkMLSStatus(testToken);
  console.assert(status.success === false); // No real token
  
  // Test 2: Validate errors
  const error = await tools.getListingDetails(testToken, null);
  console.assert(error.code === 'INVALID_PARAM');
  
  // Test 3: Tool definitions
  const defs = tools.getToolDefinitions();
  console.assert(Object.keys(defs).length === 9);
  
  console.log('All tests passed!');
}
```

---

## API Configuration

### Custom API Base URL

```javascript
// Default: http://localhost:3000
const tools = new MLSAgentTools('https://api.example.com');
```

### Timeout Configuration

```javascript
const tools = new MLSAgentTools();
tools.requestTimeout = 60000; // 60 seconds
tools.retryAttempts = 5;
tools.retryDelay = 2000;
```

---

## Monitoring & Logging

### Log Tool Usage

```javascript
// Before calling tool
console.log(`[MLS Agent] Calling ${toolName} for user ${userId}`);

// After calling tool
console.log(`[MLS Agent] ${toolName} returned: ${result.success}`);
```

### Track Performance

```javascript
const startTime = Date.now();
const result = await mlsTools.searchListings(token, params);
const duration = Date.now() - startTime;

console.log(`Search took ${duration}ms, found ${result.count} listings`);
```

---

## Deployment Checklist

- [ ] MLSAgentTools imported in agent code
- [ ] Tool definitions added to system prompt
- [ ] Error handling implemented
- [ ] User token management verified
- [ ] Rate limiting configured
- [ ] Logging enabled
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Security review complete

---

## Support

### Documentation
- Full API guide: `MLS_INTEGRATION_GUIDE.md`
- Quick start: `MLS_QUICK_START.md`
- Implementation guide: This file

### Issues
- Check error `code` in response
- Verify token is valid
- Check MLS service logs
- Review test suite: `tests/mls-integration-tests.js`

### Contact
- Email: dev-support@lucaexpress.com
- Slack: #mls-integration
- Docs: Internal wiki

---

**Version:** 1.0.0  
**Last Updated:** January 20, 2026  
**Status:** Production Ready
