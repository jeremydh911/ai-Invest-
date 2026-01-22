/**
 * Agentic Empire API Routes
 * 
 * RESTful API endpoints for all 12 services
 * 30+ routes covering:
 * - Agent Onboarding (5 routes)
 * - CEO Hiring Engine (4 routes)
 * - HR Voice Interview (6 routes)
 * - Agent Backstory (5 routes)
 * - End-of-Day Reporting (4 routes)
 * - Call Center (5 routes)
 * - Call Quality ML (4 routes)
 * - Compliance Certification (4 routes)
 * - Document Editor (6 routes)
 * - Email & Messaging (8 routes)
 * - Industry Workflow Engine (6 routes)
 * - Agent Focus Control (6 routes)
 * 
 * Total: 63 API endpoints
 */

class AgenticEmpireAPI {
  constructor(services) {
    this.services = services;
    this.routes = {};
    this._initializeRoutes();
  }

  /**
   * Initialize all API routes
   */
  _initializeRoutes() {
    // ============ AGENT ONBOARDING ROUTES ============
    this.routes.onboarding = {
      'POST /api/onboarding/start': (req) => 
        this.services.onboarding.startOnboarding(req.agentId, req.body.position, req.body.department),
      
      'GET /api/onboarding/:sessionId/progress': (req) =>
        this.services.onboarding.getProgress(req.params.sessionId),
      
      'POST /api/onboarding/:sessionId/step/:stepId': (req) =>
        this.services.onboarding.completeStep(req.params.sessionId, req.params.stepId, req.body.result),
      
      'GET /api/onboarding/:sessionId/checklist': (req) =>
        this.services.onboarding.getOnboardingChecklist(req.params.sessionId),
      
      'POST /api/onboarding/:sessionId/training': (req) =>
        this.services.onboarding.assignTrainingModules(req.params.sessionId, req.body.modules)
    };

    // ============ CEO HIRING ENGINE ROUTES ============
    this.routes.hiring = {
      'POST /api/hiring/request': (req) =>
        this.services.hiring.createHiringRequest(req.body.positionTitle, req.body.department, req.body.urgency),
      
      'GET /api/hiring/dashboard': (req) =>
        this.services.hiring.getCEOHiringDashboard(req.userId),
      
      'POST /api/hiring/:requestId/decide': (req) =>
        this.services.hiring.decideOnHiringRequest(req.params.requestId, req.body.decision, req.body.reasoning),
      
      'GET /api/hiring/:requestId/details': (req) =>
        this.services.hiring.getHiringRequestDetails(req.params.requestId)
    };

    // ============ HR VOICE INTERVIEW ROUTES ============
    this.routes.hrInterview = {
      'POST /api/hr-interview/schedule': (req) =>
        this.services.hrInterview.scheduleVoiceInterview(req.body.hiringRequestId, req.body.candidateName, req.body.interviewSlot),
      
      'POST /api/hr-interview/:interviewId/start': (req) =>
        this.services.hrInterview.startVoiceInterview(req.params.interviewId),
      
      'POST /api/hr-interview/:interviewId/complete': (req) =>
        this.services.hrInterview.completeVoiceInterview(req.params.interviewId, req.body.transcript),
      
      'POST /api/hr-interview/:interviewId/score': (req) =>
        this.services.hrInterview.scoreInterview(req.params.interviewId, req.body.scores),
      
      'GET /api/hr-interview/admin/inbox': (req) =>
        this.services.hrInterview.getAdminInbox(req.userId),
      
      'POST /api/hr-interview/:interviewId/route': (req) =>
        this.services.hrInterview.routeInterviewToInbox(req.params.interviewId, req.body.inboxType)
    };

    // ============ AGENT BACKSTORY ROUTES ============
    this.routes.backstory = {
      'POST /api/backstory/profile': (req) =>
        this.services.backstory.createAgentProfile(req.agentId, req.body.basicInfo),
      
      'GET /api/backstory/:agentId/profile': (req) =>
        this.services.backstory.getAgentProfile(req.params.agentId, req.viewerRole),
      
      'POST /api/backstory/:agentId/daily-update': (req) =>
        this.services.backstory.addDailyLifeUpdate(req.params.agentId, req.body.update),
      
      'POST /api/backstory/:agentId/milestone': (req) =>
        this.services.backstory.recordMilestone(req.params.agentId, req.body.milestone),
      
      'GET /api/backstory/team-connections/:agentId': (req) =>
        this.services.backstory.findTeamConnections(req.params.agentId)
    };

    // ============ END-OF-DAY REPORTING ROUTES ============
    this.routes.eodReporting = {
      'POST /api/reporting/daily': (req) =>
        this.services.eodReporting.submitDailyReport(req.agentId, req.body.reportData),
      
      'GET /api/reporting/manager-dashboard': (req) =>
        this.services.eodReporting.getManagerDashboard(req.userId),
      
      'POST /api/reporting/:reportId/review': (req) =>
        this.services.eodReporting.reviewAgentReport(req.params.reportId, req.body.review),
      
      'GET /api/reporting/:reportId/details': (req) =>
        this.services.eodReporting.getReportDetails(req.params.reportId)
    };

    // ============ CALL CENTER ROUTES ============
    this.routes.callCenter = {
      'POST /api/calls/inbound': (req) =>
        this.services.callCenter.handleInboundCall(req.body.callerId, req.body.callData),
      
      'POST /api/calls/outbound': (req) =>
        this.services.callCenter.handleOutboundCall(req.agentId, req.body.recipientId, req.body.callData),
      
      'POST /api/calls/:callId/process-speech': (req) =>
        this.services.callCenter.processSpeechWithDLPCheck(req.params.callId, req.body.transcript),
      
      'POST /api/calls/:callId/verify-passphrase': (req) =>
        this.services.callCenter.verifyAdminPassphraseVerbally(req.params.callId, req.body.passphrase),
      
      'POST /api/calls/:callId/complete': (req) =>
        this.services.callCenter.completeCall(req.params.callId, req.body.duration)
    };

    // ============ CALL QUALITY ML ROUTES ============
    this.routes.callQuality = {
      'POST /api/call-quality/review': (req) =>
        this.services.callQuality.startCallReview(req.body.callId, req.body.transcript, req.body.metadata),
      
      'POST /api/call-quality/:reviewId/analyze': (req) =>
        this.services.callQuality.analyzeTranscript(req.params.reviewId, req.body.transcript),
      
      'GET /api/call-quality/team-performance': (req) =>
        this.services.callQuality.getTeamPerformanceDashboard(req.userId),
      
      'GET /api/call-quality/:agentId/training-gaps': (req) =>
        this.services.callQuality.identifyTrainingGaps(req.params.agentId)
    };

    // ============ COMPLIANCE CERTIFICATION ROUTES ============
    this.routes.compliance = {
      'GET /api/compliance/status': (req) =>
        this.services.compliance.getComplianceStatus(),
      
      'GET /api/compliance/checklist': (req) =>
        this.services.compliance.getComplianceChecklist(),
      
      'GET /api/compliance/free-trainings': (req) =>
        this.services.compliance.getFreeTrainings(),
      
      'POST /api/compliance/training-complete': (req) =>
        this.services.compliance.completeTraining(req.body.trainingId, req.body.agentId, req.body.certificateUrl)
    };

    // ============ DOCUMENT EDITOR ROUTES ============
    this.routes.documents = {
      'POST /api/documents': (req) =>
        this.services.documents.createDocument(req.userId, req.body.documentData),
      
      'PUT /api/documents/:docId': (req) =>
        this.services.documents.updateDocumentContent(req.params.docId, req.userId, req.body.content),
      
      'GET /api/documents/:docId/ai-assistance': (req) =>
        this.services.documents.getAIAssistance(req.params.docId, req.query.type),
      
      'POST /api/documents/:docId/share': (req) =>
        this.services.documents.shareDocument(req.params.docId, req.userId, req.body.shareOptions),
      
      'POST /api/documents/:docId/template': (req) =>
        this.services.documents.saveAsTemplate(req.params.docId, req.userId, req.body.templateName),
      
      'GET /api/documents/:docId/history': (req) =>
        this.services.documents.getDocumentHistory(req.params.docId)
    };

    // ============ EMAIL & MESSAGING ROUTES ============
    this.routes.email = {
      'GET /api/mail/mailbox': (req) =>
        this.services.email.getOrCreateMailbox(req.userId, req.body.email),
      
      'POST /api/mail/send': (req) =>
        this.services.email.composeAndSendEmail(req.userId, req.body.emailData),
      
      'POST /api/mail/draft': (req) =>
        this.services.email.saveDraft(req.userId, req.body.draftData),
      
      'GET /api/mail/inbox': (req) =>
        this.services.email.getInbox(req.userId, req.query.limit),
      
      'POST /api/mail/message/:messageId/direct': (req) =>
        this.services.email.sendDirectMessage(req.userId, req.body.recipientId, req.body.content),
      
      'GET /api/mail/conversation/:threadId': (req) =>
        this.services.email.getConversationThread(req.params.threadId, req.userId),
      
      'GET /api/mail/search': (req) =>
        this.services.email.searchEmails(req.userId, req.query.term),
      
      'GET /api/mail/templates': (req) =>
        this.services.email.getEmailTemplates()
    };

    // ============ WORKFLOW ENGINE ROUTES ============
    this.routes.workflows = {
      'POST /api/workflows/start': (req) =>
        this.services.workflows.startWorkflow(req.agentId, req.body.workflowType, req.body.industryType, req.body.agentLevel),
      
      'GET /api/workflows/:workflowId/status': (req) =>
        this.services.workflows.getWorkflowStatus(req.agentId, req.params.workflowId),
      
      'POST /api/workflows/:workflowId/step-complete': (req) =>
        this.services.workflows.completeStep(req.agentId, req.params.workflowId, req.body.result),
      
      'POST /api/workflows/:workflowId/error': (req) =>
        this.services.workflows.handleStepError(req.agentId, req.params.workflowId, req.body.errorData),
      
      'POST /api/workflows/:workflowId/escalate': (req) =>
        this.services.workflows.escalateWorkflow(req.agentId, req.params.workflowId, req.body.reason, 'agent'),
      
      'GET /api/workflows/available': (req) =>
        this.services.workflows.getAvailableWorkflows(req.agentId, req.query.industry, req.query.level)
    };

    // ============ AGENT FOCUS CONTROL ROUTES ============
    this.routes.focus = {
      'POST /api/focus/session-start': (req) =>
        this.services.focus.startWorkSession(req.agentId, req.body.agentInfo),
      
      'POST /api/focus/activity-log': (req) =>
        this.services.focus.logActivity(req.agentId, req.body.activity, req.body.data),
      
      'GET /api/focus/metrics': (req) =>
        this.services.focus.getFocusMetrics(req.agentId),
      
      'POST /api/focus/focus-mode': (req) =>
        this.services.focus.requestFocusMode(req.agentId, req.body.duration, req.body.context),
      
      'POST /api/focus/break': (req) =>
        this.services.focus.takeBreak(req.agentId, req.body.breakType, req.body.duration),
      
      'POST /api/focus/session-end': (req) =>
        this.services.focus.endWorkSession(req.agentId)
    };

    // ============ MANAGER & ADMIN ROUTES ============
    this.routes.management = {
      'GET /api/manager/focus-dashboard': (req) =>
        this.services.focus.getManagerDashboard(req.userId, req.body.teamAgentIds),
      
      'GET /api/agent/:agentId/daily-summary': (req) =>
        this.services.focus.getAgentDailySummary(req.params.agentId),
      
      'GET /api/agent/:agentId/compliance-report': (req) =>
        this.services.compliance.generateComplianceReport(req.params.agentId),
      
      'GET /api/ceo/hiring-charts': (req) =>
        this.services.hiring.getIndustryGrowthCharts(req.query.industry),
      
      'GET /api/ceo/reporting-dashboard': (req) =>
        this.services.eodReporting.getCEOReportingDashboard(req.userId),
      
      'GET /api/ceo/trend-analysis': (req) =>
        this.services.eodReporting.getTrendAnalysis(req.query.days)
    };
  }

