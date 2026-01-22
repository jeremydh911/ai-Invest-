/**
 * Agent Management Routes
 * 
 * Handles:
 * - Agent creation and lifecycle
 * - Batch deployment
 * - Agent configuration
 * - Agent status tracking
 * 
 * Extracted from server.js for modular architecture
 */

const express = require('express');
const router = express.Router();
const CompanyDB = require('../services/company-db');
const IndustryTemplates = require('../services/industry-templates');

/**
 * GET /api/agents/templates/:industry
 * Get industry template with agent positions
 */
router.get('/agents/templates/:industry', (req, res) => {
  try {
    const { industry } = req.params;
    const template = IndustryTemplates.getTemplate(industry);
    
    if (!template) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    res.json({
      industry,
      description: template.description,
      stages: Object.keys(template.stages).map(stage => ({
        name: stage,
        description: template.stages[stage].description,
        timeline: template.stages[stage].timeline,
        positions: template.stages[stage].agents
      }))
    });
  } catch (err) {
    console.error('Get template error:', err);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

/**
 * GET /api/agents/templates
 * List all available industry templates
 */
router.get('/agents/templates', (req, res) => {
  try {
    const industries = IndustryTemplates.listIndustries();
    const templates = industries.map(industry => {
      const template = IndustryTemplates.getTemplate(industry);
      return {
        industry,
        description: template.description,
        chartType: template.chartType,
        stageCount: Object.keys(template.stages).length
      };
    });
    
    res.json(templates);
  } catch (err) {
    console.error('List templates error:', err);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

/**
 * GET /api/agents/templates/:industry/chart
 * Get chart SVG for industry
 */
router.get('/agents/templates/:industry/chart', (req, res) => {
  try {
    const { industry } = req.params;
    const svg = IndustryTemplates.getChartSvg(industry);
    
    if (!svg) {
      return res.status(404).json({ error: 'Chart not available' });
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error('Get chart error:', err);
    res.status(500).json({ error: 'Failed to get chart' });
  }
});

/**
 * POST /api/companies/:companyId/batch-deploy
 * Deploy multiple agents in batch
 * Requires: agents[], industry, batchName (optional)
 */
router.post('/companies/:companyId/batch-deploy', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { agents, industry, batchName } = req.body;

    // Verify auth and company access
    if (!req.user || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return res.status(400).json({ error: 'No agents provided' });
    }

    const cid = parseInt(companyId);
    const deployedAgents = [];
    const errors = [];

    // Deploy each agent
    for (const agentData of agents) {
      try {
        const result = await CompanyDB.run(
          cid,
          `INSERT INTO agents (name, position, industry, department, model, voice, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            agentData.name || agentData.position,
            agentData.name || agentData.position,
            industry || agentData.industry,
            agentData.type || 'General',
            'gpt-4-turbo',
            'alloy',
            'pending_onboarding',
            req.user.id
          ]
        );

        // Initialize onboarding record
        await CompanyDB.run(
          cid,
          `INSERT INTO agent_onboarding (agent_id, step, training_data_uploaded, rag_indexed, model_fine_tuned, system_prompt_set, voice_configured, test_conversation_passed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [result.id, 1, 0, 0, 0, 0, 0, 0]
        );

        // Create default settings for agent
        await CompanyDB.run(
          cid,
          `INSERT INTO settings (user_id, setting_type, rag_enabled, voice_enabled)
           VALUES (?, ?, ?, ?)`,
          [null, 'agent', 1, 1]
        );

        deployedAgents.push({
          id: result.id,
          name: agentData.name || agentData.position,
          status: 'pending_onboarding'
        });
      } catch (err) {
        errors.push({
          agent: agentData.name || agentData.position,
          error: err.message
        });
      }
    }

    // Record batch deployment
    if (deployedAgents.length > 0) {
      await CompanyDB.run(
        cid,
        `INSERT INTO agent_batch_deploys (batch_name, created_by, agent_count, status, deployment_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          batchName || `Batch ${new Date().toLocaleDateString()}`,
          req.user.id,
          deployedAgents.length,
          'completed',
          JSON.stringify(deployedAgents)
        ]
      );
    }

    res.status(201).json({
      batchName: batchName || 'Batch',
      deployed: deployedAgents.length,
      agents: deployedAgents,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deployed ${deployedAgents.length} agent(s)`
    });
  } catch (err) {
    console.error('Batch deploy error:', err);
    res.status(500).json({ error: 'Batch deployment failed' });
  }
});

/**
 * GET /api/companies/:companyId/agents
 * List all agents for a company
 */
router.get('/companies/:companyId/agents', async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!req.user || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const agents = await CompanyDB.all(
      parseInt(companyId),
      `SELECT a.*, 
              (SELECT COUNT(*) FROM agent_onboarding WHERE agent_id = a.id AND completed_at IS NULL) as pending_onboarding
       FROM agents a 
       ORDER BY a.created_at DESC`
    );

    res.json(agents || []);
  } catch (err) {
    console.error('List agents error:', err);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

/**
 * GET /api/companies/:companyId/agents/:agentId
 * Get specific agent details
 */
router.get('/companies/:companyId/agents/:agentId', async (req, res) => {
  try {
    const { companyId, agentId } = req.params;

    if (!req.user || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const agent = await CompanyDB.get(
      parseInt(companyId),
      'SELECT * FROM agents WHERE id = ?',
      [parseInt(agentId)]
    );

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get onboarding status
    const onboarding = await CompanyDB.get(
      parseInt(companyId),
      'SELECT * FROM agent_onboarding WHERE agent_id = ?',
      [parseInt(agentId)]
    );

    res.json({
      ...agent,
      onboarding: onboarding || {}
    });
  } catch (err) {
    console.error('Get agent error:', err);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

/**
 * PUT /api/companies/:companyId/agents/:agentId
 * Update agent configuration
 */
router.put('/companies/:companyId/agents/:agentId', async (req, res) => {
  try {
    const { companyId, agentId } = req.params;
    const updates = req.body;

    if (!req.user || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Build update query dynamically
    const allowedFields = ['name', 'position', 'industry', 'department', 'system_prompt', 'model', 'voice', 'status'];
    const updateFields = [];
    const values = [];

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(agentId));

    await CompanyDB.run(
      parseInt(companyId),
      `UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Agent updated successfully' });
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

/**
 * DELETE /api/companies/:companyId/agents/:agentId
 * Delete an agent
 */
router.delete('/companies/:companyId/agents/:agentId', async (req, res) => {
  try {
    const { companyId, agentId } = req.params;

    if (!req.user || req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete related data
    await CompanyDB.run(
      parseInt(companyId),
      'DELETE FROM agent_onboarding WHERE agent_id = ?',
      [parseInt(agentId)]
    );

    await CompanyDB.run(
      parseInt(companyId),
      'DELETE FROM agents WHERE id = ?',
      [parseInt(agentId)]
    );

    res.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    console.error('Delete agent error:', err);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

module.exports = router;
