/**
 * CRM Integrations Service
 * Handles data sync with external CRM platforms: Brivity, TopProducer, etc.
 * Stores all CRM data in memory for quick access and context
 */

const axios = require('axios');

// Per-user in-memory CRM cache for all integrations
// Structure: { userId: { brivity: {...}, topproducer: {...}, local: {...} } }
const crmCache = {};

// Configuration for each CRM platform
const crmConfigs = {
  brivity: {
    apiBaseUrl: process.env.BRIVITY_API_BASE_URL || 'https://api.brivity.com/v1',
    apiKey: process.env.BRIVITY_API_KEY,
    clientId: process.env.BRIVITY_CLIENT_ID,
    clientSecret: process.env.BRIVITY_CLIENT_SECRET,
    enabled: !!process.env.BRIVITY_API_KEY,
    syncInterval: 3600000, // 1 hour
    batchSize: 100
  },
  topproducer: {
    apiBaseUrl: process.env.TOPPRODUCER_API_BASE_URL || 'https://api.topproducerpro.com/v2',
    apiKey: process.env.TOPPRODUCER_API_KEY,
    clientId: process.env.TOPPRODUCER_CLIENT_ID,
    clientSecret: process.env.TOPPRODUCER_CLIENT_SECRET,
    enabled: !!process.env.TOPPRODUCER_API_KEY,
    syncInterval: 3600000, // 1 hour
    batchSize: 100
  }
};

/**
 * Initialize user-specific cache
 * @param {string|number} userId - The user ID to initialize cache for
 */
function initializeUserCache(userId) {
  if (!crmCache[userId]) {
    crmCache[userId] = {
      brivity: { contacts: [], deals: [], activities: [], lastSync: null, syncStatus: 'idle' },
      topproducer: { contacts: [], deals: [], activities: [], lastSync: null, syncStatus: 'idle' },
      local: { contacts: [], deals: [], activities: [], lastSync: null, syncStatus: 'idle' }
    };
  }
}

/**
 * Get user-specific cache
 * @param {string|number} userId - The user ID
 * @returns {Object} User's CRM cache
 */
function getUserCache(userId) {
  initializeUserCache(userId);
  return crmCache[userId];
}

/**
 * Brivity CRM Integration
 */
