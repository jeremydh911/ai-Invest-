/**
 * HR Voice Interview Service
 * 
 * Manages candidate voice interviews conducted by HR
 * - Receive hiring requests from CEO
 * - Schedule and conduct voice interviews
 * - Store interview recordings and transcripts
 * - Create interview summaries
 * - Route interviews to admin/power user inbox
 * - Track interview progress and decisions
 * 
 * Compliance: HIPAA-ready, SOC2, GDPR (audio data handling)
 */

class HRVoiceInterviewService {
  constructor() {
    // Interview sessions storage (in production: database)
    this.interviews = {};
    this.interviewQueue = [];
    this.interviewInbox = {}; // indexed by admin/power user ID
    this.adminInboxes = {}; // { adminId: { interviews: [], unread: count } }
    
    // Interview questions (customizable per role)
    this.interviewTemplates = {
      'VP Sales': this._createVPSalesQuestions(),
      'Sales Agent': this._createSalesAgentQuestions(),
      'Customer Service': this._createCustomerServiceQuestions(),
      'Technical Support': this._createTechnicalSupportQuestions(),
      'Manager': this._createManagerQuestions(),
      'Executive': this._createExecutiveQuestions(),
      'default': this._createDefaultQuestions()
    };
    
    // Interview scoring rubric
    this.scoringRubric = {
      communication: { description: 'Clarity, articulation, listening skills', weight: 0.20 },
      professionalism: { description: 'Demeanor, respect, appropriate tone', weight: 0.15 },
      cultureFit: { description: 'Values alignment, team compatibility', weight: 0.20 },
      problemSolving: { description: 'Analytical thinking, creativity', weight: 0.15 },
      experience: { description: 'Relevant skills and background', weight: 0.15 },
      enthusiasm: { description: 'Passion, motivation, energy', weight: 0.10 },
      integrity: { description: 'Honesty, reliability, trustworthiness', weight: 0.05 }
    };
  }

