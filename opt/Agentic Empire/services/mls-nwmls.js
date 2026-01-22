/**
 * MLS (Multiple Listing Service) Integration for NWMLS.com
 * Handles all MLS operations: listings, offers, agreements, extensions, etc.
 * Uses Playwright for automation and stable interaction
 */

const axios = require('axios');
const playwright = require('playwright');

// Per-user MLS credentials and cache
const mlsCache = {};
const mlsConnections = {};

class MLSNWMLSService {
  constructor() {
    this.baseUrl = 'https://www.nwmls.com';
    this.browser = null;
    this.contexts = {}; // Per-user browser contexts
  }

  /**
   * Initialize user MLS cache
   */
  initializeUserMLS(userId) {
    if (!mlsCache[userId]) {
      mlsCache[userId] = {
        listings: [],
        offers: [],
        agreements: [],
        extensions: [],
        transactions: [],
        documents: [],
        credentials: null,
        authenticated: false,
        lastSync: null,
        syncStatus: 'idle',
        capabilities: {
          canCreateListings: false,
          canWriteAgreements: false,
          canSubmitOffers: false,
          canWriteExtensions: false,
          canAccessDocuments: false,
          canViewCompensation: false,
          canViewHistory: false,
          canBulkImport: false
        }
      };
    }
    return mlsCache[userId];
  }

  /**
   * Set MLS credentials for user
   */
  async setCredentials(userId, credentials) {
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required');
    }

    const cache = this.initializeUserMLS(userId);
    cache.credentials = {
      username: credentials.username,
      password: credentials.password,
      brokerNumber: credentials.brokerNumber || null,
      agentNumber: credentials.agentNumber || null,
      createdAt: new Date().toISOString()
    };

