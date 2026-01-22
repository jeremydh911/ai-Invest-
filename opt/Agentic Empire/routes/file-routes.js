/**
 * File Management Routes
 * 
 * Handles:
 * - File upload to company folders
 * - File download
 * - File deletion
 * - Folder access control
 * - Master backdoor access
 * - RAG memory integration
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const FileManagement = require('../services/file-management');
const CompanyDB = require('../services/company-db');

// Configure multer for file uploads (no disk storage, keep in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    // Reject .exe, .bat, .sh and other dangerous files
    const dangerousExt = ['.exe', '.bat', '.sh', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    
    if (dangerousExt.includes(ext)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  }
});

/**
 * POST /api/companies/:companyId/files/upload
 * Upload file to company folder
 * Requires: Valid admin/master password, multipart file
 */
router.post('/companies/:companyId/files/upload', upload.single('file'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { password, isMaster } = req.body;
    const cid = parseInt(companyId);

    if (!password) {
      return res.status(401).json({ error: 'Password required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Verify folder access
    const hasAccess = await FileManagement.verifyFolderAccess(
      cid,
      password,
      isMaster === 'true' || isMaster === true
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    // Upload file
    const fileInfo = await FileManagement.uploadFile(
      cid,
      req.user?.id || 0,
      {
        filename: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype
      }
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * GET /api/companies/:companyId/files
 * List all files in company folder
 */
router.get('/companies/:companyId/files', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { password, isMaster } = req.query;
    const cid = parseInt(companyId);

    if (!password) {
      return res.status(401).json({ error: 'Password required' });
    }

    // Verify folder access
    const hasAccess = await FileManagement.verifyFolderAccess(
      cid,
      password,
      isMaster === 'true'
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    const files = await FileManagement.listCompanyFiles(cid);
    const stats = await FileManagement.getCompanyFolderStats(cid);

    res.json({
      files,
      stats
    });
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * GET /api/companies/:companyId/files/:filename
 * Download file
 */
router.get('/companies/:companyId/files/:filename', async (req, res) => {
  try {
    const { companyId, filename } = req.params;
    const { password, isMaster } = req.query;
    const cid = parseInt(companyId);

    if (!password) {
      return res.status(401).json({ error: 'Password required' });
    }

    // Verify folder access
    const hasAccess = await FileManagement.verifyFolderAccess(
      cid,
      password,
      isMaster === 'true'
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    const fileBuffer = await FileManagement.getFile(cid, filename);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message || 'Download failed' });
  }
});

/**
 * DELETE /api/companies/:companyId/files/:filename
 * Delete file (removes from RAG automatically)
 */
router.delete('/companies/:companyId/files/:filename', async (req, res) => {
  try {
    const { companyId, filename } = req.params;
    const { password, isMaster } = req.body;
    const cid = parseInt(companyId);

    if (!password) {
      return res.status(401).json({ error: 'Password required' });
    }

    // Verify folder access
    const hasAccess = await FileManagement.verifyFolderAccess(
      cid,
      password,
      isMaster === 'true' || isMaster === true
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    const result = await FileManagement.deleteFile(cid, filename);

    res.json({
      message: 'File deleted and removed from RAG',
      file: filename
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message || 'Deletion failed' });
  }
});

/**
 * GET /api/companies/:companyId/files/stats
 * Get folder statistics
 */
router.get('/companies/:companyId/files/stats', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { password, isMaster } = req.query;
    const cid = parseInt(companyId);

    if (!password) {
      return res.status(401).json({ error: 'Password required' });
    }

    // Verify folder access
    const hasAccess = await FileManagement.verifyFolderAccess(
      cid,
      password,
      isMaster === 'true'
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    const stats = await FileManagement.getCompanyFolderStats(cid);

    if (!stats) {
      return res.status(404).json({ error: 'Company folder not found' });
    }

    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * POST /api/files/verify-access
 * Verify folder access with password (utility endpoint)
 */
router.post('/files/verify-access', async (req, res) => {
  try {
    const { companyId, password, isMaster } = req.body;

    if (!companyId || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hasAccess = await FileManagement.verifyFolderAccess(
      parseInt(companyId),
      password,
      isMaster === true || isMaster === 'true'
    );

    res.json({
      authorized: hasAccess,
      accessType: isMaster ? 'master' : 'admin'
    });
  } catch (err) {
    console.error('Verify access error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/files/master-status
 * Check if master password is set (no password required)
 */
router.get('/files/master-status', (req, res) => {
  try {
    const hasMaster = FileManagement.getMasterPassword() ? true : false;
    
    res.json({
      masterPasswordSet: hasMaster,
      message: hasMaster ? 'Master backdoor is secured' : 'Master password not initialized'
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

module.exports = router;
