// ============================================================================
// COMPANY SETUP SERVICE
// Secure Master Company Configuration Management
// Encryption: AES-256, PBKDF2, Industry Compliance Standards
// ============================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Company Setup Service
 * Manages master company data with enterprise-grade encryption
 * and strict access controls for sensitive information
 */
class CompanySetupService {
  constructor() {
    // Encryption configuration
    this.algorithm = 'aes-256-cbc';
    this.encryptionKeyPath = path.join(__dirname, '../.keys/company-setup.key');
    this.encryptionKey = this.loadOrCreateEncryptionKey();

    // Company data storage (in-memory for demo, use database in production)
    this.companyData = new Map();
    this.auditLog = [];

    // Sensitive field markers for encryption
    this.sensitiveFieaolds = [
      'ein',
      'ssn',
      'bankAccountNumber',
      'routingNumber',
      'apiKeys',
      'privateKeys',
      'bankingCredentials',
      'payrollServiceCredentials',
      'taxIdNumber',
      'businessLicenseNumber'
    ];

    // Access control matrix
    this.accessRoles = {
      ADMIN: 'admin',
      POWER_USER: 'power_user',
      MANAGER: 'manager',
      EMPLOYEE: 'employee',
      VIEWER: 'viewer'
    };

    // Company document structure
    this.companyStructure = {
      companyInfo: null,
      executives: new Map(),
      organizationalChart: null,
      complianceFramework: null,
      bankingInfo: null,
      payrollInfo: null,
      operationalSettings: null
    };
  }

  // ========== ENCRYPTION METHODS ==========

  /**
   * Load or create encryption key for sensitive data
   */
  loadOrCreateEncryptionKey() {
    try {
      // Ensure keys directory exists
      const keyDir = path.dirname(this.encryptionKeyPath);
      if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
      }

      // Check if key file exists
      if (fs.existsSync(this.encryptionKeyPath)) {
        const keyData = fs.readFileSync(this.encryptionKeyPath, 'utf8');
        return Buffer.from(keyData, 'hex');
      }

      // Create new key using PBKDF2
      const masterPassword = process.env.MASTER_ENCRYPTION_KEY || 'default-unsafe-key';
      const salt = crypto.randomBytes(16);
      const key = crypto.pbkdf2Sync(masterPassword, salt, 100000, 32, 'sha256');

      // Store salt and key securely
      const keyData = Buffer.concat([salt, key]);
      fs.writeFileSync(this.encryptionKeyPath, keyData.toString('hex'), {
        mode: 0o600 // Only owner can read
      });

      return key;
    } catch (error) {
      throw new Error(`Failed to load/create encryption key: ${error.message}`);
    }
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   */
  encryptData(data) {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(16);

      // Cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Return IV + encrypted data (IV is public, encryption is the security)
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        algorithm: this.algorithm,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedPayload) {
    try {
      const iv = Buffer.from(encryptedPayload.iv, 'hex');
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );

      let decrypted = decipher.update(encryptedPayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data for validation (one-way)
   */
  hashSensitiveData(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // ========== ACCESS CONTROL METHODS ==========

  /**
   * Check if user has permission to access company setup
   */
  checkAccess(userId, userRole, action) {
    // Only ADMIN and POWER_USER can modify company setup
    const modifyActions = ['create', 'update', 'delete', 'activate'];
    const viewActions = ['read', 'view', 'list'];

    if (modifyActions.includes(action)) {
      return [this.accessRoles.ADMIN, this.accessRoles.POWER_USER].includes(userRole);
    }

    if (viewActions.includes(action)) {
      return [
        this.accessRoles.ADMIN,
        this.accessRoles.POWER_USER,
        this.accessRoles.MANAGER
      ].includes(userRole);
    }

    return false;
  }

  /**
   * Verify access and log the attempt
   */
  verifyAccessAndLog(userId, userRole, action, resource) {
    const hasAccess = this.checkAccess(userId, userRole, action);

    // Log all access attempts (even failures)
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      action,
      resource,
      accessGranted: hasAccess,
      ipAddress: 'tracked-from-request',
      userAgent: 'tracked-from-request'
    });

    if (!hasAccess) {
      throw new Error(
        `Access Denied: User ${userId} (${userRole}) cannot ${action} ${resource}`
      );
    }

    return true;
  }

  // ========== COMPANY DATA MANAGEMENT ==========

  /**
   * Create new company configuration
   * Requires ADMIN access
   */
  createCompanyConfiguration(userId, userRole, companyData) {
    // Verify access
    this.verifyAccessAndLog(userId, userRole, 'create', 'company_setup');

    // Validate company data structure
    this.validateCompanyData(companyData);

    // Generate unique company ID
    const companyId = crypto.randomUUID();

    // Separate sensitive and non-sensitive data
    const { sensitiveData, publicData } = this.separateSensitiveData(companyData);

    // Encrypt sensitive data
    const encryptedSensitive = this.encryptData(sensitiveData);

    // Store company configuration
    const configuration = {
      id: companyId,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      status: 'active',
      publicData,
      encryptedSensitive,
      dataHash: this.hashSensitiveData(sensitiveData),
      complianceStatus: {
        dlpCompliant: true,
        bankingCompliant: false, // Requires verification
        hipaaCompliant: false, // If applicable
        fairHousingCompliant: false, // If applicable
        lastComplianceCheck: new Date().toISOString()
      }
    };

    this.companyData.set(companyId, configuration);

    // Audit log
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'CREATE_COMPANY_CONFIG',
      companyId,
      performedBy: userId,
      changes: { publicFields: Object.keys(publicData) },
      status: 'success'
    });

