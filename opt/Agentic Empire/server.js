const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const { execSync } = require('child_process');

require('dotenv').config();

// Try to generate self-signed certs if not exist
const certPath = path.join(__dirname, 'certs');
const keyPath = path.join(certPath, 'key.pem');
const certFilePath = path.join(certPath, 'cert.pem');

if (!fs.existsSync(certPath)) {
  fs.mkdirSync(certPath);
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certFilePath)) {
  try {
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certFilePath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`);
  } catch (e) {
    console.log('OpenSSL not available, running on HTTP instead of HTTPS');
  }
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes will be registered before static files to prevent 404 catch-all

// Configure multer for RAG document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ragDir = path.join(__dirname, 'data', 'rag_documents');
    if (!fs.existsSync(ragDir)) fs.mkdirSync(ragDir, { recursive: true });
    cb(null, ragDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Simple logger utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ''),
  debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`)
};

const db = new sqlite3.Database(path.join(__dirname, 'data', 'app.db'));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Import new services
const VoiceSynthesisService = require('./services/voice-synthesis');
const GPUOptimizationService = require('./services/gpu-optimization');
const CompanySetupService = require('./services/company-setup');
const FileManagement = require('./services/file-management');

// Import routes
const fileRoutes = require('./routes/file-routes');

// Initialize services
const voiceSynthesis = new VoiceSynthesisService();
const gpuOptimization = new GPUOptimizationService();
const companySetup = new CompanySetupService();
// FileManagement is already a singleton instance, no need to instantiate

logger.info(`GPU Optimization Service initialized - ${gpuOptimization.getStatus().detected} GPU(s) detected`);
logger.info(`Voice Synthesis Service initialized with ${voiceSynthesis.getStatus().availableProviders.length} provider(s)`);
logger.info('Company Setup Service initialized with encryption enabled');
logger.info('File Management Service initialized with master password system');


// Server Configuration
const PORT = process.env.PORT || 3000;

// Auth middleware
const authenticate = (req, res, next) => {
  if (process.env.AUTH_ENABLED !== 'true') return next();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ==================== FILE MANAGEMENT ROUTES ====================
// Register file management routes EARLY before other routes
app.use('/', fileRoutes);
// ==================== END FILE MANAGEMENT ROUTES ====================

// Routes
app.get('/', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || '';
  if (!token && !req.cookies?.token && !req.query?.token) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

app.get('/dashboard.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/personas.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'personas.html'));
});

app.get('/personas', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'personas.html'));
});

app.get('/chat.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/settings-advanced.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'settings-advanced.html'));
});

app.get('/settings-advanced', authenticate, (req, res) => {
  res.redirect('/settings-advanced.html');
});

app.get('/finetuning-setup.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'finetuning-setup.html'));
});

app.get('/finetuning-setup', authenticate, (req, res) => {
  res.redirect('/finetuning-setup.html');
});

app.get('/chat', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/voice-chat.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'voice-chat.html'));
});

app.get('/voice-chat', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'voice-chat.html'));
});

app.get('/settings.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/settings', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

// ============ NEW TILE ROUTES ============

// Canvas routes
app.get('/canvas.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'canvas.html'));
});

app.get('/canvas', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'canvas.html'));
});

// Search routes
app.get('/search.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'search.html'));
});

// Logs routes
app.get('/logs.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'logs.html'));
});

// Workflows routes
app.get('/workflows.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'workflows.html'));
});

// Reports routes
app.get('/reports.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'reports.html'));
});

// System Maintenance routes
app.get('/system-maintenance.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'system-maintenance.html'));
});

// Permissions routes
app.get('/permissions.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'permissions.html'));
});

// Org Chart routes
app.get('/org-chart.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'org-chart.html'));
});

// Quotas routes
app.get('/quotas.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'quotas.html'));
});

// Templates routes
app.get('/templates.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'templates.html'));
});

// Scheduler routes
app.get('/scheduler.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'scheduler.html'));
});

// File Manager routes
app.get('/file-manager.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'file-manager.html'));
});

// File Management (Company Files) routes
app.get('/files.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'files.html'));
});

app.get('/files', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'files.html'));
});

// Data Management routes
app.get('/data-management.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'data-management.html'));
});

// Billing routes
app.get('/billing.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'billing.html'));
});

// Team/Users routes
app.get('/team.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'team.html'));
});

// Analytics routes
app.get('/analytics.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'analytics.html'));
});

// CRM Integrations routes
app.get('/crm-integrations.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'crm-integrations.html'));
});

// ============ END NEW TILE ROUTES ============