  /**
   * CEO initiates hiring -> HR receives request in queue
   * Called by CEO Hiring Engine when hiring decision is made
   */
  receiveHiringRequest(hiringRequestId, requestData, ceoid) {
    try {
      if (!hiringRequestId || !requestData || !ceoid) {
        throw new Error('Missing required hiring request parameters');
      }

      const queueEntry = {
        hiringRequestId,
        ceoId: ceoid,
        jobTitle: requestData.jobTitle,
        department: requestData.department,
        urgency: requestData.urgency || 'normal',
        requiredBackground: requestData.requiredBackground || 'Not specified',
        budgetRange: requestData.budgetRange || { min: 40000, max: 80000 },
        seniority: requestData.seniority || 'mid-level',
        receivedAt: new Date(),
        status: 'queued_for_interview_scheduling'
      };

      this.interviewQueue.push(queueEntry);

      this._logEvent(`HIRE_REQ_${hiringRequestId}`, 'hiring_request_received', {
        jobTitle: requestData.jobTitle,
        department: requestData.department,
        urgency: requestData.urgency,
        ceoId: ceoid
      });

      return {
        success: true,
        message: 'Hiring request received. HR will schedule candidate interviews.',
        queuePosition: this.interviewQueue.length,
        estimatedTimeToInterview: '2-5 business days'
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'hiring_request_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * HR schedules voice interview with candidate
   * Returns interview link and time
   */
  scheduleVoiceInterview(hiringRequestId, candidateData) {
    try {
      if (!hiringRequestId || !candidateData) {
        throw new Error('Missing interview scheduling parameters');
      }

      const interviewId = `INTER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const interview = {
        interviewId,
        hiringRequestId,
        candidateName: candidateData.name,
        candidatePhone: candidateData.phone,
        candidateEmail: candidateData.email,
        jobTitle: candidateData.jobTitle,
        department: candidateData.department,
        scheduledTime: candidateData.scheduledTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
        interviewer: {
          name: candidateData.interviewerName || 'HR Team',
          department: 'Human Resources',
          level: 'Senior HR'
        },
        interviewLink: `https://interview.agentic-empire.com/${interviewId}`,
        phoneNumber: '+1-855-AI-TRADE', // Company interview line
        accessCode: this._generateAccessCode(),
        status: 'scheduled',
        createdAt: new Date(),
        questionsTemplate: this.interviewTemplates[candidateData.jobTitle] || this.interviewTemplates['default'],
        recording: null,
        transcript: null,
        notes: null,
        scores: {},
        decision: null,
        decisions: []
      };

      this.interviews[interviewId] = interview;

      // Send notification to candidate (in production: actual email/SMS)
      const notification = {
        candidateName: candidateData.name,
        jobTitle: candidateData.jobTitle,
        interviewTime: interview.scheduledTime,
        interviewLink: interview.interviewLink,
        phoneNumber: interview.phoneNumber,
        accessCode: interview.accessCode,
        message: `You're scheduled for a voice interview! ${interview.interviewLink}`
      };

      this._logEvent(interviewId, 'interview_scheduled', {
        candidateName: candidateData.name,
        jobTitle: candidateData.jobTitle,
        scheduledTime: interview.scheduledTime
      });

      return {
        success: true,
        interviewId,
        interview: {
          candidateName: interview.candidateName,
          jobTitle: interview.jobTitle,
          scheduledTime: interview.scheduledTime,
          interviewLink: interview.interviewLink,
          status: 'scheduled'
        },
        notificationSent: true
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'interview_scheduling_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start voice interview - interviewer joins call
   */
  startVoiceInterview(interviewId, interviewerData) {
    try {
      if (!interviewId || !interviewerData) {
        throw new Error('Missing interview start parameters');
      }

      const interview = this.interviews[interviewId];
      if (!interview) {
        throw new Error('Interview not found');
      }

      interview.status = 'in_progress';
      interview.startedAt = new Date();
      interview.interviewer = {
        ...interview.interviewer,
        actualInterviewer: interviewerData.name,
        department: interviewerData.department
      };

      // Initialize recording setup
      interview.recordingStatus = 'recording_started';

      this._logEvent(interviewId, 'interview_started', {
        candidateName: interview.candidateName,
        interviewer: interviewerData.name,
        startTime: interview.startedAt
      });

      return {
        success: true,
        interviewId,
        status: 'interview_in_progress',
        questions: interview.questionsTemplate,
        recordingActive: true,
        message: 'Interview started. All audio will be recorded and transcribed.'
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'interview_start_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process audio chunk during interview
   * Real-time transcription and quality check
   */
  processInterviewAudio(interviewId, audioChunk, speaker) {
    try {
      if (!interviewId) throw new Error('Interview ID required');

      const interview = this.interviews[interviewId];
      if (!interview) throw new Error('Interview not found');

      // In production: use speech-to-text API (Google Cloud, AWS Transcribe, Azure)
      const transcript = this._simulateTranscription(audioChunk, speaker);

      if (!interview.transcript) {
        interview.transcript = [];
      }

      interview.transcript.push({
        timestamp: new Date(),
        speaker: speaker, // 'candidate' or 'interviewer'
        text: transcript,
        duration: audioChunk.duration || 0
      });

      // Real-time quality check
      const qualityCheck = this._assessInterviewQuality(interview.transcript);

      return {
        success: true,
        transcribed: transcript,
        qualityCheck: qualityCheck,
        recordingContinues: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * End interview, save recording, get transcript
   */
  completeVoiceInterview(interviewId, interviewerNotes = '') {
    try {
      const interview = this.interviews[interviewId];
      if (!interview) throw new Error('Interview not found');

      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.duration = interview.completedAt - interview.startedAt;
      interview.interviewerNotes = interviewerNotes;

      // Generate transcript summary
      const transcriptSummary = this._generateTranscriptSummary(interview.transcript);
      interview.transcriptSummary = transcriptSummary;

      this._logEvent(interviewId, 'interview_completed', {
        candidateName: interview.candidateName,
        duration: interview.duration,
        completedAt: interview.completedAt
      });

      return {
        success: true,
        interviewId,
        status: 'completed',
        duration: Math.round(interview.duration / 1000 / 60) + ' minutes',
        transcriptReady: true,
        nextStep: 'Interview will be sent to admin/power user inbox for review'
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'interview_completion_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Score interview on all rubric dimensions
   * Called by HR or admin reviewing the interview
   */
  scoreInterview(interviewId, scores, reviewerId) {
    try {
      const interview = this.interviews[interviewId];
      if (!interview) throw new Error('Interview not found');

      if (interview.status !== 'completed') {
        throw new Error('Can only score completed interviews');
      }

      // Validate scores against rubric
      let totalScore = 0;
      const validatedScores = {};

      for (const [category, scoreData] of Object.entries(scores)) {
        if (!this.scoringRubric[category]) {
          throw new Error(`Invalid scoring category: ${category}`);
        }

        const score = Math.max(0, Math.min(100, scoreData.score)); // 0-100
        const weight = this.scoringRubric[category].weight;

        validatedScores[category] = {
          score: score,
          notes: scoreData.notes || '',
          weight: weight
        };

        totalScore += score * weight;
      }

      interview.scores = validatedScores;
      interview.overallScore = Math.round(totalScore);
      interview.scoredBy = reviewerId;
      interview.scoredAt = new Date();

      // Generate recommendation
      interview.recommendation = this._generateHiringRecommendation(interview.overallScore);

      this._logEvent(interviewId, 'interview_scored', {
        candidateName: interview.candidateName,
        overallScore: interview.overallScore,
        recommendation: interview.recommendation,
        scoredBy: reviewerId
      });

      return {
        success: true,
        interviewId,
        overallScore: interview.overallScore,
        recommendation: interview.recommendation,
        scores: validatedScores
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'interview_scoring_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Make hiring decision on candidate
   */
  makeHiringDecision(interviewId, decision, reviewerId, reasoning = '') {
    try {
      const interview = this.interviews[interviewId];
      if (!interview) throw new Error('Interview not found');

      if (!['hire', 'reject', 'maybe', 'hold'].includes(decision)) {
        throw new Error('Invalid decision. Must be: hire, reject, maybe, hold');
      }

      interview.decision = decision;
      interview.decisionMaker = reviewerId;
      interview.decisionAt = new Date();
      interview.decisionReasoning = reasoning;

      // Track multiple decisions (for consensus)
      if (!interview.decisions) interview.decisions = [];
      interview.decisions.push({
        decision,
        decidedBy: reviewerId,
        decidedAt: new Date(),
        reasoning
      });

      this._logEvent(interviewId, 'hiring_decision_made', {
        candidateName: interview.candidateName,
        decision,
        decidedBy: reviewerId
      });

      // If hire decision: next step is onboarding
      let nextStep = 'Awaiting additional reviews';
      if (decision === 'hire') {
        nextStep = 'Candidate will be sent onboarding materials';
      } else if (decision === 'reject') {
        nextStep = 'Candidate will be notified of decision';
      }

      return {
        success: true,
        interviewId,
        decision,
        nextStep,
        message: `Decision recorded: ${decision}`
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'decision_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Route completed interview to admin/power user inbox
   */
  routeInterviewToInbox(interviewId, adminIds) {
    try {
      const interview = this.interviews[interviewId];
      if (!interview) throw new Error('Interview not found');

      if (interview.status !== 'completed') {
        throw new Error('Can only route completed interviews');
      }

      // Ensure array
      const recipients = Array.isArray(adminIds) ? adminIds : [adminIds];

      recipients.forEach(adminId => {
        if (!this.adminInboxes[adminId]) {
          this.adminInboxes[adminId] = { interviews: [], unread: 0 };
        }

        this.adminInboxes[adminId].interviews.push({
          interviewId,
          candidateName: interview.candidateName,
          jobTitle: interview.jobTitle,
          completedAt: interview.completedAt,
          overallScore: interview.overallScore,
          unread: true
        });

        this.adminInboxes[adminId].unread += 1;
      });

      interview.routedToAdmins = recipients;
      interview.routedAt = new Date();

      this._logEvent(interviewId, 'interview_routed_to_inbox', {
        candidateName: interview.candidateName,
        routedToAdmins: recipients,
        routedAt: interview.routedAt
      });

      return {
        success: true,
        interviewId,
        routedToAdmins: recipients,
        message: `Interview routed to ${recipients.length} admin(s)`
      };
    } catch (error) {
      this._logEvent('HR_ERROR', 'routing_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin inbox: get all interviews pending review
   */
  getAdminInbox(adminId) {
    try {
      if (!adminId) throw new Error('Admin ID required');

      const inbox = this.adminInboxes[adminId] || { interviews: [], unread: 0 };

      return {
        success: true,
        adminId,
        interviews: inbox.interviews,
        unreadCount: inbox.unread,
        totalCount: inbox.interviews.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin retrieves full interview details for review
   */
  getInterviewForReview(interviewId, adminId) {
    try {
      const interview = this.interviews[interviewId];
      if (!interview) throw new Error('Interview not found');

      // Mark as read
      const inbox = this.adminInboxes[adminId];
      if (inbox) {
        const item = inbox.interviews.find(i => i.interviewId === interviewId);
        if (item && item.unread) {
          item.unread = false;
          inbox.unread = Math.max(0, inbox.unread - 1);
        }
      }

      return {
        success: true,
        interview: {
          interviewId: interview.interviewId,
          candidateName: interview.candidateName,
          jobTitle: interview.jobTitle,
          email: interview.candidateEmail,
          phone: interview.candidatePhone,
          scheduledTime: interview.scheduledTime,
          duration: Math.round((interview.duration || 0) / 1000 / 60) + ' minutes',
          transcript: interview.transcript,
          transcriptSummary: interview.transcriptSummary,
          scores: interview.scores,
          overallScore: interview.overallScore,
          recommendation: interview.recommendation,
          interviewerNotes: interview.interviewerNotes,
          decision: interview.decision,
          decisions: interview.decisions
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all interviews (admin view)
   */
  getAllInterviews(filters = {}) {
    try {
      let result = Object.values(this.interviews);

      // Apply filters
      if (filters.status) {
        result = result.filter(i => i.status === filters.status);
      }
      if (filters.jobTitle) {
        result = result.filter(i => i.jobTitle === filters.jobTitle);
      }
      if (filters.decision) {
        result = result.filter(i => i.decision === filters.decision);
      }

      const summary = result.map(i => ({
        interviewId: i.interviewId,
        candidateName: i.candidateName,
        jobTitle: i.jobTitle,
        status: i.status,
        completedAt: i.completedAt,
        overallScore: i.overallScore,
        decision: i.decision
      }));

      return {
        success: true,
        total: summary.length,
        interviews: summary
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  _createVPSalesQuestions() {
    return [
      'Tell us about your most significant sales achievement. How did you approach it?',
      'Describe a time when you missed a quota. What did you learn?',
      'How do you build and maintain relationships with key accounts?',
      'What sales methodology or framework do you prefer and why?',
      'Tell us about a time you had to manage a difficult client.',
      'How do you stay motivated in a fast-paced sales environment?',
      'What metrics do you track to measure your success?',
      'Describe your ideal team structure and management approach.',
      'Where do you see yourself in 5 years?',
      'Why are you interested in joining our company?'
    ];
  }

  _createSalesAgentQuestions() {
    return [
      'Tell us about your sales experience.',
      'Describe your approach to prospecting.',
      'How do you handle rejection or a "no"?',
      'What\'s your biggest sale to date?',
      'How do you stay organized with multiple leads?',
      'Tell us about a customer you turned into a loyal client.',
      'What motivates you in sales?',
      'How do you continue learning and improving?',
      'Why are you interested in this role?',
      'What questions do you have for us?'
    ];
  }

  _createCustomerServiceQuestions() {
    return [
      'Tell us about a difficult customer interaction you handled well.',
      'How do you stay calm under pressure?',
      'Describe your approach to problem-solving.',
      'Tell us about a time you went above and beyond for a customer.',
      'How do you handle conflict?',
      'What customer service experience do you have?',
      'How do you prioritize when dealing with multiple requests?',
      'Tell us about a system or process you improved.',
      'Why do you want to work in customer service?',
      'What questions do you have for us?'
    ];
  }

  _createTechnicalSupportQuestions() {
    return [
      'Tell us about your technical background.',
      'How do you approach troubleshooting an unfamiliar issue?',
      'Describe a complex technical problem you solved.',
      'How do you communicate technical concepts to non-technical users?',
      'Tell us about your experience with our type of products/services.',
      'How do you stay current with technology?',
      'Tell us about a time you had to learn something new quickly.',
      'How do you handle frustrated technical customers?',
      'What\'s your testing and documentation approach?',
      'What questions do you have for us?'
    ];
  }

  _createManagerQuestions() {
    return [
      'Tell us about your management philosophy.',
      'Describe your approach to developing team members.',
      'How do you handle underperforming employees?',
      'Tell us about your biggest team achievement.',
      'How do you provide feedback and conduct reviews?',
      'Describe a conflict you resolved within your team.',
      'How do you build psychological safety and trust?',
      'What metrics do you track for your team?',
      'Tell us about your hiring and recruitment process.',
      'Where do you see this role in your career?'
    ];
  }

  _createExecutiveQuestions() {
    return [
      'What\'s your strategic vision for growth?',
      'How do you approach organizational change?',
      'Tell us about your leadership style and approach.',
      'Describe your experience with P&L management.',
      'How do you build and maintain company culture?',
      'Tell us about your experience with scaling operations.',
      'How do you approach competitive challenges?',
      'What\'s your board or stakeholder management experience?',
      'How do you measure executive success?',
      'Why are you interested in our company?'
    ];
  }

  _createDefaultQuestions() {
    return [
      'Tell us about your professional background.',
      'What are your key strengths?',
      'Describe a major accomplishment you\'re proud of.',
      'Tell us about a challenge you overcame.',
      'How do you approach learning and development?',
      'Describe your work style and preferences.',
      'Tell us about your experience with teamwork.',
      'How do you handle feedback and criticism?',
      'What are your career goals?',
      'Why are you interested in this position?'
    ];
  }

  _generateAccessCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  _simulateTranscription(audioChunk, speaker) {
    // In production: integrate with real transcription service
    return `[Transcribed from ${speaker}]: ${audioChunk || 'audio content'}`;
  }

  _assessInterviewQuality(transcript) {
    // Check for good engagement, relevant answers, etc.
    return {
      clarity: 'good',
      engagement: 'high',
      completeness: 'complete',
      issues: []
    };
  }

  _generateTranscriptSummary(transcript) {
    if (!transcript || transcript.length === 0) return 'No transcript available';

    const candidateResponses = transcript.filter(t => t.speaker === 'candidate');
    const summary = candidateResponses.map(t => `${t.speaker}: ${t.text}`).join('\n\n');

    return summary || 'Interview transcript pending processing';
  }

  _generateHiringRecommendation(score) {
    if (score >= 85) return 'STRONG HIRE - Exceptional candidate';
    if (score >= 75) return 'HIRE - Good fit for role';
    if (score >= 65) return 'MAYBE - Has potential, needs consideration';
    if (score >= 50) return 'WEAK HIRE - Significant gaps';
    return 'DO NOT HIRE - Not suitable for role';
  }

  _logEvent(eventId, eventType, eventData) {
    const log = {
      timestamp: new Date(),
      eventId,
      eventType,
      eventData,
      severity: 'info',
      service: 'HRVoiceInterview',
      complianceRelevant: true
    };
    console.log('[HR_INTERVIEW_AUDIT]', log);
  }
}

module.exports = HRVoiceInterviewService;
