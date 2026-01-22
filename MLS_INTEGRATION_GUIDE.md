# MLS (NWMLS) Integration Guide

## Overview

The MLS (Multiple Listing Service) integration for NWMLS provides comprehensive real estate management capabilities directly within the LucaExpress platform. This guide covers all features, setup instructions, and best practices.

## Features

### Core MLS Capabilities

1. **Listing Search**
   - Search available properties with multiple filters
   - Filter by city, county, price range, property type
   - View detailed listing information and photos
   - Sort and refine results

2. **My Listings Management**
   - Create new listings with comprehensive property details
   - View active listings and their status
   - Track days on market and exposure
   - Update listing information in real-time

3. **Offer Management**
   - Submit offers on available properties
   - Track offer status and counter-offers
   - Manage multiple offers simultaneously
   - View offer history and negotiations

4. **Listing Agreements**
   - Generate professional listing agreements
   - Customize terms and commissions
   - Track agreement status
   - Download and share documents

5. **Extensions**
   - Submit close date extensions
   - Manage extension workflows
   - Track extension status and approvals

6. **Document Management**
   - Access all generated documents
   - Download agreements, offers, and extensions
   - Organize documents by property or transaction
   - Archive completed transactions

## Getting Started

### 1. Set Up MLS Credentials

Navigate to the MLS tab in the dashboard and enter your NWMLS credentials:

```
NWMLS Username: [Your NWMLS username]
NWMLS Password: [Your NWMLS password]
Broker Number: [Optional - your broker's MLS number]
Agent Number: [Optional - your agent MLS number]
```

**Important Security Notes:**
- Credentials are encrypted before storage
- Only you can access your own credentials (admin users can set credentials for others)
- Credentials are never displayed in plain text
- Sessions are automatically managed for security

### 2. Authenticate with NWMLS

Click the "Authenticate" button to establish your connection. The system will:
- Verify your credentials
- Detect your user capabilities
- Retrieve your authorization level
- Prepare access to all available features

## API Endpoints

### Authentication & Credentials

#### Set MLS Credentials
```
POST /api/mls/credentials/set
Content-Type: application/json
Authorization: Bearer {token}

{
  "username": "your_username",
  "password": "your_password",
  "brokerNumber": "optional_broker_number",
  "agentNumber": "optional_agent_number"
}

Response: { success: true, userId: "...", message: "MLS credentials saved and verified" }
```

#### Authenticate with MLS
```
POST /api/mls/authenticate
Authorization: Bearer {token}

Response: { 
  success: true, 
  authenticated: true, 
  capabilities: { 
    canCreateListings: boolean,
    canWriteAgreements: boolean,
    canSubmitOffers: boolean,
    canWriteExtensions: boolean,
    canAccessDocuments: boolean,
    ...
  }
}
```

#### Get MLS Status
```
GET /api/mls/status
Authorization: Bearer {token}

Response: {
  success: true,
  userId: "...",
  authenticated: boolean,
  capabilities: { ... },
  lastSync: ISO8601_timestamp,
  dataCount: {
    listings: number,
    offers: number,
    agreements: number,
    extensions: number,
    documents: number
  }
}
```

### Listing Operations

#### Search Listings
```
POST /api/mls/search
Content-Type: application/json
Authorization: Bearer {token}

{
  "city": "Seattle",
  "county": "king",
  "minPrice": 300000,
  "maxPrice": 800000,
  "bedrooms": 3,
  "bathrooms": 2,
  "propertyType": "single-family",
  "status": "active"
}

Response: {
  success: true,
  count: number,
  listings: [
    {
      mls: "string",
      address: "string",
      price: "string",
      bedrooms: "string",
      bathrooms: "string",
      sqft: "string",
      status: "string",
      dom: "days on market"
    }
  ]
}
```

#### Get Listing Details
```
GET /api/mls/listings/{mlsNumber}
Authorization: Bearer {token}

Response: {
  success: true,
  mlsNumber: "string",
  details: {
    mlsNumber: "string",
    address: "string",
    price: "string",
    listPrice: "string",
    soldPrice: "string",
    bedrooms: "string",
    bathrooms: "string",
    sqft: "string",
    lotSize: "string",
    yearBuilt: "string",
    propertyType: "string",
    status: "string",
    dom: "days on market",
    cdom: "cumulative days on market",
    listAgent: "string",
    sellingAgent: "string",
    listOffice: "string",
    sellOffice: "string",
    listDate: "string",
    soldDate: "string",
    closePrice: "string",
    description: "string",
    photos: [urls...]
  }
}
```

#### Create New Listing
```
POST /api/mls/listings/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "address": "123 Main Street",
  "city": "Seattle",
  "state": "WA",
  "zip": "98101",
  "bedrooms": 3,
  "bathrooms": 2,
  "listPrice": 750000,
  "propertyType": "single-family",
  "description": "Beautiful home in perfect location",
  "sqft": 2500,
  "lotSize": "0.35 acres"
}

Response: {
  success: true,
  mlsNumber: "string",
  address: "string",
  message: "Listing created successfully"
}
```

### Offer Management

#### Submit Offer
```
POST /api/mls/offers/submit
Content-Type: application/json
Authorization: Bearer {token}

{
  "mlsNumber": "string",
  "offerPrice": 700000,
  "earnestMoney": 20000,
  "closingDate": "2024-02-15",
  "contingencies": ["inspection", "appraisal", "financing"],
  "buyerAgent": "Agent Name",
  "notes": "Strong buyer, clean transaction"
}

Response: {
  success: true,
  offerId: "string",
  mlsNumber: "string",
  message: "Offer submitted successfully"
}
```

