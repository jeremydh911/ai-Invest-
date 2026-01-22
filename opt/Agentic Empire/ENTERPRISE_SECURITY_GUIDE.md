# Enterprise Security Implementation Guide

## Overview
This document outlines enterprise-level security measures for AgenticEmpire platform, focusing on free/open-source tools and best practices.

## 1. Security Headers Configuration

### Implemented Headers (via Helmet)

```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.openai.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
```

### Headers Explained

| Header | Purpose | Value |
|--------|---------|-------|
| `Strict-Transport-Security` | HTTPS only | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `X-Frame-Options` | Prevent clickjacking | `DENY` |
| `X-XSS-Protection` | XSS protection | `1; mode=block` |
| `Content-Security-Policy` | Control resource loading | Restrictive whitelist |
| `Referrer-Policy` | Control referrer info | `strict-origin-when-cross-origin` |

## 2. Input Validation & Sanitization

### Implementation

```javascript
const validator = require('express-validator');

// Validate and sanitize inputs
app.post('/api/login', [
  // Validate
  validator.body('username')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .trim()
    .escape(),
  
  validator.body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .trim(),

  validator.body('email')
    .isEmail().withMessage('Invalid email')
    .normalizeEmail()
    .toLowerCase()
], async (req, res) => {
  // Handle validation errors
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Proceed with sanitized inputs
  const { username, password, email } = req.body;
});

// SQL Injection Prevention: Use parameterized queries
db.run('SELECT * FROM users WHERE username = ? AND email = ?', [username, email], (err, row) => {
  // Safe from SQL injection
});

// NoSQL Injection Prevention: Use query builders/ORM
const query = { username: { $regex: username } }; // Still risky - use validators
```

### OWASP Top 10 Protections

```javascript
const protection = {
  'A01:2021 - Broken Access Control': {
    implementation: 'JWT validation on all routes',
    code: 'verifyToken middleware on protected endpoints'
  },
  'A02:2021 - Cryptographic Failures': {
    implementation: 'AES-256 encryption for sensitive data',
    code: 'crypto.createCipheriv with strong keys'
  },
  'A03:2021 - Injection': {
    implementation: 'Parameterized queries, input validation',
    code: 'db.run("SELECT * FROM users WHERE id = ?", [id])'
  },
  'A04:2021 - Insecure Design': {
    implementation: 'Threat modeling, secure defaults',
    code: 'HTTPS only, authentication required by default'
  },
  'A05:2021 - Security Misconfiguration': {
    implementation: 'Security headers, helmet.js',
    code: 'CSP, HSTS, X-Frame-Options headers'
  },
  'A06:2021 - Vulnerable Outdated Components': {
    implementation: 'npm audit, regular updates',
    code: 'Automated dependency scanning'
  },
  'A07:2021 - Identification Authentication Failures': {
    implementation: 'Strong JWT, bcrypt hashing',
    code: 'bcrypt with salt rounds, JWT expiration'
  },
  'A08:2021 - Software Data Integrity Failures': {
    implementation: 'Verify npm packages, GPG signatures',
    code: 'npm ci, lock file integrity'
  },
  'A09:2021 - Logging & Monitoring Failures': {
    implementation: 'Comprehensive audit logging',
    code: 'Log all auth attempts, errors, admin actions'
  },
  'A10:2021 - SSRF': {
    implementation: 'URL validation, internal network blocking',
    code: 'Validate URLs, block localhost/private IPs'
  }
};
```

## 3. Encryption Implementation

### Data at Rest

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || 
  crypto.randomBytes(32).toString('hex'), 'hex');

class EncryptionService {
  static encrypt(text, key = ENCRYPTION_KEY) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText, key = ENCRYPTION_KEY) {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hash(text, salt = 10) {
    return bcrypt.hashSync(text, salt);
  }

  static compareHash(text, hash) {
    return bcrypt.compareSync(text, hash);
  }
}

// Usage
const encryptedBankingCreds = EncryptionService.encrypt(bankingPassword);
const decryptedCreds = EncryptionService.decrypt(encryptedBankingCreds);
```

### Data in Transit

```javascript
// HTTPS enforced
const httpsOptions = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem'),
  // Modern TLS only
  minVersion: 'TLSv1.2'
};

https.createServer(httpsOptions, app).listen(3443, () => {
  console.log('HTTPS Server running on port 3443');
});

// Force HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(301, `https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

## 4. Authentication & Authorization

### JWT Security

```javascript
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRY = '1h';

const createToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256',
    issuer: 'agentic-empire',
    audience: 'api'
  });
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'agentic-empire',
      audience: 'api'
    });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', expiredAt: err.expiredAt });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Role-Based Access Control (RBAC)

```javascript
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.delete('/api/users/:id', verifyToken, checkRole(['admin']), (req, res) => {
  // Only admins can delete users
});

app.post('/api/banking/trade', verifyToken, checkRole(['user', 'trader']), (req, res) => {
  // Users and traders can trade
});
```

## 5. Rate Limiting & DDoS Protection

### Express Rate Limit

```javascript
const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