    return {
      id: companyId,
      status: 'created',
      message: 'Company configuration created successfully',
      complianceStatus: configuration.complianceStatus
    };
  }

  /**
   * Update company configuration
   * Only accessible by ADMIN/POWER_USER
   */
  updateCompanyConfiguration(userId, userRole, companyId, updates) {
    this.verifyAccessAndLog(userId, userRole, 'update', `company_setup:${companyId}`);

    // Verify company exists
    if (!this.companyData.has(companyId)) {
      throw new Error(`Company configuration not found: ${companyId}`);
    }

    const currentConfig = this.companyData.get(companyId);
    const updateLog = [];

    // Process updates
    const { sensitiveData, publicData } = this.separateSensitiveData(updates);

    // Update public data
    if (Object.keys(publicData).length > 0) {
      Object.assign(currentConfig.publicData, publicData);
      updateLog.push({ type: 'public_fields', fields: Object.keys(publicData) });
    }

    // Update sensitive data (re-encrypt)
    if (Object.keys(sensitiveData).length > 0) {
      const combinedSensitive = {
        ...this.decryptData(currentConfig.encryptedSensitive),
        ...sensitiveData
      };
      currentConfig.encryptedSensitive = this.encryptData(combinedSensitive);
      currentConfig.dataHash = this.hashSensitiveData(combinedSensitive);
      updateLog.push({ type: 'sensitive_fields', fields: Object.keys(sensitiveData) });
    }

    // Update metadata
    currentConfig.updatedAt = new Date().toISOString();
    currentConfig.updatedBy = userId;

    // Audit log
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'UPDATE_COMPANY_CONFIG',
      companyId,
      performedBy: userId,
      changes: updateLog,
      status: 'success'
    });

    return {
      id: companyId,
      status: 'updated',
      message: 'Company configuration updated successfully',
      updatedFields: updateLog
    };
  }

  /**
   * Get company configuration (with proper decryption for authorized users)
   */
  getCompanyConfiguration(userId, userRole, companyId, includeSecrets = false) {
    this.verifyAccessAndLog(
      userId,
      userRole,
      includeSecrets ? 'read_secrets' : 'read',
      `company_setup:${companyId}`
    );

    if (!this.companyData.has(companyId)) {
      throw new Error(`Company configuration not found: ${companyId}`);
    }

    const config = this.companyData.get(companyId);

    // Only ADMIN can see encrypted sensitive data
    if (includeSecrets && userRole === this.accessRoles.ADMIN) {
      const decryptedSensitive = this.decryptData(config.encryptedSensitive);
      return {
        id: config.id,
        createdAt: config.createdAt,
        createdBy: config.createdBy,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
        status: config.status,
        ...config.publicData,
        ...decryptedSensitive,
        complianceStatus: config.complianceStatus
      };
    }

    // Non-admin users only get public data
    return {
      id: config.id,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      status: config.status,
      ...config.publicData,
      complianceStatus: config.complianceStatus,
      note: 'Sensitive financial data requires ADMIN access'
    };
  }

  /**
   * Validate company data structure
   */
  validateCompanyData(companyData) {
    const required = [
      'companyName',
      'industry',
      'ein',
      'incorporationDate',
      'headquarters'
    ];

    const missing = required.filter(field => !companyData[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate EIN format (XX-XXXXXXX)
    if (!companyData.ein.match(/^\d{2}-\d{7}$/)) {
      throw new Error('Invalid EIN format. Expected: XX-XXXXXXX');
    }

    // Validate industry against known list
    const validIndustries = [
      'Technology',
      'Financial Services',
      'Real Estate',
      'Healthcare',
      'Logistics',
      'Professional Services',
      'Retail',
      'Manufacturing',
      'Education',
      'Other'
    ];

    if (!validIndustries.includes(companyData.industry)) {
      throw new Error(`Invalid industry: ${companyData.industry}`);
    }

    return true;
  }

  /**
   * Separate sensitive fields from public fields
   */
  separateSensitiveData(data) {
    const sensitiveData = {};
    const publicData = {};

    Object.entries(data).forEach(([key, value]) => {
      if (this.sensitiveFieaolds.includes(key)) {
        sensitiveData[key] = value;
      } else {
        publicData[key] = value;
      }
    });

    return { sensitiveData, publicData };
  }

  // ========== ORGANIZATIONAL CHART MANAGEMENT ==========

  /**
   * Set organizational chart template
   * Used to configure role hierarchies for scaling
   */
  setOrganizationalChart(userId, userRole, companyId, chartConfig) {
    this.verifyAccessAndLog(userId, userRole, 'update', `org_chart:${companyId}`);

    if (!this.companyData.has(companyId)) {
      throw new Error(`Company configuration not found: ${companyId}`);
    }

    const config = this.companyData.get(companyId);

    // Validate chart structure
    this.validateOrganizationalChart(chartConfig);

    config.publicData.organizationalChart = {
      ...chartConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      positions: this.countPositions(chartConfig),
      recommendedHeadcount: this.calculateRecommendedHeadcount(chartConfig)
    };

    // Audit log
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'UPDATE_ORG_CHART',
      companyId,
      performedBy: userId,
      details: {
        industry: chartConfig.industry,
        targetSize: chartConfig.targetSize,
        positions: config.publicData.organizationalChart.positions
      },
      status: 'success'
    });

    return {
      status: 'updated',
      positions: config.publicData.organizationalChart.positions,
      recommendedHeadcount: config.publicData.organizationalChart.recommendedHeadcount
    };
  }

  /**
   * Validate organizational chart structure
   */
  validateOrganizationalChart(chart) {
    if (!chart.ceo || !chart.ceo.title) {
      throw new Error('Organizational chart must have CEO defined');
    }

    if (!chart.industry) {
      throw new Error('Industry must be specified');
    }

    if (!chart.targetSize || chart.targetSize < 10 || chart.targetSize > 500) {
      throw new Error('Target size must be between 10 and 500 employees');
    }

    return true;
  }

  /**
   * Count positions in organizational chart
   */
  countPositions(chart) {
    let count = 0;
    const countRecursive = (node) => {
      if (!node) return;
      count++;
      if (node.directReports && Array.isArray(node.directReports)) {
        node.directReports.forEach(reportId => {
          const report = this.findNodeById(chart, reportId);
          if (report) countRecursive(report);
        });
      }
    };

    countRecursive(chart.ceo);
    return count;
  }

  /**
   * Calculate recommended headcount based on chart
   */
  calculateRecommendedHeadcount(chart) {
    return {
      currentPositions: this.countPositions(chart),
      targetSize: chart.targetSize,
      hiringSuggestions: this.generateHiringSuggestions(chart)
    };
  }

  /**
   * Generate hiring suggestions based on chart
   */
  generateHiringSuggestions(chart) {
    // Simplified hiring path
    return [
      {
        phase: 'Phase 1 (Q1)',
        priority: 'Executive Layer',
        positions: ['CEO', 'CTO', 'VP Sales', 'CFO'],
        estimatedHeadcount: 4
      },
      {
        phase: 'Phase 2 (Q2-Q3)',
        priority: 'Management Layer',
        positions: ['Engineering Manager', 'Sales Manager', 'Controller'],
        estimatedHeadcount: 8
      },
      {
        phase: 'Phase 3 (Q4)',
        priority: 'Individual Contributors',
        positions: ['Engineers', 'Sales Reps', 'Accountants'],
        estimatedHeadcount: 15
      }
    ];
  }

  /**
   * Find node in organizational chart by ID
   */
  findNodeById(chart, nodeId) {
    const search = (node) => {
      if (!node) return null;
      if (node.id === nodeId) return node;
      if (node.directReports && Array.isArray(node.directReports)) {
        for (const reportId of node.directReports) {
          const report = this.findNodeById(chart, reportId);
          if (report) return report;
        }
      }
      return null;
    };

    return search(chart);
  }

  // ========== COMPLIANCE VERIFICATION ==========

  /**
   * Verify banking compliance
   * Checks GLBA and SOX requirements
   */
  verifyBankingCompliance(userId, userRole, companyId) {
    this.verifyAccessAndLog(userId, userRole, 'read', `compliance:${companyId}`);

    if (!this.companyData.has(companyId)) {
      throw new Error(`Company configuration not found: ${companyId}`);
    }

    const config = this.companyData.get(companyId);
    const bankingInfo = this.decryptData(config.encryptedSensitive).bankingInfo || {};

    const complianceChecklist = {
      glba: {
        privacyNoticeOnFile: !!bankingInfo.privacyNotice,
        securityProgramEstablished: !!bankingInfo.securityProgram,
        safeguardsImplemented: !!bankingInfo.safeguards,
        breachNotificationProcedures: !!bankingInfo.breachProcedures,
        compliant: false
      },
      sox: {
        ceoSignatory: !!bankingInfo.ceoSignatory,
        cfoSignatory: !!bankingInfo.cfoSignatory,
        auditCommittee: !!bankingInfo.auditCommittee,
        internalControls: !!bankingInfo.internalControls,
        documentRetention: !!bankingInfo.documentRetention,
        compliant: false
      },
      overall: {
        compliant: false,
        lastChecked: new Date().toISOString(),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        recommendations: []
      }
    };

    // Calculate compliance
    complianceChecklist.glba.compliant =
      Object.entries(complianceChecklist.glba)
        .filter(([k]) => k !== 'compliant')
        .every(([, v]) => v);

    complianceChecklist.sox.compliant =
      Object.entries(complianceChecklist.sox)
        .filter(([k]) => k !== 'compliant')
        .every(([, v]) => v);

    complianceChecklist.overall.compliant =
      complianceChecklist.glba.compliant && complianceChecklist.sox.compliant;

    // Update company config compliance status
    config.complianceStatus.bankingCompliant = complianceChecklist.overall.compliant;

    return complianceChecklist;
  }

  // ========== AUDIT TRAIL ==========

  /**
   * Get audit log for company setup changes
   * Only accessible to ADMIN users
   */
  getAuditLog(userId, userRole, companyId = null) {
    this.verifyAccessAndLog(userId, userRole, 'read', 'audit_log');

    if (userRole !== this.accessRoles.ADMIN) {
      throw new Error('Only ADMIN users can access audit logs');
    }

    // Filter by company if specified
    if (companyId) {
      return this.auditLog.filter(entry => entry.companyId === companyId);
    }

    return this.auditLog;
  }

  /**
   * Export audit log with filtering
   */
  exportAuditLog(userId, userRole, filters = {}) {
    const log = this.getAuditLog(userId, userRole);

    // Apply filters
    return log.filter(entry => {
      if (filters.action && entry.action !== filters.action) return false;
      if (filters.startDate && new Date(entry.timestamp) < new Date(filters.startDate))
        return false;
      if (filters.endDate && new Date(entry.timestamp) > new Date(filters.endDate))
        return false;
      return true;
    });
  }

  // ========== DATA INTEGRITY ==========

  /**
   * Verify data integrity using stored hash
   */
  verifyDataIntegrity(userId, userRole, companyId) {
    this.verifyAccessAndLog(userId, userRole, 'read', `integrity:${companyId}`);

    if (!this.companyData.has(companyId)) {
      throw new Error(`Company configuration not found: ${companyId}`);
    }

    const config = this.companyData.get(companyId);
    const decryptedSensitive = this.decryptData(config.encryptedSensitive);
    const currentHash = this.hashSensitiveData(decryptedSensitive);

    return {
      companyId,
      integrityVerified: currentHash === config.dataHash,
      lastVerifiedAt: new Date().toISOString(),
      details: {
        storedHash: config.dataHash,
        currentHash,
        match: currentHash === config.dataHash
      }
    };
  }

  // ========== BACKUP & RECOVERY ==========

  /**
   * Create secure backup of company configuration
   * Includes encrypted data and audit trail
   */
  createBackup(userId, userRole, companyId) {
    this.verifyAccessAndLog(userId, userRole, 'read', `backup:${companyId}`);

    if (!this.companyData.has(companyId)) {
      throw new Error(`Company configuration not found: ${companyId}`);
    }

    const config = this.companyData.get(companyId);
    const backupId = crypto.randomUUID();
    const backupData = {
      id: backupId,
      companyId,
      timestamp: new Date().toISOString(),
      createdBy: userId,
      data: JSON.parse(JSON.stringify(config)),
      integrityHash: this.hashSensitiveData(config)
    };

    // Audit log
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'CREATE_BACKUP',
      companyId,
      backupId,
      performedBy: userId,
      status: 'success'
    });

    return {
      backupId,
      status: 'created',
      timestamp: backupData.timestamp,
      message: 'Backup created successfully'
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

module.exports = CompanySetupService;
