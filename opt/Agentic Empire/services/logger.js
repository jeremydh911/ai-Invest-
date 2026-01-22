/**
 * Logger Service - Agentic Empire
 * Comprehensive logging with audit trail support
 */

class Logger {
  constructor(serviceName = 'Agentic Empire') {
    this.serviceName = serviceName;
    this.logs = [];
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  audit(action, userId, details = {}) {
    this.log('AUDIT', action, { userId, ...details });
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      data
    };
    
    this.logs.push(entry);
    
    // Console output for development
    const prefix = `[${level}] [${this.serviceName}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, data);
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`, data);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

module.exports = Logger;