### Agreement Management

#### Create Listing Agreement
```
POST /api/mls/agreements/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "sellerName": "John Doe",
  "sellerPhone": "(206) 555-1234",
  "sellerEmail": "john@example.com",
  "propertyAddress": "123 Main Street, Seattle, WA 98101",
  "listPrice": 750000,
  "commissionPercent": 5.0,
  "listingDays": 90
}

Response: {
  success: true,
  sellerName: "string",
  propertyAddress: "string",
  documentUrl: "url_to_pdf",
  message: "Listing agreement generated successfully"
}
```

### Extension Management

#### Create Extension
```
POST /api/mls/extensions/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "mlsNumber": "string",
  "newCloseDate": "2024-03-15",
  "additionalDays": 7,
  "reason": "Inspection repairs in progress"
}

Response: {
  success: true,
  mlsNumber: "string",
  newCloseDate: "string",
  message: "Extension submitted successfully"
}
```

### Document Access

#### Get Documents
```
GET /api/mls/documents?type=all|agreements|offers|extensions
Authorization: Bearer {token}

Response: {
  success: true,
  count: number,
  documents: [
    {
      id: "string",
      name: "string",
      type: "string",
      date: "ISO8601",
      url: "download_url"
    }
  ]
}
```

#### Get All User Data
```
GET /api/mls/data
Authorization: Bearer {token}

Response: {
  success: true,
  userId: "string",
  data: {
    authenticated: boolean,
    capabilities: { ... },
    listings: { count, items },
    offers: { count, items },
    agreements: { count, items },
    extensions: { count, items },
    documents: { count, items },
    lastSync: "ISO8601"
  }
}
```

### Session Management

#### Logout from MLS
```
POST /api/mls/logout
Authorization: Bearer {token}

Response: {
  success: true,
  message: "Logged out successfully"
}
```

## User Roles & Permissions

### Admin Users
- Set credentials for any user
- View all user MLS data
- Restrict/enable MLS access per user
- Manage admin settings

### Regular Users
- Set their own credentials
- Access all features they're authorized for
- Cannot modify other users' credentials
- Cannot view other users' MLS data

### Permission Restrictions
- Users without NWMLS credentials have the MLS tab disabled
- Admin can restrict access to specific features
- Capability detection is automatic based on NWMLS role
- Session tokens expire after 24 hours of inactivity

## Best Practices

### Security

1. **Credential Management**
   - Never share your NWMLS credentials
   - Change your password regularly through NWMLS
   - Use strong, unique passwords
   - Enable two-factor authentication if available

2. **Data Protection**
   - Credentials are encrypted with AES-256
   - All API calls require authentication tokens
   - Sessions are validated for every request
   - Sensitive data is never logged

3. **Access Control**
   - Admins should use strong session tokens
   - Regular logout when not in use
   - Monitor unauthorized access attempts
   - Review audit logs regularly

### Workflow Optimization

1. **Listing Management**
   - Update listing photos regularly
   - Monitor days on market metrics
   - Respond to inquiries promptly
   - Use detailed descriptions

2. **Offer Handling**
   - Set clear response timelines
   - Track multiple offers systematically
   - Use contingencies appropriately
   - Document negotiations

3. **Agreement Generation**
   - Review generated agreements carefully
   - Customize terms as needed
   - Store copies for records
   - Track signature status

## Troubleshooting

### Authentication Issues

**Problem: "Login failed - invalid credentials"**
- Verify username and password are correct
- Check NWMLS account is active
- Reset password through NWMLS if needed
- Try re-entering credentials

**Problem: "Session expired"**
- Log in again to refresh session
- Sessions expire after 24 hours
- Clear browser cache if persisting
- Use incognito mode for testing

### Search Issues

**Problem: "No listings found"**
- Verify search parameters are correct
- Expand price range or other filters
- Check listing status (active, pending, sold)
- Try different geographic areas

**Problem: "Search is slow"**
- Reduce number of filters
- Use specific city instead of county
- Narrow price range
- Try again during off-peak hours

### Document Issues

**Problem: "Agreement PDF is blank"**
- Verify all required fields are filled
- Check form fields for special characters
- Try regenerating the document
- Use a different browser

**Problem: "Cannot download document"**
- Check browser pop-up blockers
- Verify document URL is valid
- Try different browser
- Contact support if persisting

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/mls/credentials/set | POST | Set/update MLS credentials |
| /api/mls/authenticate | POST | Authenticate with NWMLS |
| /api/mls/status | GET | Get current connection status |
| /api/mls/search | POST | Search listings |
| /api/mls/listings/{mls} | GET | Get listing details |
| /api/mls/listings/create | POST | Create new listing |
| /api/mls/offers/submit | POST | Submit offer |
| /api/mls/agreements/create | POST | Generate agreement |
| /api/mls/extensions/create | POST | Submit extension |
| /api/mls/documents | GET | Get documents |
| /api/mls/data | GET | Get all cached data |
| /api/mls/logout | POST | Logout from MLS |

## Support

For technical support or questions about the MLS integration:
1. Check this documentation
2. Review troubleshooting section
3. Contact your system administrator
4. Submit a support ticket with error details

## Version History

**v1.0.0** (January 2026)
- Initial MLS integration for NWMLS
- Full listing search and management
- Offer submission and tracking
- Agreement generation
- Extension support
- Document management
- Per-user credential isolation
- Admin credential control