  /**
   * Route incoming request
   */
  handleRequest(method, path, req) {
    try {
      const routeKey = `${method} ${path}`;

      // Search for matching route in all route categories
      for (const category of Object.values(this.routes)) {
        if (category[routeKey]) {
          const result = category[routeKey](req);
          return this._formatResponse(result);
        }
      }

      // Route not found
      return this._formatResponse({
        success: false,
        error: `Route not found: ${routeKey}`,
        statusCode: 404
      });
    } catch (error) {
      return this._formatResponse({
        success: false,
        error: error.message,
        statusCode: 500
      });
    }
  }

  /**
   * Format response
   */
  _formatResponse(result) {
    return {
      success: result.success,
      data: result.success ? result : null,
      error: !result.success ? result.error : null,
      statusCode: result.statusCode || (result.success ? 200 : 400),
      timestamp: new Date()
    };
  }

  /**
   * Get all available routes
   */
  getAllRoutes() {
    const allRoutes = [];
    
    for (const [category, routes] of Object.entries(this.routes)) {
      for (const route of Object.keys(routes)) {
        allRoutes.push({
          category,
          route
        });
      }
    }

    return {
      total: allRoutes.length,
      byCategory: Object.keys(this.routes).reduce((acc, cat) => {
        acc[cat] = Object.keys(this.routes[cat]).length;
        return acc;
      }, {}),
      routes: allRoutes
    };
  }

