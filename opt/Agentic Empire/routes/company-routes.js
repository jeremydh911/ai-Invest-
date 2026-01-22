/**
 * Company Setup and Administration Routes
 * 
 * Handles company configuration, organizational charts, and data integrity.
 */

const express = require('express');
const router = express.Router();
const authenticate = require('./auth-middleware');
const logger = require('../services/logger');
const CompanySetupService = require('../services/company-setup');
const companySetup = new CompanySetupService();

// Applying authentication to all company routes
router.use(authenticate);

/**
 * POST /api/company-setup/create
 * Create new company configuration
 */
router.post('/create', (req, res) => {
  try {
    const userRole = req.user?.role || 'admin';
    const userId = req.user?.id || 'system';
    const companyData = req.body;

    // Use the service directly
    const result = companySetup.submitCompanySetup(userId, userRole, companyData);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Error creating company configuration:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/company-setup/status
 * Get setup status and configuration (decrypted based on role)
 */
router.get('/status', (req, res) => {
  try {
    const userRole = req.user?.role || 'admin';
    const result = companySetup.getCompanyConfiguration(userRole);
    res.json(result);
  } catch (err) {
    logger.error('Error getting company status:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/company-setup/audit-log
 * Get configuration audit log
 */
router.get('/audit-log', (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json(companySetup.getAuditLog());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
