/**
 * Company Database Management Service
 * 
 * Handles:
 * - Separate SQLite databases per company
 * - Company creation and initialization
 * - Database file management
 * - Company-scoped database connections
 * 
 * Each company gets its own app-company-{id}.db file
 * All data is completely isolated between companies
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CompanyDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data', 'companies');
    this.companyConnections = new Map();
    this.ensureCompanyDir();
  }

  ensureCompanyDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Get or create a database connection for a specific company
   * @param {number} companyId - Company ID
   * @returns {sqlite3.Database} Database connection
   */
  getCompanyDb(companyId) {
    if (this.companyConnections.has(companyId)) {
      return this.companyConnections.get(companyId);
    }

    const dbPath = path.join(this.dataDir, `app-company-${companyId}.db`);
    const db = new sqlite3.Database(dbPath);
    
    // Enable foreign keys for this connection
    db.run('PRAGMA foreign_keys = ON');
    
    this.companyConnections.set(companyId, db);
    return db;
  }

  /**
   * Initialize company database with schema
   * @param {number} companyId - Company ID
   * @param {string} companyName - Company name for context
   * @returns {Promise}
   */
  initializeCompanyDatabase(companyId, companyName) {
    return new Promise((resolve, reject) => {
      const db = this.getCompanyDb(companyId);
      
      db.serialize(() => {
        // Users table (company-specific)
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'user',
          is_admin BOOLEAN DEFAULT 0,
          first_name TEXT,
          last_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) reject(err);
        });

        // Personas/Agents table
        db.run(`CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          position TEXT NOT NULL,
          industry TEXT,
          department TEXT,
          system_prompt TEXT,
          model TEXT,
          voice TEXT,
          status TEXT DEFAULT 'active',
          hire_date DATETIME,
          training_completed BOOLEAN DEFAULT 0,
          fine_tuned_model TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(created_by) REFERENCES users(id)
        )`, (err) => {
          if (err) reject(err);
        });

        // Settings table (company-wide and user-specific)
        db.run(`CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          setting_type TEXT DEFAULT 'user',
          rag_enabled BOOLEAN DEFAULT 1,
          rag_chunk_size INTEGER DEFAULT 1024,
          rag_overlap INTEGER DEFAULT 100,
          rag_max_results INTEGER DEFAULT 5,
          tuning_temperature REAL DEFAULT 0.7,
          tuning_top_p REAL DEFAULT 0.9,
          tuning_max_tokens INTEGER DEFAULT 2000,
          voice_enabled BOOLEAN DEFAULT 1,
          voice_model TEXT DEFAULT 'alloy',
          voice_speed REAL DEFAULT 1.0,
          llm_model_name TEXT DEFAULT 'gpt-4-turbo',
          llm_base_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) reject(err);
        });

        // RAG Documents table
        db.run(`CREATE TABLE IF NOT EXISTS rag_documents (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          agent_id INTEGER,
          title TEXT NOT NULL,
          content TEXT,
          file_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(agent_id) REFERENCES agents(id)
        )`, (err) => {
          if (err) reject(err);
        });

        // Conversations table
        db.run(`CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          agent_id INTEGER,
          title TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(agent_id) REFERENCES agents(id)
        )`, (err) => {
          if (err) reject(err);
        });

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY,
          conversation_id INTEGER NOT NULL,
          role TEXT,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )`, (err) => {
          if (err) reject(err);
        });

        // Agent Onboarding Progress
        db.run(`CREATE TABLE IF NOT EXISTS agent_onboarding (
          id INTEGER PRIMARY KEY,
          agent_id INTEGER NOT NULL UNIQUE,
          step INTEGER DEFAULT 1,
          training_data_uploaded BOOLEAN DEFAULT 0,
          rag_indexed BOOLEAN DEFAULT 0,
          model_fine_tuned BOOLEAN DEFAULT 0,
          system_prompt_set BOOLEAN DEFAULT 0,
          voice_configured BOOLEAN DEFAULT 0,
          test_conversation_passed BOOLEAN DEFAULT 0,
          completed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
        )`, (err) => {
          if (err) reject(err);
        });

        // Company Configuration
        db.run(`CREATE TABLE IF NOT EXISTS company_config (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          industry TEXT,
          llm_selection TEXT DEFAULT 'independent',
          shared_llm_company_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) reject(err);
        });

        // Industry Templates
        db.run(`CREATE TABLE IF NOT EXISTS industry_templates (
          id INTEGER PRIMARY KEY,
          industry_name TEXT NOT NULL,
          description TEXT,
          required_positions TEXT,
          template_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) reject(err);
        });

        // Agent Batch Deploy History
        db.run(`CREATE TABLE IF NOT EXISTS agent_batch_deploys (
          id INTEGER PRIMARY KEY,
          batch_name TEXT,
          created_by INTEGER,
          agent_count INTEGER,
          status TEXT DEFAULT 'pending',
          deployment_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY(created_by) REFERENCES users(id)
        )`, (err) => {
          if (err) reject(err);
        });

        // Copy Requests (for company data sharing)
        db.run(`CREATE TABLE IF NOT EXISTS copy_requests (
          id INTEGER PRIMARY KEY,
          requester_company_id INTEGER,
          target_company_id INTEGER,
          approver_user_id INTEGER,
          status TEXT DEFAULT 'pending',
          is_shared_llm BOOLEAN DEFAULT 0,
          dlp_warning_acknowledged BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          approved_at DATETIME
        )`, (err) => {
          if (err) reject(err);
        });

        // Audit Logs
        db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          action TEXT,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) reject(err);
        });

        // Initialize company config
        db.run(`INSERT INTO company_config (name, description) VALUES (?, ?)`,
          [companyName, `Configuration for ${companyName}`],
          function(err) {
            if (err && !err.message.includes('UNIQUE constraint failed')) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    });
  }

  /**
   * Get company database file path
   * @param {number} companyId - Company ID
   * @returns {string} File path
   */
  getCompanyDbPath(companyId) {
    return path.join(this.dataDir, `app-company-${companyId}.db`);
  }

  /**
   * Close a company database connection
   * @param {number} companyId - Company ID
   */
  closeCompanyDb(companyId) {
    const db = this.companyConnections.get(companyId);
    if (db) {
      db.close();
      this.companyConnections.delete(companyId);
    }
  }

  /**
   * Delete company database (complete data removal)
   * @param {number} companyId - Company ID
   */
  deleteCompanyDb(companyId) {
    this.closeCompanyDb(companyId);
    const dbPath = this.getCompanyDbPath(companyId);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  }

  /**
   * Get list of all company IDs
   * @returns {Promise<number[]>}
   */
  listCompanies() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.dataDir, (err, files) => {
        if (err) {
          if (err.code === 'ENOENT') resolve([]);
          else reject(err);
        } else {
          const companies = files
            .filter(f => f.startsWith('app-company-') && f.endsWith('.db'))
            .map(f => parseInt(f.match(/\d+/)[0]));
          resolve(companies);
        }
      });
    });
  }

  /**
   * Run a query on company database
   * @param {number} companyId - Company ID
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise}
   */
  run(companyId, sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = this.getCompanyDb(companyId);
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Get single row from company database
   * @param {number} companyId - Company ID
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise}
   */
  get(companyId, sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = this.getCompanyDb(companyId);
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get all rows from company database
   * @param {number} companyId - Company ID
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise}
   */
  all(companyId, sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = this.getCompanyDb(companyId);
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = new CompanyDatabase();
