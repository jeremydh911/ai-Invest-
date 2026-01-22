# AgenticEmpire Complete API Reference

## Overview
Complete API endpoint reference for all AgenticEmpire services including CRM, Banking, Voice Synthesis, and GPU Optimization.

---

## Authentication

### Token Format
```
Authorization: Bearer <JWT_TOKEN>
```

### Obtain Token
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
```

### Token Properties
- **Algorithm**: HS256
- **Expiry**: 1 hour
- **Issuer**: agentic-empire
- **Audience**: api

---

## Voice Synthesis API

### 1. Synthesize Speech
```http
POST /api/tts/synthesize
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "text": "Hello, how can I help you today?",
  "voice": "nova",
  "speed": 1.0,
  "returnFile": false
}
```

**Response (200):**
```json
{
  "success": true,
  "audio": "<base64-encoded-mp3>",
  "format": "mp3",
  "provider": "openai",
  "voice": "nova"
}
```

**Available Voices:**
- OpenAI: nova, echo, onyx, fable, shimmer, alloy
- Google: en-US-Standard-A/C/D/E, Neural2-A/C/D/E
- ElevenLabs: shivers, benjamin, charlotte, josh
- Browser: default

**Error Responses:**
```json
{
  "error": "Text cannot be empty"  // 400
}
```

---

### 2. Get Available Voices
```http
GET /api/tts/voices
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "available": {
    "openai": ["nova", "echo", "onyx", "fable", "shimmer", "alloy"],
    "google": ["en-US-Standard-A", "en-US-Neural2-A"],
    "elevenlabs": ["shivers", "benjamin"],
    "browser": ["default"]
  },
  "providers": ["openai", "elevenlabs"],
  "defaultVoice": "nova"
}
```

---

### 3. Get TTS Status
```http
GET /api/tts/status
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "openai": true,
  "google": false,
  "elevenlabs": true,
  "browser": true,
  "availableProviders": ["openai", "elevenlabs", "browser"]
}
```

---

## GPU Optimization API

### 1. Get GPU Status
```http
GET /api/gpu/status
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "gpus": [
    {
      "index": 0,
      "name": "NVIDIA GeForce RTX 3080",
      "type": "NVIDIA",
      "memory": 10240,
      "available": true,
      "currentLoad": 0,
      "temperature": 45,
      "queueLength": 0,
      "memoryUsageRatio": 0.0
    }
  ],
  "detected": 1,
  "detectionMethod": "NVIDIA CUDA",
  "health": {
    "0": {
      "name": "NVIDIA GeForce RTX 3080",
      "status": "healthy",
      "issues": [],
      "recommendation": null
    }
  },
  "loadBalancingStrategy": {
    "0": {
      "gpu": "NVIDIA GeForce RTX 3080",
      "memory": "10240MB",
      "jobDistribution": "100%",
      "weights": "1.00"
    }
  }
}
```

---

### 2. Get Workload Distribution
```http
GET /api/gpu/distribution
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "distribution": {
    "0": 0.6,
    "1": 0.4
  },
  "strategy": {
    "0": {
      "gpu": "NVIDIA GPU 0 (6GB)",
      "memory": "6144MB",
      "jobDistribution": "60%",
      "weights": "0.60"
    },
    "1": {
      "gpu": "NVIDIA GPU 1 (4GB)",
      "memory": "4096MB",
      "jobDistribution": "40%",
      "weights": "0.40"
    }
  },
  "recommendation": "Distribute workload according to memory capacity"
}
```

---

### 3. Submit Workload
```http
POST /api/gpu/submit-workload
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "type": "inference",
  "itemCount": 10
}
```

**Workload Types:**
- `inference` - Model inference (50ms per item)
- `training` - Model training (500ms per item)
- `synthesis` - Text-to-speech (100ms)
- `embedding` - Text embedding (10ms per token)
- `analysis` - Data analysis (150ms)

**Response (200):**
```json
{
  "jobId": "0_1702345678901_a1b2c3d4",
  "gpuIndex": 0,
  "gpu": "NVIDIA GeForce RTX 3080",
  "status": "queued",
  "estimatedTime": "500ms",
  "submitted": "2024-12-12T10:30:00Z"
}
```

---

### 4. Get GPU Health
```http
GET /api/gpu/health
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "timestamp": "2024-12-12T10:35:00Z",
  "gpuHealth": {
    "0": {
      "name": "NVIDIA GeForce RTX 3080",
      "status": "healthy",
      "issues": [],
      "recommendation": null
    }
  },
  "overallStatus": "healthy"
}
```

**Status Values:**
- `healthy` - All systems normal
- `warning` - High temperature or memory, large queue
- `critical` - Critical temperature or memory issues

---

## CRM Integration API

### 1. Get Cached CRM Data
```http
GET /api/crm/integrations/cached-data
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "brivity": {
      "contacts": 150,
      "deals": 25,
      "lastSync": "2024-12-12T10:00:00Z",
      "cached": true
    }
  },
  "timestamp": "2024-12-12T10:30:00Z"
}
```

---

### 2. Search Contacts
```http
GET /api/crm/integrations/search?q=john&type=contact
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "source": "brivity"
    }
  ],
  "count": 1
}
```

---

### 3. Get Sync Status
```http
GET /api/crm/integrations/sync-status
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "integrations": {
    "brivity": {
      "connected": true,
      "lastSync": "2024-12-12T10:00:00Z",
      "status": "active",
      "contacts": 150,
      "deals": 25
    },
    "topproducer": {
      "connected": false,
      "status": "disconnected",
      "reason": "Missing API key"
    }
  }
}
```

---

## Banking & Trading API

### 1. Connect Banking Account
```http
POST /api/banking/connect
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "platform": "interactive-brokers",
  "accountId": "U123456",
  "apiKey": "<encrypted-api-key>",
  "apiSecret": "<encrypted-api-secret>"
}
```

**Supported Platforms:**
- interactive-brokers
- td-ameritrade
- charles-schwab
- firstrade

**Response (200):**
```json
{
  "success": true,
  "platform": "interactive-brokers",
  "accountId": "U123456",
  "status": "connected",
  "lastVerified": "2024-12-12T10:30:00Z"
}
```

---

### 2. Get Portfolio
```http
GET /api/banking/portfolio
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "portfolio": {
    "totalValue": 150000,
    "cashBalance": 25000,
    "positions": [
      {
        "symbol": "AAPL",
        "shares": 100,
        "avgPrice": 150,
        "currentPrice": 190,
        "value": 19000,
        "gainLoss": 4000,
        "gainLossPercent": 26.67
      }
    ],
    "totalGainLoss": 15000,
    "dailyChange": -250
  }
}
```

---

### 3. Analyze Trade
```http
POST /api/banking/trade/analyze
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "symbol": "AAPL",
  "action": "BUY",
  "quantity": 50
}
```

**Response (200):**
```json
{
  "success": true,
  "analysis": {
    "symbol": "AAPL",
    "action": "BUY",
    "quantity": 50,
    "indicators": {
      "RSI": 65,
      "MACD": "positive",
      "SMA_20": 185,
      "SMA_50": 175,
      "Bollinger": "middle"
    },
    "mlScore": 0.78,
    "recommendation": "BUY",
    "confidence": 78,
    "riskLevel": "moderate"
  },
  "timestamp": "2024-12-12T10:35:00Z"
}
```

---

### 4. Compliance Check
```http
GET /api/banking/compliance-check?symbol=AAPL&action=BUY&quantity=50
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "checks": {
    "SEC": "PASS",
    "FINRA": "PASS",
    "IRS": "PASS",
    "AccountLimit": "PASS"
  },
  "overallStatus": "APPROVED",
  "message": "Trade approved by all compliance checks"
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input parameters",
  "details": {
    "voice": "Invalid voice ID"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "No authorization token",
  "expiredAt": "2024-12-12T11:30:00Z"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "requiredRole": "admin",
  "userRole": "user"
}
```

### 429 Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## Rate Limiting

### Limits by Endpoint Type
| Type | Limit | Window |
|------|-------|--------|
| General API | 100 req | 15 min |
| Auth (login) | 5 req | 15 min |
| TTS | 30 req | 1 min |
| GPU | 20 req | 1 min |
| CRM | 50 req | 1 min |
| Banking | 25 req | 1 min |

### Headers Returned
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1702346400
```