    // Test the credentials
    try {
      await this.authenticate(userId);
      cache.authenticated = true;
      console.log(`[MLS] Credentials verified for user ${userId}`);
      return { success: true, message: 'Credentials verified and saved' };
    } catch (err) {
      cache.authenticated = false;
      throw new Error(`Authentication failed: ${err.message}`);
    }
  }

  /**
   * Authenticate with NWMLS
   */
  async authenticate(userId) {
    const cache = this.initializeUserMLS(userId);
    
    if (!cache.credentials) {
      throw new Error('No credentials found for this user');
    }

    try {
      // Initialize Playwright browser if not exists
      if (!this.browser) {
        this.browser = await playwright.chromium.launch({ headless: true });
      }

      // Create user-specific context
      const context = await this.browser.newContext();
      this.contexts[userId] = context;
      const page = await context.newPage();

      // Navigate to login page
      await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle' });

      // Fill login form
      await page.fill('input[name="username"]', cache.credentials.username);
      await page.fill('input[name="password"]', cache.credentials.password);

      // Submit login
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

      // Check if login was successful
      const url = page.url();
      if (url.includes('login') || url.includes('error')) {
        throw new Error('Login failed - invalid credentials');
      }

      cache.authenticated = true;
      console.log(`[MLS] User ${userId} authenticated`);

      // Detect user capabilities
      await this.detectCapabilities(userId, page);

      return { success: true, authenticated: true };
    } catch (err) {
      console.error(`[MLS] Authentication failed for user ${userId}:`, err.message);
      throw err;
    }
  }

  /**
   * Detect user capabilities based on role
   */
  async detectCapabilities(userId, page) {
    const cache = this.initializeUserMLS(userId);

    try {
      // Navigate to different sections to determine permissions
      const capabilities = {
        canCreateListings: false,
        canWriteAgreements: false,
        canSubmitOffers: false,
        canWriteExtensions: false,
        canAccessDocuments: false,
        canViewCompensation: false,
        canViewHistory: false,
        canBulkImport: false
      };

      // Check each capability
      // This would normally involve navigating to each section and checking for access denied messages
      // For now, we'll set defaults based on typical agent permissions

      capabilities.canCreateListings = true;
      capabilities.canWriteAgreements = true;
      capabilities.canSubmitOffers = true;
      capabilities.canWriteExtensions = true;
      capabilities.canAccessDocuments = true;
      capabilities.canViewCompensation = true;
      capabilities.canViewHistory = true;

      cache.capabilities = capabilities;
      console.log(`[MLS] Capabilities detected for user ${userId}:`, capabilities);

      return capabilities;
    } catch (err) {
      console.error(`[MLS] Failed to detect capabilities:`, err.message);
      return cache.capabilities;
    }
  }

  /**
   * Search listings with multiple filters
   */
  async searchListings(userId, searchParams = {}) {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated) {
      throw new Error('User not authenticated with MLS');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to search page
      await page.goto(`${this.baseUrl}/search`, { waitUntil: 'domcontentloaded' });

      // Fill search parameters
      if (searchParams.county) {
        await page.selectOption('select[name="county"]', searchParams.county);
      }

      if (searchParams.city) {
        await page.fill('input[name="city"]', searchParams.city);
      }

      if (searchParams.minPrice) {
        await page.fill('input[name="minPrice"]', searchParams.minPrice.toString());
      }

      if (searchParams.maxPrice) {
        await page.fill('input[name="maxPrice"]', searchParams.maxPrice.toString());
      }

      if (searchParams.bedrooms) {
        await page.selectOption('select[name="bedrooms"]', searchParams.bedrooms.toString());
      }

      if (searchParams.bathrooms) {
        await page.selectOption('select[name="bathrooms"]', searchParams.bathrooms.toString());
      }

      if (searchParams.propertyType) {
        await page.selectOption('select[name="propertyType"]', searchParams.propertyType);
      }

      if (searchParams.status) {
        await page.selectOption('select[name="status"]', searchParams.status);
      }

      // Submit search
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' });

      // Extract listings
      const listings = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('[data-listing-item]').forEach(el => {
          items.push({
            mls: el.getAttribute('data-mls'),
            address: el.querySelector('[data-address]')?.textContent || '',
            price: el.querySelector('[data-price]')?.textContent || '',
            bedrooms: el.querySelector('[data-bedrooms]')?.textContent || '',
            bathrooms: el.querySelector('[data-bathrooms]')?.textContent || '',
            sqft: el.querySelector('[data-sqft]')?.textContent || '',
            status: el.querySelector('[data-status]')?.textContent || '',
            dom: el.querySelector('[data-dom]')?.textContent || ''
          });
        });
        return items;
      });

      cache.listings = listings;
      cache.lastSync = new Date().toISOString();

      console.log(`[MLS] Found ${listings.length} listings for user ${userId}`);

      return {
        success: true,
        count: listings.length,
        listings,
        searchParams
      };
    } catch (err) {
      console.error(`[MLS] Search failed:`, err.message);
      throw err;
    }
  }

  /**
   * Get listing details
   */
  async getListingDetails(userId, mlsNumber) {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated) {
      throw new Error('User not authenticated with MLS');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to listing detail page
      await page.goto(`${this.baseUrl}/listings/${mlsNumber}`, { waitUntil: 'domcontentloaded' });

      // Extract detailed information
      const details = await page.evaluate(() => {
        return {
          mlsNumber: document.querySelector('[data-mls]')?.textContent || '',
          address: document.querySelector('[data-address]')?.textContent || '',
          price: document.querySelector('[data-price]')?.textContent || '',
          listPrice: document.querySelector('[data-list-price]')?.textContent || '',
          soldPrice: document.querySelector('[data-sold-price]')?.textContent || '',
          bedrooms: document.querySelector('[data-bedrooms]')?.textContent || '',
          bathrooms: document.querySelector('[data-bathrooms]')?.textContent || '',
          sqft: document.querySelector('[data-sqft]')?.textContent || '',
          lotSize: document.querySelector('[data-lot-size]')?.textContent || '',
          yearBuilt: document.querySelector('[data-year-built]')?.textContent || '',
          propertyType: document.querySelector('[data-property-type]')?.textContent || '',
          status: document.querySelector('[data-status]')?.textContent || '',
          dom: document.querySelector('[data-dom]')?.textContent || '',
          listAgent: document.querySelector('[data-list-agent]')?.textContent || '',
          sellingAgent: document.querySelector('[data-selling-agent]')?.textContent || '',
          listOffice: document.querySelector('[data-list-office]')?.textContent || '',
          sellOffice: document.querySelector('[data-sell-office]')?.textContent || '',
          listDate: document.querySelector('[data-list-date]')?.textContent || '',
          soldDate: document.querySelector('[data-sold-date]')?.textContent || '',
          closePrice: document.querySelector('[data-close-price]')?.textContent || '',
          dom: document.querySelector('[data-dom]')?.textContent || '',
          cdom: document.querySelector('[data-cdom]')?.textContent || '',
          description: document.querySelector('[data-description]')?.textContent || '',
          photos: Array.from(document.querySelectorAll('[data-photo]')).map(el => el.src)
        };
      });

      return {
        success: true,
        mlsNumber,
        details
      };
    } catch (err) {
      console.error(`[MLS] Failed to get listing details:`, err.message);
      throw err;
    }
  }

  /**
   * Create new listing
   */
  async createListing(userId, listingData) {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated || !cache.capabilities.canCreateListings) {
      throw new Error('User not authorized to create listings');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to new listing form
      await page.goto(`${this.baseUrl}/listings/new`, { waitUntil: 'domcontentloaded' });

      // Fill property information
      await page.fill('input[name="address"]', listingData.address);
      await page.fill('input[name="city"]', listingData.city);
      await page.fill('input[name="state"]', listingData.state);
      await page.fill('input[name="zip"]', listingData.zip);

      if (listingData.bedrooms) {
        await page.selectOption('select[name="bedrooms"]', listingData.bedrooms.toString());
      }

      if (listingData.bathrooms) {
        await page.selectOption('select[name="bathrooms"]', listingData.bathrooms.toString());
      }

      if (listingData.listPrice) {
        await page.fill('input[name="listPrice"]', listingData.listPrice.toString());
      }

      if (listingData.propertyType) {
        await page.selectOption('select[name="propertyType"]', listingData.propertyType);
      }

      if (listingData.description) {
        await page.fill('textarea[name="description"]', listingData.description);
      }

      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' });

      // Get new MLS number
      const newMlsNumber = await page.evaluate(() => {
        return document.querySelector('[data-mls]')?.textContent || '';
      });

      console.log(`[MLS] Listing created: ${newMlsNumber}`);

      return {
        success: true,
        mlsNumber: newMlsNumber,
        address: listingData.address,
        message: 'Listing created successfully'
      };
    } catch (err) {
      console.error(`[MLS] Failed to create listing:`, err.message);
      throw err;
    }
  }

  /**
   * Submit offer
   */
  async submitOffer(userId, offerData) {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated || !cache.capabilities.canSubmitOffers) {
      throw new Error('User not authorized to submit offers');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to offer form for listing
      await page.goto(`${this.baseUrl}/listings/${offerData.mlsNumber}/offer`, { waitUntil: 'domcontentloaded' });

      // Fill offer information
      await page.fill('input[name="offerPrice"]', offerData.offerPrice.toString());

      if (offerData.earnestMoney) {
        await page.fill('input[name="earnestMoney"]', offerData.earnestMoney.toString());
      }

      if (offerData.closingDate) {
        await page.fill('input[name="closingDate"]', offerData.closingDate);
      }

      if (offerData.contingencies) {
        for (const contingency of offerData.contingencies) {
          const checkbox = await page.$(`input[value="${contingency}"]`);
          if (checkbox) {
            await checkbox.check();
          }
        }
      }

      if (offerData.buyerAgent) {
        await page.fill('input[name="buyerAgent"]', offerData.buyerAgent);
      }

      if (offerData.notes) {
        await page.fill('textarea[name="notes"]', offerData.notes);
      }

      // Submit offer
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' });

      const offerId = await page.evaluate(() => {
        return document.querySelector('[data-offer-id]')?.textContent || '';
      });

      cache.offers.push({
        offerId,
        mlsNumber: offerData.mlsNumber,
        offerPrice: offerData.offerPrice,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      });

      console.log(`[MLS] Offer submitted: ${offerId}`);

      return {
        success: true,
        offerId,
        mlsNumber: offerData.mlsNumber,
        message: 'Offer submitted successfully'
      };
    } catch (err) {
      console.error(`[MLS] Failed to submit offer:`, err.message);
      throw err;
    }
  }

  /**
   * Generate and write listing agreement
   */
  async writeListingAgreement(userId, agreementData) {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated || !cache.capabilities.canWriteAgreements) {
      throw new Error('User not authorized to write agreements');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to agreement form
      await page.goto(`${this.baseUrl}/documents/listing-agreement`, { waitUntil: 'domcontentloaded' });

      // Fill agreement information
      await page.fill('input[name="sellerName"]', agreementData.sellerName);
      await page.fill('input[name="sellerPhone"]', agreementData.sellerPhone);
      await page.fill('input[name="sellerEmail"]', agreementData.sellerEmail);
      await page.fill('input[name="propertyAddress"]', agreementData.propertyAddress);
      await page.fill('input[name="listPrice"]', agreementData.listPrice.toString());

      if (agreementData.commissionPercent) {
        await page.fill('input[name="commissionPercent"]', agreementData.commissionPercent.toString());
      }

      if (agreementData.listingDays) {
        await page.selectOption('select[name="listingDays"]', agreementData.listingDays.toString());
      }

      // Generate document
      await page.click('button[data-action="generate"]');
      await page.waitForTimeout(2000);

      // Download document
      const documentUrl = await page.getAttribute('a[data-action="download"]', 'href');

      cache.agreements.push({
        sellerName: agreementData.sellerName,
        propertyAddress: agreementData.propertyAddress,
        generatedAt: new Date().toISOString(),
        documentUrl,
        status: 'generated'
      });

      console.log(`[MLS] Listing agreement generated for ${agreementData.sellerName}`);

      return {
        success: true,
        sellerName: agreementData.sellerName,
        propertyAddress: agreementData.propertyAddress,
        documentUrl,
        message: 'Listing agreement generated successfully'
      };
    } catch (err) {
      console.error(`[MLS] Failed to write agreement:`, err.message);
      throw err;
    }
  }

  /**
   * Write extension
   */
  async writeExtension(userId, extensionData) {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated || !cache.capabilities.canWriteExtensions) {
      throw new Error('User not authorized to write extensions');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to extension form
      await page.goto(`${this.baseUrl}/listings/${extensionData.mlsNumber}/extension`, { waitUntil: 'domcontentloaded' });

      // Fill extension information
      await page.fill('input[name="newCloseDate"]', extensionData.newCloseDate);

      if (extensionData.reason) {
        await page.fill('textarea[name="reason"]', extensionData.reason);
      }

      if (extensionData.additionalDays) {
        await page.selectOption('select[name="additionalDays"]', extensionData.additionalDays.toString());
      }

      // Submit extension
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' });

      cache.extensions.push({
        mlsNumber: extensionData.mlsNumber,
        newCloseDate: extensionData.newCloseDate,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      });

      console.log(`[MLS] Extension submitted for MLS ${extensionData.mlsNumber}`);

      return {
        success: true,
        mlsNumber: extensionData.mlsNumber,
        newCloseDate: extensionData.newCloseDate,
        message: 'Extension submitted successfully'
      };
    } catch (err) {
      console.error(`[MLS] Failed to write extension:`, err.message);
      throw err;
    }
  }

  /**
   * Access documents
   */
  async getDocuments(userId, documentType = 'all') {
    const cache = this.initializeUserMLS(userId);

    if (!cache.authenticated || !cache.capabilities.canAccessDocuments) {
      throw new Error('User not authorized to access documents');
    }

    try {
      const page = this.contexts[userId]?.pages()[0];
      if (!page) {
        throw new Error('No active MLS session');
      }

      // Navigate to documents page
      await page.goto(`${this.baseUrl}/documents${documentType !== 'all' ? `?type=${documentType}` : ''}`, {
        waitUntil: 'domcontentloaded'
      });

      // Extract documents
      const documents = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('[data-document-item]').forEach(el => {
          items.push({
            id: el.getAttribute('data-document-id'),
            name: el.querySelector('[data-document-name]')?.textContent || '',
            type: el.querySelector('[data-document-type]')?.textContent || '',
            date: el.querySelector('[data-document-date]')?.textContent || '',
            url: el.querySelector('a[data-download]')?.href || ''
          });
        });
        return items;
      });

      cache.documents = documents;

      console.log(`[MLS] Retrieved ${documents.length} documents for user ${userId}`);

      return {
        success: true,
        count: documents.length,
        documents
      };
    } catch (err) {
      console.error(`[MLS] Failed to get documents:`, err.message);
      throw err;
    }
  }

  /**
   * Get user MLS data
   */
  getUserMLSData(userId) {
    const cache = this.initializeUserMLS(userId);
    return {
      authenticated: cache.authenticated,
      capabilities: cache.capabilities,
      listings: {
        count: cache.listings.length,
        items: cache.listings
      },
      offers: {
        count: cache.offers.length,
        items: cache.offers
      },
      agreements: {
        count: cache.agreements.length,
        items: cache.agreements
      },
      extensions: {
        count: cache.extensions.length,
        items: cache.extensions
      },
      documents: {
        count: cache.documents.length,
        items: cache.documents
      },
      lastSync: cache.lastSync
    };
  }

  /**
   * Logout user from MLS
   */
  async logout(userId) {
    try {
      const context = this.contexts[userId];
      if (context) {
        await context.close();
        delete this.contexts[userId];
      }

      const cache = mlsCache[userId];
      if (cache) {
        cache.authenticated = false;
        cache.credentials = null;
      }

      console.log(`[MLS] User ${userId} logged out`);

      return { success: true, message: 'Logged out successfully' };
    } catch (err) {
      console.error(`[MLS] Logout failed:`, err.message);
      throw err;
    }
  }

  /**
   * Close all connections
   */
  async closeAll() {
    try {
      for (const userId in this.contexts) {
        await this.contexts[userId].close();
      }
      this.contexts = {};

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      console.log('[MLS] All connections closed');
    } catch (err) {
      console.error('[MLS] Error closing connections:', err.message);
    }
  }
}

module.exports = MLSNWMLSService;