  /**
   * Get route documentation
   */
  getRouteDocumentation(category) {
    const docs = {
      onboarding: {
        description: 'Agent onboarding workflow management',
        routes: [
          { method: 'POST', path: '/api/onboarding/start', description: 'Start onboarding session' },
          { method: 'GET', path: '/api/onboarding/:sessionId/progress', description: 'Get onboarding progress' },
          { method: 'POST', path: '/api/onboarding/:sessionId/step/:stepId', description: 'Complete onboarding step' },
          { method: 'GET', path: '/api/onboarding/:sessionId/checklist', description: 'Get onboarding checklist' },
          { method: 'POST', path: '/api/onboarding/:sessionId/training', description: 'Assign training modules' }
        ]
      },
      hiring: {
        description: 'CEO hiring engine and decision support',
        routes: [
          { method: 'POST', path: '/api/hiring/request', description: 'Create hiring request' },
          { method: 'GET', path: '/api/hiring/dashboard', description: 'Get CEO hiring dashboard' },
          { method: 'POST', path: '/api/hiring/:requestId/decide', description: 'Make hiring decision' },
          { method: 'GET', path: '/api/hiring/:requestId/details', description: 'Get hiring request details' }
        ]
      },
      hrInterview: {
        description: 'HR voice interview scheduling and management',
        routes: [
          { method: 'POST', path: '/api/hr-interview/schedule', description: 'Schedule voice interview' },
          { method: 'POST', path: '/api/hr-interview/:interviewId/start', description: 'Start voice interview' },
          { method: 'POST', path: '/api/hr-interview/:interviewId/complete', description: 'Complete interview' },
          { method: 'POST', path: '/api/hr-interview/:interviewId/score', description: 'Score interview' },
          { method: 'GET', path: '/api/hr-interview/admin/inbox', description: 'Get admin interview inbox' },
          { method: 'POST', path: '/api/hr-interview/:interviewId/route', description: 'Route to inbox' }
        ]
      },
      backstory: {
        description: 'Agent personal profiles and life stories',
        routes: [
          { method: 'POST', path: '/api/backstory/profile', description: 'Create agent profile' },
          { method: 'GET', path: '/api/backstory/:agentId/profile', description: 'Get agent profile' },
          { method: 'POST', path: '/api/backstory/:agentId/daily-update', description: 'Add daily life update' },
          { method: 'POST', path: '/api/backstory/:agentId/milestone', description: 'Record milestone' },
          { method: 'GET', path: '/api/backstory/team-connections/:agentId', description: 'Find team connections' }
        ]
      },
      eodReporting: {
        description: 'End-of-day reporting and analytics',
        routes: [
          { method: 'POST', path: '/api/reporting/daily', description: 'Submit daily report' },
          { method: 'GET', path: '/api/reporting/manager-dashboard', description: 'Get manager dashboard' },
          { method: 'POST', path: '/api/reporting/:reportId/review', description: 'Review agent report' },
          { method: 'GET', path: '/api/reporting/:reportId/details', description: 'Get report details' }
        ]
      },
      callCenter: {
        description: 'Inbound/outbound call handling',
        routes: [
          { method: 'POST', path: '/api/calls/inbound', description: 'Handle inbound call' },
          { method: 'POST', path: '/api/calls/outbound', description: 'Handle outbound call' },
          { method: 'POST', path: '/api/calls/:callId/process-speech', description: 'Process speech with DLP' },
          { method: 'POST', path: '/api/calls/:callId/verify-passphrase', description: 'Verify passphrase' },
          { method: 'POST', path: '/api/calls/:callId/complete', description: 'Complete call' }
        ]
      },
      callQuality: {
        description: 'Call quality review and ML analysis',
        routes: [
          { method: 'POST', path: '/api/call-quality/review', description: 'Start call review' },
          { method: 'POST', path: '/api/call-quality/:reviewId/analyze', description: 'Analyze transcript' },
          { method: 'GET', path: '/api/call-quality/team-performance', description: 'Get team dashboard' },
          { method: 'GET', path: '/api/call-quality/:agentId/training-gaps', description: 'Identify training gaps' }
        ]
      },
      compliance: {
        description: 'Compliance certification and training',
        routes: [
          { method: 'GET', path: '/api/compliance/status', description: 'Get compliance status' },
          { method: 'GET', path: '/api/compliance/checklist', description: 'Get compliance checklist' },
          { method: 'GET', path: '/api/compliance/free-trainings', description: 'Get free trainings' },
          { method: 'POST', path: '/api/compliance/training-complete', description: 'Complete training' }
        ]
      },
      documents: {
        description: 'Document editing with AI assistance',
        routes: [
          { method: 'POST', path: '/api/documents', description: 'Create document' },
          { method: 'PUT', path: '/api/documents/:docId', description: 'Update document' },
          { method: 'GET', path: '/api/documents/:docId/ai-assistance', description: 'Get AI assistance' },
          { method: 'POST', path: '/api/documents/:docId/share', description: 'Share document' },
          { method: 'POST', path: '/api/documents/:docId/template', description: 'Save as template' },
          { method: 'GET', path: '/api/documents/:docId/history', description: 'Get document history' }
        ]
      },
      email: {
        description: 'Email and messaging system',
        routes: [
          { method: 'GET', path: '/api/mail/mailbox', description: 'Get or create mailbox' },
          { method: 'POST', path: '/api/mail/send', description: 'Send email' },
          { method: 'POST', path: '/api/mail/draft', description: 'Save draft' },
          { method: 'GET', path: '/api/mail/inbox', description: 'Get inbox' },
          { method: 'POST', path: '/api/mail/message/:messageId/direct', description: 'Send direct message' },
          { method: 'GET', path: '/api/mail/conversation/:threadId', description: 'Get conversation thread' },
          { method: 'GET', path: '/api/mail/search', description: 'Search emails' },
          { method: 'GET', path: '/api/mail/templates', description: 'Get email templates' }
        ]
      },
      workflows: {
        description: 'Industry-specific workflow management',
        routes: [
          { method: 'POST', path: '/api/workflows/start', description: 'Start workflow' },
          { method: 'GET', path: '/api/workflows/:workflowId/status', description: 'Get workflow status' },
          { method: 'POST', path: '/api/workflows/:workflowId/step-complete', description: 'Complete step' },
          { method: 'POST', path: '/api/workflows/:workflowId/error', description: 'Handle error' },
          { method: 'POST', path: '/api/workflows/:workflowId/escalate', description: 'Escalate workflow' },
          { method: 'GET', path: '/api/workflows/available', description: 'Get available workflows' }
        ]
      },
      focus: {
        description: 'Agent focus control and productivity',
        routes: [
          { method: 'POST', path: '/api/focus/session-start', description: 'Start work session' },
          { method: 'POST', path: '/api/focus/activity-log', description: 'Log activity' },
          { method: 'GET', path: '/api/focus/metrics', description: 'Get focus metrics' },
          { method: 'POST', path: '/api/focus/focus-mode', description: 'Request focus mode' },
          { method: 'POST', path: '/api/focus/break', description: 'Take break' },
          { method: 'POST', path: '/api/focus/session-end', description: 'End work session' }
        ]
      },
      management: {
        description: 'Manager and admin dashboards',
        routes: [
          { method: 'GET', path: '/api/manager/focus-dashboard', description: 'Get focus dashboard' },
          { method: 'GET', path: '/api/agent/:agentId/daily-summary', description: 'Get agent summary' },
          { method: 'GET', path: '/api/agent/:agentId/compliance-report', description: 'Get compliance report' },
          { method: 'GET', path: '/api/ceo/hiring-charts', description: 'Get hiring charts' },
          { method: 'GET', path: '/api/ceo/reporting-dashboard', description: 'Get reporting dashboard' },
          { method: 'GET', path: '/api/ceo/trend-analysis', description: 'Get trend analysis' }
        ]
      }
    };

    if (category && docs[category]) {
      return docs[category];
    }

    return docs;
  }
}

module.exports = AgenticEmpireAPI;
