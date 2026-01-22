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
  fs.mkdirSync(certPath, { recursive: true });
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

// Simple logger utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ''),
  debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`)
};

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(path.join(dataDir, 'app.db'));

// Import new services
// Note: We'll need to make sure these exist on disk too
const VoiceSynthesisService = require('./services/voice-synthesis');
const GPUOptimizationService = require('./services/gpu-optimization');
const CompanySetupService = require('./services/company-setup');
const ceoHiring = require('./services/ceo-hiring-engine');

// Import routes
const authRoutes = require('./routes/auth-routes');
const hiringRoutes = require('./routes/hiring-routes');

// Initialize services
const voiceSynthesis = new VoiceSynthesisService();
const gpuOptimization = new GPUOptimizationService();
const companySetup = new CompanySetupService();

logger.info(`GPU Optimization Service initialized`);
logger.info(`Voice Synthesis Service initialized`);
logger.info('CEO Hiring Engine initialized');

// Server Configuration
const PORT = process.env.PORT || 3000;

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hiring', hiringRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => {
  console.log(`🚀 Smoke Test Server listening on http://localhost:${PORT}`);
});
