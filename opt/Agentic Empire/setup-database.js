const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'app.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Personas table
  db.run(`CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY,
    name TEXT,
    slug TEXT UNIQUE,
    system_prompt TEXT,
    model TEXT,
    voice TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Conversations table
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    persona_id INTEGER,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(persona_id) REFERENCES personas(id)
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  )`);

  // RAG Documents table
  db.run(`CREATE TABLE IF NOT EXISTS rag_documents (
    id INTEGER PRIMARY KEY,
    persona_id INTEGER,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(persona_id) REFERENCES personas(id)
  )`);

  // RAG Chunks table
  db.run(`CREATE TABLE IF NOT EXISTS rag_chunks (
    id INTEGER PRIMARY KEY,
    document_id INTEGER,
    chunk_text TEXT,
    embedding BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES rag_documents(id)
  )`);

  // Audit Logs table
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE,
    rag_enabled BOOLEAN DEFAULT 1,
    rag_chunk_size INTEGER DEFAULT 1024,
    rag_overlap INTEGER DEFAULT 100,
    rag_max_results INTEGER DEFAULT 5,
    tuning_temperature REAL DEFAULT 0.7,
    tuning_top_p REAL DEFAULT 0.9,
    tuning_max_tokens INTEGER DEFAULT 2000,
    voice_enabled BOOLEAN DEFAULT 1,
    voice_model TEXT DEFAULT 'alloy',
    voice_speed REAL DEFAULT 1.0,
    mcp_connections TEXT DEFAULT '{}',
    tool_email_enabled BOOLEAN DEFAULT 0,
    tool_websearch_enabled BOOLEAN DEFAULT 0,
    tool_playwright_enabled BOOLEAN DEFAULT 0,
    tool_crm_enabled BOOLEAN DEFAULT 0,
    tool_api_enabled BOOLEAN DEFAULT 0,
    tool_banking_enabled BOOLEAN DEFAULT 0,
    tool_payment_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // MCP Servers table
  db.run(`CREATE TABLE IF NOT EXISTS mcp_servers (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    type TEXT,
    config TEXT,
    is_connected BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Tool Configurations table
  db.run(`CREATE TABLE IF NOT EXISTS tool_configs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    tool_name TEXT UNIQUE,
    is_enabled BOOLEAN DEFAULT 0,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Canvas Diagrams table
  db.run(`CREATE TABLE IF NOT EXISTS canvas_diagrams (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    shapes TEXT,
    connectors TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Workflows table
  db.run(`CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    steps TEXT,
    trigger_type TEXT,
    status TEXT DEFAULT 'inactive',
    execution_count INTEGER DEFAULT 0,
    last_executed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Workflow Executions table
  db.run(`CREATE TABLE IF NOT EXISTS workflow_executions (
    id INTEGER PRIMARY KEY,
    workflow_id INTEGER,
    user_id INTEGER,
    status TEXT,
    start_time DATETIME,
    end_time DATETIME,
    result TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES workflows(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Scheduled Jobs table
  db.run(`CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    job_type TEXT,
    description TEXT,
    cron_expression TEXT,
    status TEXT DEFAULT 'active',
    last_run DATETIME,
    next_run DATETIME,
    execution_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Job Executions table
  db.run(`CREATE TABLE IF NOT EXISTS job_executions (
    id INTEGER PRIMARY KEY,
    job_id INTEGER,
    started_at DATETIME,
    completed_at DATETIME,
    status TEXT,
    duration_ms INTEGER,
    output TEXT,
    error_message TEXT,
    FOREIGN KEY(job_id) REFERENCES scheduled_jobs(id)
  )`);

  // Reports table
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    template_id INTEGER,
    format TEXT DEFAULT 'pdf',
    content TEXT,
    file_path TEXT,
    generated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Templates table
  db.run(`CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    type TEXT,
    category TEXT,
    content TEXT,
    tags TEXT,
    difficulty_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Files table
  db.run(`CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    filename TEXT,
    filepath TEXT,
    mimetype TEXT,
    size INTEGER,
    folder_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(folder_id) REFERENCES folders(id)
  )`);

  // Folders table
  db.run(`CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    parent_folder_id INTEGER,
    path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(parent_folder_id) REFERENCES folders(id)
  )`);

  // Quotas table
  db.run(`CREATE TABLE IF NOT EXISTS quotas (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    quota_type TEXT,
    limit_value INTEGER,
    current_usage INTEGER DEFAULT 0,
    period TEXT,
    reset_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Roles table (for RBAC)
  db.run(`CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT,
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User Roles table
  db.run(`CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    role_id INTEGER,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(role_id) REFERENCES roles(id),
    UNIQUE(user_id, role_id)
  )`);

  // Organization Structure table
  db.run(`CREATE TABLE IF NOT EXISTS organization_structure (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    agent_id INTEGER,
    parent_agent_id INTEGER,
    title TEXT,
    department TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(parent_agent_id) REFERENCES organization_structure(id)
  )`);

  // Agents table (for Org Chart)
  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    role TEXT,
    status TEXT DEFAULT 'idle',
    skills TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // RAG Documents Extended table
  db.run(`CREATE TABLE IF NOT EXISTS rag_document_status (
    id INTEGER PRIMARY KEY,
    document_id INTEGER,
    chunks_count INTEGER DEFAULT 0,
    indexed_count INTEGER DEFAULT 0,
    total_size_bytes INTEGER DEFAULT 0,
    last_indexed DATETIME,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(document_id) REFERENCES rag_documents(id)
  )`);

  // ==================== PAYMENT SYSTEM TABLES ====================
  
  // Payments table - Track all one-time payments
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    payment_intent_id TEXT UNIQUE,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending',
    method TEXT,
    description TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Subscriptions table - Track recurring subscriptions
  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id TEXT UNIQUE,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'usd',
    billing_cycle_anchor DATETIME,
    current_period_start DATETIME,
    current_period_end DATETIME,
    next_billing_date DATETIME,
    cancel_at DATETIME,
    cancel_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Invoices table - Track invoices
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    invoice_id TEXT UNIQUE,
    subscription_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'draft',
    description TEXT,
    due_date DATETIME,
    paid_at DATETIME,
    pdf_url TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Payment Methods table - Track saved payment methods
  db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    stripe_method_id TEXT UNIQUE,
    type TEXT,
    brand TEXT,
    last4 TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Refunds table - Track refunds
  db.run(`CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    payment_intent_id TEXT,
    refund_id TEXT UNIQUE,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'usd',
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Billing History table - Track all billing events
  db.run(`CREATE TABLE IF NOT EXISTS billing_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_type TEXT,
    plan TEXT,
    amount REAL,
    status TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // ==================== END PAYMENT SYSTEM TABLES ====================

  // ==================== CRM SYSTEM TABLES ====================

  // Contacts table
  db.run(`CREATE TABLE IF NOT EXISTS crm_contacts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    source TEXT,
    status TEXT DEFAULT 'lead',
    rating INTEGER DEFAULT 0,
    notes TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Opportunities table
  db.run(`CREATE TABLE IF NOT EXISTS crm_opportunities (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    value REAL,
    currency TEXT DEFAULT 'usd',
    stage TEXT DEFAULT 'prospect',
    probability INTEGER DEFAULT 0,
    expected_close_date DATETIME,
    close_date DATETIME,
    status TEXT DEFAULT 'open',
    owner_id INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(contact_id) REFERENCES crm_contacts(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  )`);

  // Activities table
  db.run(`CREATE TABLE IF NOT EXISTS crm_activities (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_id INTEGER,
    opportunity_id INTEGER,
    type TEXT,
    subject TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed',
    priority TEXT DEFAULT 'normal',
    due_date DATETIME,
    completed_at DATETIME,
    assigned_to INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(contact_id) REFERENCES crm_contacts(id),
    FOREIGN KEY(opportunity_id) REFERENCES crm_opportunities(id),
    FOREIGN KEY(assigned_to) REFERENCES users(id)
  )`);

  // Deals table
  db.run(`CREATE TABLE IF NOT EXISTS crm_deals (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL,
    currency TEXT DEFAULT 'usd',
    stage TEXT DEFAULT 'proposal',
    status TEXT DEFAULT 'active',
    close_date DATETIME,
    closed_date DATETIME,
    owner_id INTEGER,
    probability INTEGER DEFAULT 50,
    next_step TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(opportunity_id) REFERENCES crm_opportunities(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  )`);

  // Pipeline Stages table
  db.run(`CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    color TEXT DEFAULT '#0066cc',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Notes table
  db.run(`CREATE TABLE IF NOT EXISTS crm_notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_id INTEGER,
    opportunity_id INTEGER,
    deal_id INTEGER,
    content TEXT NOT NULL,
    visibility TEXT DEFAULT 'private',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(contact_id) REFERENCES crm_contacts(id),
    FOREIGN KEY(opportunity_id) REFERENCES crm_opportunities(id),
    FOREIGN KEY(deal_id) REFERENCES crm_deals(id)
  )`);

  // ==================== END CRM SYSTEM TABLES ====================

  // Insert default admin user
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
    ['admin', adminPasswordHash, 'admin']);

  // Insert sample personas
  db.run(`INSERT OR IGNORE INTO personas (name, slug, system_prompt, model, voice) VALUES (?, ?, ?, ?, ?)`,
    ['General Assistant', 'general', 'You are a helpful AI assistant.', 'gpt-4', 'nova']);
  
  db.run(`INSERT OR IGNORE INTO personas (name, slug, system_prompt, model, voice) VALUES (?, ?, ?, ?, ?)`,
    ['Code Developer', 'code-developer', 'You are an expert software developer. Provide clean, efficient code.', 'gpt-4', 'echo']);

  // Insert default roles
  db.run(`INSERT OR IGNORE INTO roles (name, description, permissions) VALUES (?, ?, ?)`,
    ['admin', 'Administrator with full access', JSON.stringify(['*'])]);

  db.run(`INSERT OR IGNORE INTO roles (name, description, permissions) VALUES (?, ?, ?)`,
    ['editor', 'Editor can create and modify content', JSON.stringify(['read', 'create', 'edit'])]);

  db.run(`INSERT OR IGNORE INTO roles (name, description, permissions) VALUES (?, ?, ?)`,
    ['viewer', 'Viewer can only view content', JSON.stringify(['read'])]);

  // Insert sample agents
  db.run(`INSERT OR IGNORE INTO agents (user_id, name, role, status, skills) VALUES (?, ?, ?, ?, ?)`,
    [1, 'CEO Agent', 'CEO', 'active', JSON.stringify(['strategy', 'planning', 'oversight'])]);

  db.run(`INSERT OR IGNORE INTO agents (user_id, name, role, status, skills) VALUES (?, ?, ?, ?, ?)`,
    [1, 'CTO Agent', 'CTO', 'active', JSON.stringify(['technical_leadership', 'architecture', 'security'])]);

  db.run(`INSERT OR IGNORE INTO agents (user_id, name, role, status, skills) VALUES (?, ?, ?, ?, ?)`,
    [1, 'CFO Agent', 'CFO', 'active', JSON.stringify(['financial_planning', 'budgeting', 'reporting'])]);

  console.log('Database initialized successfully.');
});

db.close();