/**
 * Admin Coaching System
 * 
 * Intelligent coaching system that helps administrators set up companies
 * and staff them with agents. Provides recommendations, validation, and
 * best practice guidance at each stage of growth.
 */

const logger = require('./logger');

class AdminCoachingSystem {
  constructor() {
    this.coachingSessions = {};
    this.bestPractices = this._loadBestPractices();
    this.validationRules = this._loadValidationRules();
    this.recommendationEngine = this._loadRecommendations();
  }

  /**
   * Start coaching session for company setup
   * @param {string} companyId - Company ID
   * @param {string} userId - Admin user ID
   * @param {Object} companyInfo - Current company information
   * @returns {Object} Coaching session
   */
  startCoachingSession(companyId, userId, companyInfo) {
    try {
      const session = {
        sessionId: `coaching_${companyId}_${Date.now()}`,
        companyId,
        userId,
        startTime: new Date().toISOString(),
        stage: this._determineGrowthStage(companyInfo),
        currentStep: 'company_info_review',
        completedSteps: [],
        companyInfo,
        coachingNotes: [],
        recommendations: [],
        validationIssues: [],
        decisions: {},
        status: 'active'
      };

      this.coachingSessions[session.sessionId] = session;
      logger.info(`Coaching session started: ${session.sessionId}`);

      // Provide initial greeting
      this._addCoachingNote(session.sessionId, `Welcome to the company setup coaching system! I'll help you build a strong organization. Let's start by reviewing your company information.`);

      return session;
    } catch (error) {
      logger.error(`Error starting coaching session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Review company information completeness
   * @param {string} sessionId - Coaching session ID
   * @returns {Object} Assessment and recommendations
   */
  reviewCompanyInfo(sessionId) {
    try {
      const session = this._getSession(sessionId);
      const assessment = {
        completeness: 0,
        missingFields: [],
        redFlags: [],
        recommendations: [],
        readyToAdvance: false
      };

      // Check required fields
      const requiredFields = [
        { field: 'companyName', category: 'basic' },
        { field: 'industry', category: 'basic' },
        { field: 'legalName', category: 'legal' },
        { field: 'ein', category: 'legal' },
        { field: 'headquarters', category: 'operations' }
      ];

      let completedFields = 0;
      for (const fieldCheck of requiredFields) {
        const value = this._getNestedValue(session.companyInfo, fieldCheck.field);
        if (value) {
          completedFields++;
        } else {
          assessment.missingFields.push(fieldCheck.field);
        }
      }

      assessment.completeness = Math.round((completedFields / requiredFields.length) * 100);

      // Recommend next hires based on stage
      const nextHires = this._recommendNextHires(session.stage, session.companyInfo);
      assessment.recommendations.push({
        type: 'hiring',
        priority: 'critical',
        message: `Based on your ${session.stage} stage, I recommend these critical hires:`,
        hires: nextHires
      });

      // Check for critical staffing gaps
      const staffingAssessment = this._assessStaffing(session.companyInfo);
      assessment.recommendations.push(staffingAssessment);

      assessment.readyToAdvance = assessment.completeness >= 80;

      if (assessment.readyToAdvance) {
        this._addCoachingNote(
          sessionId,
          `Great! Your company information is ${assessment.completeness}% complete. You're ready to move forward with staffing setup.`
        );
      } else {
        this._addCoachingNote(
          sessionId,
          `Your company information is ${assessment.completeness}% complete. Let's fill in the missing fields before proceeding: ${assessment.missingFields.join(', ')}`
        );
      }

      return assessment;
    } catch (error) {
      logger.error(`Error reviewing company info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get staffing recommendations for company stage
   * @param {string} sessionId - Coaching session ID
   * @param {string} industryType - Industry type (optional, uses company info if not provided)
   * @returns {Object} Detailed staffing recommendations
   */
  getStaffingRecommendations(sessionId, industryType = null) {
    try {
      const session = this._getSession(sessionId);
      const industry = industryType || session.companyInfo.industry || 'generic';
      const stage = session.stage;

      const recommendations = {
        stage,
        industry,
        criticalHires: [],
        recommendedHires: [],
        timeline: {},
        staffingTemplate: {},
        rationale: []
      };

      // Get critical roles for this stage and industry
      const criticalRoles = this._getCriticalRoles(stage, industry);
      recommendations.criticalHires = criticalRoles;

      // Get recommended additional hires
      const recommendedRoles = this._getRecommendedRoles(stage, industry);
      recommendations.recommendedHires = recommendedRoles;

      // Create hiring timeline
      recommendations.timeline = this._createHiringTimeline(stage, criticalRoles, recommendedRoles);

      // Provide staffing template
      recommendations.staffingTemplate = this._getStaffingTemplate(stage);

      // Add coaching notes
      const hiringMessage = `For your ${stage} stage company in ${industry}, here's your staffing roadmap:
      
Critical Hires (Immediate):
${criticalRoles.map(r => `• ${r.title} - ${r.urgency}`).join('\n')}

Recommended Hires (Next 3-6 Months):
${recommendedRoles.map(r => `• ${r.title} - ${r.rationale}`).join('\n')}`;

      this._addCoachingNote(sessionId, hiringMessage);

      return recommendations;
    } catch (error) {
      logger.error(`Error getting staffing recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get coaching for specific agent/job description
   * @param {string} sessionId - Coaching session ID
   * @param {string} jobTitle - Job title
   * @param {string} industry - Industry type
   * @returns {Object} Comprehensive job guidance
   */
  getJobDescriptionCoaching(sessionId, jobTitle, industry) {
    try {
      const guidance = {
        jobTitle,
        industry,
        responsibilities: [],
        keyQualifications: [],
        companyContextTips: [],
        compensationGuidance: {},
        redFlags: [],
        successMetrics: []
      };

      // Get template responsibilities for this role
      const roleTemplate = this._getJobTemplate(jobTitle, industry);
      if (roleTemplate) {
        guidance.responsibilities = roleTemplate.responsibilities.slice(0, 8);
        guidance.keyQualifications = roleTemplate.qualifications.slice(0, 5);
        guidance.successMetrics = roleTemplate.kpis.slice(0, 5);
      }

      // Provide company-context tips
      const stage = this._getSession(sessionId).stage;
      guidance.companyContextTips = this._getContextTips(jobTitle, stage, industry);

      // Provide compensation guidance
      guidance.compensationGuidance = this._getCompensationGuidance(jobTitle, industry, stage);

      // List red flags to avoid
      guidance.redFlags = this._getRedFlags(jobTitle, industry);

      const coachingMessage = `Here's my guidance for your ${jobTitle} hire:

Key Responsibilities:
${guidance.responsibilities.slice(0, 5).map(r => `• ${r}`).join('\n')}

Must-Have Qualifications:
${guidance.keyQualifications.map(q => `• ${q}`).join('\n')}

Success Metrics:
${guidance.successMetrics.map(m => `• ${m}`).join('\n')}

Compensation Range: $${guidance.compensationGuidance.min}K - $${guidance.compensationGuidance.max}K`;

      this._addCoachingNote(sessionId, coachingMessage);

      return guidance;
    } catch (error) {
      logger.error(`Error getting job description coaching: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate completed agent profile
   * @param {string} sessionId - Coaching session ID
   * @param {Object} agentProfile - Agent profile to validate
   * @returns {Object} Validation results with suggestions
   */
  validateAgentProfile(sessionId, agentProfile) {
    try {
      const session = this._getSession(sessionId);
      const validation = {
        isComplete: true,
        completenessScore: 0,
        missingFields: [],
        warnings: [],
        suggestions: [],
        isReady: false
      };

      // Required fields for agent profile
      const requiredFields = [
        'firstName', 'lastName', 'email', 'phone',
        'dateOfBirth', 'department', 'jobTitle', 'reportsTo',
        'specialty', 'address'
      ];

      let filledFields = 0;
      for (const field of requiredFields) {
        if (!agentProfile[field] || agentProfile[field].trim() === '') {
          validation.missingFields.push(field);
          validation.isComplete = false;
        } else {
          filledFields++;
        }
      }

      validation.completenessScore = Math.round((filledFields / requiredFields.length) * 100);

      // Check for voice configuration
      if (!agentProfile.voiceSynthesis || !agentProfile.voiceSynthesis.voiceId) {
        validation.warnings.push('Voice synthesis not configured. Agent voice will be generic.');
        validation.suggestions.push('Configure voice settings to match agent personality and role');
      }

      // Check for job description
      if (!agentProfile.jobDescription || !agentProfile.jobDescription.description) {
        validation.warnings.push('Job description not finalized. Recommend completing before publishing.');
        validation.suggestions.push('Use industry-specific job template and customize for your needs');
      }

      // Check reporting structure
      if (!agentProfile.reportsTo) {
        validation.warnings.push('Reporting manager not assigned.');
        validation.suggestions.push('Assign direct manager to establish reporting chain');
      }

      // Check backstory completeness
      if (!agentProfile.backstory || !agentProfile.backstory.professionalBackground) {
        validation.suggestions.push('Add professional background and accomplishments for more authentic interactions');
      }

      validation.isReady = validation.isComplete && validation.completenessScore >= 85;

      if (validation.isReady) {
        this._addCoachingNote(
          sessionId,
          `Excellent! ${agentProfile.firstName} ${agentProfile.lastName}'s profile is ${validation.completenessScore}% complete and ready to activate!`
        );
      } else {
        this._addCoachingNote(
          sessionId,
          `${agentProfile.firstName} ${agentProfile.lastName}'s profile is ${validation.completenessScore}% complete. Complete these fields: ${validation.missingFields.join(', ')}`
        );
      }

      return validation;
    } catch (error) {
      logger.error(`Error validating agent profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get organizational structure recommendations
   * @param {string} sessionId - Coaching session ID
   * @returns {Object} Org structure guidance
   */
  getOrgStructureGuidance(sessionId) {
    try {
      const session = this._getSession(sessionId);
      const guidance = {
        currentStructure: {},
        recommendedStructure: {},
        improvementAreas: [],
        healthMetrics: {}
      };

      // Analyze current structure
      const structure = session.companyInfo.organizationStructure || {};
      const employeeCount = Object.values(structure).reduce((sum, dept) => sum + (dept.headcount || 0), 0);

      // Manager to report ratios (ideal: 1:7 to 1:10)
      const managerCount = Object.values(structure).filter(dept => dept.manager).length;
      const ratioHealth = employeeCount / (managerCount || 1);

      guidance.healthMetrics = {
        totalEmployees: employeeCount,
        totalManagers: managerCount,
        managerRatio: ratioHealth,
        isHealthy: ratioHealth >= 3 && ratioHealth <= 10,
        recommendations: ratioHealth > 10 ? 'Too many reports per manager. Consider adding team leads.' :
                        ratioHealth < 3 ? 'Not enough direct reports. Consider flatter structure.' :
                        'Manager-to-report ratio is healthy!'
      };

      // Recommend org template
      const templateName = this._getOrgTemplate(session.stage, session.companyInfo.industry);
      guidance.recommendedStructure = this._getTemplate(templateName);

      // Identify improvement areas
      const criticalholds = ['Marketing', 'Legal', 'HR', 'Executive'];
      for (const dept of criticalholds) {
        if (!structure[dept] || !structure[dept].manager) {
          guidance.improvementAreas.push(`Missing manager for ${dept} department`);
        }
      }

      const orgMessage = `Here's my assessment of your organizational structure:

Current Headcount: ${employeeCount}
Manager to Report Ratio: 1:${Math.round(ratioHealth)}
${guidance.healthMetrics.recommendations}

Recommended Template: ${templateName}
${guidance.improvementAreas.length > 0 ? `\nAreas to Improve:\n${guidance.improvementAreas.map(a => '• ' + a).join('\n')}` : 'Your structure looks well-balanced!'}`;

      this._addCoachingNote(sessionId, orgMessage);

      return guidance;
    } catch (error) {
      logger.error(`Error getting org structure guidance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all coaching notes for session
   * @param {string} sessionId - Coaching session ID
   * @returns {Array} Coaching notes
   */
  getCoachingNotes(sessionId) {
    try {
      const session = this._getSession(sessionId);
      return session.coachingNotes || [];
    } catch (error) {
      logger.error(`Error getting coaching notes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete coaching step
   * @param {string} sessionId - Coaching session ID
   * @param {string} stepName - Step name
   * @returns {Object} Updated session
   */
  completeStep(sessionId, stepName) {
    try {
      const session = this._getSession(sessionId);
      if (!session.completedSteps.includes(stepName)) {
        session.completedSteps.push(stepName);
      }

      logger.info(`Step completed in coaching session: ${stepName}`);
      return session;
    } catch (error) {
      logger.error(`Error completing step: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get next recommended action
   * @param {string} sessionId - Coaching session ID
   * @returns {Object} Next action recommendation
   */
  getNextAction(sessionId) {
    try {
      const session = this._getSession(sessionId);
      const completedSteps = session.completedSteps || [];

      const allSteps = [
        'company_info_review',
        'staffing_assessment',
        'ceo_cfo_hire',
        'core_team_hire', // Marketing, Legal, HR
        'org_structure_setup',
        'agent_profiles_creation',
        'voice_configuration',
        'job_descriptions',
        'final_review'
      ];

      for (const step of allSteps) {
        if (!completedSteps.includes(step)) {
          return {
            nextStep: step,
            stepNumber: allSteps.indexOf(step) + 1,
            totalSteps: allSteps.length,
            recommendation: this._getStepRecommendation(step, session),
            guidance: this._getStepGuidance(step, session)
          };
        }
      }

      return {
        nextStep: 'complete',
        message: 'Congratulations! You\'ve completed the company setup coaching. Your team is ready to launch!',
        nextActions: [
          'Invite team members to activate their profiles',
          'Configure voice synthesis for all agents',
          'Set up department workflows',
          'Launch communication channels'
        ]
      };
    } catch (error) {
      logger.error(`Error getting next action: ${error.message}`);
      throw error;
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  /**
   * Get session by ID
   * @private
   */
  _getSession(sessionId) {
    const session = this.coachingSessions[sessionId];
    if (!session) {
      throw new Error(`Coaching session not found: ${sessionId}`);
    }
    return session;
  }

  /**
   * Add coaching note
   * @private
   */
  _addCoachingNote(sessionId, note) {
    try {
      const session = this._getSession(sessionId);
      session.coachingNotes.push({
        timestamp: new Date().toISOString(),
        message: note,
        type: 'info'
      });
    } catch (error) {
      logger.error(`Error adding coaching note: ${error.message}`);
    }
  }

  /**
   * Determine growth stage
   * @private
   */
  _determineGrowthStage(companyInfo) {
    const headcount = companyInfo.headcount || 1;
    if (headcount <= 10) return 'stage-1-startup';
    if (headcount <= 30) return 'stage-2-scale';
    if (headcount <= 75) return 'stage-3-growth';
    if (headcount <= 150) return 'stage-4-maturity';
    return 'stage-5-enterprise';
  }

  /**
   * Recommend next hires
   * @private
   */
  _recommendNextHires(stage, companyInfo) {
    const hires = {
      'stage-1-startup': [
        { title: 'CEO (if not founder)', urgency: 'Critical', salary: '$150K-$200K' },
        { title: 'CFO (Fractional)', urgency: 'Critical', salary: '$3K-$8K/month' },
        { title: 'Head of Marketing', urgency: 'Critical', salary: '$60K-$90K' },
        { title: 'General Counsel (Fractional)', urgency: 'High', salary: '$2K-$5K/month' }
      ],
      'stage-2-scale': [
        { title: 'CFO (Full-Time)', urgency: 'Critical', salary: '$120K-$180K' },
        { title: 'COO', urgency: 'Critical', salary: '$120K-$180K' },
        { title: 'VP Sales', urgency: 'High', salary: '$100K-$150K' },
        { title: 'Head of HR (Full-Time)', urgency: 'High', salary: '$70K-$110K' }
      ],
      'stage-3-growth': [
        { title: 'VP Product', urgency: 'Critical', salary: '$100K-$200K' },
        { title: 'VP Marketing', urgency: 'High', salary: '$90K-$160K' },
        { title: 'Chief Compliance Officer', urgency: 'High', salary: '$100K-$180K' },
        { title: 'General Counsel (Full-Time)', urgency: 'High', salary: '$100K-$180K' }
      ],
      'stage-4-maturity': [
        { title: 'Chief Risk Officer', urgency: 'Medium', salary: '$120K-$250K' },
        { title: 'VP Business Development', urgency: 'Medium', salary: '$100K-$200K' },
        { title: 'Chief Marketing Officer', urgency: 'Medium', salary: '$110K-$220K' },
        { title: 'Regional Directors', urgency: 'Medium', salary: '$90K-$180K' }
      ]
    };

    return hires[stage] || [];
  }

  /**
   * Get critical roles for stage
   * @private
   */
  _getCriticalRoles(stage, industry) {
    // Implementation would return critical roles from MINIMUM_STAFFING_REQUIREMENTS
    const roles = {
      'stage-1-startup': [
        { title: 'CEO', urgency: 'Critical - Day 1' },
        { title: 'CFO (Fractional)', urgency: 'Critical - Week 1' },
        { title: 'Head of Marketing', urgency: 'Critical - Week 1' },
        { title: 'General Counsel', urgency: 'High - Week 1' },
        { title: 'Head of HR', urgency: 'High - Week 2' }
      ]
    };
    return roles[stage] || [];
  }

  /**
   * Get recommended roles
   * @private
   */
  _getRecommendedRoles(stage, industry) {
    return [
      { title: 'Sales Representative', rationale: 'Revenue generation critical' },
      { title: 'Customer Success Manager', rationale: 'Customer retention' },
      { title: 'Operations Manager', rationale: 'Process efficiency' }
    ];
  }

  /**
   * Create hiring timeline
   * @private
   */
  _createHiringTimeline(stage, critical, recommended) {
    return {
      month1: critical.slice(0, 2),
      month2: critical.slice(2),
      month3: recommended.slice(0, 2),
      month6: recommended.slice(2)
    };
  }

  /**
   * Get staffing template
   * @private
   */
  _getStaffingTemplate(stage) {
    return {
      stage,
      description: `Staffing template for ${stage}`,
      structure: {}
    };
  }

  /**
   * Assess staffing gaps
   * @private
   */
  _assessStaffing(companyInfo) {
    const gaps = [];
    const mandatoryDepts = ['Marketing', 'Legal', 'HR', 'Executive'];
    
    return {
      type: 'staffing_assessment',
      priority: 'critical',
      message: 'Staffing Assessment',
      gaps: gaps
    };
  }

  /**
   * Get nested value from object
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Load best practices
   * @private
   */
  _loadBestPractices() {
    return {
      hiring: 'Hire slow, fire fast',
      culture: 'Culture is set from the top',
      scaling: 'Build processes before you need them'
    };
  }

  /**
   * Load validation rules
   * @private
   */
  _loadValidationRules() {
    return {};
  }

  /**
   * Load recommendations
   * @private
   */
  _loadRecommendations() {
    return {};
  }

  /**
   * Get context tips
   * @private
   */
  _getContextTips(jobTitle, stage, industry) {
    return [
      `In your ${stage} stage, focus on versatility and wearing multiple hats`,
      `This ${jobTitle} will likely report directly to CEO/leadership`,
      `Consider internal promotion opportunities as company grows`
    ];
  }

  /**
   * Get compensation guidance
   * @private
   */
  _getCompensationGuidance(jobTitle, industry, stage) {
    return {
      min: 60,
      max: 120,
      bonus: '10-20%',
      equity: '0.1-1%',
      note: 'Varies by location and candidate experience'
    };
  }

  /**
   * Get red flags
   * @private
   */
  _getRedFlags(jobTitle, industry) {
    return [
      'Candidate has no experience in this industry',
      'Frequent job hopping without good explanation',
      'Lacks enthusiasm for company mission'
    ];
  }

  /**
   * Get job template
   * @private
   */
  _getJobTemplate(jobTitle, industry) {
    return {
      responsibilities: ['Responsibility 1', 'Responsibility 2'],
      qualifications: ['Qualification 1'],
      kpis: ['KPI 1', 'KPI 2']
    };
  }

  /**
   * Get org template
   * @private
   */
  _getOrgTemplate(stage, industry) {
    return `${industry}-${stage}-template`;
  }

  /**
   * Get template
   * @private
   */
  _getTemplate(name) {
    return {};
  }

  /**
   * Get step recommendation
   * @private
   */
  _getStepRecommendation(step, session) {
    const recommendations = {
      company_info_review: 'Review and complete your basic company information',
      staffing_assessment: 'Let\'s assess your current staffing against industry best practices',
      ceo_cfo_hire: 'Identify or hire your CEO and CFO first',
      core_team_hire: 'Build your core team: Marketing, Legal, HR',
      org_structure_setup: 'Design your organizational structure',
      agent_profiles_creation: 'Create profiles for all team members',
      voice_configuration: 'Configure voice synthesis for AI agents',
      job_descriptions: 'Finalize job descriptions for all roles',
      final_review: 'Do a final review of everything'
    };
    return recommendations[step] || 'Complete this step';
  }

  /**
   * Get step guidance
   * @private
   */
  _getStepGuidance(step, session) {
    return 'Step guidance for ' + step;
  }
}

module.exports = AdminCoachingSystem;
