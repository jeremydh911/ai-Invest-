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
const pageRoutes = require('./routes/page-routes');
const crmRoutes = require('./routes/crm-routes');
const billingRoutes = require('./routes/billing-routes');
const systemRoutes = require('./routes/system-routes');
const dataRoutes = require('./routes/data-routes');
const personaRoutes = require('./routes/persona-routes');
const companyRoutes = require('./routes/company-routes');
const mlsRoutes = require('./routes/mls-routes');

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

// Auth middleware (Keep for backwards compatibility in this file, but logic moved to routes/auth-middleware.js)
const authenticate = require('./routes/auth-middleware');

// API routes will be registered before static files to prevent 404 catch-all
app.use('/', pageRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payment', billingRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/settings', systemRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/rag', dataRoutes);
app.use('/api/canvas', dataRoutes);
app.use('/api/ollama', systemRoutes);
app.use('/api', personaRoutes);
app.use('/api/company-setup', companyRoutes);
app.use('/api/mls', mlsRoutes);

// File management routes
app.use('/', fileRoutes);

// ============ CORE API ROUTES ============
// (Logic moved to modular route files in ./routes/)

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, '.')));

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