---

## Webhook Support (Future)

```bash
# Subscribe to events
POST /api/webhooks/subscribe
{
  "event": "trade-executed",
  "url": "https://yourserver.com/webhook",
  "secret": "webhook-secret"
}

# Webhook payload
POST https://yourserver.com/webhook
X-Webhook-Signature: sha256=<signature>

{
  "event": "trade-executed",
  "timestamp": "2024-12-12T10:35:00Z",
  "data": {
    "tradeId": "T123456",
    "symbol": "AAPL",
    "quantity": 50,
    "price": 190
  }
}
```

---

## Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Synthesize speech
const tts = await client.post('/api/tts/synthesize', {
  text: 'Hello world',
  voice: 'nova'
});

// Get GPU status
const gpu = await client.get('/api/gpu/status');

// Submit workload
const job = await client.post('/api/gpu/submit-workload', {
  type: 'inference',
  itemCount: 10
});
```

### Python
```python
import requests
import json

headers = {
    'Authorization': f'Bearer {token}'
}

# Synthesize speech
response = requests.post(
    'http://localhost:3000/api/tts/synthesize',
    json={
        'text': 'Hello world',
        'voice': 'nova'
    },
    headers=headers
)
audio = response.json()['audio']

# Get GPU status
gpu_status = requests.get(
    'http://localhost:3000/api/gpu/status',
    headers=headers
).json()
```

### cURL
```bash
# Synthesize speech
curl -X POST http://localhost:3000/api/tts/synthesize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"nova"}'

# Get GPU status
curl -X GET http://localhost:3000/api/gpu/status \
  -H "Authorization: Bearer $TOKEN"

# Submit GPU workload
curl -X POST http://localhost:3000/api/gpu/submit-workload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"inference","itemCount":10}'
```

---

## API Versioning

Current Version: **v1**

Future versions will maintain backward compatibility via:
- Header: `API-Version: 1`
- URL: `/api/v2/...`
- Deprecation headers indicate timeline for changes

---

## Support

- **Documentation**: [PHASE_3_IMPLEMENTATION_SUMMARY.md](./PHASE_3_IMPLEMENTATION_SUMMARY.md)
- **Security Guide**: [ENTERPRISE_SECURITY_GUIDE.md](./ENTERPRISE_SECURITY_GUIDE.md)
- **Maintenance**: [MAINTENANCE_PLAN.md](./MAINTENANCE_PLAN.md)
- **Issues**: Check logs in `logs/` directory
- **Status**: Check `/api/gpu/status` and `/api/tts/status`

---

**Last Updated**: December 2024
**API Version**: 1.0
**Status**: Production Ready
