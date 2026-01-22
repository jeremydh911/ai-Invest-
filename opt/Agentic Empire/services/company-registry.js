/**
 * Global Company Registry & Management
 * 
 * Handles:
 * - Company registration and lifecycle
 * - Master database (tracks all companies)
 * - Admin approval workflows
 * - LLM sharing configuration
 * - Data copy/migration requests
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const CompanyDB = require('./company-db');

class CompanyRegistry {
  constructor() {
    this.registryDbPath = path.join(__dirname, '..', 'data', 'registry.db');
    this.ensureRegistryDb();
  }

  /**
   * Ensure global registry database exists with proper schema
   */
  ensureRegistryDb() {
    const registryDir = path.dirname(this.registryDbPath);
    if (!fs.existsSync(registryDir)) {
      fs.mkdirSync(registryDir, { recursive: true });
    }

    const db = new sqlite3.Database(this.registryDbPath);
    
    db.serialize(() => {
      // Companies table (global)
      db.run(`CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        industry TEXT,
        created_by TEXT,
        llm_model TEXT DEFAULT 'independent',
        shared_llm_source_id INTEGER,
        admin_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Company Users Mapping (tracks which users belong to which company)
      db.run(`CREATE TABLE IF NOT EXISTS company_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(company_id) REFERENCES companies(id),
        UNIQUE(company_id, username)
      )`);

      // Admin Approval Requests
      db.run(`CREATE TABLE IF NOT EXISTS admin_approval_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_type TEXT,
        source_company_id INTEGER,
        target_company_id INTEGER,
        requesting_user TEXT,
        approving_admin TEXT,
        details TEXT,
        status TEXT DEFAULT 'pending',
        dlp_warning BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        FOREIGN KEY(source_company_id) REFERENCES companies(id),
        FOREIGN KEY(target_company_id) REFERENCES companies(id)
      )`);

      // LLM Sharing Configuration
      db.run(`CREATE TABLE IF NOT EXISTS llm_sharing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_company_id INTEGER NOT NULL,
        target_company_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        dlp_risk_level TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(source_company_id) REFERENCES companies(id),
        FOREIGN KEY(target_company_id) REFERENCES companies(id),
        UNIQUE(source_company_id, target_company_id)
      )`);

      // Company Copy Requests
      db.run(`CREATE TABLE IF NOT EXISTS company_copy_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_company_id INTEGER NOT NULL,
        target_company_id INTEGER NOT NULL,
        requesting_user TEXT,
        approving_admin TEXT,
        copy_type TEXT DEFAULT 'full',
        is_llm_shared BOOLEAN DEFAULT 0,
        dlp_acknowledged BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY(source_company_id) REFERENCES companies(id),
        FOREIGN KEY(target_company_id) REFERENCES companies(id)
      )`);

      // Industry Templates (global reference)
      db.run(`CREATE TABLE IF NOT EXISTS industry_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        industry_name TEXT UNIQUE NOT NULL,
        description TEXT,
        roles TEXT,
        chart_data TEXT,
        growth_stages TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Session tracking for admin sign-ins
      db.run(`CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        username TEXT,
        session_token TEXT UNIQUE,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(company_id) REFERENCES companies(id)
      )`);
    });

    db.close();
  }

  /**
   * Get registry database connection
   * @returns {sqlite3.Database}
   */
  getRegistryDb() {
    return new sqlite3.Database(this.registryDbPath);
  }

  /**
   * Create a new company
   * @param {Object} config - Company configuration
   * @returns {Promise<number>} Company ID
   */
  async createCompany(config) {
    const { name, description, industry, createdBy } = config;
    
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      
      db.run(`INSERT INTO companies (name, description, industry, created_by, admin_count)
              VALUES (?, ?, ?, ?, 0)`,
        [name, description, industry, createdBy],
        function(err) {
          if (err) {
            db.close();
            reject(err);
          } else {
            const companyId = this.lastID;
            
            // Initialize company database
            CompanyDB.initializeCompanyDatabase(companyId, name)
              .then(() => {
                db.close();
                resolve(companyId);
              })
              .catch(err => {
                db.close();
                reject(err);
              });
          }
        }
      );
    });
  }

  /**
   * Get company by ID
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>}
   */
  getCompany(companyId) {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * List all companies
   * @returns {Promise<Array>}
   */
  listCompanies() {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      db.all('SELECT id, name, industry, admin_count, status FROM companies WHERE status = "active" ORDER BY created_at DESC', 
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Add user to company
   * @param {number} companyId - Company ID
   * @param {Object} userData - User data {username, email, isAdmin}
   * @returns {Promise}
   */
  async addUserToCompany(companyId, userData) {
    const { username, email, isAdmin } = userData;
    
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      
      db.run(`INSERT INTO company_users (company_id, username, email, is_admin)
              VALUES (?, ?, ?, ?)`,
        [companyId, username, email, isAdmin ? 1 : 0],
        function(err) {
          if (err) {
            db.close();
            reject(err);
          } else {
            // Update admin count if admin
            if (isAdmin) {
              db.run(`UPDATE companies SET admin_count = admin_count + 1 WHERE id = ?`,
                [companyId],
                (err) => {
                  db.close();
                  if (err) reject(err);
                  else resolve();
                }
              );
            } else {
              db.close();
              resolve();
            }
          }
        }
      );
    });
  }

  /**
   * Get company admins
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>}
   */
  getCompanyAdmins(companyId) {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      db.all(`SELECT username, email FROM company_users WHERE company_id = ? AND is_admin = 1`,
        [companyId],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Check if user is admin for company
   * @param {number} companyId - Company ID
   * @param {string} username - Username
   * @returns {Promise<boolean>}
   */
  isCompanyAdmin(companyId, username) {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      db.get(`SELECT is_admin FROM company_users WHERE company_id = ? AND username = ?`,
        [companyId, username],
        (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row && row.is_admin ? true : false);
        }
      );
    });
  }

  /**
   * Get user's companies
   * @param {string} username - Username
   * @returns {Promise<Array>}
   */
  getUserCompanies(username) {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      db.all(`SELECT c.id, c.name, c.industry, cu.is_admin 
              FROM companies c
              JOIN company_users cu ON c.id = cu.company_id
              WHERE cu.username = ? AND c.status = 'active'
              ORDER BY c.created_at DESC`,
        [username],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Create copy request
   * @param {Object} request - Request data
   * @returns {Promise<number>} Request ID
   */
  createCopyRequest(request) {
    const { sourceCompanyId, targetCompanyId, requestingUser, isLlmShared } = request;
    
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      
      db.run(`INSERT INTO company_copy_requests 
              (source_company_id, target_company_id, requesting_user, is_llm_shared, dlp_acknowledged)
              VALUES (?, ?, ?, ?, 0)`,
        [sourceCompanyId, targetCompanyId, requestingUser, isLlmShared ? 1 : 0],
        function(err) {
          db.close();
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Approve copy request (admin only)
   * @param {number} requestId - Request ID
   * @param {string} approvingAdmin - Admin username
   * @param {boolean} dlpAcknowledged - DLP warning acknowledged
   * @returns {Promise}
   */
  approveCopyRequest(requestId, approvingAdmin, dlpAcknowledged) {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      
      db.run(`UPDATE company_copy_requests 
              SET status = 'approved', 
                  approving_admin = ?, 
                  dlp_acknowledged = ?,
                  approved_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        [approvingAdmin, dlpAcknowledged ? 1 : 0, requestId],
        (err) => {
          db.close();
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Setup LLM sharing between companies
   * @param {number} sourceId - Source company ID
   * @param {number} targetId - Target company ID
   * @param {string} riskLevel - DLP risk level
   * @returns {Promise}
   */
  setupLlmSharing(sourceId, targetId, riskLevel = 'medium') {
    return new Promise((resolve, reject) => {
      const db = this.getRegistryDb();
      
      db.run(`INSERT OR REPLACE INTO llm_sharing (source_company_id, target_company_id, dlp_risk_level, is_active)
              VALUES (?, ?, ?, 1)`,
        [sourceId, targetId, riskLevel],
        (err) => {
          db.close();
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = new CompanyRegistry();
