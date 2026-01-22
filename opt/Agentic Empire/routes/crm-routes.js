/**
 * CRM System API Routes
 * 
 * Handles contacts, opportunities, and CRM integrations.
 * Extracted from server.js to maintain 1000 LOC limit.
 */

const express = require('express');
const router = express.Router();
const authenticate = require('./auth-middleware');
const CompanyDB = require('../services/company-db');
const logger = require('../services/logger');

// Applying authentication to all CRM routes
router.use(authenticate);

// CRM Contacts
router.get('/contacts', async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    const rows = await CompanyDB.all(companyId, 
      `SELECT * FROM crm_contacts WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    res.json(rows || []);
  } catch (error) {
    logger.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

router.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, companyId } = req.user;
    const row = await CompanyDB.get(companyId,
      `SELECT * FROM crm_contacts WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!row) return res.status(404).json({ error: 'Contact not found' });
    res.json(row);
  } catch (error) {
    logger.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

router.post('/contacts', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, company, job_title, source, status, notes } = req.body;
    const { id: userId, companyId } = req.user;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await CompanyDB.run(companyId,
      `INSERT INTO crm_contacts (user_id, first_name, last_name, email, phone, company, job_title, source, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, first_name, last_name, email, phone, company, job_title, source, status || 'lead', notes, new Date().toISOString(), new Date().toISOString()]
    );
    res.status(201).json({ id: result.lastID, message: 'Contact created successfully' });
  } catch (error) {
    logger.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.put('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, companyId } = req.user;
    const { first_name, last_name, email, phone, company, job_title, source, status, notes, rating } = req.body;

    const result = await CompanyDB.run(companyId,
      `UPDATE crm_contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?, job_title = ?, source = ?, status = ?, notes = ?, rating = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [first_name, last_name, email, phone, company, job_title, source, status, notes, rating, new Date().toISOString(), id, userId]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    logger.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, companyId } = req.user;
    const result = await CompanyDB.run(companyId,
      `DELETE FROM crm_contacts WHERE id = ? AND user_id = ?`, [id, userId]);
    if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    logger.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// CRM Opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const { id: userId, companyId } = req.user;
    const rows = await CompanyDB.all(companyId,
      `SELECT o.*, c.first_name || ' ' || c.last_name as contact_name FROM crm_opportunities o
       LEFT JOIN crm_contacts c ON o.contact_id = c.id
       WHERE o.user_id = ? ORDER BY o.created_at DESC`, [userId]);
    res.json(rows || []);
  } catch (error) {
    logger.error('Error getting opportunities:', error);
    res.status(500).json({ error: 'Failed to get opportunities' });
  }
});

router.post('/opportunities', async (req, res) => {
  try {
    const { contact_id, name, description, value, stage, probability, expected_close_date } = req.body;
    const { id: userId, companyId } = req.user;

    if (!contact_id || !name) {
      return res.status(400).json({ error: 'Contact and name are required' });
    }

    const result = await CompanyDB.run(companyId,
      `INSERT INTO crm_opportunities (user_id, contact_id, name, description, value, stage, probability, expected_close_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, contact_id, name, description, value, stage || 'prospect', probability || 0, expected_close_date, new Date().toISOString(), new Date().toISOString()]
    );
    res.status(201).json({ id: result.lastID, message: 'Opportunity created successfully' });
  } catch (error) {
    logger.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

module.exports = router;
