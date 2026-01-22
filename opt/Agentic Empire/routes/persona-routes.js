/**
 * Persona and Quick Template Routes
 * 
 * Handles persona creation, management, and compliance checks.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');
const authenticate = require('./auth-middleware');
const logger = require('../services/logger');
const PersonaManagement = require('../services/persona-management');
const CompanyDB = require('../services/company-db');

const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'app.db'));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const personaManagement = new PersonaManagement();

// Applying authentication to all persona routes
router.use(authenticate);

/**
 * GET /api/templates
 * Get all available templates
 */
router.get('/templates', (req, res) => {
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
router.get('/templates/:templateId', (req, res) => {
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
router.get('/templates/category/:category', (req, res) => {
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
router.post('/create', (req, res) => {
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
router.get('/:personaId', (req, res) => {
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
router.get('/user/:userId', (req, res) => {
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
router.post('/:personaId/setup/complete', (req, res) => {
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
router.get('/:personaId/setup/checklist', (req, res) => {
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
router.get('/:personaId/setup/progress', (req, res) => {
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
router.post('/:personaId/activate', (req, res) => {
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
router.post('/:personaId/deactivate', (req, res) => {
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
router.get('/:personaId/compliance', (req, res) => {
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
router.post('/:personaId/dlp-check', (req, res) => {
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
router.get('/:personaId/audit-log', (req, res) => {
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
router.post('/:personaId/login', (req, res) => {
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

/**
 * GET /api/personas
 * List all personas (Core functionality)
 */
router.get('/personas', (req, res) => {
  db.all('SELECT id, name, slug, model FROM personas', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * POST /api/personas
 * Create new persona (Core functionality)
 */
router.post('/personas', (req, res) => {
  const { name, slug, system_prompt, model, voice } = req.body;
  db.run('INSERT INTO personas (name, slug, system_prompt, model, voice) VALUES (?, ?, ?, ?, ?)',
    [name, slug, system_prompt, model, voice], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

/**
 * POST /api/text-chat
 * Process text chat with a persona with RAG memory and history
 */
router.post('/text-chat', async (req, res) => {
  const { persona_id, message, conversation_id } = req.body;
  const { id: userId, companyId } = req.user;

  db.get('SELECT * FROM personas WHERE id = ?', [persona_id], async (err, persona) => {
    if (err || !persona) return res.status(404).json({ error: 'Persona not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // 1. Manage Conversation History
      let activeConversationId = conversation_id;
      if (!activeConversationId) {
        const conv = await CompanyDB.get(companyId, 
          'SELECT id FROM conversations WHERE user_id = ? AND agent_id = ? ORDER BY updated_at DESC LIMIT 1', 
          [userId, persona_id]);
        
        if (conv) {
          activeConversationId = conv.id;
        } else {
          const result = await CompanyDB.run(companyId, 
            'INSERT INTO conversations (user_id, agent_id, title) VALUES (?, ?, ?)',
            [userId, persona_id, message.substring(0, 30) + '...']);
          activeConversationId = result.id;
        }
      }

      // 2. Load History
      const historyRows = await CompanyDB.all(companyId,
        'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 10',
        [activeConversationId]);
      
      const history = historyRows.map(h => ({ role: h.role, content: h.content }));

      // 3. RAG Retrieval (Keyword search for relevance)
      const keywords = message.toLowerCase().split(' ').filter(w => w.length > 3);
      let ragContext = "";
      if (keywords.length > 0) {
        const query = keywords.map(k => `content LIKE '%${k}%'`).join(' OR ');
        const docs = await CompanyDB.all(companyId, 
          `SELECT content FROM rag_documents WHERE agent_id = ? OR agent_id IS NULL AND (${query}) LIMIT 3`,
          [persona_id]);
        
        if (docs.length > 0) {
          ragContext = "\n\nRelevant Context from Memory:\n" + docs.map(d => d.content).join("\n---\n");
        }
      }

      // 4. Update DB with user message
      await CompanyDB.run(companyId, 
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [activeConversationId, 'user', message]);
      
      // Update conversation timestamp
      await CompanyDB.run(companyId, 'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [activeConversationId]);

      // 5. Build Messages for LLM
      const llmMessages = [
        { role: 'system', content: persona.system_prompt + ragContext },
        ...history,
        { role: 'user', content: message }
      ];

      // 6. Stream Response
      const stream = await openai.chat.completions.create({
        model: persona.model || 'gpt-4-turbo',
        messages: llmMessages,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content, conversation_id: activeConversationId })}\n\n`);
      }

      // 7. Save Assistant Response
      await CompanyDB.run(companyId, 
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [activeConversationId, 'assistant', fullResponse]);

    } catch (error) {
      logger.error('Chat processing error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    res.end();
  });
});

module.exports = router;