// API endpoint limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});

app.use(generalLimiter);
app.post('/api/login', authLimiter, ...);
app.get('/api/*', apiLimiter, ...);
```

## 6. Dependency Security Scanning

### Using npm audit

```bash
# Check for vulnerabilities
npm audit

# Generate detailed report
npm audit --json > audit-report.json

# Fix vulnerabilities automatically
npm audit fix

# Fix with breaking changes
npm audit fix --force

# Check for outdated packages
npm outdated
```

### Using Snyk (Free Tier)

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test project
snyk test

# Monitor continuously
snyk monitor

# Fix vulnerabilities
snyk fix
```

## 7. Secure Configuration

### Environment Variables Template

```ini
# .env.example (commit this, never .env)
NODE_ENV=production

# API Keys
OPENAI_API_KEY=your_key_here
JWT_SECRET=your_secret_here_generate_with_crypto
ENCRYPTION_KEY=your_encryption_key_here

# Database
DATABASE_URL=sqlite://./data/app.db

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# HTTPS
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem

# Monitoring
LOG_LEVEL=info
```

### Secure Defaults

```javascript
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Disable unnecessary headers
app.disable('x-powered-by');

// Set security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

// Set secure cookie options
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  }
}));
```

## 8. Audit Logging

### Comprehensive Logging

```javascript
const auditLog = (userId, action, resource, details = {}) => {
  const log = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    details,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };

  // Log to database
  db.run(
    'INSERT INTO audit_logs (timestamp, user_id, action, resource, details) VALUES (?, ?, ?, ?, ?)',
    [log.timestamp, userId, action, resource, JSON.stringify(details)]
  );

  // Log to file for critical events
  if (['delete', 'admin_action', 'failed_login', 'security_event'].includes(action)) {
    fs.appendFileSync('logs/security.log', JSON.stringify(log) + '\n');
  }

  // Log to console
  console.log(`[AUDIT] ${action} on ${resource} by user ${userId}`);
};

// Usage
app.post('/api/users/:id/delete', verifyToken, (req, res) => {
  auditLog(req.user.id, 'delete', `user_${req.params.id}`, { reason: 'user_request' });
});
```

## 9. Free Enterprise Security Tools

### Tool Recommendations

| Tool | Purpose | Free Option | Setup |
|------|---------|------------|-------|
| **Snyk** | Dependency scanning | Free tier with limits | `npm install -g snyk && snyk auth` |
| **npm audit** | Built-in security check | Yes, unlimited | `npm audit` |
| **OWASP ZAP** | Web app vulnerability scanning | Open source | Download from zaproxy.org |
| **Trivy** | Container/artifact scanning | Open source | `brew install aquasecurity/trivy/trivy` |
| **Git Secrets** | Prevent secret commits | Open source | `brew install git-secrets` |
| **Dependabot** | Auto dependency updates | GitHub free | Enable in repo settings |
| **SonarQube** | Code quality & security | Community edition | `docker run sonarqube` |
| **Vault** | Secret management | Open source | HashiCorp Vault |

### OWASP ZAP Implementation

```bash
#!/bin/bash
# Run OWASP ZAP security scan

docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r report.html \
  -J report.json
```

## 10. Security Checklist

### Pre-Production

- [ ] All inputs validated and sanitized
- [ ] HTTPS/TLS configured
- [ ] Security headers implemented
- [ ] Authentication & authorization tested
- [ ] Rate limiting configured
- [ ] Encryption at rest and transit implemented
- [ ] npm audit run, vulnerabilities fixed
- [ ] Secrets not in code or version control
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info
- [ ] Logging and monitoring enabled
- [ ] Database backups encrypted
- [ ] Load testing completed
- [ ] Security scan (Snyk/ZAP) passed

### Ongoing

- [ ] Weekly npm audit checks
- [ ] Monthly security updates
- [ ] Quarterly penetration testing
- [ ] Review audit logs monthly
- [ ] Monitor for suspicious activity
- [ ] Test backup restoration
- [ ] Update security policies

## 11. Incident Response

### Security Incident Response Plan

```javascript
const handleSecurityIncident = (type, severity, details) => {
  const incident = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type, // 'breach', 'intrusion', 'malware', 'unauthorized_access'
    severity, // 'low', 'medium', 'high', 'critical'
    details
  };

  // Log incident
  fs.appendFileSync('logs/incidents.log', JSON.stringify(incident) + '\n');

  // Alert administrators
  if (['high', 'critical'].includes(severity)) {
    sendSecurityAlert(incident);
  }

  // Take action based on severity
  switch (severity) {
    case 'critical':
      // 1. Isolate affected systems
      // 2. Preserve evidence
      // 3. Notify stakeholders
      // 4. Activate incident response team
      break;
    case 'high':
      // 1. Start investigation
      // 2. Monitor situation
      // 3. Prepare mitigation
      break;
  }

  return incident;
};
```

---

**Last Updated**: 2024
**Status**: Production Ready
**Review Frequency**: Quarterly
