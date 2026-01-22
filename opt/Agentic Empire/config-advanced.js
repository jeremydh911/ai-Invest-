/**
 * AgenticEmpire Advanced Configuration
 * Comprehensive settings for Auto-Approval, DLP, LLM Management, Agent Autonomy, Fine-Tuning
 */

const config = {
  // ============ AUTO-APPROVAL SETTINGS ============
  autoApproval: {
    enabled: true,
    defaults: {
      chat: true,           // Auto-send messages
      voice: true,          // Auto-process voice input
      tts: true,            // Auto-play text-to-speech
      tools: true,          // Auto-execute tools
      websearch: false,     // Require approval for web search
      fileops: false,       // Require approval for file operations
      timeout: 30           // Seconds before auto-approval happens
    },
    approvalMatrix: {
      messageSend: { enabled: true, timeout: 0 },      // Immediate
      voiceProcess: { enabled: true, timeout: 0 },     // Immediate
      toolExecution: { enabled: true, timeout: 30 },   // 30s timeout
      fileOperation: { enabled: false, timeout: 0 },   // Manual
      apiCall: { enabled: true, timeout: 15 }          // 15s timeout
    }
  },

  // ============ DATA LOSS PREVENTION (DLP) ============
  dlp: {
    enabled: true,
    action: 'redact',  // 'redact', 'block', 'warn', or 'log'
    redactionText: '[REDACTED]',
    logging: true,
    notifyAdmin: false,
    adminEmail: 'admin@example.com',
    
    detectionRules: {
      // Personal Information
      ssn: {
        enabled: true,
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        severity: 'high',
        description: 'Social Security Numbers'
      },
      phone: {
        enabled: true,
        pattern: /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,2}\s?\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
        severity: 'high',
        description: 'Phone Numbers'
      },
      email: {
        enabled: true,
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        severity: 'medium',
        description: 'Email Addresses'
      },
      creditCard: {
        enabled: true,
        pattern: /\b(?:\d[ -]*?){13,16}\b/g,
        severity: 'critical',
        description: 'Credit Card Numbers'
      },
      
      // Business Information
      apiKey: {
        enabled: true,
        pattern: /(?:api[_-]?key|apikey|api[_-]?secret)[:\s='"]+([A-Za-z0-9_\-\.]+)/gi,
        severity: 'critical',
        description: 'API Keys & Secrets'
      },
      dbCredentials: {
        enabled: true,
        pattern: /(?:password|passwd|pwd|secret)[:\s='"]+([^"\s]+)/gi,
        severity: 'critical',
        description: 'Database Credentials'
      },
      privateKey: {
        enabled: true,
        pattern: /-----BEGIN (RSA|DSA|EC|PGP|ENCRYPTED)[\s\S]+?-----END/gi,
        severity: 'critical',
        description: 'Private Keys'
      },
      ipAddress: {
        enabled: true,
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        severity: 'medium',
        description: 'IP Addresses'
      }
    },
    
    // DLP enforcement strategy
    containment: {
      // All processing happens locally
      local_processing_only: true,
      
      // Never send sensitive data to external APIs
      external_api_filtering: true,
      
      // Scan all inputs before processing
      input_scanning: true,
      
      // Scan all outputs before display
      output_scanning: true,
      
      // Encrypt sensitive data at rest
      encryption_at_rest: true,
      
      // Complete audit trail
      audit_logging: true
    }
  },

  // ============ LLM MANAGEMENT ============
  llm: {
    default: 'gpt-3.5-turbo',
    
    cloudModels: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        context: 8192,
        costPer1kTokens: 0.03,
        description: 'Most capable model'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        context: 4096,
        costPer1kTokens: 0.0015,
        description: 'Fast and cost-effective'
      }
    ],
    
    localModels: [
      {
        id: 'ollama-llama3',
        name: 'Llama 3 8B',
        provider: 'Ollama',
        type: 'local',
        context: 8192,
        params: 8000000000,
        description: 'State-of-the-art local model'
      },
      {
        id: 'ollama-mistral',
        name: 'Mistral 7B',
        provider: 'Ollama',
        type: 'local',
        context: 4096,
        params: 7000000000,
        description: 'Fast and efficient'
      },
      {
        id: 'ollama-neural-chat',
        name: 'Neural Chat 7B',
        provider: 'Ollama',
        type: 'local',
        context: 4096,
        params: 7000000000,
        description: 'Optimized for chat'
      }
    ],
    
    ollama: {
      enabled: true,
      url: 'http://localhost:11434',
      autoDetect: true,
      connectionTimeout: 5000
    }
  },

  // ============ AGENT AUTONOMY ============
  agents: {
    autonomyEnabled: true,
    defaultSchedule: {
      'Monday': { start: '09:00', end: '17:00', enabled: true },
      'Tuesday': { start: '09:00', end: '17:00', enabled: true },
      'Wednesday': { start: '09:00', end: '17:00', enabled: true },
      'Thursday': { start: '09:00', end: '17:00', enabled: true },
      'Friday': { start: '09:00', end: '17:00', enabled: true },
      'Saturday': { start: '09:00', end: '12:00', enabled: false },
      'Sunday': { start: '09:00', end: '17:00', enabled: false }
    },
    
    autonomyConfig: {
      selfDirectionInterval: 30,  // Seconds - how often agents ask "What should I do next?"
      proactiveThreshold: 0.6,    // 0-1 confidence for autonomous actions (0.6 = 60% confidence needed)
      ragMemoryEnabled: true,      // Agents use their RAG-learned knowledge
      maxTaskQueue: 100,           // Maximum tasks to queue
      taskTimeout: 3600            // 1 hour task timeout
    },
    
    // Core agent definitions
    agents: [
      {
        id: 1,
        name: 'Executive Agent',
        role: 'CEO',
        description: 'Strategic planning and decision making',
        skills: ['Leadership', 'Strategic Planning', 'Decision Making'],
        autonom: true
      },
      {
        id: 2,
        name: 'Technical Agent',
        role: 'CTO',
        description: 'Technical implementation and architecture',
        skills: ['Coding', 'Architecture', 'System Design'],
        autonomy: true
      },
      {
        id: 3,
        name: 'Financial Agent',
        role: 'CFO',
        description: 'Financial planning and reporting',
        skills: ['Analysis', 'Finance', 'Reporting'],
        autonomy: true
      }
    ],
    
    // Agent capabilities and actions
    actions: [
      'analyze_documents',    // Read and analyze from RAG
      'learn_from_rag',       // Extract learnings from memory
      'process_tasks',        // Handle task queue
      'report_findings',      // Generate reports
      'suggest_improvements', // Proactive suggestions
      'monitor_health'        // System monitoring
    ]
  },

  // ============ FINE-TUNING SETUP ============
  fineTuning: {
    enabled: true,
    
    frameworks: {
      transformers: {
        name: 'Hugging Face Transformers',
        icon: '🤗',
        description: 'Standard fine-tuning. Full-parameter. GPU required.',
        recommended: false,
        installation: 'pip install transformers torch'
      },
      axolotl: {
        name: 'Axolotl',
        icon: '⚙️',
        description: 'Advanced framework. Production-ready. LoRA/QLoRA support.',
        recommended: true,
        installation: 'git clone https://github.com/OpenAccess-AI-Collective/axolotl && cd axolotl && pip install -e .'
      },
      lora: {
        name: 'LoRA (Low-Rank Adaptation)',
        icon: '🔄',
        description: 'Adapter-based. 10x memory reduction. Consumer GPU friendly.',
        recommended: true,
        installation: 'pip install peft'
      },
      qlora: {
        name: 'QLoRA (Quantized LoRA)',
        icon: '⚡',
        description: '4-bit quantization. 75% memory reduction. Recommended!',
        recommended: true,
        installation: 'pip install peft bitsandbytes'
      },
      modal: {
        name: 'Modal Labs',
        icon: '💻',
        description: 'Serverless cloud training. Distributed. Pay-per-use.',
        recommended: false,
        installation: 'pip install modal'
      }
    },
    
    baseModels: [
      { id: 'llama-3-8b', name: 'Llama 3 8B', params: 8000000000 },
      { id: 'llama-3-70b', name: 'Llama 3 70B', params: 70000000000 },
      { id: 'mistral-7b', name: 'Mistral 7B', params: 7000000000 },
      { id: 'neural-chat-7b', name: 'Neural Chat 7B', params: 7000000000 },
      { id: 'openchat-3.5', name: 'OpenChat 3.5 7B', params: 7000000000 },
      { id: 'zephyr-7b', name: 'Zephyr 7B', params: 7000000000 }
    ],
    
    defaultConfig: {
      learningRate: 0.0002,
      batchSize: 8,
      epochs: 3,
      validationSplit: 0.1,
      maxLength: 512,
      loraRank: 8,
      loraAlpha: 16,
      warmupSteps: 100,
      weightDecay: 0.01
    },
    
    // Required tools from Hugging Face ecosystem
    requiredTools: [
      { name: 'Transformers', command: 'pip install transformers', description: 'HF model library' },
      { name: 'PEFT', command: 'pip install peft', description: 'LoRA/Adapter library' },
      { name: 'BitsAndBytes', command: 'pip install bitsandbytes', description: '4-bit quantization' },
      { name: 'TRL', command: 'pip install trl', description: 'Training library' },
      { name: 'HF Hub', command: 'pip install huggingface-hub', description: 'Hub integration' }
    ]
  },

  // ============ CHAT SETTINGS ============
  chat: {
    maxMessageLength: 4000,
    contextWindow: 20,
    persistHistory: true,
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 2000
  },

  // ============ SYSTEM CONFIGURATION ============
  system: {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    https: process.env.HTTPS_ENABLED !== 'false',
    
    database: {
      type: 'sqlite3',
      path: './data/app.db'
    },
    
    auth: {
      enabled: process.env.AUTH_ENABLED === 'true',
      jwtSecret: process.env.JWT_SECRET || 'dev-secret',
      tokenExpiry: '1h'
    },
    
    logging: {
      level: 'info',
      dlpEvents: true,
      auditTrail: true
    }
  }
};

module.exports = config;