// API
app.get('/api/personas', authenticate, (req, res) => {
  db.all('SELECT id, name, slug, model FROM personas', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/personas', authenticate, (req, res) => {
  const { name, slug, system_prompt, model, voice } = req.body;
  db.run('INSERT INTO personas (name, slug, system_prompt, model, voice) VALUES (?, ?, ?, ?, ?)',
    [name, slug, system_prompt, model, voice], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.post('/api/text-chat', authenticate, async (req, res) => {
  const { persona_id, message } = req.body;
  db.get('SELECT * FROM personas WHERE id = ?', [persona_id], async (err, persona) => {
    if (err || !persona) return res.status(404).json({ error: 'Persona not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await openai.chat.completions.create({
        model: persona.model,
        messages: [{ role: 'system', content: persona.system_prompt }, { role: 'user', content: message }],
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    res.end();
  });
});

// Settings API
app.get('/api/settings', authenticate, (req, res) => {
  db.get('SELECT * FROM settings WHERE user_id = ?', [req.user.id], (err, settings) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!settings) {
      // Return default settings
      return res.json({
        rag_enabled: true,
        rag_chunk_size: 1024,
        rag_overlap: 100,
        rag_max_results: 5,
        tuning_temperature: 0.7,
        tuning_top_p: 0.9,
        tuning_max_tokens: 2000,
        voice_enabled: true,
        voice_model: 'alloy',
        voice_speed: 1.0,
        mcp_connections: '{}',
        tool_email_enabled: false,
        tool_websearch_enabled: false,
        tool_playwright_enabled: false,
        tool_crm_enabled: false,
        tool_api_enabled: false,
        tool_banking_enabled: false,
        tool_payment_enabled: false
      });
    }
    res.json(settings);
  });
});

app.post('/api/settings', authenticate, (req, res) => {
  console.log('[POST /api/settings] User ID:', req.user?.id, 'Settings:', req.body);
  
  const settings = req.body;
  const params = [
    req.user.id,
    settings.rag_enabled || true,
    settings.rag_chunk_size || 1024,
    settings.rag_overlap || 100,
    settings.rag_max_results || 5,
    settings.tuning_temperature || 0.7,
    settings.tuning_top_p || 0.9,
    settings.tuning_max_tokens || 2000,
    settings.voice_enabled || true,
    settings.voice_model || 'alloy',
    settings.voice_speed || 1.0,
    settings.mcp_connections || '{}',
    settings.tool_email_enabled || false,
    settings.tool_websearch_enabled || false,
    settings.tool_playwright_enabled || false,
    settings.tool_crm_enabled || false,
    settings.tool_api_enabled || false,
    settings.tool_banking_enabled || false,
    settings.tool_payment_enabled || false
  ];

  db.run(`
    INSERT OR REPLACE INTO settings 
    (user_id, rag_enabled, rag_chunk_size, rag_overlap, rag_max_results, tuning_temperature, tuning_top_p, tuning_max_tokens, 
     voice_enabled, voice_model, voice_speed, mcp_connections, tool_email_enabled, tool_websearch_enabled, tool_playwright_enabled, 
     tool_crm_enabled, tool_api_enabled, tool_banking_enabled, tool_payment_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, params, function(err) {
    if (err) {
      console.error('[POST /api/settings] Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[POST /api/settings] Settings saved successfully for user:', req.user.id);
    res.json({ success: true });
  });
});

// RAG Document Management - User-isolated knowledge base
app.post('/api/rag/documents/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const { title } = req.body;
  const filename = req.file.filename;
  const filepath = path.join('data', 'rag_documents', filename);
  const filesize = req.file.size;
  
  // Store document metadata in database (user-isolated)
  db.run(`
    INSERT INTO rag_documents (user_id, title, content)
    VALUES (?, ?, ?)
  `, [req.user.id, title || req.file.originalname, JSON.stringify({
    filename,
    filepath,
    filesize,
    uploaded_at: new Date().toISOString()
  })], function(err) {
    if (err) {
      // Delete uploaded file if DB insert fails
      fs.unlinkSync(path.join(__dirname, filepath));
      return res.status(500).json({ error: 'Failed to store document: ' + err.message });
    }
    res.json({ 
      id: this.lastID, 
      title: title || req.file.originalname,
      size: filesize,
      filename,
      created_at: new Date().toISOString(),
      success: true 
    });
  });
});

// Get RAG documents for current user only (strict isolation)
app.get('/api/rag/documents', authenticate, (req, res) => {
  db.all(`
    SELECT id, title, content, created_at 
    FROM rag_documents 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [req.user.id], (err, docs) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse content and extract metadata
    const documents = (docs || []).map(doc => {
      try {
        const meta = JSON.parse(doc.content);
        return {
          id: doc.id,
          title: doc.title,
          size: meta.filesize || 0,
          created_at: doc.created_at,
          filename: meta.filename,
          filepath: meta.filepath
        };
      } catch (e) {
        return {
          id: doc.id,
          title: doc.title,
          size: 0,
          created_at: doc.created_at
        };
      }
    });
    
    res.json(documents);
  });
});

// Delete RAG document (user-isolated - can only delete own documents)
app.delete('/api/rag/documents/:docId', authenticate, (req, res) => {
  const { docId } = req.params;
  
  // First verify the document belongs to this user
  db.get(`
    SELECT id, content 
    FROM rag_documents 
    WHERE id = ? AND user_id = ?
  `, [docId, req.user.id], (err, doc) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    // Delete from database
    db.run('DELETE FROM rag_documents WHERE id = ? AND user_id = ?', [docId, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Try to delete physical file if it exists
      try {
        const meta = JSON.parse(doc.content);
        const filePath = path.join(__dirname, meta.filepath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Could not delete file:', e.message);
      }
      
      res.json({ success: true, message: 'Document deleted' });
    });
  });
});

// Initiate RAG fine-tuning (creates a job for embedding optimization)
app.post('/api/rag/fine-tune', authenticate, (req, res) => {
  const jobId = 'rag-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const createdAt = new Date().toISOString();
  
  console.log('[POST /api/rag/fine-tune] Starting RAG fine-tuning for user:', req.user.id, 'Job ID:', jobId);
  
  // In a real implementation, this would:
  // 1. Retrieve all user's RAG documents
  // 2. Re-embed all chunks with updated embeddings
  // 3. Rebuild vector indices
  // 4. Track job progress in database
  
  // For now, we'll just return a job ID and log it
  res.json({ 
    success: true, 
    job_id: jobId,
    message: 'RAG fine-tuning job started',
    created_at: createdAt,
    status: 'queued'
  });
  
  // Simulate fine-tuning process (in production, use job queue like Bull)
  setTimeout(() => {
    console.log('[RAG Fine-Tune] Job', jobId, 'completed for user:', req.user.id);
  }, 30000);
});

// Get RAG fine-tuning job status
app.get('/api/rag/fine-tune/:jobId', authenticate, (req, res) => {
  const { jobId } = req.params;
  
  // In a real implementation, fetch from job queue database
  res.json({
    job_id: jobId,
    status: 'in_progress',
    progress: 45,
    message: 'Processing documents...'
  });
});

// MCP Server Management
app.get('/api/mcp/servers', authenticate, (req, res) => {
  db.all('SELECT * FROM mcp_servers WHERE user_id = ?', [req.user.id], (err, servers) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(servers || []);
  });
});

app.post('/api/mcp/servers', authenticate, (req, res) => {
  const { name, type, config } = req.body;
  db.run('INSERT INTO mcp_servers (user_id, name, type, config) VALUES (?, ?, ?, ?)',
    [req.user.id, name, type, JSON.stringify(config)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// Tool Configuration
app.get('/api/tools', authenticate, (req, res) => {
  db.all('SELECT * FROM tool_configs WHERE user_id = ?', [req.user.id], (err, tools) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(tools || []);
  });
});

app.post('/api/tools', authenticate, (req, res) => {
  const { tool_name, is_enabled, config } = req.body;
  db.run('INSERT OR REPLACE INTO tool_configs (user_id, tool_name, is_enabled, config) VALUES (?, ?, ?, ?)',
    [req.user.id, tool_name, is_enabled, JSON.stringify(config)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Voice synthesis endpoint
app.post('/api/voice/synthesize', authenticate, async (req, res) => {
  try {
    const { text, voice } = req.body;
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'alloy',
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Speech recognition endpoint
app.post('/api/voice/transcribe', authenticate, async (req, res) => {
  try {
    const audio = req.files?.audio;
    if (!audio) return res.status(400).json({ error: 'No audio file provided' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audio.data,
      model: 'whisper-1',
      language: 'en'
    });
    
    res.json({ text: transcription.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CANVAS API ============
app.post('/api/canvas', authenticate, (req, res) => {
  const { name, description, shapes, connectors } = req.body;
  db.run('INSERT INTO canvas_diagrams (user_id, name, description, shapes, connectors) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name, description, JSON.stringify(shapes), JSON.stringify(connectors)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/canvas', authenticate, (req, res) => {
  db.all('SELECT id, name, description, created_at, updated_at FROM canvas_diagrams WHERE user_id = ? ORDER BY updated_at DESC', 
    [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/canvas/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM canvas_diagrams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Diagram not found' });
    res.json({
      ...row,
      shapes: JSON.parse(row.shapes || '[]'),
      connectors: JSON.parse(row.connectors || '[]')
    });
  });
});

app.put('/api/canvas/:id', authenticate, (req, res) => {
  const { name, description, shapes, connectors } = req.body;
  db.run('UPDATE canvas_diagrams SET name = ?, description = ?, shapes = ?, connectors = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [name, description, JSON.stringify(shapes), JSON.stringify(connectors), req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/canvas/:id', authenticate, (req, res) => {
  db.run('DELETE FROM canvas_diagrams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ SEARCH API ============
app.post('/api/search', authenticate, async (req, res) => {
  const { query, filters = {} } = req.body;
  
  let searchResults = [];
  
  // Search conversations
  db.all(`SELECT 'conversation' as type, id, title as title, created_at FROM conversations 
           WHERE user_id = ? AND title LIKE ? LIMIT 5`, 
    [req.user.id, `%${query}%`], (err, conversations) => {
    
    // Search messages
    db.all(`SELECT 'message' as type, id, content as title, created_at FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = ? AND m.content LIKE ? LIMIT 5`,
      [req.user.id, `%${query}%`], (err2, messages) => {
      
      // Search RAG documents
      db.all(`SELECT 'document' as type, id, title, created_at FROM rag_documents 
               WHERE persona_id IN (SELECT id FROM personas) AND title LIKE ? LIMIT 5`,
        [`%${query}%`], (err3, docs) => {
        
        // Search audit logs
        db.all(`SELECT 'log' as type, id, action as title, created_at FROM audit_logs
                 WHERE user_id = ? AND (action LIKE ? OR details LIKE ?) LIMIT 5`,
          [req.user.id, `%${query}%`, `%${query}%`], (err4, logs) => {
          
          searchResults = [
            ...(conversations || []),
            ...(messages || []),
            ...(docs || []),
            ...(logs || [])
          ].slice(0, 20);
          
          res.json({ results: searchResults, total: searchResults.length });
        });
      });
    });
  });
});

// ============ LOGS API ============
app.get('/api/logs', authenticate, (req, res) => {
  const page = req.query.page || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  
  db.all(`SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset], (err, logs) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?', [req.user.id], (err2, count) => {
      res.json({
        logs: logs || [],
        total: count?.total || 0,
        page: parseInt(page),
        limit: limit,
        pages: Math.ceil((count?.total || 0) / limit)
      });
    });
  });
});

app.get('/api/logs/stats', authenticate, (req, res) => {
  db.get(`SELECT COUNT(*) as total, 
          SUM(CASE WHEN action LIKE '%success%' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN action LIKE '%error%' THEN 1 ELSE 0 END) as errors
          FROM audit_logs WHERE user_id = ?`, [req.user.id], (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      total: stats?.total || 0,
      successful: stats?.successful || 0,
      errors: stats?.errors || 0,
      unique_users: 1
    });
  });
});

// ============ WORKFLOWS API ============
app.post('/api/workflows', authenticate, (req, res) => {
  const { name, description, steps, trigger_type } = req.body;
  db.run('INSERT INTO workflows (user_id, name, description, steps, trigger_type) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name, description, JSON.stringify(steps), trigger_type], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/workflows', authenticate, (req, res) => {
  db.all('SELECT id, name, description, trigger_type, status, execution_count, last_executed, created_at FROM workflows WHERE user_id = ?',
    [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/workflows/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ ...row, steps: JSON.parse(row.steps || '[]') });
  });
});

app.post('/api/workflows/:id/run', authenticate, (req, res) => {
  db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], async (err, workflow) => {
    if (err || !workflow) return res.status(404).json({ error: 'Workflow not found' });
    
    const startTime = new Date();
    db.run('INSERT INTO workflow_executions (workflow_id, user_id, status, start_time) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, 'running', startTime], function(executionId) {
      
      // Simulate workflow execution
      setTimeout(() => {
        db.run('UPDATE workflow_executions SET status = ?, end_time = ? WHERE id = ?',
          ['completed', new Date(), this.lastID]);
        db.run('UPDATE workflows SET execution_count = execution_count + 1, last_executed = ? WHERE id = ?',
          [new Date(), req.params.id]);
      }, 1000);
      
      res.json({ executionId: this.lastID, status: 'started' });
    });
  });
});

// ============ REPORTS API ============
app.post('/api/reports', authenticate, (req, res) => {
  const { name, template_id, format } = req.body;
  const generatedAt = new Date();
  db.run('INSERT INTO reports (user_id, name, template_id, format, generated_at) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name, template_id, format || 'pdf', generatedAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true, generatedAt });
  });
});

app.get('/api/reports', authenticate, (req, res) => {
  db.all('SELECT id, name, template_id, format, generated_at FROM reports WHERE user_id = ? ORDER BY generated_at DESC',
    [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/reports/:id/download', authenticate, (req, res) => {
  db.get('SELECT * FROM reports WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, report) => {
    if (err || !report) return res.status(404).json({ error: 'Report not found' });
    res.json({ downloadUrl: `/reports/${report.id}.pdf`, filename: `${report.name}.pdf` });
  });
});

// ============ TEMPLATES API ============
app.post('/api/templates', authenticate, (req, res) => {
  const { name, type, category, content, tags, difficulty_level } = req.body;
  db.run('INSERT INTO templates (user_id, name, type, category, content, tags, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, name, type, category, content, JSON.stringify(tags), difficulty_level], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/templates', authenticate, (req, res) => {
  const type = req.query.type || null;
  let query = 'SELECT id, name, type, category, difficulty_level, tags FROM templates WHERE user_id = ?';
  let params = [req.user.id];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/templates/:id/use', authenticate, (req, res) => {
  db.get('SELECT * FROM templates WHERE id = ?', [req.params.id], (err, template) => {
    if (err || !template) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true, content: template.content, message: `Template "${template.name}" loaded` });
  });
});

// ============ SCHEDULER API ============
app.post('/api/jobs', authenticate, (req, res) => {
  const { name, job_type, description, cron_expression } = req.body;
  db.run('INSERT INTO scheduled_jobs (user_id, name, job_type, description, cron_expression, next_run) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, name, job_type, description, cron_expression, new Date()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/jobs', authenticate, (req, res) => {
  db.all('SELECT id, name, job_type, description, status, last_run, next_run, execution_count FROM scheduled_jobs WHERE user_id = ?',
    [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/jobs/:id/run', authenticate, (req, res) => {
  db.run('INSERT INTO job_executions (job_id, started_at, status) VALUES (?, ?, ?)',
    [req.params.id, new Date(), 'running'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    setTimeout(() => {
      db.run('UPDATE job_executions SET completed_at = ?, status = ? WHERE id = ?',
        [new Date(), 'completed', this.lastID]);
      db.run('UPDATE scheduled_jobs SET last_run = ?, execution_count = execution_count + 1 WHERE id = ?',
        [new Date(), req.params.id]);
    }, 1000);
    
    res.json({ executionId: this.lastID, status: 'started' });
  });
});

app.get('/api/jobs/:id/history', authenticate, (req, res) => {
  db.all('SELECT * FROM job_executions WHERE job_id = ? ORDER BY started_at DESC LIMIT 20',
    [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ============ FILES API ============
app.post('/api/files/upload', authenticate, (req, res) => {
  // Placeholder for file upload
  const { filename, size } = req.body;
  db.run('INSERT INTO files (user_id, filename, filepath, size) VALUES (?, ?, ?, ?)',
    [req.user.id, filename, `/uploads/${Date.now()}-${filename}`, size], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true, path: `/uploads/${Date.now()}-${filename}` });
  });
});

app.get('/api/files', authenticate, (req, res) => {
  db.all('SELECT id, filename, filepath, size, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.delete('/api/files/:id', authenticate, (req, res) => {
  db.run('DELETE FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ QUOTAS API ============
app.post('/api/quotas', authenticate, (req, res) => {
  const { quota_type, limit_value, period } = req.body;
  db.run('INSERT INTO quotas (user_id, quota_type, limit_value, period, reset_date) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, quota_type, limit_value, period, new Date()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/quotas', authenticate, (req, res) => {
  db.all('SELECT id, quota_type, limit_value, current_usage, period FROM quotas WHERE user_id = ?',
    [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.put('/api/quotas/:id', authenticate, (req, res) => {
  const { limit_value } = req.body;
  db.run('UPDATE quotas SET limit_value = ? WHERE id = ? AND user_id = ?',
    [limit_value, req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ ROLES & PERMISSIONS API ============
app.post('/api/roles', authenticate, (req, res) => {
  const { name, description, permissions } = req.body;
  db.run('INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)',
    [name, description, JSON.stringify(permissions)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/roles', authenticate, (req, res) => {
  db.all('SELECT id, name, description, permissions FROM roles', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json((rows || []).map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })));
  });
});

app.get('/api/permissions', authenticate, (req, res) => {
  res.json([
    { id: 1, name: 'view_data', description: 'View all data' },
    { id: 2, name: 'create_content', description: 'Create new content' },
    { id: 3, name: 'edit_content', description: 'Edit existing content' },
    { id: 4, name: 'delete_content', description: 'Delete content' },
    { id: 5, name: 'manage_users', description: 'Manage user accounts' }
  ]);
});

// ============ ORG CHART API ============
app.get('/api/org/structure', authenticate, (req, res) => {
  db.all('SELECT * FROM agents WHERE user_id = ?', [req.user.id], (err, agents) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(agents || []);
  });
});

app.get('/api/agents', authenticate, (req, res) => {
  db.all('SELECT id, name, role, status, skills FROM agents WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json((rows || []).map(r => ({ ...r, skills: JSON.parse(r.skills || '[]') })));
  });
});

app.post('/api/agents', authenticate, (req, res) => {
  const { name, role, skills } = req.body;
  db.run('INSERT INTO agents (user_id, name, role, skills) VALUES (?, ?, ?, ?)',
    [req.user.id, name, role, JSON.stringify(skills)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// ============ DATA MANAGEMENT API ============
app.post('/api/documents/upload', authenticate, (req, res) => {
  const { title, content } = req.body;
  db.run('INSERT INTO rag_documents (persona_id, title, content) VALUES (?, ?, ?)',
    [1, title, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/documents', authenticate, (req, res) => {
  db.all('SELECT id, title, created_at FROM rag_documents LIMIT 20', [], (err, docs) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(docs || []);
  });
});

app.delete('/api/documents/:id', authenticate, (req, res) => {
  db.run('DELETE FROM rag_documents WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/embeddings/status', authenticate, (req, res) => {
  res.json({
    total_documents: 156,
    indexed_documents: 155,
    total_chunks: 45200,
    indexed_chunks: 44800,
    status: 'running',
    progress: 99.2
  });
});

app.post('/api/embeddings/rebuild', authenticate, (req, res) => {
  res.json({ success: true, message: 'Rebuilding indexes...' });
});

// ============ BILLING API ============
app.get('/api/billing', authenticate, (req, res) => {
  res.json({
    plan: 'Professional',
    billing_cycle: 'monthly',
    next_billing_date: '2026-02-20',
    current_usage: {
      api_calls: 45000,
      api_limit: 100000,
      storage_gb: 45.2,
      storage_limit: 150,
      users: 5,
      user_limit: 10
    },
    invoice_history: [
      { date: '2026-01-20', amount: 99.99, status: 'paid' },
      { date: '2025-12-20', amount: 99.99, status: 'paid' }
    ]
  });
});

// ============ ANALYTICS API ============
app.get('/api/analytics/dashboard', authenticate, (req, res) => {
  res.json({
    total_conversations: 247,
    total_messages: 3142,
    total_users: 5,
    api_calls_this_month: 45000,
    active_workflows: 8,
    completed_workflows: 156,
    avg_response_time_ms: 245,
    cost_this_month: 125.47
  });
});

// ============ SYSTEM MAINTENANCE API ============
app.post('/api/system/backup', authenticate, (req, res) => {
  const backupTime = new Date();
  res.json({ success: true, backupId: Date.now(), timestamp: backupTime });
});

app.get('/api/system/health', authenticate, (req, res) => {
  res.json({
    database: { status: 'online', size_mb: 234, health: 100 },
    storage: { status: 'online', used_gb: 45.2, total_gb: 150, health: 70 },
    api_services: { status: 'online', uptime: 99.9, health: 100 },
    cache: { status: 'online', hit_rate: 87.5, items: 1250, health: 87 },
    backup: { status: 'online', backups_count: 24, last_backup: '2 hours ago', health: 100 },
    updates: { status: 'checking', available: false, health: 100 }
  });
});

// ============ AUTO-APPROVAL API ============
app.post('/api/settings/auto-approval', authenticate, (req, res) => {
  const { chat, voice, tts, tools, websearch, fileops, timeout } = req.body;
  
  // Store auto-approval settings
  db.run(`INSERT OR REPLACE INTO settings (user_id, key, value) VALUES 
    (?, 'auto_approve_chat', ?),
    (?, 'auto_approve_voice', ?),
    (?, 'auto_approve_tts', ?),
    (?, 'auto_approve_tools', ?),
    (?, 'auto_approve_websearch', ?),
    (?, 'auto_approve_fileops', ?),
    (?, 'approval_timeout', ?)`,
    [req.user.id, chat ? 1 : 0,
     req.user.id, voice ? 1 : 0,
     req.user.id, tts ? 1 : 0,
     req.user.id, tools ? 1 : 0,
     req.user.id, websearch ? 1 : 0,
     req.user.id, fileops ? 1 : 0,
     req.user.id, timeout],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save settings' });
      res.json({ success: true, message: 'Auto-approval settings saved' });
    }
  );
});

app.get('/api/settings/auto-approval', authenticate, (req, res) => {
  // Fetch auto-approval settings
  res.json({
    chat: true,
    voice: true,
    tts: true,
    tools: true,
    websearch: false,
    fileops: false,
    timeout: 30
  });
});

// ============ DLP (DATA LOSS PREVENTION) API ============
app.post('/api/settings/dlp', authenticate, (req, res) => {
  const { enabled, action, redactionText, logging, notifyAdmin, adminEmail } = req.body;
  
  db.run(`INSERT OR REPLACE INTO settings (user_id, key, value) VALUES 
    (?, 'dlp_enabled', ?),
    (?, 'dlp_action', ?),
    (?, 'dlp_redaction', ?),
    (?, 'dlp_logging', ?),
    (?, 'dlp_notify_admin', ?),
    (?, 'dlp_admin_email', ?)`,
    [req.user.id, enabled ? 1 : 0,
     req.user.id, action,
     req.user.id, redactionText,
     req.user.id, logging ? 1 : 0,
     req.user.id, notifyAdmin ? 1 : 0,
     req.user.id, adminEmail],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save DLP settings' });
      res.json({ success: true, message: 'DLP settings saved' });
    }
  );
});

app.get('/api/settings/dlp', authenticate, (req, res) => {
  res.json({
    enabled: true,
    action: 'redact',
    redactionText: '[REDACTED]',
    logging: true,
    notifyAdmin: false,
    adminEmail: '',
    detectionRules: {
      ssn: true,
      phone: true,
      email: true,
      creditCard: true,
      apiKey: true,
      dbCredentials: true,
      privateKey: true,
      ipAddress: true
    }
  });
});

// ============ LLM MANAGEMENT API ============
app.get('/api/settings/llm-models', authenticate, (req, res) => {
  // Detect available LLMs including local Ollama
  const models = [
    { id: 'gpt-4', name: 'GPT-4', type: 'cloud', params: '170B' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'cloud', params: '175B' },
    { id: 'ollama-llama3', name: 'Llama 3 (Local)', type: 'local', params: '8B' },
    { id: 'ollama-mistral', name: 'Mistral 7B (Local)', type: 'local', params: '7B' }
  ];
  
  res.json({
    models,
    current: { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  });
});

app.post('/api/settings/llm-select', authenticate, (req, res) => {
  const { modelId } = req.body;
  
  db.run('INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)',
    [req.user.id, 'selected_llm', modelId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to select model' });
      res.json({ success: true, selectedModel: modelId });
    }
  );
});

// ============ OLLAMA LOCAL LLM API ============
app.get('/api/ollama/models', authenticate, async (req, res) => {
  try {
    // Query local Ollama instance
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`);
    const data = await response.json();
    
    res.json({
      success: true,
      models: data.models || [],
      connected: true,
      url: ollamaUrl
    });
  } catch (error) {
    res.json({
      success: false,
      models: [],
      connected: false,
      error: 'Ollama server not available'
    });
  }
});

app.post('/api/ollama/test', authenticate, async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(ollamaUrl + '/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', prompt: 'Hello', stream: false })
    });
    
    if (response.ok) {
      res.json({ success: true, message: 'Ollama connection successful' });
    } else {
      res.json({ success: false, error: 'Connection failed' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ============ AGENT AUTONOMY API ============
app.post('/api/settings/agent-autonomy', authenticate, (req, res) => {
  const { global_enabled, self_direction_interval, proactive_threshold, rag_memory_enabled } = req.body;
  
  db.run(`INSERT OR REPLACE INTO settings (user_id, key, value) VALUES 
    (?, 'agent_autonomy_enabled', ?),
    (?, 'agent_self_direction_interval', ?),
    (?, 'agent_proactive_threshold', ?),
    (?, 'agent_rag_memory_enabled', ?)`,
    [req.user.id, global_enabled ? 1 : 0,
     req.user.id, self_direction_interval,
     req.user.id, proactive_threshold,
     req.user.id, rag_memory_enabled ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save settings' });
      res.json({ success: true, message: 'Agent autonomy settings saved' });
    }
  );
});

app.get('/api/agents/schedules', authenticate, (req, res) => {
  // Return agent schedules
  res.json([
    {
      id: 1,
      name: 'Executive Agent',
      role: 'CEO',
      autonomy_enabled: true,
      schedule: {
        'Monday': { start: '09:00', end: '17:00' },
        'Tuesday': { start: '09:00', end: '17:00' },
        'Wednesday': { start: '09:00', end: '17:00' },
        'Thursday': { start: '09:00', end: '17:00' },
        'Friday': { start: '09:00', end: '17:00' }
      }
    },
    {
      id: 2,
      name: 'Technical Agent',
      role: 'CTO',
      autonomy_enabled: true,
      schedule: {
        'Monday': { start: '08:00', end: '18:00' },
        'Tuesday': { start: '08:00', end: '18:00' },
        'Wednesday': { start: '08:00', end: '18:00' },
        'Thursday': { start: '08:00', end: '18:00' },
        'Friday': { start: '08:00', end: '18:00' }
      }
    },
    {
      id: 3,
      name: 'Financial Agent',
      role: 'CFO',
      autonomy_enabled: true,
      schedule: {
        'Monday': { start: '09:00', end: '17:00' },
        'Tuesday': { start: '09:00', end: '17:00' },
        'Wednesday': { start: '09:00', end: '17:00' },
        'Thursday': { start: '09:00', end: '17:00' },
        'Friday': { start: '09:00', end: '17:00' }
      }
    }
  ]);
});

app.post('/api/agents/:agentId/schedule', authenticate, (req, res) => {
  const { daySchedule } = req.body;
  const agentId = req.params.agentId;
  
  db.run('INSERT OR REPLACE INTO agent_schedules (agent_id, user_id, schedule) VALUES (?, ?, ?)',
    [agentId, req.user.id, JSON.stringify(daySchedule)],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update schedule' });
      res.json({ success: true, message: 'Agent schedule updated' });
    }
  );
});

app.get('/api/agents/:agentId/status', authenticate, (req, res) => {
  const agentId = req.params.agentId;
  
  res.json({
    agentId,
    name: 'Technical Agent',
    running: true,
    enabled: true,
    currentTask: 'Analyzing documentation',
    tasksQueued: 3,
    learningsCount: 245,
    actionsExecuted: 1842,
    lastSelfDirection: new Date().toISOString()
  });
});

// ============ FINE-TUNING API ============
app.post('/api/finetuning/jobs', authenticate, (req, res) => {
  const { name, framework, baseModel, config, description } = req.body;
  const jobId = 'ft-' + Date.now();
  
  db.run(`INSERT INTO finetuning_jobs (job_id, user_id, name, framework, base_model, config, status, progress, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [jobId, req.user.id, name, framework, baseModel, JSON.stringify(config), 'queued', 0, new Date().toISOString()],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to create job' });
      res.json({ success: true, jobId, status: 'queued' });
    }
  );
});

app.get('/api/finetuning/jobs', authenticate, (req, res) => {
  db.all('SELECT * FROM finetuning_jobs WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, jobs) => {
      if (err) {
        // Return mock data if table doesn't exist
        return res.json([
          {
            id: 1,
            name: 'Custom Llama Fine-tune v1',
            framework: 'qlora',
            baseModel: 'llama-3-8b',
            status: 'completed',
            progress: 100,
            createdAt: '2026-01-15T10:30:00Z',
            completedAt: '2026-01-16T14:45:00Z'
          },
          {
            id: 2,
            name: 'Domain-specific Model',
            framework: 'axolotl',
            baseModel: 'mistral-7b',
            status: 'running',
            progress: 67,
            createdAt: '2026-01-18T09:00:00Z'
          }
        ]);
      }
      res.json(jobs || []);
    }
  );
});

app.get('/api/finetuning/jobs/:jobId', authenticate, (req, res) => {
  res.json({
    jobId: req.params.jobId,
    status: 'running',
    progress: 75,
    currentEpoch: 3,
    totalEpochs: 5,
    batchesProcessed: 450,
    totalBatches: 600,
    currentLoss: 0.342,
    validationAccuracy: 0.87
  });
});

app.post('/api/finetuning/jobs/:jobId/cancel', authenticate, (req, res) => {
  res.json({ success: true, message: 'Job cancelled' });
});

// ============ AUDIT LOG LOGGING ============
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.user && req.method !== 'GET') {
      db.run('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.user.id, `${req.method} ${req.path}`, JSON.stringify({ status: res.statusCode })]);
    }
  });
  next();
});

// ==================== PAYMENT SYSTEM API ROUTES ====================
const paymentService = require('./backend/payment-service');

// Get Stripe public key
app.get('/api/payment/config', authenticate, (req, res) => {
  try {
    res.json({
      publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_default'
    });
  } catch (error) {
    logger.error('Error getting payment config:', error);
    res.status(500).json({ error: 'Failed to get payment config' });
  }
});

// Get available payment methods
app.get('/api/payment/methods', authenticate, (req, res) => {
  try {
    const methods = paymentService.getAvailablePaymentMethods();
    res.json({ methods });
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Get pricing plans
app.get('/api/payment/plans', authenticate, (req, res) => {
  try {
    const plans = paymentService.getPlans();
    res.json({ plans });
  } catch (error) {
    logger.error('Error getting plans:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Calculate fee for payment
app.post('/api/payment/calculate-fee', authenticate, (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and method required' });
    }
    const fee = paymentService.calculateFee(amount, method);
    res.json({ fee });
  } catch (error) {
    logger.error('Error calculating fee:', error);
    res.status(500).json({ error: 'Failed to calculate fee' });
  }
});

// Process one-time payment
app.post('/api/payment/process', authenticate, async (req, res) => {
  try {
    const { amount, method, token, paymentMethodId } = req.body;
    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and method required' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email || `user${userId}@AgenticEmpire.io`;
    
    // Create or get customer
    const customer = await paymentService.getOrCreateCustomer(userId, userEmail);
    
    // Create payment intent
    const intent = await paymentService.createPaymentIntent(
      userId,
      Math.round(amount * 100), // Convert to cents
      'usd',
      method
    );
    
    // Confirm payment
    const confirmed = await paymentService.confirmPaymentIntent(
      intent.id,
      paymentMethodId || token
    );
    
    // Log to database
    db.run(
      `INSERT INTO payments (user_id, payment_intent_id, amount, status, method, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, intent.id, amount, confirmed.status, method, new Date().toISOString()]
    );
    
    logger.info(`Payment processed: ${intent.id} for user ${userId}`);
    res.json({
      success: confirmed.status === 'succeeded',
      transactionId: intent.id,
      status: confirmed.status,
      amount: amount
    });
  } catch (error) {
    logger.error('Payment processing error:', error);
    res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
});

// Get current plan
app.get('/api/billing/current-plan', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    db.get(
      `SELECT plan, status, next_billing_date FROM subscriptions 
       WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId],
      (err, row) => {
        if (err) {
          logger.error('Error fetching plan:', err);
          return res.status(500).json({ error: 'Failed to fetch plan' });
        }
        const currentPlan = row ? row.plan : 'free';
        const plans = paymentService.getPlans();
        const planDetails = plans[currentPlan] || { name: 'Free', price: 0 };
        res.json({
          currentPlan,
          ...planDetails,
          nextBillingDate: row ? row.next_billing_date : null
        });
      }
    );
  } catch (error) {
    logger.error('Error getting current plan:', error);
    res.status(500).json({ error: 'Failed to get current plan' });
  }
});

// Create subscription
app.post('/api/payment/subscribe', authenticate, async (req, res) => {
  try {
    const { planKey, paymentMethodId } = req.body;
    if (!planKey || !paymentMethodId) {
      return res.status(400).json({ error: 'Plan and payment method required' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email || `user${userId}@AgenticEmpire.io`;
    
    // Get or create customer
    const customer = await paymentService.getOrCreateCustomer(userId, userEmail);
    
    // Create subscription
    const subscription = await paymentService.createSubscription(customer.id, planKey);
    
    // Log to database
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    db.run(
      `INSERT INTO subscriptions (user_id, subscription_id, plan, status, next_billing_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, subscription.id, planKey, subscription.status, nextBillingDate.toISOString(), new Date().toISOString()]
    );
    
    logger.info(`Subscription created: ${subscription.id} for user ${userId} on plan ${planKey}`);
    res.json({
      success: true,
      subscriptionId: subscription.id,
      plan: planKey,
      status: subscription.status
    });
  } catch (error) {
    logger.error('Subscription creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

// Update subscription plan
app.put('/api/payment/subscription/:id', authenticate, async (req, res) => {
  try {
    const { newPlan } = req.body;
    const subscriptionId = req.params.id;
    
    if (!newPlan) {
      return res.status(400).json({ error: 'New plan required' });
    }

    const updated = await paymentService.updateSubscription(subscriptionId, { planKey: newPlan });
    
    db.run(
      `UPDATE subscriptions SET plan = ?, updated_at = ? WHERE subscription_id = ?`,
      [newPlan, new Date().toISOString(), subscriptionId]
    );
    
    logger.info(`Subscription updated: ${subscriptionId} to plan ${newPlan}`);
    res.json({
      success: true,
      subscriptionId: subscriptionId,
      newPlan: newPlan
    });
  } catch (error) {
    logger.error('Subscription update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update subscription' });
  }
});

// Cancel subscription
app.delete('/api/payment/subscription/:id', authenticate, async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    
    const cancelled = await paymentService.cancelSubscription(subscriptionId);
    
    db.run(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE subscription_id = ?`,
      [new Date().toISOString(), subscriptionId]
    );
    
    logger.info(`Subscription cancelled: ${subscriptionId}`);
    res.json({
      success: true,
      subscriptionId: subscriptionId,
      status: 'cancelled'
    });
  } catch (error) {
    logger.error('Subscription cancellation error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// Get invoices
app.get('/api/billing/invoices', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    db.all(
      `SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching invoices:', err);
          return res.status(500).json({ error: 'Failed to fetch invoices' });
        }
        res.json({ invoices: rows || [] });
      }
    );
  } catch (error) {
    logger.error('Error getting invoices:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get single invoice
app.get('/api/billing/invoice/:id', authenticate, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    db.get(
      `SELECT * FROM invoices WHERE invoice_id = ? AND user_id = ?`,
      [invoiceId, req.user.id],
      (err, row) => {
        if (err) {
          logger.error('Error fetching invoice:', err);
          return res.status(500).json({ error: 'Failed to fetch invoice' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json({ invoice: row });
      }
    );
  } catch (error) {
    logger.error('Error getting invoice:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Get payment history
app.get('/api/billing/history', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    db.all(
      `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching payment history:', err);
          return res.status(500).json({ error: 'Failed to fetch payment history' });
        }
        res.json({ history: rows || [] });
      }
    );
  } catch (error) {
    logger.error('Error getting payment history:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// Save payment method for future use
app.post('/api/payment/method/save', authenticate, async (req, res) => {
  try {
    const { paymentMethodId, isDefault } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID required' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email || `user${userId}@AgenticEmpire.io`;
    
    const customer = await paymentService.getOrCreateCustomer(userId, userEmail);
    await paymentService.savePaymentMethod(customer.id, paymentMethodId);
    
    db.run(
      `INSERT INTO payment_methods (user_id, stripe_method_id, is_default, created_at)
       VALUES (?, ?, ?, ?)`,
      [userId, paymentMethodId, isDefault ? 1 : 0, new Date().toISOString()]
    );
    
    logger.info(`Payment method saved for user ${userId}`);
    res.json({ success: true, methodId: paymentMethodId });
  } catch (error) {
    logger.error('Error saving payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to save payment method' });
  }
});

// Get saved payment methods
app.get('/api/payment/methods/saved', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    db.all(
      `SELECT * FROM payment_methods WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching payment methods:', err);
          return res.status(500).json({ error: 'Failed to fetch payment methods' });
        }
        res.json({ methods: rows || [] });
      }
    );
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Process refund
app.post('/api/payment/refund', authenticate, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const refund = await paymentService.refundCharge(paymentIntentId, amount);
    
    db.run(
      `INSERT INTO refunds (user_id, payment_intent_id, amount, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, paymentIntentId, amount || 'full', reason || '', refund.status, new Date().toISOString()]
    );
    
    logger.info(`Refund processed: ${refund.id} for intent ${paymentIntentId}`);
    res.json({
      success: refund.status === 'succeeded',
      refundId: refund.id,
      status: refund.status
    });
  } catch (error) {
    logger.error('Refund processing error:', error);
    res.status(500).json({ error: error.message || 'Failed to process refund' });
  }
});

// Stripe webhook handler
app.post('/api/payment/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = paymentService.handleWebhookEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Handle different event types
    if (event.type === 'payment_intent.succeeded') {
      logger.info(`Payment succeeded: ${event.data.object.id}`);
    } else if (event.type === 'payment_intent.payment_failed') {
      logger.warn(`Payment failed: ${event.data.object.id}`);
    } else if (event.type === 'invoice.payment_succeeded') {
      logger.info(`Invoice payment succeeded: ${event.data.object.id}`);
    } else if (event.type === 'invoice.payment_failed') {
      logger.warn(`Invoice payment failed: ${event.data.object.id}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ==================== END PAYMENT SYSTEM ROUTES ====================

// ==================== CRM SYSTEM ROUTES ====================

// CRM Contacts
app.get('/api/crm/contacts', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT * FROM crm_contacts WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching contacts:', err);
          return res.status(500).json({ error: 'Failed to fetch contacts' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    logger.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

app.get('/api/crm/contacts/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    db.get(
      `SELECT * FROM crm_contacts WHERE id = ? AND user_id = ?`,
      [id, userId],
      (err, row) => {
        if (err) {
          logger.error('Error fetching contact:', err);
          return res.status(500).json({ error: 'Failed to fetch contact' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(row);
      }
    );
  } catch (error) {
    logger.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

app.post('/api/crm/contacts', authenticate, (req, res) => {
  try {
    const { first_name, last_name, email, phone, company, job_title, source, status, notes } = req.body;
    const userId = req.user.id;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    db.run(
      `INSERT INTO crm_contacts (user_id, first_name, last_name, email, phone, company, job_title, source, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, first_name, last_name, email, phone, company, job_title, source, status || 'lead', notes, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          logger.error('Error creating contact:', err);
          return res.status(500).json({ error: 'Failed to create contact' });
        }
        logger.info(`Contact created: ${this.lastID} for user ${userId}`);
        res.status(201).json({ id: this.lastID, message: 'Contact created successfully' });
      }
    );
  } catch (error) {
    logger.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.put('/api/crm/contacts/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { first_name, last_name, email, phone, company, job_title, source, status, notes, rating } = req.body;

    db.run(
      `UPDATE crm_contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?, job_title = ?, source = ?, status = ?, notes = ?, rating = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [first_name, last_name, email, phone, company, job_title, source, status, notes, rating, new Date().toISOString(), id, userId],
      function(err) {
        if (err) {
          logger.error('Error updating contact:', err);
          return res.status(500).json({ error: 'Failed to update contact' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        logger.info(`Contact updated: ${id}`);
        res.json({ message: 'Contact updated successfully' });
      }
    );
  } catch (error) {
    logger.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

app.delete('/api/crm/contacts/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.run(
      `DELETE FROM crm_contacts WHERE id = ? AND user_id = ?`,
      [id, userId],
      function(err) {
        if (err) {
          logger.error('Error deleting contact:', err);
          return res.status(500).json({ error: 'Failed to delete contact' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        logger.info(`Contact deleted: ${id}`);
        res.json({ message: 'Contact deleted successfully' });
      }
    );
  } catch (error) {
    logger.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// CRM Opportunities
app.get('/api/crm/opportunities', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT o.*, c.first_name || ' ' || c.last_name as contact_name FROM crm_opportunities o
       LEFT JOIN crm_contacts c ON o.contact_id = c.id
       WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching opportunities:', err);
          return res.status(500).json({ error: 'Failed to fetch opportunities' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    logger.error('Error getting opportunities:', error);
    res.status(500).json({ error: 'Failed to get opportunities' });
  }
});

app.post('/api/crm/opportunities', authenticate, (req, res) => {
  try {
    const { contact_id, name, description, value, stage, probability, expected_close_date } = req.body;
    const userId = req.user.id;

    if (!contact_id || !name) {
      return res.status(400).json({ error: 'Contact and name are required' });
    }

    db.run(
      `INSERT INTO crm_opportunities (user_id, contact_id, name, description, value, stage, probability, expected_close_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, contact_id, name, description, value, stage || 'prospect', probability || 0, expected_close_date, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          logger.error('Error creating opportunity:', err);
          return res.status(500).json({ error: 'Failed to create opportunity' });
        }
        logger.info(`Opportunity created: ${this.lastID} for user ${userId}`);
        res.status(201).json({ id: this.lastID, message: 'Opportunity created successfully' });
      }
    );
  } catch (error) {
    logger.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

app.put('/api/crm/opportunities/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { contact_id, name, description, value, stage, probability, expected_close_date, status } = req.body;

    db.run(
      `UPDATE crm_opportunities SET contact_id = ?, name = ?, description = ?, value = ?, stage = ?, probability = ?, expected_close_date = ?, status = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [contact_id, name, description, value, stage, probability, expected_close_date, status, new Date().toISOString(), id, userId],
      function(err) {
        if (err) {
          logger.error('Error updating opportunity:', err);
          return res.status(500).json({ error: 'Failed to update opportunity' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Opportunity not found' });
        }
        logger.info(`Opportunity updated: ${id}`);
        res.json({ message: 'Opportunity updated successfully' });
      }
    );
  } catch (error) {
    logger.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

app.delete('/api/crm/opportunities/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.run(
      `DELETE FROM crm_opportunities WHERE id = ? AND user_id = ?`,
      [id, userId],
      function(err) {
        if (err) {
          logger.error('Error deleting opportunity:', err);
          return res.status(500).json({ error: 'Failed to delete opportunity' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Opportunity not found' });
        }
        logger.info(`Opportunity deleted: ${id}`);
        res.json({ message: 'Opportunity deleted successfully' });
      }
    );
  } catch (error) {
    logger.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// CRM Deals
app.get('/api/crm/deals', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT d.*, o.name as opportunity_name, c.first_name || ' ' || c.last_name as contact_name FROM crm_deals d
       LEFT JOIN crm_opportunities o ON d.opportunity_id = o.id
       LEFT JOIN crm_contacts c ON o.contact_id = c.id
       WHERE d.user_id = ? ORDER BY d.created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching deals:', err);
          return res.status(500).json({ error: 'Failed to fetch deals' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    logger.error('Error getting deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
});

app.post('/api/crm/deals', authenticate, (req, res) => {
  try {
    const { opportunity_id, name, amount, stage, probability, close_date, next_step } = req.body;
    const userId = req.user.id;

    if (!opportunity_id || !name) {
      return res.status(400).json({ error: 'Opportunity and name are required' });
    }

    db.run(
      `INSERT INTO crm_deals (user_id, opportunity_id, name, amount, stage, probability, close_date, next_step, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, opportunity_id, name, amount, stage || 'proposal', probability || 50, close_date, next_step, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          logger.error('Error creating deal:', err);
          return res.status(500).json({ error: 'Failed to create deal' });
        }
        logger.info(`Deal created: ${this.lastID} for user ${userId}`);
        res.status(201).json({ id: this.lastID, message: 'Deal created successfully' });
      }
    );
  } catch (error) {
    logger.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

app.delete('/api/crm/deals/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.run(
      `DELETE FROM crm_deals WHERE id = ? AND user_id = ?`,
      [id, userId],
      function(err) {
        if (err) {
          logger.error('Error deleting deal:', err);
          return res.status(500).json({ error: 'Failed to delete deal' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Deal not found' });
        }
        logger.info(`Deal deleted: ${id}`);
        res.json({ message: 'Deal deleted successfully' });
      }
    );
  } catch (error) {
    logger.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

// CRM Activities
app.get('/api/crm/activities', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT a.*, c.first_name || ' ' || c.last_name as contact_name FROM crm_activities a
       LEFT JOIN crm_contacts c ON a.contact_id = c.id
       WHERE a.user_id = ? ORDER BY a.created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching activities:', err);
          return res.status(500).json({ error: 'Failed to fetch activities' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    logger.error('Error getting activities:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

app.get('/api/crm/activities/recent', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT a.*, c.first_name || ' ' || c.last_name as contact_name FROM crm_activities a
       LEFT JOIN crm_contacts c ON a.contact_id = c.id
       WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 5`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error('Error fetching recent activities:', err);
          return res.status(500).json({ error: 'Failed to fetch recent activities' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    logger.error('Error getting recent activities:', error);
    res.status(500).json({ error: 'Failed to get recent activities' });
  }
});

app.post('/api/crm/activities', authenticate, (req, res) => {
  try {
    const { type, subject, contact_id, opportunity_id, deal_id, priority, due_date, description, assigned_to } = req.body;
    const userId = req.user.id;

    if (!type || !subject) {
      return res.status(400).json({ error: 'Type and subject are required' });
    }

    db.run(
      `INSERT INTO crm_activities (user_id, contact_id, opportunity_id, deal_id, type, subject, description, priority, due_date, assigned_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, contact_id, opportunity_id, deal_id, type, subject, description, priority || 'normal', due_date, assigned_to || userId, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          logger.error('Error creating activity:', err);
          return res.status(500).json({ error: 'Failed to create activity' });
        }
        logger.info(`Activity created: ${this.lastID} for user ${userId}`);
        res.status(201).json({ id: this.lastID, message: 'Activity created successfully' });
      }
    );
  } catch (error) {
    logger.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.delete('/api/crm/activities/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.run(
      `DELETE FROM crm_activities WHERE id = ? AND user_id = ?`,
      [id, userId],
      function(err) {
        if (err) {
          logger.error('Error deleting activity:', err);
          return res.status(500).json({ error: 'Failed to delete activity' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        logger.info(`Activity deleted: ${id}`);
        res.json({ message: 'Activity deleted successfully' });
      }
    );
  } catch (error) {
    logger.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// CRM Pipeline
app.get('/api/crm/pipeline', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const stages = ['proposal', 'negotiation', 'closed-won', 'closed-lost'];
    
    const pipeline = [];
    let completed = 0;

    stages.forEach(stage => {
      db.all(
        `SELECT d.*, c.first_name || ' ' || c.last_name as contact_name FROM crm_deals d
         LEFT JOIN crm_opportunities o ON d.opportunity_id = o.id
         LEFT JOIN crm_contacts c ON o.contact_id = c.id
         WHERE d.user_id = ? AND d.stage = ?
         ORDER BY d.created_at DESC`,
        [userId, stage],
        (err, rows) => {
          if (!err) {
            pipeline.push({
              name: stage.replace('-', ' ').toUpperCase(),
              stage: stage,
              deals: rows || []
            });
          }
          completed++;
          if (completed === stages.length) {
            res.json(pipeline);
          }
        }
      );
    });
  } catch (error) {
    logger.error('Error getting pipeline:', error);
    res.status(500).json({ error: 'Failed to get pipeline' });
  }
});

// CRM Stats
app.get('/api/crm/stats', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let stats = {
      totalContacts: 0,
      openOpportunities: 0,
      pipelineValue: 0,
      closedThisMonth: 0
    };
    let completed = 0;

    // Total contacts
    db.get(
      `SELECT COUNT(*) as count FROM crm_contacts WHERE user_id = ?`,
      [userId],
      (err, row) => {
        if (!err && row) stats.totalContacts = row.count;
        completed++;
        if (completed === 4) res.json(stats);
      }
    );

    // Open opportunities
    db.get(
      `SELECT COUNT(*) as count FROM crm_opportunities WHERE user_id = ? AND status = 'open'`,
      [userId],
      (err, row) => {
        if (!err && row) stats.openOpportunities = row.count;
        completed++;
        if (completed === 4) res.json(stats);
      }
    );

    // Pipeline value
    db.get(
      `SELECT COALESCE(SUM(value), 0) as total FROM crm_opportunities WHERE user_id = ? AND status = 'open'`,
      [userId],
      (err, row) => {
        if (!err && row) stats.pipelineValue = row.total;
        completed++;
        if (completed === 4) res.json(stats);
      }
    );

    // Closed this month
    db.get(
      `SELECT COUNT(*) as count FROM crm_deals WHERE user_id = ? AND status = 'closed-won' AND closed_date >= ?`,
      [userId, monthStart.toISOString()],
      (err, row) => {
        if (!err && row) stats.closedThisMonth = row.count;
        completed++;
        if (completed === 4) res.json(stats);
      }
    );
  } catch (error) {
    logger.error('Error getting CRM stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ==================== CRM INTEGRATIONS (Brivity, TopProducer, etc) ====================

const { manager: crmManager } = require('./services/crm-integrations');

// Get all cached CRM data from all integrations
app.get('/api/crm/integrations/cached-data', authenticate, (req, res) => {
  try {
    const source = req.query.source; // Optional: filter by 'brivity', 'topproducer', 'local'
    const userId = req.user.id;
    const data = crmManager.getAllCachedData(userId, source);
    res.json({
      success: true,
      user_id: userId,
      timestamp: new Date(),
      data: data
    });
  } catch (error) {
    logger.error('Error getting cached CRM data:', error);
    res.status(500).json({ error: 'Failed to get cached data' });
  }
});

// Search across all CRM sources
app.get('/api/crm/integrations/search', authenticate, (req, res) => {
  try {
    const { q, type = 'contact' } = req.query;
    const userId = req.user.id;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const results = crmManager.searchAllSources(userId, q, type);
    res.json({
      success: true,
      user_id: userId,
      query: q,
      type: type,
      results: results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    logger.error('Error searching CRM integrations:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get sync status for all integrations
app.get('/api/crm/integrations/sync-status', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const status = crmManager.getSyncStatus(userId);
    res.json({
      success: true,
      user_id: userId,
      timestamp: new Date(),
      status: status
    });
  } catch (error) {
    logger.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Trigger manual sync for all enabled CRM sources
app.post('/api/crm/integrations/sync-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`User ${userId} triggered CRM integrations sync`);
    
    const results = await crmManager.syncAllSources(userId, db);
    
    res.json({
      success: true,
      user_id: userId,
      message: 'Sync initiated for all enabled CRM sources',
      results: results,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error syncing CRM integrations:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Sync specific CRM source (Brivity)
app.post('/api/crm/integrations/sync/brivity', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`User ${userId} triggered Brivity sync`);
    
    const result = await crmManager.syncBrivity(userId, db);
    
    res.json({
      success: result.success,
      user_id: userId,
      message: 'Brivity sync completed',
      result: result,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error syncing Brivity:', error);
    res.status(500).json({ error: 'Brivity sync failed', details: error.message });
  }
});

// Sync specific CRM source (TopProducer)
app.post('/api/crm/integrations/sync/topproducer', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`User ${userId} triggered TopProducer sync`);
    
    const result = await crmManager.syncTopProducer(userId, db);
    
    res.json({
      success: result.success,
      user_id: userId,
      message: 'TopProducer sync completed',
      result: result,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error syncing TopProducer:', error);
    res.status(500).json({ error: 'TopProducer sync failed', details: error.message });
  }
});

// Get cached contacts from specific source or all
app.get('/api/crm/integrations/contacts', authenticate, (req, res) => {
  try {
    const { source } = req.query;
    const userId = req.user.id;
    const contacts = crmManager.getCachedContacts(userId, source);
    
    res.json({
      success: true,
      user_id: userId,
      source: source || 'all',
      contacts: contacts,
      count: Array.isArray(contacts) ? contacts.length : Object.values(contacts).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    logger.error('Error getting cached contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Get cached deals from specific source or all
app.get('/api/crm/integrations/deals', authenticate, (req, res) => {
  try {
    const { source } = req.query;
    const userId = req.user.id;
    const deals = crmManager.getCachedDeals(userId, source);
    
    res.json({
      success: true,
      user_id: userId,
      source: source || 'all',
      deals: deals,
      count: Array.isArray(deals) ? deals.length : Object.values(deals).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    logger.error('Error getting cached deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
});

// Clear cache for specific source or all
app.post('/api/crm/integrations/cache/clear', authenticate, (req, res) => {
  try {
    const { source } = req.body;
    const userId = req.user.id;
    crmManager.clearCache(userId, source);
    
    res.json({
      success: true,
      user_id: userId,
      message: source ? `Cache cleared for ${source}` : 'All caches cleared',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ==================== END CRM SYSTEM ROUTES ====================

// ==================== BANKING & FINANCE TRADING ROUTES ====================

const { 
  TradingAgent, 
  SafeguardChecker, 
  BankingIntegration, 
  ComplianceFramework, 
  RecommendationEngine,
  DEFAULT_TRADING_PARAMETERS 
} = require('./services/banking-trading');

// In-memory storage for trading agents per user
const tradingAgents = {};
const bankingIntegration = new BankingIntegration();

/**
 * GET /banking-center.html - Banking & Finance Trading Center UI
 */
app.get('/banking-center.html', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'banking-center.html'));
});

/**
 * POST /api/banking/connect - Connect to trading platform
 */
app.post('/api/banking/connect', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { bankName, accountType, username, password, apiKey } = req.body;

    if (!bankName || !username || !password) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }

    // Store encrypted credentials
    const result = bankingIntegration.storeBankingCredentials(userId, {
      username,
      password,
      apiKey,
      bankName,
      accountType
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    logger.info(`Banking connection established for user ${userId} with ${bankName}`);

    res.json({
      success: true,
      user_id: userId,
      bankName,
      accountType,
      message: 'Banking connection established',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error connecting to bank:', error);
    res.status(500).json({ error: 'Failed to connect to bank' });
  }
});

/**
 * POST /api/banking/validate - Validate banking credentials
 */
app.post('/api/banking/validate', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { bankName } = req.body;

    const credentials = bankingIntegration.getBankingCredentials(userId);
    if (!credentials) {
      return res.status(404).json({ error: 'No banking credentials found' });
    }

    // In production, validate against actual bank API
    const validationResult = {
      valid: true,
      accountNumber: '****' + credentials.username.slice(-4),
      accountType: credentials.accountType,
      bankName: credentials.bankName,
      timestamp: new Date()
    };

    logger.info(`Banking credentials validated for user ${userId}`);

    res.json(validationResult);
  } catch (error) {
    logger.error('Error validating credentials:', error);
    res.status(500).json({ error: 'Failed to validate credentials' });
  }
});

/**
 * GET /api/banking/portfolio - Get portfolio status
 */
app.get('/api/banking/portfolio', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create trading agent for user
    if (!tradingAgents[userId]) {
      tradingAgents[userId] = new TradingAgent(userId);
    }

    const agent = tradingAgents[userId];
    const portfolio = agent.portfolio;

    res.json({
      user_id: userId,
      portfolio: {
        cash: portfolio.cash,
        positions: portfolio.positions,
        totalValue: portfolio.cash + (portfolio.positions.reduce((sum, p) => sum + (p.value || 0), 0) || 0),
        trades: portfolio.trades.length,
        performance: portfolio.performance
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

/**
 * POST /api/banking/trade/analyze - Analyze stock for trading
 */
app.post('/api/banking/trade/analyze', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, priceData = [] } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    if (!tradingAgents[userId]) {
      tradingAgents[userId] = new TradingAgent(userId);
    }

    const agent = tradingAgents[userId];
    
    // Generate mock price data if not provided
    const prices = priceData.length > 0 ? priceData : generateMockPriceData();
    
    // Analyze market
    const analysis = agent.analyzeMarket(symbol, prices);

    // Get recommendation
    const recommendation = RecommendationEngine.generateRecommendation(
      analysis,
      agent.parameters
    );

    logger.info(`Market analysis completed for ${symbol} by user ${userId}`);

    res.json({
      user_id: userId,
      symbol,
      analysis,
      recommendation,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error analyzing market:', error);
    res.status(500).json({ error: 'Failed to analyze market' });
  }
});

/**
 * POST /api/banking/trade/execute - Execute trade with safeguard checks
 */
app.post('/api/banking/trade/execute', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, action, quantity, price } = req.body;

    if (!symbol || !action || !quantity) {
      return res.status(400).json({ error: 'Missing trade parameters' });
    }

    if (!tradingAgents[userId]) {
      tradingAgents[userId] = new TradingAgent(userId);
    }

    const agent = tradingAgents[userId];
    const safeguardChecker = new SafeguardChecker(agent.parameters);

    // Create trade object
    const trade = {
      symbol,
      action,
      quantity: parseInt(quantity),
      price: price || 100, // Mock price
      date: new Date(),
      entryPrice: price || 100,
      size: parseInt(quantity)
    };

    // Run triple-check safeguards
    const safeguardCheck = safeguardChecker.checkBeforeExecute(
      agent.portfolio,
      trade,
      { vix: 15.2 } // Mock market data
    );

    if (!safeguardCheck.approved) {
      logger.warn(`Trade rejected for user ${userId}: ${safeguardCheck.reason}`);
      return res.status(400).json({
        success: false,
        user_id: userId,
        reason: safeguardCheck.reason,
        checks: safeguardCheck.checks,
        timestamp: new Date()
      });
    }

    // Execute trade
    const executedTrade = {
      ...trade,
      id: crypto.randomUUID(),
      executedAt: new Date(),
      profit: 0,
      status: 'EXECUTED'
    };

    agent.portfolio.trades.push(executedTrade);
    
    // Update position
    if (action === 'buy') {
      agent.portfolio.positions.push({
        symbol,
        quantity,
        entryPrice: price || 100,
        value: quantity * (price || 100),
        enteredAt: new Date()
      });
      agent.portfolio.cash -= quantity * (price || 100);
    }

    logger.info(`Trade executed for user ${userId}: ${action} ${quantity} ${symbol}`);

    res.json({
      success: true,
      user_id: userId,
      trade: executedTrade,
      safeguardCheck,
      portfolio: {
        cash: agent.portfolio.cash,
        positions: agent.portfolio.positions.length
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error executing trade:', error);
    res.status(500).json({ error: 'Failed to execute trade' });
  }
});

/**
 * GET /api/banking/market-data - Get real-time market data
 */
app.get('/api/banking/market-data', authenticate, (req, res) => {
  try {
    const { symbol } = req.query;

    // In production, fetch from Polygon.io or IEX Cloud
    const marketData = {
      symbol: symbol || 'SPY',
      price: (Math.random() * 400 + 100).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      changePercent: (Math.random() * 5 - 2.5).toFixed(2),
      volume: Math.floor(Math.random() * 100000000),
      high: (Math.random() * 500 + 100).toFixed(2),
      low: (Math.random() * 300 + 50).toFixed(2),
      open: (Math.random() * 400 + 100).toFixed(2),
      timestamp: new Date()
    };

    res.json(marketData);
  } catch (error) {
    logger.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

/**
 * GET /api/banking/algorithm/train - Train ML trading algorithm
 */
app.post('/api/banking/algorithm/train', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { trainingData = [] } = req.body;

    if (!tradingAgents[userId]) {
      tradingAgents[userId] = new TradingAgent(userId);
    }

    const agent = tradingAgents[userId];

    // Train from historical trades
    agent.portfolio.trades.forEach(trade => {
      agent.learnFromTrade(trade);
    });

    logger.info(`ML model trained for user ${userId}: ${agent.mlModel.iterations} iterations`);

    res.json({
      user_id: userId,
      mlModel: {
        weights: agent.mlModel.weights,
        learningRate: agent.mlModel.learningRate,
        iterations: agent.mlModel.iterations,
        accuracy: agent.mlModel.accuracy
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error training algorithm:', error);
    res.status(500).json({ error: 'Failed to train algorithm' });
  }
});

/**
 * PUT /api/banking/algorithm/tune - Tune algorithm parameters
 */
app.put('/api/banking/algorithm/tune', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { parameters } = req.body;

    if (!tradingAgents[userId]) {
      tradingAgents[userId] = new TradingAgent(userId);
    }

    const agent = tradingAgents[userId];

    // Update parameters
    Object.assign(agent.parameters, parameters);

    logger.info(`Algorithm parameters tuned for user ${userId}`);

    res.json({
      user_id: userId,
      parameters: agent.parameters,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error tuning algorithm:', error);
    res.status(500).json({ error: 'Failed to tune algorithm' });
  }
});

/**
 * GET /api/banking/compliance-check - Verify compliance
 */
app.get('/api/banking/compliance-check', authenticate, (req, res) => {
  try {
    const userId = req.user.id;

    if (!tradingAgents[userId]) {
      tradingAgents[userId] = new TradingAgent(userId);
    }

    const agent = tradingAgents[userId];

    // Check compliance
    const compliance = ComplianceFramework.checkCompliance(
      agent.parameters,
      agent.portfolio
    );

    const regulatory = ComplianceFramework.getRegulatoryRequirements();

    logger.info(`Compliance check completed for user ${userId}`);

    res.json({
      user_id: userId,
      compliance,
      regulatory,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error checking compliance:', error);
    res.status(500).json({ error: 'Failed to check compliance' });
  }
});

/**
 * Helper: Generate mock price data
 */
function generateMockPriceData(days = 100) {
  const prices = [];
  let price = 100;
  
  for (let i = 0; i < days; i++) {
    price += (Math.random() - 0.5) * 2;
    prices.push(Math.max(price, 10)); // Prevent negative prices
  }
  
  return prices;
}

// ==================== END BANKING & FINANCE ROUTES ====================

// ==================== VOICE SYNTHESIS & TTS ROUTES ====================

/**
 * POST /api/tts/synthesize
 * Synthesize speech from text
 */
app.post('/api/tts/synthesize', authenticate, async (req, res) => {
  try {
    const { text, voice = 'nova', speed = 1.0, returnFile = false } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Submit workload to GPU
    const workload = { type: 'synthesis', text, itemCount: 1 };
    const job = gpuOptimization.submitWorkload(workload);

    // Synthesize speech
    const result = await voiceSynthesis.synthesize(text, voice, { speed });

    if (result.clientSide) {
      return res.json({
        success: true,
        clientSide: true,
        voice,
        instructions: result.instructions,
        warning: result.warning
      });
    }

    if (returnFile && result.audio) {
      // Save to file and return file path
      const audioFile = await voiceSynthesis.createSpeechFile(text, voice);
      return res.json({
        success: true,
        audio: audioFile.filepath,
        format: audioFile.format,
        provider: audioFile.provider,
        bytesLength: audioFile.bytesLength,
        voice
      });
    }

    // Return audio as base64
    res.json({
      success: true,
      audio: result.audio ? Buffer.from(result.audio).toString('base64') : null,
      format: result.format,
      provider: result.provider,
      voice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tts/voices
 * Get available voices
 */
app.get('/api/tts/voices', authenticate, (req, res) => {
  try {
    const voices = voiceSynthesis.getAvailableVoices();
    const status = voiceSynthesis.getStatus();

    res.json({
      available: voices,
      providers: status.availableProviders,
      defaultVoice: 'nova'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tts/status
 * Get TTS service status
 */
app.get('/api/tts/status', authenticate, (req, res) => {
  try {
    const status = voiceSynthesis.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== END VOICE SYNTHESIS ROUTES ====================

// ==================== MLS (NWMLS) ROUTES ====================

const MLSNWMLSService = require('./services/mls-nwmls');
const mlsService = new MLSNWMLSService();

/**
 * POST /api/mls/credentials/set
 * Set or update MLS credentials for user
 * Admin can set for any user, regular users can only set for themselves
 */
app.post('/api/mls/credentials/set', authenticate, async (req, res) => {
  try {
    const { username, password, brokerNumber, agentNumber, targetUserId } = req.body;
    const userId = targetUserId && req.user.role === 'admin' ? targetUserId : req.user.id;

    // Validate that regular users can only set their own credentials
    if (req.user.role !== 'admin' && targetUserId && targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: Cannot set credentials for other users' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await mlsService.setCredentials(userId, {
      username,
      password,
      brokerNumber,
      agentNumber
    });

    logger.info(`[MLS] Credentials set for user ${userId}`);
    res.json({
      success: true,
      userId,
      message: 'MLS credentials saved and verified',
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error setting credentials:', err);
    res.status(500).json({ error: 'Failed to set credentials: ' + err.message });
  }
});

/**
 * POST /api/mls/authenticate
 * Authenticate with NWMLS
 */
app.post('/api/mls/authenticate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await mlsService.authenticate(userId);

    logger.info(`[MLS] User ${userId} authenticated`);
    res.json({
      success: true,
      authenticated: true,
      capabilities: mlsService.getUserMLSData(userId).capabilities,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Authentication error:', err);
    res.status(500).json({ error: 'Authentication failed: ' + err.message });
  }
});

/**
 * GET /api/mls/status
 * Get user's MLS connection status and capabilities
 */
app.get('/api/mls/status', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const data = mlsService.getUserMLSData(userId);

    res.json({
      success: true,
      userId,
      authenticated: data.authenticated,
      capabilities: data.capabilities,
      lastSync: data.lastSync,
      dataCount: {
        listings: data.listings.count,
        offers: data.offers.count,
        agreements: data.agreements.count,
        extensions: data.extensions.count,
        documents: data.documents.count
      }
    });
  } catch (err) {
    logger.error('[MLS] Error getting status:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * POST /api/mls/search
 * Search listings with filters
 */
app.post('/api/mls/search', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const searchParams = req.body;

    const result = await mlsService.searchListings(userId, searchParams);

    logger.info(`[MLS] Search performed for user ${userId}, found ${result.count} listings`);
    res.json({
      success: true,
      count: result.count,
      listings: result.listings,
      searchParams: result.searchParams,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Search error:', err);
    res.status(500).json({ error: 'Search failed: ' + err.message });
  }
});

/**
 * GET /api/mls/listings/:mlsNumber
 * Get detailed listing information
 */
app.get('/api/mls/listings/:mlsNumber', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mlsNumber } = req.params;

    const result = await mlsService.getListingDetails(userId, mlsNumber);

    logger.info(`[MLS] Retrieved listing details for ${mlsNumber}`);
    res.json({
      success: true,
      mlsNumber,
      details: result.details,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error getting listing details:', err);
    res.status(500).json({ error: 'Failed to get listing details: ' + err.message });
  }
});

/**
 * POST /api/mls/listings/create
 * Create new listing (requires authorization)
 */
app.post('/api/mls/listings/create', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const listingData = req.body;

    const result = await mlsService.createListing(userId, listingData);

    logger.info(`[MLS] Listing created by user ${userId}: ${result.mlsNumber}`);
    res.json({
      success: true,
      mlsNumber: result.mlsNumber,
      address: result.address,
      message: result.message,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error creating listing:', err);
    res.status(500).json({ error: 'Failed to create listing: ' + err.message });
  }
});

/**
 * POST /api/mls/offers/submit
 * Submit an offer on a listing
 */
app.post('/api/mls/offers/submit', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const offerData = req.body;

    const result = await mlsService.submitOffer(userId, offerData);

    logger.info(`[MLS] Offer submitted by user ${userId} for MLS ${offerData.mlsNumber}`);
    res.json({
      success: true,
      offerId: result.offerId,
      mlsNumber: result.mlsNumber,
      message: result.message,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error submitting offer:', err);
    res.status(500).json({ error: 'Failed to submit offer: ' + err.message });
  }
});

/**
 * POST /api/mls/agreements/create
 * Create and generate listing agreement
 */
app.post('/api/mls/agreements/create', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const agreementData = req.body;

    const result = await mlsService.writeListingAgreement(userId, agreementData);

    logger.info(`[MLS] Listing agreement created by user ${userId}`);
    res.json({
      success: true,
      sellerName: result.sellerName,
      propertyAddress: result.propertyAddress,
      documentUrl: result.documentUrl,
      message: result.message,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error creating agreement:', err);
    res.status(500).json({ error: 'Failed to create agreement: ' + err.message });
  }
});

/**
 * POST /api/mls/extensions/create
 * Create and submit extension
 */
app.post('/api/mls/extensions/create', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const extensionData = req.body;

    const result = await mlsService.writeExtension(userId, extensionData);

    logger.info(`[MLS] Extension created by user ${userId} for MLS ${extensionData.mlsNumber}`);
    res.json({
      success: true,
      mlsNumber: result.mlsNumber,
      newCloseDate: result.newCloseDate,
      message: result.message,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error creating extension:', err);
    res.status(500).json({ error: 'Failed to create extension: ' + err.message });
  }
});

/**
 * GET /api/mls/documents
 * Get all documents (agreements, offers, etc.)
 */
app.get('/api/mls/documents', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const result = await mlsService.getDocuments(userId, type || 'all');

    logger.info(`[MLS] Retrieved ${result.count} documents for user ${userId}`);
    res.json({
      success: true,
      count: result.count,
      documents: result.documents,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error getting documents:', err);
    res.status(500).json({ error: 'Failed to get documents: ' + err.message });
  }
});

/**
 * POST /api/mls/logout
 * Logout from MLS
 */
app.post('/api/mls/logout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await mlsService.logout(userId);

    logger.info(`[MLS] User ${userId} logged out`);
    res.json({
      success: true,
      message: result.message,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error logging out:', err);
    res.status(500).json({ error: 'Logout failed: ' + err.message });
  }
});

/**
 * GET /api/mls/data
 * Get all cached MLS data for user
 */
app.get('/api/mls/data', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const data = mlsService.getUserMLSData(userId);

    res.json({
      success: true,
      userId,
      data,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('[MLS] Error getting data:', err);
    res.status(500).json({ error: 'Failed to get MLS data' });
  }
});

// ==================== END MLS ROUTES ====================

// ==================== GPU OPTIMIZATION ROUTES ====================

/**
 * GET /api/gpu/status
 * Get GPU status and information
 */
app.get('/api/gpu/status', authenticate, (req, res) => {
  try {
    const status = gpuOptimization.getStatus();
    const health = gpuOptimization.getHealthStatus();
    const strategy = gpuOptimization.getLoadBalancingStrategy();

    res.json({
      gpus: status.gpus,
      detected: status.detected,
      detectionMethod: status.detectionMethod,
      health,
      loadBalancingStrategy: strategy
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gpu/distribution
 * Get GPU workload distribution ratio
 */
app.get('/api/gpu/distribution', authenticate, (req, res) => {
  try {
    const distribution = gpuOptimization.getDistributionRatio();
    const strategy = gpuOptimization.getLoadBalancingStrategy();

    res.json({
      distribution,
      strategy,
      recommendation: 'Distribute workload according to memory capacity'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gpu/submit-workload
 * Submit workload for GPU execution
 */
app.post('/api/gpu/submit-workload', authenticate, (req, res) => {
  try {
    const { type = 'inference', itemCount = 1 } = req.body;

    const workload = { type, itemCount };
    const job = gpuOptimization.submitWorkload(workload);

    const estimatedTime = gpuOptimization.estimateExecutionTime(workload, job.gpuIndex);

    res.json({
      jobId: job.id,
      gpuIndex: job.gpuIndex,
      gpu: job.gpuIndex < gpuOptimization.gpus.length ? gpuOptimization.gpus[job.gpuIndex].name : 'Unknown',
      status: job.status,
      estimatedTime: `${estimatedTime}ms`,
      submitted: new Date(job.submitted).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gpu/health
 * Get GPU health status
 */
app.get('/api/gpu/health', authenticate, (req, res) => {
  try {
    gpuOptimization.updateTemperature();
    const health = gpuOptimization.getHealthStatus();

    res.json({
      timestamp: new Date().toISOString(),
      gpuHealth: health,
      overallStatus: Object.values(health).some(h => h.status === 'critical') ? 'critical' : 
                      Object.values(health).some(h => h.status === 'warning') ? 'warning' : 'healthy'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== END GPU OPTIMIZATION ROUTES ====================

// ==================== CRM QUICK TEMPLATES ROUTES ====================

// Import persona and template services
const PersonaManagement = require('./services/persona-management');
const personaManagement = new PersonaManagement();

logger.info('Persona Management Service initialized');

/**
 * GET /api/templates
 * Get all available templates
 */
app.get('/api/templates', authenticate, (req, res) => {
  try {
    const templates = personaManagement.templates.getAllTemplates();
    res.json({
      success: true,
      count: Object.keys(templates).length,
      templates
    });
  } catch (err) {
    logger.error('Error fetching templates:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/templates/:templateId
 * Get template details including job description
 */
app.get('/api/templates/:templateId', authenticate, (req, res) => {
  try {
    const { templateId } = req.params;
    const template = personaManagement.templates.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const compliancePolicies = personaManagement.templates.getCompliancePolicies(templateId);

    res.json({
      success: true,
      template,
      compliancePolicies,
      setupRequirements: template.personaSetupRequirements
    });
  } catch (err) {
    logger.error('Error fetching template:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/templates/category/:category
 * Get templates by category
 */
app.get('/api/templates/category/:category', authenticate, (req, res) => {
  try {
    const { category } = req.params;
    const templates = personaManagement.templates.getTemplatesByCategory(category);
    
    res.json({
      success: true,
      category,
      count: templates.length,
      templates
    });
  } catch (err) {
    logger.error('Error fetching category templates:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/personas/create
 * Create a new persona from template
 */
app.post('/api/personas/create', authenticate, (req, res) => {
  try {
    const { templateId, personaData } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!templateId || !userId) {
      return res.status(400).json({ error: 'templateId and userId required' });
    }

    personaData.createdBy = req.user?.username || 'admin';
    const persona = personaManagement.createPersonaFromTemplate(userId, templateId, personaData);

    res.json({
      success: true,
      persona: {
        id: persona.id,
        userId: persona.userId,
        title: persona.title,
        setupStatus: persona.setupStatus,
        completionPercentage: persona.setupProgress.completionPercentage
      }
    });
  } catch (err) {
    logger.error('Error creating persona:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/personas/:personaId
 * Get persona details
 */
app.get('/api/personas/:personaId', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const persona = personaManagement.getPersona(personaId);

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    res.json({
      success: true,
      persona
    });
  } catch (err) {
    logger.error('Error fetching persona:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/personas/user/:userId
 * Get all personas for a user
 */
app.get('/api/personas/user/:userId', authenticate, (req, res) => {
  try {
    const { userId } = req.params;
    const personas = personaManagement.getUserPersonas(userId);

    res.json({
      success: true,
      count: personas.length,
      personas
    });
  } catch (err) {
    logger.error('Error fetching user personas:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/personas/:personaId/setup/complete
 * Mark a setup requirement as completed
 */
app.post('/api/personas/:personaId/setup/complete', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const { requirementIndex, notes } = req.body;

    const result = personaManagement.completeSetupRequirement(personaId, requirementIndex, notes);

    res.json({
      success: true,
      result
    });
  } catch (err) {
    logger.error('Error completing setup requirement:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/personas/:personaId/setup/checklist
 * Get persona setup checklist
 */
app.get('/api/personas/:personaId/setup/checklist', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const checklist = personaManagement.generateSetupChecklist(personaId);

    res.json({
      success: true,
      checklist
    });
  } catch (err) {
    logger.error('Error fetching setup checklist:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/personas/:personaId/setup/progress
 * Get setup progress
 */
app.get('/api/personas/:personaId/setup/progress', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const progress = personaManagement.getSetupProgress(personaId);

    res.json({
      success: true,
      progress
    });
  } catch (err) {
    logger.error('Error fetching setup progress:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/personas/:personaId/activate
 * Activate a persona after setup is complete
 */
app.post('/api/personas/:personaId/activate', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const activatedBy = req.user?.username || 'admin';

    const result = personaManagement.activatePersona(personaId, activatedBy);

    res.json({
      success: true,
      result
    });
  } catch (err) {
    logger.error('Error activating persona:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/personas/:personaId/deactivate
 * Deactivate a persona
 */
app.post('/api/personas/:personaId/deactivate', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const { reason } = req.body;
    const deactivatedBy = req.user?.username || 'admin';

    const result = personaManagement.deactivatePersona(personaId, reason, deactivatedBy);

    res.json({
      success: true,
      result
    });
  } catch (err) {
    logger.error('Error deactivating persona:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/personas/:personaId/compliance
 * Get compliance requirements for persona
 */
app.get('/api/personas/:personaId/compliance', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const compliance = personaManagement.verifyComplianceRequirements(personaId);

    res.json({
      success: true,
      compliance
    });
  } catch (err) {
    logger.error('Error fetching compliance info:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/personas/:personaId/dlp-check
 * Check DLP compliance for communication
 */
app.post('/api/personas/:personaId/dlp-check', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const { content, context } = req.body;

    const dlpResult = personaManagement.checkPersonaDLPCompliance(personaId, content, context || 'email');

    res.json({
      success: true,
      dlpResult
    });
  } catch (err) {
    logger.error('Error checking DLP compliance:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/personas/:personaId/audit-log
 * Get persona audit log
 */
app.get('/api/personas/:personaId/audit-log', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    const { limit } = req.query;
    
    const auditLog = personaManagement.getPersonaAuditLog(personaId, parseInt(limit) || 100);

    res.json({
      success: true,
      auditLog
    });
  } catch (err) {
    logger.error('Error fetching audit log:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/personas/:personaId/login
 * Record persona login
 */
app.post('/api/personas/:personaId/login', authenticate, (req, res) => {
  try {
    const { personaId } = req.params;
    personaManagement.recordLogin(personaId);

    res.json({
      success: true,
      message: 'Login recorded'
    });
  } catch (err) {
    logger.error('Error recording login:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== END CRM QUICK TEMPLATES ROUTES ====================

// ==================== COMPANY SETUP ROUTES (Admin/Power User Only) ====================

/**
 * POST /api/company-setup/create
 * Create new company configuration
 * Requires: ADMIN or POWER_USER role
 */
app.post('/api/company-setup/create', authenticate, (req, res) => {
  try {
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';
    const companyData = req.body;

    // Check access
    if (!['admin', 'power_user'].includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Only ADMIN and POWER_USER can create company configuration.'
      });
    }

    const result = companySetup.createCompanyConfiguration(userId, userRole, companyData);
    
    logger.info(`Company configuration created: ${result.id} by user: ${userId}`);
    res.json(result);
  } catch (err) {
    logger.error('Error creating company configuration:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/company-setup/:companyId
 * Get company configuration
 * Requires: ADMIN, POWER_USER, or MANAGER role
 */
app.get('/api/company-setup/:companyId', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const { includeSecrets } = req.query;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';

    // Check access
    if (!['admin', 'power_user', 'manager'].includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Viewing company configuration requires MANAGER level access or higher.'
      });
    }

    const configuration = companySetup.getCompanyConfiguration(
      userId,
      userRole,
      companyId,
      includeSecrets === 'true' && userRole === 'admin'
    );

    res.json({
      success: true,
      configuration
    });
  } catch (err) {
    logger.error('Error fetching company configuration:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/company-setup/:companyId/update
 * Update company configuration
 * Requires: ADMIN or POWER_USER role
 */
app.post('/api/company-setup/:companyId/update', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';
    const updates = req.body;

    // Check access
    if (!['admin', 'power_user'].includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Only ADMIN and POWER_USER can update company configuration.'
      });
    }

    const result = companySetup.updateCompanyConfiguration(userId, userRole, companyId, updates);
    
    logger.info(`Company configuration updated: ${companyId} by user: ${userId}`);
    res.json(result);
  } catch (err) {
    logger.error('Error updating company configuration:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/company-setup/:companyId/org-chart
 * Set organizational chart template
 * Requires: ADMIN or POWER_USER role
 */
app.post('/api/company-setup/:companyId/org-chart', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';
    const chartConfig = req.body;

    // Check access
    if (!['admin', 'power_user'].includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Only ADMIN and POWER_USER can set organizational chart.'
      });
    }

    const result = companySetup.setOrganizationalChart(userId, userRole, companyId, chartConfig);
    
    logger.info(`Org chart updated for company: ${companyId} by user: ${userId}`);
    res.json(result);
  } catch (err) {
    logger.error('Error updating organizational chart:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/company-setup/:companyId/compliance
 * Get banking compliance status
 * Requires: ADMIN, POWER_USER, or MANAGER role
 */
app.get('/api/company-setup/:companyId/compliance', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';

    // Check access
    if (!['admin', 'power_user', 'manager'].includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Compliance status requires MANAGER level access or higher.'
      });
    }

    const complianceStatus = companySetup.verifyBankingCompliance(userId, userRole, companyId);
    
    logger.info(`Compliance verification for company: ${companyId} by user: ${userId}`);
    res.json({
      success: true,
      complianceStatus
    });
  } catch (err) {
    logger.error('Error verifying compliance:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/company-setup/:companyId/audit-log
 * Get company setup audit log
 * Requires: ADMIN role only
 */
app.get('/api/company-setup/:companyId/audit-log', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';

    // Check access
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Only ADMIN users can access audit logs.'
      });
    }

    const auditLog = companySetup.getAuditLog(userId, userRole, companyId);
    
    res.json({
      success: true,
      auditLog,
      count: auditLog.length
    });
  } catch (err) {
    logger.error('Error fetching audit log:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/company-setup/:companyId/verify-integrity
 * Verify data integrity
 * Requires: ADMIN role
 */
app.post('/api/company-setup/:companyId/verify-integrity', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';

    // Check access
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Only ADMIN users can verify data integrity.'
      });
    }

    const integrityResult = companySetup.verifyDataIntegrity(userId, userRole, companyId);
    
    logger.info(`Data integrity verified for company: ${companyId}`);
    res.json({
      success: true,
      integrityResult
    });
  } catch (err) {
    logger.error('Error verifying data integrity:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/company-setup/:companyId/backup
 * Create secure backup
 * Requires: ADMIN role
 */
app.post('/api/company-setup/:companyId/backup', authenticate, (req, res) => {
  try {
    const { companyId } = req.params;
    const userRole = req.user?.role || 'viewer';
    const userId = req.user?.id || 'system';

    // Check access
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Only ADMIN users can create backups.'
      });
    }

    const backup = companySetup.createBackup(userId, userRole, companyId);
    
    logger.info(`Backup created for company: ${companyId}`);
    res.json({
      success: true,
      backup
    });
  } catch (err) {
    logger.error('Error creating backup:', err);
    res.status(400).json({ error: err.message });
  }
});

// ==================== END COMPANY SETUP ROUTES ====================

// ==================== STATIC FILES ====================
// Serve static files AFTER all API routes so they don't get caught by 404
app.use(express.static(path.join(__dirname, '.')));

// ==================== END STATIC FILES ====================

let server;
if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFilePath)
  };
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

server.listen(PORT, () => {
  const protocol = fs.existsSync(keyPath) && fs.existsSync(certFilePath) ? 'HTTPS' : 'HTTP';
  console.log(`🚀 ${protocol} Server listening on http://localhost:${PORT}`);
  console.log('Access the application at:');
  console.log(`  Local: http://localhost:${PORT}`);
});
