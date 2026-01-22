/**
 * Persona Management Service
 * Creates and manages user personas based on Quick Templates
 * Handles persona setup, compliance verification, and policy enforcement
 */

const CRMQuickTemplates = require('./crm-quick-templates');
const CompliancePolicies = require('./compliance-policies');

class PersonaManagement {
  constructor() {
    this.templates = new CRMQuickTemplates();
    this.compliance = new CompliancePolicies();
    this.personas = {}; // Store created personas
    this.personaSetupLogs = {}; // Track setup progress
  }

  /**
   * Create a new persona from a template
   */
  createPersonaFromTemplate(userId, templateId, personaData = {}) {
    const template = this.templates.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    // Initialize persona object
    const persona = {
      id: `${userId}-${templateId}-${Date.now()}`,
      userId,
      templateId,
      title: template.title,
      icon: template.icon,
      createdAt: new Date().toISOString(),
      createdBy: personaData.createdBy || 'admin',
      
      // Persona details
      firstName: personaData.firstName || '',
      lastName: personaData.lastName || '',
      email: personaData.email || '',
      phone: personaData.phone || '',
      department: personaData.department || '',
      reportsTo: personaData.reportsTo || null,
      
      // Access configuration
      permissions: template.requiredPermissions,
      departmentAccess: template.departmentAccess,
      accessLevel: template.accessLevel,
      sessionTimeout: template.sessionTimeout,
      mfaRequired: template.mfaRequired,
      ipWhitelistRequired: template.ipWhitelistRequired,
      
      // Compliance configuration
      complianceRequirements: template.complianceRequirements,
      applicablePolicies: this.compliance.getApplicablePolicies(templateId),
      
      // Setup status
      setupStatus: 'pending',
      setupProgress: {
        completed: [],
        pending: template.personaSetupRequirements || [],
        completionPercentage: 0
      },
      
      // Audit trail
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: 'persona_created',
        details: `Persona created from ${template.title} template`
      }],
      
