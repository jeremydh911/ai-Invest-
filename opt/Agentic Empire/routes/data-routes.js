/**
 * Data & Knowledge Management API Routes
 * 
 * Handles RAG documents, Canvas diagrams, and file uploads.
 * Extracted from server.js to maintain 1000 LOC limit.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authenticate = require('./auth-middleware');
const CompanyDB = require('../services/company-db');

router.use(authenticate);

// ============ RAG DOCUMENT MANAGEMENT ============
router.get('/rag/documents', async (req, res) => {
  try {
    const { id: userId, companyId } = req.user;
    const docs = await CompanyDB.all(companyId,
      `SELECT id, title, content, created_at FROM rag_documents WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    
    const documents = (docs || []).map(doc => {
      try {
        const meta = JSON.parse(doc.content);
        return { id: doc.id, title: doc.title, size: meta.filesize || 0, created_at: doc.created_at };
      } catch (e) {
        return { id: doc.id, title: doc.title, size: 0, created_at: doc.created_at };
      }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CANVAS API ============
router.get('/canvas', async (req, res) => {
  try {
    const { id: userId, companyId } = req.user;
    const rows = await CompanyDB.all(companyId,
      'SELECT id, name, description, created_at, updated_at FROM canvas_diagrams WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/canvas', async (req, res) => {
  try {
    const { name, description, shapes, connectors } = req.body;
    const { id: userId, companyId } = req.user;
    const result = await CompanyDB.run(companyId,
      'INSERT INTO canvas_diagrams (user_id, name, description, shapes, connectors) VALUES (?, ?, ?, ?, ?)',
      [userId, name, description, JSON.stringify(shapes), JSON.stringify(connectors)]);
    res.json({ id: result.lastID, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
