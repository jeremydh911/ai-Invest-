/**
 * CEO Hiring Routes
 * External interface for the CEO Hiring Engine and Autonomy Controls
 */

const express = require('express');
const router = express.Router();
const authenticate = require('./auth-middleware');

// For modularity, we use a registry or require it from the main app instance if needed.
// Since server.js initializes it, we re-require the singleton instance.
const ceoHiring = require('../services/ceo-hiring-engine');

router.use(authenticate);

/**
 * POST /api/hiring/request
 * CEO creates a hiring request
 */
router.post('/request', (req, res) => {
  try {
    const { companyId, hiringRequest } = req.body;
    const result = ceoHiring.createHiringRequest(companyId, req.user.id, hiringRequest);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/hiring/autonomy
 * Toggle Autonomous Approval Mode
 */
router.post('/autonomy', (req, res) => {
  try {
    const { companyId, settings } = req.body;
    const result = ceoHiring.setAutonomyMode(companyId, settings);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/hiring/requests/:companyId
 * List all pending requests
 */
router.get('/requests/:companyId', (req, res) => {
  try {
    const stats = ceoHiring.getHiringStats(req.params.companyId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
