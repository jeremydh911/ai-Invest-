/**
 * Industry-Specific Workflow Engine
 * 
 * Features:
 * - Industry-specific workflows (Sales, Customer Service, Technical Support, Management)
 * - Agent-level specific flows (Entry-level, Mid-level, Senior, Manager, Executive)
 * - Workflow templates for each industry
 * - Agentic workflow execution with checkpoints
 * - Error handling and recovery
 * - Agent focus management (stay on track during work hours)
 * - Real-time progress tracking
 * - Automatic escalation paths
 * 
 * Workflows keep agents focused and productive
 */

class IndustryWorkflowEngine {
  constructor() {
    this.workflows = this._initializeWorkflows();
    this.templates = this._initializeTemplates();
    this.activeWorkflows = {}; // User -> { workflowId -> workflow instance }
    this.workflowProgress = {};
    this.workflowCheckpoints = {};
    this.industryConfigs = this._initializeIndustryConfigs();
  }

  /**
   * Start workflow for agent
   */
  startWorkflow(agentId, workflowType, industryType, agentLevel) {
    try {
      if (!agentId || !workflowType || !industryType) {
        throw new Error('Missing required parameters');
      }

      const workflow = this.templates[industryType]?.[agentLevel]?.[workflowType];
      if (!workflow) {
        throw new Error(`Workflow not found: ${industryType}/${agentLevel}/${workflowType}`);
      }

      const workflowInstanceId = `WF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const workflowInstance = {
        workflowInstanceId,
        agentId,
        workflowType,
        industryType,
        agentLevel,
        startedAt: new Date(),
        status: 'active', // active | paused | completed | failed
        currentStep: 0,
        totalSteps: workflow.steps.length,
        completedSteps: [],
        failedSteps: [],
        progress: 0,
        
        steps: workflow.steps.map((step, index) => ({
          stepId: step.id,
          stepNumber: index + 1,
          name: step.name,
          description: step.description,
          expectedDuration: step.expectedDuration,
          priority: step.priority,
          status: 'pending', // pending | in-progress | completed | failed | skipped
          startedAt: null,
          completedAt: null,
          result: null,
          errors: [],
          checkpoint: step.checkpoint || false,
          requiresApproval: step.requiresApproval || false,
          checkpoints: step.checkpoints || [],
          outputs: {}
        })),

        context: {
          customerInfo: null,
          ticketId: null,
          caseData: null,
          notes: [],
          attachments: [],
          metadata: {}
        },

        escalation: {
          escalated: false,
          escalatedTo: null,
          escalationReason: null,
          escalatedAt: null
        },

        focusMode: {
          enabled: true,
          allowedDuringWorkflow: workflow.allowedInterruptions || false,
          blockedActivities: workflow.blockedActivities || [],
          notifications: {
            silenced: true,
            delayedUntilCompletion: true
          }
        },

        timeTracking: {
          plannedDuration: workflow.estimatedTime || 0,
          actualDuration: 0,
          timeOverage: 0,
          efficiencyScore: 0
        },

        qualityMetrics: {
          stepsCompleted: 0,
          stepsOnTime: 0,
          errorsEncountered: 0,
          escalationsNeeded: 0,
          overallQuality: 0
        }
      };

      if (!this.activeWorkflows[agentId]) {
        this.activeWorkflows[agentId] = {};
      }
      this.activeWorkflows[agentId][workflowInstanceId] = workflowInstance;

      // Mark first step as in-progress
      workflowInstance.steps[0].status = 'in-progress';
      workflowInstance.steps[0].startedAt = new Date();
      workflowInstance.currentStep = 0;

      this._logEvent(workflowInstanceId, 'workflow_started', {
        agentId,
        workflowType,
        industryType,
        agentLevel
      });

      return {
        success: true,
        workflowInstanceId,
        workflow: {
          name: workflow.name,
          description: workflow.description,
          totalSteps: workflow.steps.length,
          estimatedTime: workflow.estimatedTime,
          currentStep: workflowInstance.steps[0]
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current workflow status
   */
  getWorkflowStatus(agentId, workflowInstanceId) {
    try {
      const workflow = this.activeWorkflows[agentId]?.[workflowInstanceId];
      if (!workflow) throw new Error('Workflow not found');

      const currentStep = workflow.steps[workflow.currentStep];
      const elapsedTime = new Date() - workflow.startedAt;

      return {
        success: true,
        workflow: {
          workflowInstanceId,
          agentId,
          workflowType: workflow.workflowType,
          status: workflow.status,
          progress: Math.round((workflow.completedSteps.length / workflow.totalSteps) * 100),
          currentStep: {
            stepNumber: workflow.currentStep + 1,
            name: currentStep.name,
            description: currentStep.description,
            expectedDuration: currentStep.expectedDuration,
            checkpoints: currentStep.checkpoints
          },
          timeElapsed: Math.round(elapsedTime / 1000 / 60), // minutes
          timeRemaining: Math.round((workflow.timeTracking.plannedDuration - elapsedTime / 1000 / 60)),
          completedSteps: workflow.completedSteps.length,
          totalSteps: workflow.totalSteps,
          focusModeActive: workflow.focusMode.enabled
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete current step and move to next
   */
  completeStep(agentId, workflowInstanceId, stepResult) {
    try {
      const workflow = this.activeWorkflows[agentId]?.[workflowInstanceId];
      if (!workflow) throw new Error('Workflow not found');

      const currentStep = workflow.steps[workflow.currentStep];
      if (!currentStep) throw new Error('No current step');

      // Validate checkpoints
      if (currentStep.checkpoints && currentStep.checkpoints.length > 0) {
        const checkpointValidation = this._validateCheckpoints(currentStep.checkpoints, stepResult);
        if (!checkpointValidation.valid) {
          return {
            success: false,
            error: `Checkpoints not met: ${checkpointValidation.failedCheckpoints.join(', ')}`,
            requiredCheckpoints: currentStep.checkpoints
          };
        }
      }

      // Mark step as completed
      currentStep.status = 'completed';
      currentStep.completedAt = new Date();
      currentStep.result = stepResult;
      workflow.completedSteps.push(currentStep.stepId);

      // Update quality metrics
      workflow.qualityMetrics.stepsCompleted++;
      const isOnTime = (currentStep.completedAt - currentStep.startedAt) <= (currentStep.expectedDuration * 60 * 1000);
      if (isOnTime) {
        workflow.qualityMetrics.stepsOnTime++;
      }

      // Move to next step
      if (workflow.currentStep < workflow.steps.length - 1) {
        workflow.currentStep++;
        const nextStep = workflow.steps[workflow.currentStep];
        nextStep.status = 'in-progress';
        nextStep.startedAt = new Date();

        return {
          success: true,
          message: `Step completed. Moving to: ${nextStep.name}`,
          nextStep: {
            stepNumber: workflow.currentStep + 1,
            name: nextStep.name,
            description: nextStep.description,
            checkpoints: nextStep.checkpoints
          }
        };
      } else {
        // Workflow complete
        workflow.status = 'completed';
        workflow.completedAt = new Date();
        workflow.timeTracking.actualDuration = (workflow.completedAt - workflow.startedAt) / 1000 / 60;

        // Calculate quality score
        workflow.qualityMetrics.overallQuality = Math.round(
          (workflow.qualityMetrics.stepsOnTime / workflow.qualityMetrics.stepsCompleted) * 100
        );

        this._logEvent(workflowInstanceId, 'workflow_completed', {
          agentId,
          completionTime: workflow.timeTracking.actualDuration,
          qualityScore: workflow.qualityMetrics.overallQuality
        });

        return {
          success: true,
          message: 'Workflow completed successfully',
          workflowSummary: {
            completionTime: workflow.timeTracking.actualDuration + ' minutes',
            stepsCompleted: workflow.qualityMetrics.stepsCompleted,
            stepsOnTime: workflow.qualityMetrics.stepsOnTime,
            qualityScore: workflow.qualityMetrics.overallQuality
          }
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle error in current step
   */
  handleStepError(agentId, workflowInstanceId, errorData) {
    try {
      const workflow = this.activeWorkflows[agentId]?.[workflowInstanceId];
      if (!workflow) throw new Error('Workflow not found');

      const currentStep = workflow.steps[workflow.currentStep];
      currentStep.errors.push({
        timestamp: new Date(),
        message: errorData.message,
        severity: errorData.severity || 'medium', // low | medium | high | critical
        resolution: errorData.resolution || 'Try again'
      });

      workflow.qualityMetrics.errorsEncountered++;

      // Determine action based on severity
      if (errorData.severity === 'critical') {
        // Auto-escalate
        return this.escalateWorkflow(agentId, workflowInstanceId, 'Critical error encountered', 'system');
      }

      if (errorData.recoveryAction === 'retry') {
        return {
          success: true,
          action: 'retry',
          message: 'Attempting to recover...',
          suggestion: errorData.resolution
        };
      } else if (errorData.recoveryAction === 'skip') {
        return this.skipStep(agentId, workflowInstanceId, errorData.reason);
      }

      return {
        success: true,
        message: 'Error recorded',
        action: 'continue',
        suggestion: errorData.resolution
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Skip step (only allowed for certain workflows)
   */
  skipStep(agentId, workflowInstanceId, reason) {
    try {
      const workflow = this.activeWorkflows[agentId]?.[workflowInstanceId];
      if (!workflow) throw new Error('Workflow not found');

      const currentStep = workflow.steps[workflow.currentStep];
      if (!currentStep.skipAllowed && currentStep.stepId !== 'optional-step') {
        throw new Error('This step cannot be skipped');
      }

      currentStep.status = 'skipped';
      currentStep.skipReason = reason;

      // Move to next step
      if (workflow.currentStep < workflow.steps.length - 1) {
        workflow.currentStep++;
        const nextStep = workflow.steps[workflow.currentStep];
        nextStep.status = 'in-progress';
        nextStep.startedAt = new Date();

        return {
          success: true,
          message: `Step skipped: ${currentStep.name}`,
          nextStep: nextStep.name
        };
      }

      return { success: true, message: 'Step skipped' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Escalate workflow to supervisor/manager
   */
  escalateWorkflow(agentId, workflowInstanceId, reason, escalatedBy) {
    try {
      const workflow = this.activeWorkflows[agentId]?.[workflowInstanceId];
      if (!workflow) throw new Error('Workflow not found');

      const supervisor = this._getAppropriateManager(agentId);

      workflow.escalation = {
        escalated: true,
        escalatedTo: supervisor,
        escalationReason: reason,
        escalatedAt: new Date(),
        escalatedBy
      };

      workflow.status = 'escalated';

      workflow.qualityMetrics.escalationsNeeded++;

      this._logEvent(workflowInstanceId, 'workflow_escalated', {
        agentId,
        escalatedTo: supervisor,
        reason
      });

      return {
        success: true,
        message: 'Workflow escalated',
        escalatedTo: supervisor,
        nextSteps: 'Awaiting supervisor review and guidance'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available workflows for agent
   */
  getAvailableWorkflows(agentId, industryType, agentLevel) {
    try {
      const templates = this.templates[industryType]?.[agentLevel];
      if (!templates) {
        throw new Error(`No workflows available for ${industryType}/${agentLevel}`);
      }

      const workflows = Object.entries(templates).map(([key, workflow]) => ({
        workflowType: key,
        name: workflow.name,
        description: workflow.description,
        estimatedTime: workflow.estimatedTime,
        difficulty: workflow.difficulty,
        stepCount: workflow.steps.length,
        category: workflow.category
      }));

      return {
        success: true,
        industryType,
        agentLevel,
        workflows
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent focus status
   */
  getAgentFocusStatus(agentId) {
    try {
      const activeWorkflows = this.activeWorkflows[agentId] || {};
      const activeWF = Object.values(activeWorkflows).find(wf => wf.status === 'active');

      if (!activeWF) {
        return {
          success: true,
          focusMode: false,
          message: 'No active workflow'
        };
      }

      return {
        success: true,
        focusMode: activeWF.focusMode.enabled,
        currentWorkflow: {
          name: activeWF.workflowType,
          progress: Math.round((activeWF.completedSteps.length / activeWF.totalSteps) * 100),
          currentStep: activeWF.steps[activeWF.currentStep]?.name,
          timeRemaining: activeWF.timeTracking.plannedDuration - 
                        (new Date() - activeWF.startedAt) / 1000 / 60
        },
        blockedActivities: activeWF.focusMode.blockedActivities,
        allowedActivities: this._getAllowedActivities(activeWF)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPERS ============

  _initializeWorkflows() {
    return {};
  }

  _initializeTemplates() {
    return {
      'technology': {
        'entry-level': {
          'customer-support': {
            name: 'Customer Support Ticket',
            description: 'Handle customer support request',
            category: 'support',
            estimatedTime: 15,
            difficulty: 'easy',
            blockedActivities: ['document-creation', 'external-communication'],
            allowedInterruptions: false,
            steps: [
              {
                id: 'ticket-receive',
                name: 'Receive Ticket',
                description: 'Review customer support ticket',
                expectedDuration: 2,
                priority: 'high',
                checkpoint: true,
                checkpoints: ['Ticket understood', 'Customer name verified'],
                skipAllowed: false
              },
              {
                id: 'investigate',
                name: 'Investigate Issue',
                description: 'Troubleshoot the problem',
                expectedDuration: 8,
                priority: 'high',
                checkpoint: true,
                checkpoints: ['Root cause identified'],
                skipAllowed: false
              },
              {
                id: 'provide-solution',
                name: 'Provide Solution',
                description: 'Send resolution to customer',
                expectedDuration: 3,
                priority: 'high',
                checkpoint: true,
                checkpoints: ['Customer response requested'],
                skipAllowed: false
              },
              {
                id: 'follow-up',
                name: 'Follow-up',
                description: 'Confirm customer satisfaction',
                expectedDuration: 2,
                priority: 'medium',
                checkpoint: true,
                checkpoints: ['Ticket closed'],
                skipAllowed: true
              }
            ]
          },
          'lead-qualification': {
            name: 'Lead Qualification',
            description: 'Qualify and categorize leads',
            category: 'sales',
            estimatedTime: 10,
            difficulty: 'easy',
            blockedActivities: ['complex-documentation'],
            steps: [
              {
                id: 'lead-review',
                name: 'Review Lead',
                description: 'Analyze lead information',
                expectedDuration: 3,
                priority: 'high'
              },
              {
                id: 'assess-fit',
                name: 'Assess Fit',
                description: 'Determine if lead matches criteria',
                expectedDuration: 4,
                priority: 'high',
                checkpoints: ['Fit assessment completed']
              },
              {
                id: 'categorize',
                name: 'Categorize Lead',
                description: 'Tag and categorize lead',
                expectedDuration: 3,
                priority: 'medium'
              }
            ]
          }
        },
        'mid-level': {
          'complex-issue-resolution': {
            name: 'Complex Issue Resolution',
            description: 'Resolve complex technical issues',
            category: 'support',
            estimatedTime: 45,
            difficulty: 'hard',
            blockedActivities: ['casual-browsing'],
            steps: [
              {
                id: 'diagnose',
                name: 'Comprehensive Diagnosis',
                description: 'Deep dive investigation',
                expectedDuration: 20,
                priority: 'high',
                checkpoints: ['Comprehensive analysis complete']
              },
              {
                id: 'design-solution',
                name: 'Design Solution',
                description: 'Create solution plan',
                expectedDuration: 15,
                priority: 'high'
              },
              {
                id: 'implement',
                name: 'Implement Solution',
                description: 'Apply fix',
                expectedDuration: 10,
                priority: 'high'
              }
            ]
          }
        },
        'manager': {
          'team-performance-review': {
            name: 'Team Performance Review',
            description: 'Conduct team performance reviews',
            category: 'management',
            estimatedTime: 120,
            difficulty: 'hard',
            steps: [
              {
                id: 'prepare-data',
                name: 'Prepare Performance Data',
                expectedDuration: 30,
                priority: 'high'
              },
              {
                id: 'conduct-review',
                name: 'Conduct Review',
                expectedDuration: 60,
                priority: 'high'
              },
              {
                id: 'document',
                name: 'Document Results',
                expectedDuration: 30,
                priority: 'high'
              }
            ]
          }
        }
      },
      'sales': {
        'entry-level': {
          'sales-call': {
            name: 'Sales Call Process',
            description: 'Conduct structured sales call',
            category: 'sales',
            estimatedTime: 20,
            difficulty: 'medium',
            blockedActivities: ['multitasking'],
            steps: [
              { id: 'prepare', name: 'Prepare Call', expectedDuration: 3, priority: 'high' },
              { id: 'connect', name: 'Connect with Client', expectedDuration: 2, priority: 'high' },
              { id: 'discovery', name: 'Discovery Phase', expectedDuration: 8, priority: 'high' },
              { id: 'pitch', name: 'Pitch Product', expectedDuration: 5, priority: 'high' },
              { id: 'handle-objections', name: 'Handle Objections', expectedDuration: 2, priority: 'medium' }
            ]
          }
        }
      },
      'customer-service': {
        'entry-level': {
          'service-interaction': {
            name: 'Customer Service Interaction',
            description: 'Handle customer service request',
            category: 'service',
            estimatedTime: 12,
            difficulty: 'easy',
            blockedActivities: [],
            steps: [
              { id: 'greet', name: 'Greet Customer', expectedDuration: 1, priority: 'high' },
              { id: 'understand', name: 'Understand Need', expectedDuration: 4, priority: 'high' },
              { id: 'assist', name: 'Provide Assistance', expectedDuration: 5, priority: 'high' },
              { id: 'confirm', name: 'Confirm Resolution', expectedDuration: 2, priority: 'high' }
            ]
          }
        }
      }
    };
  }

  _initializeIndustryConfigs() {
    return {
      'technology': { name: 'Technology', color: '#0078D4' },
      'sales': { name: 'Sales', color: '#107C10' },
      'customer-service': { name: 'Customer Service', color: '#DA3B01' },
      'finance': { name: 'Finance', color: '#001A70' }
    };
  }

  _validateCheckpoints(checkpoints, result) {
    const failedCheckpoints = checkpoints.filter(cp => !result[cp] && result[cp] !== false);
    return {
      valid: failedCheckpoints.length === 0,
      failedCheckpoints
    };
  }

  _getAppropriateManager(agentId) {
    // Attempt to lookup via AgentProfileService if instantiated
    try {
      if (this.agentProfileService) {
        const chain = this.agentProfileService.getReportingChain(agentId);
        if (chain && chain.length > 1) {
          return chain[1].id; // The immediate manager
        }
      }
    } catch (e) {
      console.warn('Could not lookup manager from profile service', e.message);
    }
    
    // Fallback to record in logs for manual assignment
    return 'SYSTEM_QUEUE';
  }

  _getAllowedActivities(workflow) {
    const allActivities = [
      'email',
      'messaging',
      'phone-calls',
      'note-taking',
      'document-creation',
      'break-room'
    ];

    return allActivities.filter(activity => 
      !workflow.focusMode.blockedActivities.includes(activity)
    );
  }

  _logEvent(workflowId, eventType, eventData) {
    console.log('[WORKFLOW_AUDIT]', {
      timestamp: new Date(),
      workflowId,
      eventType,
      eventData
    });
  }
}

module.exports = IndustryWorkflowEngine;