class BrivityClient {
  constructor() {
    this.config = crmConfigs.brivity;
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.config.apiBaseUrl}/auth/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }, {
        timeout: 10000
      });

      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.token;
    } catch (error) {
      console.error('[Brivity] Authentication failed:', error.message);
      throw new Error('Brivity authentication failed');
    }
  }

  async getContacts(filters = {}) {
    try {
      const token = await this.authenticate();
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${this.config.apiBaseUrl}/contacts?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('[Brivity] Failed to fetch contacts:', error.message);
      return { contacts: [], total: 0 };
    }
  }

  async getContact(contactId) {
    try {
      const token = await this.authenticate();
      const response = await axios.get(`${this.config.apiBaseUrl}/contacts/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`[Brivity] Failed to fetch contact ${contactId}:`, error.message);
      return null;
    }
  }

  async getDeals(filters = {}) {
    try {
      const token = await this.authenticate();
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.status) params.append('status', filters.status);
      if (filters.stage) params.append('stage', filters.stage);

      const response = await axios.get(`${this.config.apiBaseUrl}/deals?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('[Brivity] Failed to fetch deals:', error.message);
      return { deals: [], total: 0 };
    }
  }

  async createContact(contactData) {
    try {
      const token = await this.authenticate();
      const response = await axios.post(`${this.config.apiBaseUrl}/contacts`, contactData, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('[Brivity] Failed to create contact:', error.message);
      throw error;
    }
  }

  async updateContact(contactId, contactData) {
    try {
      const token = await this.authenticate();
      const response = await axios.put(`${this.config.apiBaseUrl}/contacts/${contactId}`, contactData, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`[Brivity] Failed to update contact ${contactId}:`, error.message);
      throw error;
    }
  }

  async syncContacts(userId, db) {
    const userCache = getUserCache(userId);
    userCache.brivity.syncStatus = 'syncing';
    try {
      let allContacts = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getContacts({ 
          limit: this.config.batchSize, 
          offset 
        });

        if (result.contacts && result.contacts.length > 0) {
          allContacts = allContacts.concat(result.contacts);
          offset += result.contacts.length;
          hasMore = result.contacts.length === this.config.batchSize;
        } else {
          hasMore = false;
        }
      }

      // Map Brivity contacts to local CRM format
      const mappedContacts = allContacts.map(contact => ({
        id: contact.id,
        source_crm: 'brivity',
        source_id: contact.id,
        first_name: contact.first_name || contact.firstName || '',
        last_name: contact.last_name || contact.lastName || '',
        email: contact.email,
        phone: contact.phone || contact.phoneNumber,
        company: contact.company || contact.companyName,
        job_title: contact.job_title || contact.jobTitle,
        status: contact.status || 'prospect',
        rating: contact.rating || 0,
        notes: contact.notes || '',
        metadata: JSON.stringify({
          brivity_id: contact.id,
          brivity_source_type: contact.sourceType,
          brivity_lead_source: contact.leadSource,
          synced_at: new Date().toISOString(),
          user_id: userId
        })
      }));

      // Store in memory cache (user-specific)
      userCache.brivity.contacts = allContacts;
      userCache.brivity.lastSync = new Date();
      userCache.brivity.syncStatus = 'idle';

      console.log(`[Brivity] Successfully synced ${mappedContacts.length} contacts for user ${userId}`);
      return { success: true, count: mappedContacts.length, contacts: mappedContacts };
    } catch (error) {
      userCache.brivity.syncStatus = 'error';
      console.error('[Brivity] Sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async syncDeals(userId, db) {
    const userCache = getUserCache(userId);
    try {
      let allDeals = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getDeals({ 
          limit: this.config.batchSize, 
          offset 
        });

        if (result.deals && result.deals.length > 0) {
          allDeals = allDeals.concat(result.deals);
          offset += result.deals.length;
          hasMore = result.deals.length === this.config.batchSize;
        } else {
          hasMore = false;
        }
      }

      // Map Brivity deals to local format
      const mappedDeals = allDeals.map(deal => ({
        id: deal.id,
        source_crm: 'brivity',
        source_id: deal.id,
        name: deal.name || deal.dealName,
        amount: deal.amount || deal.dealAmount || 0,
        currency: deal.currency || 'USD',
        stage: deal.stage || deal.status,
        status: deal.status || 'open',
        probability: deal.probability || 50,
        close_date: deal.closeDate || deal.expectedCloseDate,
        metadata: JSON.stringify({
          brivity_id: deal.id,
          brivity_contact_id: deal.contactId,
          synced_at: new Date().toISOString(),
          user_id: userId
        })
      }));

      // Store in memory cache (user-specific)
      userCache.brivity.deals = allDeals;

      console.log(`[Brivity] Successfully synced ${mappedDeals.length} deals`);
      return { success: true, count: mappedDeals.length, deals: mappedDeals };
    } catch (error) {
      console.error('[Brivity] Deal sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * TopProducer CRM Integration
 */
class TopProducerClient {
  constructor() {
    this.config = crmConfigs.topproducer;
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.config.apiBaseUrl}/authentication/oauth/authorize`, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials'
      }, {
        timeout: 10000
      });

      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.token;
    } catch (error) {
      console.error('[TopProducer] Authentication failed:', error.message);
      throw new Error('TopProducer authentication failed');
    }
  }

  async getContacts(filters = {}) {
    try {
      const token = await this.authenticate();
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.status) params.append('Status', filters.status);

      const response = await axios.get(`${this.config.apiBaseUrl}/contacts?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('[TopProducer] Failed to fetch contacts:', error.message);
      return { value: [] };
    }
  }

  async getContact(contactId) {
    try {
      const token = await this.authenticate();
      const response = await axios.get(`${this.config.apiBaseUrl}/contacts('${contactId}')`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`[TopProducer] Failed to fetch contact ${contactId}:`, error.message);
      return null;
    }
  }

  async getDeals(filters = {}) {
    try {
      const token = await this.authenticate();
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('$top', filters.limit);
      if (filters.skip) params.append('$skip', filters.skip);

      const response = await axios.get(`${this.config.apiBaseUrl}/transactions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('[TopProducer] Failed to fetch deals:', error.message);
      return { value: [] };
    }
  }

  async syncContacts(userId, db) {
    const userCache = getUserCache(userId);
    userCache.topproducer.syncStatus = 'syncing';
    try {
      let allContacts = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getContacts({ 
          limit: this.config.batchSize, 
          offset: skip
        });

        if (result.value && result.value.length > 0) {
          allContacts = allContacts.concat(result.value);
          skip += result.value.length;
          hasMore = result.value.length === this.config.batchSize;
        } else {
          hasMore = false;
        }
      }

      // Map TopProducer contacts to local CRM format
      const mappedContacts = allContacts.map(contact => ({
        id: contact.Id || contact.id,
        source_crm: 'topproducer',
        source_id: contact.Id || contact.id,
        first_name: contact.FirstName || contact.firstName || '',
        last_name: contact.LastName || contact.lastName || '',
        email: contact.Email || contact.email,
        phone: contact.Phone || contact.phone,
        company: contact.Company || contact.company,
        job_title: contact.JobTitle || contact.jobTitle,
        status: contact.Status || 'prospect',
        rating: 0,
        notes: contact.Notes || '',
        metadata: JSON.stringify({
          topproducer_id: contact.Id || contact.id,
          topproducer_type: contact.ContactType,
          synced_at: new Date().toISOString(),
          user_id: userId
        })
      }));

      // Store in memory cache (user-specific)
      userCache.topproducer.contacts = allContacts;
      userCache.topproducer.lastSync = new Date();
      userCache.topproducer.syncStatus = 'idle';

      console.log(`[TopProducer] Successfully synced ${mappedContacts.length} contacts for user ${userId}`);
      return { success: true, count: mappedContacts.length, contacts: mappedContacts };
    } catch (error) {
      userCache.topproducer.syncStatus = 'error';
      console.error('[TopProducer] Sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async syncDeals(userId, db) {
    const userCache = getUserCache(userId);
    try {
      let allDeals = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getDeals({ 
          limit: this.config.batchSize, 
          skip
        });

        if (result.value && result.value.length > 0) {
          allDeals = allDeals.concat(result.value);
          skip += result.value.length;
          hasMore = result.value.length === this.config.batchSize;
        } else {
          hasMore = false;
        }
      }

      // Map TopProducer deals to local format
      const mappedDeals = allDeals.map(deal => ({
        id: deal.Id || deal.id,
        source_crm: 'topproducer',
        source_id: deal.Id || deal.id,
        name: deal.PropertyAddress || deal.Address,
        amount: deal.SalesPrice || deal.listPrice || 0,
        currency: 'USD',
        stage: deal.TransactionStatus || deal.status,
        status: deal.TransactionStatus || 'open',
        probability: 50,
        close_date: deal.CloseDate || deal.closingDate,
        metadata: JSON.stringify({
          topproducer_id: deal.Id || deal.id,
          topproducer_contact_id: deal.ContactId,
          topproducer_type: deal.TransactionType,
          synced_at: new Date().toISOString(),
          user_id: userId
        })
      }));

      // Store in memory cache (user-specific)
      userCache.topproducer.deals = allDeals;

      console.log(`[TopProducer] Successfully synced ${mappedDeals.length} deals for user ${userId}`);
      return { success: true, count: mappedDeals.length, deals: mappedDeals };
    } catch (error) {
      console.error('[TopProducer] Deal sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * CRM Integration Manager
 * Orchestrates syncing across all CRM platforms
 */
class CRMIntegrationManager {
  constructor() {
    this.brivity = new BrivityClient();
    this.topproducer = new TopProducerClient();
    this.syncIntervals = {};
  }

  /**
   * Get all cached CRM data for a specific user
   */
  getAllCachedData(userId, source = null) {
    const userCache = getUserCache(userId);
    if (source) {
      return userCache[source] || null;
    }
    return userCache;
  }

  /**
   * Get contacts from specific CRM or all for a specific user
   */
  getCachedContacts(userId, source = null) {
    const userCache = getUserCache(userId);
    if (source) {
      return userCache[source]?.contacts || [];
    }
    return {
      brivity: userCache.brivity.contacts,
      topproducer: userCache.topproducer.contacts,
      local: userCache.local.contacts
    };
  }

  /**
   * Get deals from specific CRM or all for a specific user
   */
  getCachedDeals(userId, source = null) {
    const userCache = getUserCache(userId);
    if (source) {
      return userCache[source]?.deals || [];
    }
    return {
      brivity: userCache.brivity.deals,
      topproducer: userCache.topproducer.deals,
      local: userCache.local.deals
    };
  }

  /**
   * Search across all CRM sources for a specific user
   */
  searchAllSources(userId, query, type = 'contact') {
    const userCache = getUserCache(userId);
    const results = {
      brivity: [],
      topproducer: [],
      local: []
    };
    const lowerQuery = query.toLowerCase();

    // Search Brivity
    if (type === 'contact') {
      results.brivity = userCache.brivity.contacts.filter(c => 
        (c.first_name && c.first_name.toLowerCase().includes(lowerQuery)) ||
        (c.last_name && c.last_name.toLowerCase().includes(lowerQuery)) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
        (c.company && c.company.toLowerCase().includes(lowerQuery))
      );
    } else if (type === 'deal') {
      results.brivity = userCache.brivity.deals.filter(d =>
        (d.name && d.name.toLowerCase().includes(lowerQuery)) ||
        (d.stage && d.stage.toLowerCase().includes(lowerQuery))
      );
    }

    // Search TopProducer
    if (type === 'contact') {
      results.topproducer = userCache.topproducer.contacts.filter(c =>
        (c.first_name && c.first_name.toLowerCase().includes(lowerQuery)) ||
        (c.last_name && c.last_name.toLowerCase().includes(lowerQuery)) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
        (c.company && c.company.toLowerCase().includes(lowerQuery))
      );
    } else if (type === 'deal') {
      results.topproducer = userCache.topproducer.deals.filter(d =>
        (d.name && d.name.toLowerCase().includes(lowerQuery)) ||
        (d.stage && d.stage.toLowerCase().includes(lowerQuery))
      );
    }

    // Search local CRM
    if (type === 'contact') {
      results.local = userCache.local.contacts.filter(c =>
        (c.first_name && c.first_name.toLowerCase().includes(lowerQuery)) ||
        (c.last_name && c.last_name.toLowerCase().includes(lowerQuery)) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
        (c.company && c.company.toLowerCase().includes(lowerQuery))
      );
    } else if (type === 'deal') {
      results.local = userCache.local.deals.filter(d =>
        (d.name && d.name.toLowerCase().includes(lowerQuery)) ||
        (d.stage && d.stage.toLowerCase().includes(lowerQuery))
      );
    }

    return results;
  }

  /**
   * Sync all enabled CRM sources
   */
  async syncAllSources(userId, db) {
    const results = {
      brivity: { success: false },
      topproducer: { success: false },
      synced_at: new Date().toISOString()
    };

    // Sync Brivity
    if (crmConfigs.brivity.enabled) {
      results.brivity = await this.syncBrivity(userId, db);
    }

    // Sync TopProducer
    if (crmConfigs.topproducer.enabled) {
      results.topproducer = await this.syncTopProducer(userId, db);
    }

    return results;
  }

  async syncBrivity(userId, db) {
    console.log('[CRM] Starting Brivity sync...');
    const contactsResult = await this.brivity.syncContacts(userId, db);
    const dealsResult = await this.brivity.syncDeals(userId, db);
    
    return {
      contacts: contactsResult,
      deals: dealsResult,
      success: contactsResult.success && dealsResult.success
    };
  }

  async syncTopProducer(userId, db) {
    console.log('[CRM] Starting TopProducer sync...');
    const contactsResult = await this.topproducer.syncContacts(userId, db);
    const dealsResult = await this.topproducer.syncDeals(userId, db);
    
    return {
      contacts: contactsResult,
      deals: dealsResult,
      success: contactsResult.success && dealsResult.success
    };
  }

  /**
   * Get sync status for all sources for a specific user
   */
  getSyncStatus(userId) {
    const userCache = getUserCache(userId);
    return {
      brivity: {
        status: userCache.brivity.syncStatus,
        lastSync: userCache.brivity.lastSync,
        contactCount: userCache.brivity.contacts.length,
        dealCount: userCache.brivity.deals.length
      },
      topproducer: {
        status: userCache.topproducer.syncStatus,
        lastSync: userCache.topproducer.lastSync,
        contactCount: userCache.topproducer.contacts.length,
        dealCount: userCache.topproducer.deals.length
      },
      local: {
        contactCount: userCache.local.contacts.length,
        dealCount: userCache.local.deals.length
      }
    };
  }

  /**
   * Clear cache for a specific user
   */
  clearCache(userId, source = null) {
    const userCache = getUserCache(userId);
    if (source) {
      userCache[source] = { 
        contacts: [], 
        deals: [], 
        activities: [], 
        lastSync: null, 
        syncStatus: 'idle' 
      };
    } else {
      Object.keys(userCache).forEach(key => {
        userCache[key] = { 
          contacts: [], 
          deals: [], 
          activities: [], 
          lastSync: null, 
          syncStatus: 'idle' 
        };
      });
    }
  }
}

// Export single instance
module.exports = {
  CRMIntegrationManager,
  BrivityClient,
  TopProducerClient,
  crmCache,
  crmConfigs,
  getUserCache,
  manager: new CRMIntegrationManager()
};
