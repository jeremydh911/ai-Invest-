/**
 * AI Agent Tools for MLS Integration
 * Provides stable, predictable interfaces for AI agents to interact with MLS
 * Follows financial institution best practices for real estate transactions
 */

const axios = require('axios');

class MLSAgentTools {
  constructor(apiBaseUrl = 'http://localhost:3000') {
    this.apiBaseUrl = apiBaseUrl;
    this.requestTimeout = 30000; // 30 second timeout for all requests
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second between retries
  }

  /**
   * Make API request with retry logic and error handling
   * Returns predictable error objects for agent consumption
   */
  async makeRequest(method, endpoint, data = null, token = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const config = {
          method,
          url: `${this.apiBaseUrl}${endpoint}`,
          timeout: this.requestTimeout,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);
        return this.normalizeResponse(response.data);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // All retries failed
    return this.normalizeError(lastError);
  }

  /**
   * Normalize API responses into consistent format
   */
  normalizeResponse(data) {
    if (data.success === false) {
      return {
        success: false,
        error: data.error || 'Unknown error',
        code: 'API_ERROR',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Normalize errors into consistent format
   */
  normalizeError(error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || error.response.statusText,
        code: `HTTP_${error.response.status}`,
        status: error.response.status,
        timestamp: new Date().toISOString()
      };
    } else if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout - MLS service not responding',
        code: 'TIMEOUT',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * TOOL: Check MLS Connection Status
   * Returns current connection and capability status
   * 
   * Usage for Agent:
   * const status = await agent.tools.checkMLSStatus(userToken);
   */
  async checkMLSStatus(token) {
    console.log('[Agent Tool] Checking MLS status...');
    
    const result = await this.makeRequest('GET', '/api/mls/status', null, token);
    
    if (result.success) {
      return {
        connected: result.data.authenticated,
        capabilities: result.data.capabilities,
        dataAvailable: result.data.dataCount,
        lastSync: result.data.lastSync,
        summary: `Connected: ${result.data.authenticated}, Listings: ${result.data.dataCount.listings}, Offers: ${result.data.dataCount.offers}`
      };
    }

    return result;
  }

  /**
   * TOOL: Search Listings
   * Powerful search with multiple filters
   * All parameters are optional - omit to ignore that filter
   * 
   * Usage for Agent:
   * const listings = await agent.tools.searchListings(userToken, {
   *   city: "Seattle",
   *   minPrice: 500000,
   *   maxPrice: 1000000
   * });
   */
  async searchListings(token, searchParams = {}) {
    console.log('[Agent Tool] Searching listings with params:', searchParams);

    // Validate parameters
    const validParams = {
      city: searchParams.city || null,
      county: searchParams.county || null,
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : null,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : null,
      bedrooms: searchParams.bedrooms ? parseInt(searchParams.bedrooms) : null,
      bathrooms: searchParams.bathrooms ? parseFloat(searchParams.bathrooms) : null,
      propertyType: searchParams.propertyType || null,
      status: searchParams.status || 'active'
    };

    // Remove null values
    Object.keys(validParams).forEach(key => {
      if (validParams[key] === null) {
        delete validParams[key];
      }
    });

    const result = await this.makeRequest('POST', '/api/mls/search', validParams, token);

    if (result.success) {
      return {
        count: result.data.count,
        listings: result.data.listings.map(l => ({
          mls: l.mls,
          address: l.address,
          price: l.price,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          sqft: l.sqft,
          status: l.status,
          daysOnMarket: l.dom
        })),
        searchUsed: validParams,
        summary: `Found ${result.data.count} listings matching criteria`
      };
    }

    return result;
  }

  /**
   * TOOL: Get Listing Details
   * Retrieve comprehensive details for a specific listing
   * 
   * Usage for Agent:
   * const details = await agent.tools.getListingDetails(userToken, "2024001234");
   */
  async getListingDetails(token, mlsNumber) {
    console.log('[Agent Tool] Getting details for MLS:', mlsNumber);

    if (!mlsNumber || typeof mlsNumber !== 'string') {
      return {
        success: false,
        error: 'Invalid MLS number provided',
        code: 'INVALID_PARAM',
        timestamp: new Date().toISOString()
      };
    }

    const result = await this.makeRequest('GET', `/api/mls/listings/${mlsNumber}`, null, token);

    if (result.success) {
      return {
        mls: result.data.details.mlsNumber,
        address: result.data.details.address,
        price: result.data.details.price,
        listPrice: result.data.details.listPrice,
        soldPrice: result.data.details.soldPrice,
        bedrooms: result.data.details.bedrooms,
        bathrooms: result.data.details.bathrooms,
        sqft: result.data.details.sqft,
        lotSize: result.data.details.lotSize,
        yearBuilt: result.data.details.yearBuilt,
        propertyType: result.data.details.propertyType,
        status: result.data.details.status,
        daysOnMarket: result.data.details.dom,
        listAgent: result.data.details.listAgent,
        sellingAgent: result.data.details.sellingAgent,
        listOffice: result.data.details.listOffice,
        sellOffice: result.data.details.sellOffice,
        listDate: result.data.details.listDate,
        soldDate: result.data.details.soldDate,
        closePrice: result.data.details.closePrice,
        description: result.data.details.description,
        photoCount: result.data.details.photos ? result.data.details.photos.length : 0,
        summary: `${result.data.details.address} - ${result.data.details.bedrooms}bd/${result.data.details.bathrooms}ba - $${result.data.details.price}`
      };
    }

    return result;
  }

  /**
   * TOOL: Submit Offer
   * Submit a purchase offer with full details
   * Follows financial best practices for offer structure
   * 
   * Usage for Agent:
   * const offer = await agent.tools.submitOffer(userToken, {
   *   mlsNumber: "2024001234",
   *   offerPrice: 700000,
   *   earnestMoney: 20000,
   *   closingDate: "2024-02-15"
   * });
   */
  async submitOffer(token, offerData) {
    console.log('[Agent Tool] Submitting offer:', offerData.mlsNumber);

    // Validate required fields
    if (!offerData.mlsNumber || !offerData.offerPrice) {
      return {
        success: false,
        error: 'MLS number and offer price are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      };
    }

    // Validate offer price is reasonable (earnest money check)
    if (offerData.earnestMoney && offerData.earnestMoney > offerData.offerPrice * 0.2) {
      return {
        success: false,
        error: 'Earnest money cannot exceed 20% of offer price',
        code: 'EARNEST_MONEY_TOO_HIGH',
        timestamp: new Date().toISOString()
      };
    }

    const payload = {
      mlsNumber: offerData.mlsNumber,
      offerPrice: parseInt(offerData.offerPrice),
      earnestMoney: offerData.earnestMoney ? parseInt(offerData.earnestMoney) : null,
      closingDate: offerData.closingDate || null,
      contingencies: offerData.contingencies || [],
      buyerAgent: offerData.buyerAgent || null,
      notes: offerData.notes || null
    };

    const result = await this.makeRequest('POST', '/api/mls/offers/submit', payload, token);

    if (result.success) {
      return {
        offerId: result.data.offerId,
        mlsNumber: result.data.mlsNumber,
        status: 'submitted',
        message: result.data.message,
        summary: `Offer submitted for MLS ${result.data.mlsNumber} at $${offerData.offerPrice.toLocaleString()}`
      };
    }

    return result;
  }

  /**
   * TOOL: Create Listing Agreement
   * Generate professional listing agreement
   * Follows financial institution documentation standards
   * 
   * Usage for Agent:
   * const agreement = await agent.tools.createListingAgreement(userToken, {
   *   sellerName: "John Doe",
   *   propertyAddress: "123 Main St, Seattle, WA",
   *   listPrice: 750000,
   *   commissionPercent: 5.0
   * });
   */
  async createListingAgreement(token, agreementData) {
    console.log('[Agent Tool] Creating listing agreement');

    // Validate required fields
    const required = ['sellerName', 'propertyAddress', 'listPrice'];
    for (const field of required) {
      if (!agreementData[field]) {
        return {
          success: false,
          error: `Missing required field: ${field}`,
          code: 'MISSING_REQUIRED_FIELD',
          timestamp: new Date().toISOString()
        };
      }
    }

    // Validate commission is reasonable (0-10%)
    const commission = agreementData.commissionPercent || 5.0;
    if (commission < 0 || commission > 10) {
      return {
        success: false,
        error: 'Commission must be between 0 and 10 percent',
        code: 'INVALID_COMMISSION',
        timestamp: new Date().toISOString()
      };
    }

    const payload = {
      sellerName: agreementData.sellerName,
      sellerPhone: agreementData.sellerPhone || '',
      sellerEmail: agreementData.sellerEmail || '',
      propertyAddress: agreementData.propertyAddress,
      listPrice: parseInt(agreementData.listPrice),
      commissionPercent: commission,
      listingDays: agreementData.listingDays || 90
    };

    const result = await this.makeRequest('POST', '/api/mls/agreements/create', payload, token);

    if (result.success) {
      return {
        status: 'generated',
        sellerName: result.data.sellerName,
        propertyAddress: result.data.propertyAddress,
        documentUrl: result.data.documentUrl,
        message: result.data.message,
        summary: `Listing agreement generated for ${result.data.sellerName}`
      };
    }

    return result;
  }

  /**
   * TOOL: Create Extension
   * Submit a close date extension
   * Useful for managing contingencies and repairs
   * 
   * Usage for Agent:
   * const extension = await agent.tools.createExtension(userToken, {
   *   mlsNumber: "2024001234",
   *   newCloseDate: "2024-03-15",
   *   additionalDays: 7,
   *   reason: "Inspection repairs"
   * });
   */
  async createExtension(token, extensionData) {
    console.log('[Agent Tool] Creating extension');

    // Validate required fields
    if (!extensionData.mlsNumber || !extensionData.newCloseDate) {
      return {
        success: false,
        error: 'MLS number and new close date are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      };
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(extensionData.newCloseDate)) {
      return {
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
        timestamp: new Date().toISOString()
      };
    }

    // Validate date is in future
    if (new Date(extensionData.newCloseDate) <= new Date()) {
      return {
        success: false,
        error: 'New close date must be in the future',
        code: 'DATE_IN_PAST',
        timestamp: new Date().toISOString()
      };
    }

    const payload = {
      mlsNumber: extensionData.mlsNumber,
      newCloseDate: extensionData.newCloseDate,
      additionalDays: extensionData.additionalDays ? parseInt(extensionData.additionalDays) : null,
      reason: extensionData.reason || ''
    };

    const result = await this.makeRequest('POST', '/api/mls/extensions/create', payload, token);

    if (result.success) {
      return {
        mlsNumber: result.data.mlsNumber,
        newCloseDate: result.data.newCloseDate,
        status: 'submitted',
        message: result.data.message,
        summary: `Extension submitted for MLS ${result.data.mlsNumber}, new close date: ${result.data.newCloseDate}`
      };
    }

    return result;
  }

  /**
   * TOOL: Get Documents
   * Retrieve all generated documents
   * Can filter by document type
   * 
   * Usage for Agent:
   * const docs = await agent.tools.getDocuments(userToken, "agreements");
   */
  async getDocuments(token, documentType = 'all') {
    console.log('[Agent Tool] Getting documents');

    const validTypes = ['all', 'agreements', 'offers', 'extensions'];
    if (!validTypes.includes(documentType)) {
      return {
        success: false,
        error: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_DOCUMENT_TYPE',
        timestamp: new Date().toISOString()
      };
    }

    const endpoint = documentType === 'all' 
      ? '/api/mls/documents' 
      : `/api/mls/documents?type=${documentType}`;

    const result = await this.makeRequest('GET', endpoint, null, token);

    if (result.success) {
      return {
        count: result.data.count,
        documents: result.data.documents.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          date: d.date,
          downloadUrl: d.url
        })),
        summary: `Retrieved ${result.data.count} documents`
      };
    }

    return result;
  }

  /**
   * TOOL: Get All MLS Data
   * Retrieve comprehensive summary of user's MLS data
   * Useful for status reports and data analysis
   * 
   * Usage for Agent:
   * const allData = await agent.tools.getAllMLSData(userToken);
   */
  async getAllMLSData(token) {
    console.log('[Agent Tool] Getting comprehensive MLS data');

    const result = await this.makeRequest('GET', '/api/mls/data', null, token);

    if (result.success) {
      const data = result.data.data;
      return {
        authenticated: data.authenticated,
        capabilities: data.capabilities,
        listings: {
          count: data.listings.count,
          items: data.listings.items
        },
        offers: {
          count: data.offers.count,
          items: data.offers.items
        },
        agreements: {
          count: data.agreements.count,
          items: data.agreements.items
        },
        extensions: {
          count: data.extensions.count,
          items: data.extensions.items
        },
        documents: {
          count: data.documents.count,
          items: data.documents.items
        },
        lastSync: data.lastSync,
        summary: `Status: ${data.authenticated ? 'Connected' : 'Disconnected'} | Listings: ${data.listings.count} | Offers: ${data.offers.count} | Agreements: ${data.agreements.count}`
      };
    }

    return result;
  }

  /**
   * TOOL: Logout from MLS
   * End MLS session
   * 
   * Usage for Agent:
   * await agent.tools.logoutFromMLS(userToken);
   */
  async logoutFromMLS(token) {
    console.log('[Agent Tool] Logging out from MLS');

    const result = await this.makeRequest('POST', '/api/mls/logout', {}, token);

    if (result.success) {
      return {
        status: 'logged_out',
        message: result.data.message,
        summary: 'MLS session terminated'
      };
    }

    return result;
  }

  /**
   * Get all available tools with descriptions
   * Useful for agent system prompts
   */
  getToolDefinitions() {
    return {
      checkMLSStatus: {
        name: 'checkMLSStatus',
        description: 'Check current MLS connection status and user capabilities',
        parameters: {
          token: 'User authentication token'
        },
        returns: {
          connected: 'boolean - Is user connected to MLS',
          capabilities: 'object - Available operations',
          dataAvailable: 'object - Count of listings, offers, agreements, etc.',
          lastSync: 'timestamp - When data was last synchronized'
        }
      },
      searchListings: {
        name: 'searchListings',
        description: 'Search for available real estate listings with multiple filters',
        parameters: {
          token: 'User authentication token',
          searchParams: 'object with optional: city, county, minPrice, maxPrice, bedrooms, bathrooms, propertyType, status'
        },
        returns: {
          count: 'number - Total listings found',
          listings: 'array - Listing objects with mls, address, price, details'
        }
      },
      getListingDetails: {
        name: 'getListingDetails',
        description: 'Get detailed information about a specific listing',
        parameters: {
          token: 'User authentication token',
          mlsNumber: 'string - MLS listing number'
        },
        returns: {
          mls: 'string',
          address: 'string',
          price: 'string',
          bedrooms: 'string',
          bathrooms: 'string',
          sqft: 'string',
          photoCount: 'number',
          description: 'string'
        }
      },
      submitOffer: {
        name: 'submitOffer',
        description: 'Submit a purchase offer on a listing',
        parameters: {
          token: 'User authentication token',
          offerData: 'object with mlsNumber, offerPrice (required), earnestMoney, closingDate, contingencies, notes'
        },
        returns: {
          offerId: 'string - Unique offer identifier',
          status: 'submitted',
          summary: 'string - Confirmation message'
        }
      },
      createListingAgreement: {
        name: 'createListingAgreement',
        description: 'Generate a professional listing agreement',
        parameters: {
          token: 'User authentication token',
          agreementData: 'object with sellerName, propertyAddress, listPrice (required), commissionPercent, listingDays'
        },
        returns: {
          status: 'generated',
          documentUrl: 'string - URL to download PDF',
          summary: 'string - Confirmation message'
        }
      },
      createExtension: {
        name: 'createExtension',
        description: 'Submit a close date extension',
        parameters: {
          token: 'User authentication token',
          extensionData: 'object with mlsNumber, newCloseDate (YYYY-MM-DD format), additionalDays, reason'
        },
        returns: {
          mlsNumber: 'string',
          newCloseDate: 'string',
          status: 'submitted'
        }
      },
      getDocuments: {
        name: 'getDocuments',
        description: 'Retrieve generated documents',
        parameters: {
          token: 'User authentication token',
          documentType: 'string - one of: all, agreements, offers, extensions'
        },
        returns: {
          count: 'number',
          documents: 'array - Document objects with name, type, date, downloadUrl'
        }
      },
      getAllMLSData: {
        name: 'getAllMLSData',
        description: 'Get comprehensive summary of all MLS data',
        parameters: {
          token: 'User authentication token'
        },
        returns: {
          authenticated: 'boolean',
          capabilities: 'object',
          listings: 'object with count and items',
          offers: 'object with count and items',
          agreements: 'object with count and items',
          extensions: 'object with count and items',
          documents: 'object with count and items'
        }
      },
      logoutFromMLS: {
        name: 'logoutFromMLS',
        description: 'End MLS session',
        parameters: {
          token: 'User authentication token'
        },
        returns: {
          status: 'logged_out',
          message: 'string'
        }
      }
    };
  }
}

module.exports = MLSAgentTools;