      // Active status
      active: false,
      activatedAt: null,
      lastLogin: null
    };

    // Store persona
    this.personas[persona.id] = persona;

    // Initialize setup log
    this.personaSetupLogs[persona.id] = {
      personaId: persona.id,
      userId,
      templateId,
      startDate: new Date().toISOString(),
      steps: template.personaSetupRequirements.map((req, idx) => ({
        id: idx,
        requirement: req,
        completed: false,
        completedAt: null,
        notes: ''
      }))
    };

    console.log(`[Persona] Created persona ${persona.id} for user ${userId} from template ${templateId}`);

    return persona;
  }

  /**
   * Mark a setup requirement as completed
   */
  completeSetupRequirement(personaId, requirementIndex, notes = '') {
    const persona = this.personas[personaId];
    const log = this.personaSetupLogs[personaId];

    if (!persona || !log) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const step = log.steps[requirementIndex];
    if (!step) {
      throw new Error(`Setup step ${requirementIndex} not found`);
    }

    // Mark step as completed
    step.completed = true;
    step.completedAt = new Date().toISOString();
    step.notes = notes;

    // Update persona
    persona.setupProgress.pending = persona.setupProgress.pending.filter(
      req => req !== step.requirement
    );
    persona.setupProgress.completed.push(step.requirement);
    persona.setupProgress.completionPercentage = Math.round(
      (persona.setupProgress.completed.length / log.steps.length) * 100
    );

    // Log action
    persona.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'setup_requirement_completed',
      details: `Completed: ${step.requirement}`,
      notes
    });

    console.log(`[Persona] Completed setup for persona ${personaId}: ${step.requirement}`);

    return {
      personaId,
      stepCompleted: step.requirement,
      completionPercentage: persona.setupProgress.completionPercentage,
      remainingSteps: persona.setupProgress.pending.length
    };
  }

  /**
   * Verify persona setup is complete
   */
  verifySetupComplete(personaId) {
    const persona = this.personas[personaId];
    const log = this.personaSetupLogs[personaId];

    if (!persona || !log) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const allCompleted = log.steps.every(step => step.completed);

    if (allCompleted) {
      persona.setupStatus = 'completed';
      persona.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'setup_verified_complete',
        details: 'All setup requirements verified as complete'
      });
      console.log(`[Persona] Setup verified complete for persona ${personaId}`);
    }

    return {
      personaId,
      setupComplete: allCompleted,
      completionPercentage: persona.setupProgress.completionPercentage,
      pendingRequirements: persona.setupProgress.pending
    };
  }

  /**
   * Activate persona after setup is complete
   */
  activatePersona(personaId, activatedBy = 'admin') {
    const persona = this.personas[personaId];

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    // Verify setup is complete
    const setupCheck = this.verifySetupComplete(personaId);
    if (!setupCheck.setupComplete) {
      throw new Error('Cannot activate persona - setup not complete. Pending: ' + 
        setupCheck.pendingRequirements.join(', '));
    }

    // Verify compliance requirements are met
    const complianceCheck = this.verifyComplianceRequirements(personaId);
    if (!complianceCheck.satisfied) {
      throw new Error('Cannot activate persona - compliance requirements not satisfied. Missing: ' +
        Object.entries(complianceCheck.unsatisfied)
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(', '));
    }

    // Activate persona
    persona.active = true;
    persona.activatedAt = new Date().toISOString();
    persona.setupStatus = 'active';

    // Log activation
    persona.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'persona_activated',
      details: `Persona activated for user access`,
      activatedBy
    });

    console.log(`[Persona] Activated persona ${personaId}`);

    return {
      personaId,
      active: true,
      activatedAt: persona.activatedAt,
      accessLevel: persona.accessLevel,
      permissions: persona.permissions.length
    };
  }

  /**
   * Deactivate persona
   */
  deactivatePersona(personaId, reason = '', deactivatedBy = 'admin') {
    const persona = this.personas[personaId];

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    persona.active = false;
    persona.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'persona_deactivated',
      details: `Persona deactivated`,
      reason,
      deactivatedBy
    });

    console.log(`[Persona] Deactivated persona ${personaId}`);

    return {
      personaId,
      active: false,
      deactivatedAt: new Date().toISOString()
    };
  }

  /**
   * Verify compliance requirements are satisfied
   */
  verifyComplianceRequirements(personaId) {
    const persona = this.personas[personaId];
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const requirements = persona.complianceRequirements;
    const satisfied = {
      dlp: false,
      banking: false,
      hipaa: false,
      mls: false,
      overall: true
    };

    const unsatisfied = {};

    // Check DLP requirements
    if (requirements.dlp && requirements.dlp.required) {
      // DLP is required and should be enforced
      satisfied.dlp = true;
    }

    // Check Banking requirements
    if (requirements.banking && requirements.banking.required) {
      const bankingReq = requirements.banking;
      if (bankingReq.certifications && Array.isArray(bankingReq.certifications)) {
        satisfied.banking = bankingReq.certifications.length > 0;
      }
      if (!satisfied.banking) {
        unsatisfied.banking = requirements.banking;
      }
    }

    // Check HIPAA requirements
    if (requirements.hipaa && requirements.hipaa.required) {
      const hipaaReq = requirements.hipaa;
      // HIPAA training required
      satisfied.hipaa = hipaaReq.trainingHours > 0;
      if (!satisfied.hipaa) {
        unsatisfied.hipaa = requirements.hipaa;
      }
    }

    // Check MLS requirements
    if (requirements.mls && requirements.mls.required) {
      // MLS restrictions apply
      satisfied.mls = true;
    }

    // Check overall satisfaction
    satisfied.overall = Object.values(satisfied).every(v => v !== false);

    return {
      personaId,
      satisfied,
      unsatisfied,
      requirementsMet: satisfied.overall,
      summary: `${Object.values(satisfied).filter(v => v === true).length}/${Object.keys(satisfied).length} requirements satisfied`
    };
  }

  /**
   * Check DLP policy compliance for persona communication
   */
  checkPersonaDLPCompliance(personaId, content, context = 'email') {
    const persona = this.personas[personaId];
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const dlpCheck = this.compliance.checkDLPViolation(content, context);

    // Log DLP check
    if (dlpCheck.violated) {
      persona.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'dlp_violation_blocked',
        details: `DLP violation in ${context}`,
        violationCount: dlpCheck.summary.blocked
      });
    }

    return {
      personaId,
      dlpCompliant: !dlpCheck.violated,
      violations: dlpCheck.violations,
      context,
      action: dlpCheck.violated ? 'block' : 'allow'
    };
  }

  /**
   * Audit log entry for persona actions
   */
  logPersonaAction(personaId, action, details = {}) {
    const persona = this.personas[personaId];
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    persona.auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      ...details
    });

    // Keep only last 1000 log entries
    if (persona.auditLog.length > 1000) {
      persona.auditLog = persona.auditLog.slice(-1000);
    }
  }

  /**
   * Record persona login
   */
  recordLogin(personaId) {
    const persona = this.personas[personaId];
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    persona.lastLogin = new Date().toISOString();
    this.logPersonaAction(personaId, 'login', {
      details: 'User logged in'
    });
  }

  /**
   * Get persona details
   */
  getPersona(personaId) {
    return this.personas[personaId] || null;
  }

  /**
   * Get all personas for a user
   */
  getUserPersonas(userId) {
    return Object.values(this.personas).filter(p => p.userId === userId);
  }

  /**
   * Get personas by template
   */
  getPersonasByTemplate(templateId) {
    return Object.values(this.personas).filter(p => p.templateId === templateId);
  }

  /**
   * Get persona audit log
   */
  getPersonaAuditLog(personaId, limit = 100) {
    const persona = this.personas[personaId];
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    return {
      personaId,
      auditLog: persona.auditLog.slice(-limit),
      totalEntries: persona.auditLog.length
    };
  }

  /**
   * Get setup progress
   */
  getSetupProgress(personaId) {
    const persona = this.personas[personaId];
    const log = this.personaSetupLogs[personaId];

    if (!persona || !log) {
      throw new Error(`Persona ${personaId} not found`);
    }

    return {
      personaId,
      setupStatus: persona.setupStatus,
      completionPercentage: persona.setupProgress.completionPercentage,
      completed: log.steps.filter(s => s.completed),
      pending: log.steps.filter(s => !s.completed),
      totalSteps: log.steps.length,
      completedSteps: log.steps.filter(s => s.completed).length
    };
  }

  /**
   * Generate persona setup checklist
   */
  generateSetupChecklist(personaId) {
    const log = this.personaSetupLogs[personaId];
    if (!log) {
      throw new Error(`Persona ${personaId} not found`);
    }

    return {
      personaId,
      checklist: log.steps.map(step => ({
        id: step.id,
        requirement: step.requirement,
        completed: step.completed,
        completedAt: step.completedAt,
        notes: step.notes
      })),
      summary: {
        total: log.steps.length,
        completed: log.steps.filter(s => s.completed).length,
        pending: log.steps.filter(s => !s.completed).length,
        completionPercentage: Math.round(
          (log.steps.filter(s => s.completed).length / log.steps.length) * 100
        )
      }
    };
  }
}

module.exports = PersonaManagement;
