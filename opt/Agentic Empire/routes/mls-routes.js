/**
 * MLS (NWMLS) System Routes
 * 
 * Handles property listings, offers, agreements, and MLS authentication.
 */

const express = require('express');
const router = express.Router();
const authenticate = require('./auth-middleware');
const logger = require('../services/logger');
const MLSNWMLSService = require('../services/mls-nwmls');
const mlsService = new MLSNWMLSService();

// Applying authentication to all MLS routes
router.use(authenticate);

/**
 * POST /api/mls/credentials/set
 */
router.post('/credentials/set', async (req, res) => {
  try {
    const { username, password, brokerNumber, agentNumber, targetUserId } = req.body;
    const userId = targetUserId && req.user.role === 'admin' ? targetUserId : req.user.id;

    if (req.user.role !== 'admin' && targetUserId && targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await mlsService.setCredentials(userId, {
      username, password, brokerNumber, agentNumber
    });

    res.json({ success: true, message: 'Credentials saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... rest of MLS routes ...

module.exports = router;
