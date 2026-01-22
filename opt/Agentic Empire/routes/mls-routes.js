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

/**
 * GET /api/mls/search
 * Search listings on NWMLS
 */
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const searchParams = req.query;
    const result = await mlsService.searchListings(userId, searchParams);
    res.json(result);
  } catch (err) {
    logger.error('MLS Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mls/listings/:mlsNumber
 * Get detailed listing information
 */
router.get('/listings/:mlsNumber', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mlsNumber } = req.params;
    const result = await mlsService.getListingDetails(userId, mlsNumber);
    res.json(result);
  } catch (err) {
    logger.error('MLS Details error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mls/listings/create
 * Create a new listing on NWMLS
 */
router.post('/listings/create', async (req, res) => {
  try {
    const userId = req.user.id;
    const listingData = req.body;
    const result = await mlsService.createListing(userId, listingData);
    res.json(result);
  } catch (err) {
    logger.error('MLS Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mls/offers/submit
 * Submit an offer on a listing
 */
router.post('/offers/submit', async (req, res) => {
  try {
    const userId = req.user.id;
    const offerData = req.body;
    const result = await mlsService.submitOffer(userId, offerData);
    res.json(result);
  } catch (err) {
    logger.error('MLS Offer error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mls/agreements/write
 * Write a listing agreement
 */
router.post('/agreements/write', async (req, res) => {
  try {
    const userId = req.user.id;
    const agreementData = req.body;
    const result = await mlsService.writeListingAgreement(userId, agreementData);
    res.json(result);
  } catch (err) {
    logger.error('MLS Agreement error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
