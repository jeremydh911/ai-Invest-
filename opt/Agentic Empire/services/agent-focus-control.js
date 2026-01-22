/**
 * Agent Focus Control Service
 * 
 * Features:
 * - Track agent activity and focus during work hours
 * - Prevent distraction sites/apps
 * - Enforce work hour policies
 * - Manage break times and productivity
 * - Real-time focus monitoring
 * - Productivity metrics and analytics
 * - Manager dashboards
 * 
 * Keep agents productive and on-task
 */

class AgentFocusControl {
  constructor() {
    this.agentSessions = {}; // agentId -> { session data }
    this.focusRules = this._initializeFocusRules();
    this.blockedSites = this._initializeBlockedSites();
    this.focusMetrics = {};
    this.workHours = this._initializeWorkHours();
    this.breakSchedules = {};
  }

  /**
   * Start work session for agent
   */
  startWorkSession(agentId, agentInfo) {
    try {
      if (!agentId) throw new Error('Agent ID required');

      // Check if within work hours
      const currentTime = new Date();
      const workHourStatus = this._checkWorkHours(currentTime, agentInfo?.timezone || 'UTC');

      if (!workHourStatus.inWorkHours && agentInfo?.enforceWorkHours !== false) {
        return {
          success: false,
          error: 'Outside of work hours',
          nextWorkHour: workHourStatus.nextWorkStart
        };
      }

      const sessionId = `FS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = {
        sessionId,
        agentId,
        startTime: currentTime,
        endTime: null,
        focusMode: true,
        workflowId: null,
        currentActivity: 'idle',
        activityHistory: [],
        
        metrics: {
          focusTime: 0, // minutes
          breakTime: 0,
          distractionAttempts: 0,
          distractionsPrevented: 0,
          siteBlocksActivated: 0,
          focusScore: 100,
          productivityScore: 100
        },

        breaks: {
          scheduled: [],
          taken: [],
          pending: [],
          breakAllowanceMinutes: 60
        },

        activityLimits: {
          emailCheckTime: { limit: 30, used: 0 },
          messagingTime: { limit: 15, used: 0 },
          breakRoomTime: { limit: 60, used: 0 },
          administrativeTime: { limit: 45, used: 0 }
        },

        focusTracking: {
          focusIntervalsStart: [],
          currentFocusIntervalStart: currentTime,
          longestFocusInterval: 0,
          focusInterruptionCount: 0
        },

        contextGuard: {
          activeWorkflows: [],
          preservedContext: null,
          contextSwitchCount: 0,
          maxContextSwitches: 8 // per day
        },

        productivity: {
          tasksCompleted: 0,
          tasksInProgress: 0,
          focusQualityScore: 100,
          efficiencyRating: 'excellent', // poor | fair | good | excellent
          warnings: [],
          suggestions: []
        }
      };

      this.agentSessions[agentId] = session;

      // Initialize metrics for the day if not exists
      if (!this.focusMetrics[agentId]) {
        this.focusMetrics[agentId] = this._initializeDailyMetrics();
      }

      // Schedule break times
      this._scheduleBreaks(agentId, session);

      // Start focus monitoring
      this._startFocusMonitoring(agentId);

      return {
        success: true,
        sessionId,
        message: 'Work session started',
        focusMode: true,
        workHours: workHourStatus.workHours,
        breakSchedule: session.breaks.scheduled
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log agent activity
   */
  logActivity(agentId, activity, data = {}) {
    try {
      const session = this.agentSessions[agentId];
      if (!session) throw new Error('No active session');

      const activityLog = {
        timestamp: new Date(),
        type: activity, // browsing | messaging | email | call | task | break | focus
        data,
        duration: data.duration || 0,
        blocked: false
      };

      // Check if activity is blocked
      if (this._isActivityBlocked(agentId, activity, data)) {
        activityLog.blocked = true;
        session.metrics.distractionsPrevented++;
        session.metrics.focusScore = Math.max(0, session.metrics.focusScore - 2);

        return {
          success: false,
          blocked: true,
          message: `Activity blocked: ${activity}`,
          reason: this._getBlockReason(activity, data),
          suggestion: `Try this later or during break time`
        };
      }

      // Log the activity
      session.activityHistory.push(activityLog);
      session.currentActivity = activity;

      // Update activity limits
      if (activity === 'email') {
        session.activityLimits.emailCheckTime.used += data.duration || 5;
      } else if (activity === 'messaging') {
        session.activityLimits.messagingTime.used += data.duration || 5;
      } else if (activity === 'break') {
        session.activityLimits.breakRoomTime.used += data.duration || 15;
        session.metrics.breakTime += data.duration;
      }

      // Check for overuse
      const overuseWarnings = this._checkActivityOveruse(session);
      if (overuseWarnings.length > 0) {
        session.productivity.warnings.push(...overuseWarnings);
      }

      // Track focus intervals
      if (activity === 'task' || activity === 'focus') {
        const interval = new Date() - session.focusTracking.currentFocusIntervalStart;
        if (interval > session.focusTracking.longestFocusInterval) {
          session.focusTracking.longestFocusInterval = interval;
        }
      }

      return {
        success: true,
        message: `Activity logged: ${activity}`,
        remainingTimeForActivity: this._getRemainingActivityTime(session, activity),
        focusScore: session.metrics.focusScore
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get focus score and productivity metrics
   */
  getFocusMetrics(agentId) {
    try {
      const session = this.agentSessions[agentId];
      if (!session) throw new Error('No active session');

      const sessionDuration = new Date() - session.startTime;
      const focusMetrics = this._calculateFocusMetrics(session, sessionDuration);

      return {
        success: true,
        metrics: {
          focusScore: focusMetrics.focusScore,
          productivityScore: focusMetrics.productivityScore,
          focusTime: Math.round(focusMetrics.focusTime / 60000),
          breakTime: Math.round(session.metrics.breakTime),
          distractionsPrevented: session.metrics.distractionsPrevented,
          tasksCompleted: session.productivity.tasksCompleted,
          contextSwitches: session.contextGuard.contextSwitchCount,
          efficiency: session.productivity.efficiencyRating,
          warnings: session.productivity.warnings,
          suggestions: focusMetrics.suggestions
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Request focus mode - blocks all distractions
   */
  requestFocusMode(agentId, duration, context = {}) {
    try {
      const session = this.agentSessions[agentId];
      if (!session) throw new Error('No active session');

      if (session.focusMode) {
        return {
          success: false,
          error: 'Already in focus mode',
          currentFocusDuration: session.focusTracking.currentFocusIntervalStart
        };
      }

      session.focusMode = true;
      session.focusTracking.currentFocusIntervalStart = new Date();

      // Store context
      if (context.workflowId) {
        session.contextGuard.activeWorkflows.push({
          workflowId: context.workflowId,
          startTime: new Date(),
          taskDescription: context.taskDescription || ''
        });
      }

      // Set all distractions as blocked
      session.blockedActivities = [
        'social-media',
        'entertainment',
        'news',
        'messaging',
        'email',
        'break-room'
      ];

      // Schedule auto-break
      this._scheduleAutoBreak(agentId, duration);

      return {
        success: true,
        message: `Focus mode activated for ${duration} minutes`,
        duration,
        blockedActivities: session.blockedActivities,
        context
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Exit focus mode
   */
  exitFocusMode(agentId, reason = '') {
    try {
      const session = this.agentSessions[agentId];
      if (!session) throw new Error('No active session');

      const focusDuration = new Date() - session.focusTracking.currentFocusIntervalStart;
      session.focusMetrics = {
        focusTime: focusDuration / 60000,
        reason
      };

      // Update context
      if (session.contextGuard.activeWorkflows.length > 0) {
        const lastWorkflow = session.contextGuard.activeWorkflows[session.contextGuard.activeWorkflows.length - 1];
        lastWorkflow.endTime = new Date();
      }

      // Track context switch
      session.contextGuard.contextSwitchCount++;
      if (session.contextGuard.contextSwitchCount > session.contextGuard.maxContextSwitches) {
        session.productivity.warnings.push(
          `High context switching detected (${session.contextGuard.contextSwitchCount}/${session.contextGuard.maxContextSwitches})`
        );
      }

      session.focusMode = false;
      session.blockedActivities = [];

      return {
        success: true,
        message: 'Focus mode deactivated',
        focusDuration: Math.round(focusDuration / 60000),
        focusQualityScore: session.metrics.focusScore
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Take scheduled break
   */
  takeBreak(agentId, breakType = 'standard', duration = 15) {
    try {
      const session = this.agentSessions[agentId];
      if (!session) throw new Error('No active session');

      // Exit focus mode if active
      if (session.focusMode) {
        this.exitFocusMode(agentId, 'break');
      }

      const breakRecord = {
        breakId: `BR_${Date.now()}`,
        type: breakType, // standard | lunch | wellness | administrative
        startTime: new Date(),
        endTime: null,
        duration,
        activity: null
      };

      session.breaks.taken.push(breakRecord);
      session.breaks.breakAllowanceMinutes -= duration;

      // Update metrics
      this.logActivity(agentId, 'break', { duration });

      return {
        success: true,
        message: `${breakType} break started`,
        duration,
        breakId: breakRecord.breakId,
        breakAllowanceRemaining: session.breaks.breakAllowanceMinutes
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * End work session
   */
  endWorkSession(agentId) {
    try {
      const session = this.agentSessions[agentId];
      if (!session) throw new Error('No active session');

      session.endTime = new Date();
      const sessionDuration = session.endTime - session.startTime;

      // Calculate final metrics
      const finalMetrics = this._calculateFinalMetrics(session, sessionDuration);

      // Store in daily metrics
      this.focusMetrics[agentId].sessions.push({
        sessionId: session.sessionId,
        duration: sessionDuration,
        metrics: finalMetrics
      });

      // Generate report
      const report = {
        sessionId: session.sessionId,
        duration: Math.round(sessionDuration / 60000),
        focusTime: finalMetrics.focusTime,
        breakTime: finalMetrics.breakTime,
        focusScore: finalMetrics.focusScore,
        productivityScore: finalMetrics.productivityScore,
        tasksCompleted: session.productivity.tasksCompleted,
        warnings: session.productivity.warnings,
        recommendations: finalMetrics.recommendations
      };

      // Send to manager dashboard if warnings exist
      if (session.productivity.warnings.length > 0) {
        this._notifyManager(agentId, report);
      }

      // Clean up
      delete this.agentSessions[agentId];

      return {
        success: true,
        message: 'Work session ended',
        report
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get manager dashboard
   */
  getManagerDashboard(managerId, teamAgentIds) {
    try {
      const dashboard = {
        managerId,
        timestamp: new Date(),
        teamOverview: {
          totalAgents: teamAgentIds.length,
          agentsActive: teamAgentIds.filter(id => this.agentSessions[id]).length,
          agentsFocused: teamAgentIds.filter(id => 
            this.agentSessions[id]?.focusMode === true
          ).length,
          avgFocusScore: 0,
          avgProductivityScore: 0
        },
        agents: []
      };

      let totalFocusScore = 0;
      let totalProductivityScore = 0;

      teamAgentIds.forEach(agentId => {
        const session = this.agentSessions[agentId];
        if (!session) return;

        const focusMetrics = this._calculateFocusMetrics(session, new Date() - session.startTime);

        dashboard.agents.push({
          agentId,
          sessionId: session.sessionId,
          focusMode: session.focusMode,
          currentActivity: session.currentActivity,
          focusScore: focusMetrics.focusScore,
          productivityScore: focusMetrics.productivityScore,
          timeElapsed: Math.round((new Date() - session.startTime) / 60000),
          tasksCompleted: session.productivity.tasksCompleted,
          warnings: session.productivity.warnings,
          breakTimeUsed: session.metrics.breakTime,
          breakTimeRemaining: session.breaks.breakAllowanceMinutes
        });

        totalFocusScore += focusMetrics.focusScore;
        totalProductivityScore += focusMetrics.productivityScore;
      });

      const activeCount = dashboard.agents.length;
      if (activeCount > 0) {
        dashboard.teamOverview.avgFocusScore = Math.round(totalFocusScore / activeCount);
        dashboard.teamOverview.avgProductivityScore = Math.round(totalProductivityScore / activeCount);
      }

      return {
        success: true,
        dashboard
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent daily summary
   */
  getAgentDailySummary(agentId) {
    try {
      const dailyMetrics = this.focusMetrics[agentId];
      if (!dailyMetrics) {
        return {
          success: false,
          error: 'No data for today'
        };
      }

      const sessionCount = dailyMetrics.sessions.length;
      const totalDuration = dailyMetrics.sessions.reduce((sum, s) => sum + (s.duration / 60000), 0);
      const avgFocusScore = sessionCount > 0 ? 
        Math.round(dailyMetrics.sessions.reduce((sum, s) => sum + s.metrics.focusScore, 0) / sessionCount) : 0;

      return {
        success: true,
        summary: {
          date: new Date().toDateString(),
          sessionCount,
          totalWorkTime: Math.round(totalDuration),
          avgFocusScore,
          avgProductivityScore: Math.round(
            dailyMetrics.sessions.reduce((sum, s) => sum + s.metrics.productivityScore, 0) / (sessionCount || 1)
          ),
          totalTasksCompleted: dailyMetrics.sessions.reduce((sum, s) => sum + s.metrics.tasksCompleted, 0),
          focusQuality: avgFocusScore > 80 ? 'excellent' : avgFocusScore > 60 ? 'good' : 'needs-improvement',
          insights: this._generateInsights(dailyMetrics)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPERS ============

  _initializeFocusRules() {
    return {
      'email-check-limit': { maxMinutesPerDay: 30, interval: 120 },
      'messaging-limit': { maxMinutesPerDay: 15, interval: 60 },
      'break-room-limit': { maxMinutesPerDay: 60, interval: 480 },
      'context-switch-limit': { maxSwitchesPerDay: 8 },
      'max-focus-interval': { minutes: 90, thenRequireBreak: 15 }
    };
  }

  _initializeBlockedSites() {
    return {
      'social-media': [
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com', 'linkedin.com'
      ],
      'entertainment': [
        'youtube.com', 'netflix.com', 'hulu.com', 'twitch.tv', 'discord.com'
      ],
      'news': [
        'cnn.com', 'bbc.com', 'reuters.com'
      ]
    };
  }

  _initializeWorkHours() {
    return {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: null, end: null },
      sunday: { start: null, end: null }
    };
  }

  _initializeDailyMetrics() {
    return {
      date: new Date().toDateString(),
      sessions: [],
      totalFocusTime: 0,
      totalBreakTime: 0,
      distractionsPrevented: 0,
      avgFocusScore: 0
    };
  }

  _checkWorkHours(time, timezone) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[time.getDay()];
    const workHour = this.workHours[dayName];

    if (!workHour.start) {
      return {
        inWorkHours: false,
        workHours: 'Off',
        nextWorkStart: this._getNextWorkStart()
      };
    }

    const [startHour, startMin] = workHour.start.split(':').map(Number);
    const [endHour, endMin] = workHour.end.split(':').map(Number);
    
    const currentHours = time.getHours();
    const currentMins = time.getMinutes();

    const inRange = (currentHours > startHour || (currentHours === startHour && currentMins >= startMin)) &&
                    (currentHours < endHour || (currentHours === endHour && currentMins <= endMin));

    return {
      inWorkHours: inRange,
      workHours: `${workHour.start} - ${workHour.end}`,
      nextWorkStart: inRange ? null : this._getNextWorkStart()
    };
  }

  _getNextWorkStart() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  _isActivityBlocked(agentId, activity, data) {
    const session = this.agentSessions[agentId];
    if (!session) return false;

    // Check if activity is in blockedActivities
    if (session.blockedActivities?.includes(activity)) {
      return true;
    }

    // Check focus mode restrictions
    if (session.focusMode && ['messaging', 'email', 'break-room'].includes(activity)) {
      return true;
    }

    // Check if workflow is blocking this
    if (session.workflowId && this._isActivityBlockedByWorkflow(activity, data)) {
      return true;
    }

    return false;
  }

  _getBlockReason(activity, data) {
    return `${activity} is blocked during your current work session`;
  }

  _checkActivityOveruse(session) {
    const warnings = [];

    if (session.activityLimits.emailCheckTime.used > session.activityLimits.emailCheckTime.limit) {
      warnings.push('Email check time limit exceeded');
    }

    if (session.activityLimits.messagingTime.used > session.activityLimits.messagingTime.limit) {
      warnings.push('Messaging time limit exceeded');
    }

    return warnings;
  }

  _getRemainingActivityTime(session, activity) {
    const limits = session.activityLimits;

    switch(activity) {
      case 'email':
        return limits.emailCheckTime.limit - limits.emailCheckTime.used;
      case 'messaging':
        return limits.messagingTime.limit - limits.messagingTime.used;
      case 'break':
        return session.breaks.breakAllowanceMinutes;
      default:
        return null;
    }
  }

  _scheduleBreaks(agentId, session) {
    // Schedule breaks: 2x 15min morning, lunch 30min, 2x 15min afternoon
    const breaks = [
      { time: '10:30', type: 'standard', duration: 15 },
      { time: '12:00', type: 'lunch', duration: 30 },
      { time: '14:30', type: 'standard', duration: 15 }
    ];

    session.breaks.scheduled = breaks;
  }

  _scheduleAutoBreak(agentId, focusDuration) {
    // After max focus interval, require break
    setTimeout(() => {
      if (this.agentSessions[agentId]?.focusMode) {
        this.agentSessions[agentId].productivity.suggestions.push(
          'Time for a break! You\'ve been focusing for ' + focusDuration + ' minutes.'
        );
      }
    }, focusDuration * 60 * 1000);
  }

  _calculateFocusMetrics(session, sessionDuration) {
    const taskActivities = session.activityHistory.filter(a => a.type === 'task' || a.type === 'focus');
    const focusTime = taskActivities.reduce((sum, a) => sum + (a.duration || 5), 0);

    const baseScore = 100;
    const distractionPenalty = session.metrics.distractionAttempts * 5;
    const breakCompliancePenalty = session.breaks.pending.length * 10;
    const focusScore = Math.max(0, baseScore - distractionPenalty - breakCompliancePenalty);

    const productivityScore = Math.min(100, 
      ((session.productivity.tasksCompleted * 10) + focusScore) / 2
    );

    return {
      focusScore,
      productivityScore,
      focusTime,
      suggestions: [
        focusScore < 60 ? 'Try using focus mode more consistently' : '',
        session.contextGuard.contextSwitchCount > 5 ? 'Reduce context switching' : '',
        session.productivity.tasksCompleted === 0 ? 'Complete at least one task' : ''
      ].filter(Boolean)
    };
  }

  _calculateFinalMetrics(session, sessionDuration) {
    const taskCount = session.activityHistory.filter(a => a.type === 'task').length;
    const focusMetrics = this._calculateFocusMetrics(session, sessionDuration);

    return {
      focusTime: focusMetrics.focusTime,
      breakTime: session.metrics.breakTime,
      focusScore: focusMetrics.focusScore,
      productivityScore: focusMetrics.productivityScore,
      tasksCompleted: session.productivity.tasksCompleted,
      recommendations: this._generateRecommendations(session, focusMetrics)
    };
  }

  _generateRecommendations(session, metrics) {
    const recs = [];

    if (metrics.focusScore < 60) {
      recs.push('Consider using focus mode during critical tasks');
    }

    if (session.contextGuard.contextSwitchCount > 8) {
      recs.push('Try grouping similar tasks together to reduce context switching');
    }

    if (session.metrics.breakTime < 30) {
      recs.push('Take more breaks to maintain energy levels');
    }

    if (metrics.productivityScore > 80) {
      recs.push('Great focus session! Keep up the excellent work.');
    }

    return recs;
  }

  _generateInsights(dailyMetrics) {
    const insights = [];
    const avgFocus = dailyMetrics.sessions.reduce((sum, s) => sum + s.metrics.focusScore, 0) / 
                     (dailyMetrics.sessions.length || 1);

    if (avgFocus > 80) {
      insights.push('Excellent focus quality today');
    } else if (avgFocus < 60) {
      insights.push('Try to improve focus consistency');
    }

    return insights;
  }

  _notifyManager(agentId, report) {
    console.log('[MANAGER_ALERT]', {
      agentId,
      timestamp: new Date(),
      report
    });
  }

  _startFocusMonitoring(agentId) {
    // In production: would run interval-based monitoring
    // For now, log start
    console.log('[FOCUS_MONITORING_STARTED]', { agentId, timestamp: new Date() });
  }

  _isActivityBlockedByWorkflow(activity, data) {
    // In production: check if active workflow blocks this activity
    return false;
  }
}

module.exports = AgentFocusControl;
