// DLP (Data Loss Prevention) System
// Prevents sensitive client information from being exposed to LLMs

class DLPEngine {
  constructor() {
    this.rules = {
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      phone: /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,2}\s?\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
      apiKey: /(?:api[_-]?key|apikey|api[_-]?secret)[:\s='"]+([A-Za-z0-9_\-\.]+)/gi,
      dbCredentials: /(?:password|passwd|pwd|secret)[:\s='"]+([^"\s]+)/gi,
      privateKey: /-----BEGIN (RSA|DSA|EC|PGP|ENCRYPTED)[\s\S]+?-----END/gi,
      ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      customPatterns: []
    };
    
    this.settings = {
      action: 'redact',
      redactionText: '[REDACTED]',
      logging: true,
      notifyAdmin: false,
      adminEmail: ''
    };
    
    this.detectionLog = [];
  }
  
  // Add custom regex pattern for detection
  addCustomPattern(pattern, name) {
    try {
      const regex = new RegExp(pattern, 'g');
      this.rules.customPatterns.push({ name, regex });
    } catch (e) {
      console.error('Invalid regex pattern:', e);
    }
  }
  
  // Detect sensitive data in text
  detect(text) {
    if (!text) return [];
    
    const detections = [];
    
    // Check all built-in rules
    for (const [ruleName, regex] of Object.entries(this.rules)) {
      if (ruleName === 'customPatterns') continue;
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        detections.push({
          type: ruleName,
          value: match[0],
          position: match.index,
          severity: this.getSeverity(ruleName)
        });
      }
    }
    
    // Check custom patterns
    for (const pattern of this.rules.customPatterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        detections.push({
          type: pattern.name,
          value: match[0],
          position: match.index,
          severity: 'high'
        });
      }
    }
    
    return detections;
  }
  
  // Get severity level for detection type
  getSeverity(type) {
    const highSeverity = ['ssn', 'creditCard', 'privateKey', 'dbCredentials', 'apiKey'];
    return highSeverity.includes(type) ? 'high' : 'medium';
  }
  
  // Redact sensitive data
  redact(text) {
    let redacted = text;
    
    for (const [ruleName, regex] of Object.entries(this.rules)) {
      if (ruleName === 'customPatterns') continue;
      redacted = redacted.replace(regex, this.settings.redactionText);
    }
    
    // Redact custom patterns
    for (const pattern of this.rules.customPatterns) {
      redacted = redacted.replace(pattern.regex, this.settings.redactionText);
    }
    
    return redacted;
  }
  
  // Process text based on detection action
  process(text, userId) {
    const detections = this.detect(text);
    
    if (detections.length === 0) {
      return {
        safe: true,
        original: text,
        processed: text,
        detections: []
      };
    }
    
    // Log detection
    if (this.settings.logging) {
      this.logDetection(userId, detections, text);
    }
    
    // Handle based on action setting
    switch (this.settings.action) {
      case 'redact':
        return {
          safe: true,
          original: text,
          processed: this.redact(text),
          detections: detections,
          action: 'redacted'
        };
      case 'block':
        return {
          safe: false,
          original: text,
          processed: null,
          detections: detections,
          action: 'blocked',
          error: 'Sensitive data detected in input'
        };
      case 'warn':
        return {
          safe: true,
          original: text,
          processed: text,
          detections: detections,
          action: 'warned'
        };
      case 'log':
      default:
        return {
          safe: true,
          original: text,
          processed: text,
          detections: detections,
          action: 'logged'
        };
    }
  }
  
  logDetection(userId, detections, context) {
    const log = {
      timestamp: new Date().toISOString(),
      userId,
      detectionCount: detections.length,
      types: detections.map(d => d.type),
      severity: Math.max(...detections.map(d => d.severity === 'high' ? 2 : 1)),
      context: context.substring(0, 100) + '...'
    };
    
    this.detectionLog.push(log);
    
    // Keep only last 1000 logs
    if (this.detectionLog.length > 1000) {
      this.detectionLog.shift();
    }
  }
  
  // Update DLP settings
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }
  
  // Get detection log
  getLog(limit = 100) {
    return this.detectionLog.slice(-limit);
  }
  
  // Clear log
  clearLog() {
    this.detectionLog = [];
  }
}

module.exports = DLPEngine;
