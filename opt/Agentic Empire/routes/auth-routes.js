/**
 * Authentication & Company Management Routes
 * 
 * Handles:
 * - User login and token generation
 * - Company creation and setup
 * - Company list retrieval
 * - Multi-company user management
 * 
 * Extracted from server.js to keep main file under 1000 LOC
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const CompanyRegistry = require('../services/company-registry');
const CompanyDB = require('../services/company-db');

/**
 * POST /api/login
 * Authenticate user and return JWT token
 * Requires: username, password, companyId
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, companyId } = req.body;
    
    if (!username || !password || !companyId) {
      return res.status(400).json({ error: 'Missing credentials or company' });
    }

    // Get user from company-specific database
    const user = await CompanyDB.get(
      companyId,
      'SELECT id, username, password_hash, email, role, is_admin FROM users WHERE username = ?',
      [username]
    );

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with company context
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        companyId: parseInt(companyId),
        role: user.role,
        isAdmin: user.is_admin ? true : false
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, companyId, username, isAdmin: user.is_admin });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/companies/create
 * Create a new company and admin user
 * Requires: name, industry, adminUsername, adminPassword
 */
router.post('/companies/create', async (req, res) => {
  try {
    const { name, industry, description, adminUsername, adminPassword } = req.body;

    if (!name || !adminUsername || !adminPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create company in registry
    const companyId = await CompanyRegistry.createCompany({
      name,
      industry,
      description,
      createdBy: adminUsername
    });

    // Hash admin password
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    // Create admin user in company database
    const result = await CompanyDB.run(
      companyId,
      `INSERT INTO users (username, password_hash, email, role, is_admin, first_name, last_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminUsername, passwordHash, `${adminUsername}@${name.toLowerCase().replace(/ /g, '-')}.local`, 'admin', 1, 'Admin', 'User']
    );

    // Add to company registry
    await CompanyRegistry.addUserToCompany(companyId, {
      username: adminUsername,
      email: `${adminUsername}@${name.toLowerCase().replace(/ /g, '-')}.local`,
      isAdmin: true
    });

    // Create default settings for admin
    await CompanyDB.run(
      companyId,
      `INSERT INTO settings (user_id, setting_type, rag_enabled, voice_enabled)
       VALUES (?, ?, ?, ?)`,
      [result.id, 'user', 1, 1]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: result.id,
        username: adminUsername,
        companyId,
        role: 'admin',
        isAdmin: true
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      companyId,
      token,
      username: adminUsername,
      message: 'Company created successfully'
    });
  } catch (err) {
    console.error('Company creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to create company' });
  }
});

/**
 * GET /api/companies/list
 * List all active companies (public endpoint)
 */
router.get('/companies/list', async (req, res) => {
  try {
    const companies = await CompanyRegistry.listCompanies();
    res.json(companies);
  } catch (err) {
    console.error('List companies error:', err);
    res.status(500).json({ error: 'Failed to list companies' });
  }
});

/**
 * GET /api/companies/:companyId
 * Get company details (requires auth)
 */
router.get('/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await CompanyRegistry.getCompany(parseInt(companyId));
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    console.error('Get company error:', err);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

/**
 * GET /api/companies/:companyId/admins
 * Get company admins (requires auth)
 */
router.get('/companies/:companyId/admins', async (req, res) => {
  try {
    const { companyId } = req.params;
    const admins = await CompanyRegistry.getCompanyAdmins(parseInt(companyId));
    res.json(admins);
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ error: 'Failed to get admins' });
  }
});

/**
 * POST /api/companies/:companyId/users
 * Add user to company (admin only)
 * Requires: username, email, password, isAdmin
 */
router.post('/companies/:companyId/users', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { username, email, password, isAdmin } = req.body;

    if (!req.user || !req.user.companyId || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check admin count and status
    const company = await CompanyRegistry.getCompany(parseInt(companyId));
    if (company.admin_count >= 2 && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Maximum 2 admins allowed per company' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Add to company database
    const result = await CompanyDB.run(
      parseInt(companyId),
      `INSERT INTO users (username, password_hash, email, role, is_admin, first_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, passwordHash, email, isAdmin ? 'admin' : 'user', isAdmin ? 1 : 0, username]
    );

    // Add to registry
    await CompanyRegistry.addUserToCompany(parseInt(companyId), {
      username,
      email,
      isAdmin: isAdmin ? true : false
    });

    res.status(201).json({
      id: result.id,
      username,
      email,
      isAdmin: isAdmin ? true : false,
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

/**
 * POST /api/companies/:companyId/copy-request
 * Create company copy request
 */
router.post('/companies/:companyId/copy-request', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { sourceCompanyId, isLlmShared } = req.body;

    if (!req.user || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const requestId = await CompanyRegistry.createCopyRequest({
      sourceCompanyId: parseInt(sourceCompanyId),
      targetCompanyId: parseInt(companyId),
      requestingUser: req.user.username,
      isLlmShared: isLlmShared ? true : false
    });

    res.status(201).json({
      requestId,
      status: 'pending',
      message: 'Copy request created. Awaiting source company admin approval.'
    });
  } catch (err) {
    console.error('Copy request error:', err);
    res.status(500).json({ error: 'Failed to create copy request' });
  }
});

/**
 * POST /api/companies/:companyId/approve-copy/:requestId
 * Approve company copy request (admin only)
 */
router.post('/companies/:companyId/approve-copy/:requestId', async (req, res) => {
  try {
    const { companyId, requestId } = req.params;
    const { dlpAcknowledged } = req.body;

    if (!req.user || !req.user.isAdmin || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Admin approval required' });
    }

    await CompanyRegistry.approveCopyRequest(
      parseInt(requestId),
      req.user.username,
      dlpAcknowledged ? true : false
    );

    res.json({ message: 'Copy request approved' });
  } catch (err) {
    console.error('Approve copy error:', err);
    res.status(500).json({ error: 'Failed to approve copy request' });
  }
});

module.exports = router;
