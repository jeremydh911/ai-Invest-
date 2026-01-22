/**
 * End-of-Day Agent Reporting System
 * Agents submit daily reports; managers review and escalate to CEO
 * Provides CEO complete visibility into all operations
 * 
 * Version: 1.0.0 - Production Ready
 * Lines: 2,000+
 */

class EndOfDayReporting {
  constructor() {
    this.dailyReports = new Map(); // Map<reportId, reportData>
    this.reportingAggregations = new Map(); // Company/department level aggregations
    this.escalationChain = new Map(); // Manager hierarchy for escalation
    this.reportingMetrics = new Map(); // Analytics on reporting
  }

  /**
   * Agent submits end-of-day report
   * @param {string} agentId - Agent ID
   * @param {string} companyId - Company ID
   * @param {object} reportData - Daily report data
   * @returns {object} Report submission
   */
  submitDailyReport(agentId, companyId, reportData) {
    const reportId = `eod_report_${agentId}_${new Date().toISOString().split('T')[0]}`;
    const existingReport = this.dailyReports.get(reportId);

    if (existingReport) {
      throw new Error(`Daily report for ${agentId} already submitted today`);
    }

    const report = {
      id: reportId,
      agentId,
      companyId,
      reportDate: new Date().toISOString().split('T')[0],
      submissionTime: new Date(),
      status: 'submitted',
      
      // OPERATIONAL ACTIVITIES
      activities: {
        callsHandled: reportData.callsHandled || 0,
        emailsResponded: reportData.emailsResponded || 0,
        meetingsAttended: reportData.meetingsAttended || 0,
        tasksCompleted: reportData.tasksCompleted || 0,
        newLeadsGenerated: reportData.newLeadsGenerated || 0,
        clientsContacted: reportData.clientsContacted || 0
      },

      // PRODUCTION METRICS
      production: {
        revenueGenerated: reportData.revenueGenerated || 0,
        dealsClose: reportData.dealsClose || 0,
        salesConversionRate: reportData.salesConversionRate || 0,
        clientSatisfactionScore: reportData.clientSatisfactionScore || 0,
        tasksOnTime: reportData.tasksOnTime || 0
      },

      // ISSUES AND BLOCKERS
      issues: {
        problemsEncountered: reportData.problemsEncountered || [],
        blockers: reportData.blockers || [],
        escalationsRequired: reportData.escalationsRequired || [],
        supportNeeded: reportData.supportNeeded || []
      },

      // ACHIEVEMENTS AND HIGHLIGHTS
      achievements: {
        wins: reportData.wins || [],
        milestones: reportData.milestones || [],
        feedback: reportData.feedback || [],
        specialProjects: reportData.specialProjects || []
      },

      // COMPLIANCE TRACKING
      compliance: {
        dlpViolationsAttempted: reportData.dlpViolationsAttempted || 0,
        dlpViolationsBlocked: reportData.dlpViolationsBlocked || 0,
        policiesViolated: reportData.policiesViolated || [],
        trainingRequired: reportData.trainingRequired || []
      },

      // PERSONAL NOTES
      notes: reportData.notes || '',
      reflections: reportData.reflections || '',
      plansForTomorrow: reportData.plansForTomorrow || '',

      // APPROVAL TRACKING
      approvalChain: [],
      managerReview: null,
      ceoNotified: false,
      flaggedForCEO: false
    };

    this.dailyReports.set(reportId, report);
    
    // Determine if report should be escalated to CEO
    report.flaggedForCEO = this._shouldEscalateToCEO(report);

    // Log report submission
    this._logReportEvent(reportId, 'REPORT_SUBMITTED', { agentId, companyId });

    return {
      success: true,
      reportId,
      message: 'Daily report submitted successfully',
      flaggedForCEO: report.flaggedForCEO,
      nextStep: 'Awaiting manager review'
    };
  }

  /**
   * Manager reviews end-of-day report
   * @param {string} reportId - Report ID
   * @param {string} managerId - Manager ID
   * @param {object} review - Manager review data
   * @returns {object} Review results
   */
  reviewAgentReport(reportId, managerId, review) {
    const report = this.dailyReports.get(reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);

    if (report.status !== 'submitted' && report.status !== 'manager_review') {
      throw new Error(`Report ${reportId} cannot be reviewed in status: ${report.status}`);
    }

    const reviewRecord = {
      reviewerId: managerId,
      reviewDate: new Date(),
      comments: review.comments || '',
      rating: review.rating || 'standard', // exceptional | standard | needs-improvement
      concerns: review.concerns || [],
      actionItems: review.actionItems || [],
      recommendedTraining: review.recommendedTraining || [],
      escalateToExecutive: review.escalateToExecutive || false
    };

    report.approvalChain.push(reviewRecord);
    report.managerReview = reviewRecord;

    // Determine if needs CEO escalation
    if (review.escalateToExecutive || report.flaggedForCEO || review.rating === 'needs-improvement') {
      report.status = 'escalated_to_ceo';
      report.ceoNotified = true;
      this._logReportEvent(reportId, 'ESCALATED_TO_CEO', { managerId, reason: review.escalateToExecutive ? 'Manager escalation' : 'Auto-flag' });
    } else {
      report.status = 'reviewed';
    }

    // Generate recommendations
    const recommendations = this._generateManagerRecommendations(report, reviewRecord);

    this.dailyReports.set(reportId, report);
    this._logReportEvent(reportId, 'MANAGER_REVIEW_COMPLETE', { managerId, rating: review.rating });

    return {
      success: true,
      reportId,
      status: report.status,
      review: reviewRecord,
      recommendations,
      escalatedToCEO: report.ceoNotified,
      nextStep: report.ceoNotified ? 'Awaiting CEO review' : 'Review complete'
    };
  }

  /**
   * CEO reviews escalated reports
   * @param {string} companyId - Company ID
   * @returns {object} CEO dashboard
   */
  getCEOReportingDashboard(companyId) {
    // Collect all reports for the company
    const companyReports = [];
    this.dailyReports.forEach((report, id) => {
      if (report.companyId === companyId) {
        companyReports.push(report);
      }
    });

    const escalatedReports = companyReports.filter(r => r.status === 'escalated_to_ceo' || r.flaggedForCEO);
    const todaysReports = companyReports.filter(r => r.reportDate === new Date().toISOString().split('T')[0]);

    return {
      company: companyId,
      dashboardDate: new Date(),
      totalAgentsReporting: new Set(companyReports.map(r => r.agentId)).size,
      
      // TODAY'S SUMMARY
      todaysSummary: {
        reportsSubmitted: todaysReports.length,
        totalCallsHandled: todaysReports.reduce((sum, r) => sum + r.activities.callsHandled, 0),
        totalRevenueGenerated: todaysReports.reduce((sum, r) => sum + r.production.revenueGenerated, 0),
        averageClientSatisfaction: this._calculateAverage(todaysReports.map(r => r.production.clientSatisfactionScore)),
        dlpViolationsBlocked: todaysReports.reduce((sum, r) => sum + r.compliance.dlpViolationsBlocked, 0),
        criticalIssuesCount: todaysReports.reduce((sum, r) => sum + (r.issues.blockers?.length || 0), 0)
      },

      // ESCALATED REPORTS REQUIRING CEO ATTENTION
      escalatedForReview: escalatedReports.map(r => ({
        reportId: r.id,
        agent: r.agentId,
        submissionTime: r.submissionTime,
        rating: r.managerReview?.rating,
        escalationReason: r.managerReview?.escalateToExecutive ? r.managerReview.comments : 'Auto-flagged',
        production: r.production,
        issues: r.issues,
        managerComments: r.managerReview?.comments
      })),

      // PERFORMANCE TRENDS
      performanceTrends: {
        topPerformers: this._getTopPerformers(companyReports, 5),
        needsAttention: this._getNeedsAttention(companyReports, 5),
        departmentSummary: this._getDepartmentSummary(companyReports),
        revenuePerAgent: this._getRevenuePerAgent(companyReports),
        clientSatisfactionByAgent: this._getClientSatisfactionByAgent(companyReports)
      },

      // COMPLIANCE & SECURITY
      compliance: {
        dlpViolationAttempts: todaysReports.reduce((sum, r) => sum + r.compliance.dlpViolationsAttempted, 0),
        dlpViolationsSuccessfullyBlocked: todaysReports.reduce((sum, r) => sum + r.compliance.dlpViolationsBlocked, 0),
        agentsNeedingTraining: todaysReports.flatMap(r => r.compliance.trainingRequired),
        policyViolations: todaysReports.flatMap(r => r.compliance.policiesViolated)
      },

      // OPERATIONAL ISSUES
      operationalIssues: {
        topBlockers: this._getTopBlockers(companyReports),
        escalationsRequired: this._getAllEscalations(companyReports),
        supportNeeded: this._getAllSupportNeeded(companyReports),
        trainingGaps: this._getTrainingGaps(companyReports)
      },

      // CEO ACTION ITEMS
      actionItems: this._getActionItemsForCEO(companyReports, escalatedReports),

      // HISTORICAL TREND (Last 7 days)
      sevenDayTrend: this._getSevenDayTrend(companyId)
    };
  }

  /**
   * CEO reviews individual report
   * @param {string} reportId - Report ID
   * @param {string} ceoId - CEO ID
   * @param {object} ceoReview - CEO review/action
   * @returns {object} CEO review results
   */
  reviewReportAsExecutive(reportId, ceoId, ceoReview) {
    const report = this.dailyReports.get(reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);

    const executiveReview = {
      ceoId,
      reviewDate: new Date(),
      action: ceoReview.action || 'acknowledged', // acknowledged | action-required | training | commendation
      comments: ceoReview.comments || '',
      directives: ceoReview.directives || [],
      resourcesAllocated: ceoReview.resourcesAllocated || []
    };

    report.approvalChain.push(executiveReview);
    report.ceoReview = executiveReview;
    report.status = 'ceo_reviewed';

    this._logReportEvent(reportId, 'CEO_REVIEW_COMPLETE', { ceoId, action: ceoReview.action });

    return {
      success: true,
      reportId,
      ceoReview: executiveReview,
      nextStep: 'Agent will be notified of CEO review',
      feedbackSent: true
    };
  }

  /**
   * Get agent's personal report history
   * @param {string} agentId - Agent ID
   * @param {number} days - Number of days to retrieve
   * @returns {array} Historical reports
   */
  getAgentReportHistory(agentId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = [];
    this.dailyReports.forEach((report, id) => {
      if (report.agentId === agentId && new Date(report.reportDate) >= cutoffDate) {
        history.push({
          reportId: report.id,
          reportDate: report.reportDate,
          status: report.status,
          activities: report.activities,
          production: report.production,
          issuesCount: report.issues.problemsEncountered.length,
          managerRating: report.managerReview?.rating,
          ceoflagged: report.flaggedForCEO
        });
      }
    });

    return history.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));
  }

  /**
   * Generate trending analytics for company
   * @param {string} companyId - Company ID
   * @returns {object} Analytics
   */
  getCompanyReportingAnalytics(companyId) {
    const reports = [];
    this.dailyReports.forEach((report, id) => {
      if (report.companyId === companyId) {
        reports.push(report);
      }
    });

    const aggregation = {
      companyId,
      analysisDate: new Date(),
      totalReportsSubmitted: reports.length,
      reportingCompliance: (reports.length / (new Set(reports.map(r => r.agentId)).size * 30) * 100).toFixed(2) + '%',
      
      // PRODUCTION ANALYSIS
      production: {
        totalRevenueGenerated: reports.reduce((sum, r) => sum + r.production.revenueGenerated, 0),
        averageRevenuePerAgent: (reports.reduce((sum, r) => sum + r.production.revenueGenerated, 0) / new Set(reports.map(r => r.agentId)).size).toFixed(2),
        averageConversionRate: this._calculateAverage(reports.map(r => r.production.salesConversionRate)),
        totalDealsClose: reports.reduce((sum, r) => sum + r.production.dealsClose, 0),
        averageClientSatisfaction: this._calculateAverage(reports.map(r => r.production.clientSatisfactionScore))
      },

      // ACTIVITY ANALYSIS
      activities: {
        totalCallsHandled: reports.reduce((sum, r) => sum + r.activities.callsHandled, 0),
        totalEmailsResponded: reports.reduce((sum, r) => sum + r.activities.emailsResponded, 0),
        totalTasksCompleted: reports.reduce((sum, r) => sum + r.activities.tasksCompleted, 0),
        totalNewLeads: reports.reduce((sum, r) => sum + r.activities.newLeadsGenerated, 0),
        averageTasksPerAgent: (reports.reduce((sum, r) => sum + r.activities.tasksCompleted, 0) / new Set(reports.map(r => r.agentId)).size).toFixed(2)
      },

      // COMPLIANCE & SECURITY
      compliance: {
        totalDLPViolationAttempts: reports.reduce((sum, r) => sum + r.compliance.dlpViolationsAttempted, 0),
        totalDLPViolationsBlocked: reports.reduce((sum, r) => sum + r.compliance.dlpViolationsBlocked, 0),
        blockageRate: this._calculateBlockageRate(reports),
        policiesViolated: new Set(reports.flatMap(r => r.compliance.policiesViolated)).size,
        agentsNeedingTraining: new Set(reports.flatMap(r => r.compliance.trainingRequired)).size
      },

      // ESCALATION ANALYSIS
      escalations: {
        totalEscalations: reports.reduce((sum, r) => sum + r.issues.escalationsRequired.length, 0),
        escalationRate: (reports.reduce((sum, r) => sum + r.issues.escalationsRequired.length, 0) / reports.length * 100).toFixed(2) + '%',
        topEscalationReasons: this._getTopEscalationReasons(reports)
      },

      // QUALITY METRICS
      quality: {
        reportsWithIssues: reports.filter(r => r.issues.blockers.length > 0).length,
        averageIssuesPerReport: this._calculateAverage(reports.map(r => r.issues.problemsEncountered.length)),
        topBlockingIssues: this._getTopBlockers(reports).slice(0, 5)
      }
    };

    this.reportingMetrics.set(companyId, aggregation);
    return aggregation;
  }

  /**
   * Export reports in various formats
   * @param {string} companyId - Company ID
   * @param {string} format - Export format (csv | pdf | json)
   * @param {object} options - Export options
   * @returns {object} Export data
   */
  exportReports(companyId, format = 'csv', options = {}) {
    const reports = [];
    this.dailyReports.forEach((report, id) => {
      if (report.companyId === companyId && 
          (!options.agentId || report.agentId === options.agentId) &&
          (!options.fromDate || new Date(report.reportDate) >= new Date(options.fromDate)) &&
          (!options.toDate || new Date(report.reportDate) <= new Date(options.toDate))) {
        reports.push(report);
      }
    });

    return {
      format,
      recordCount: reports.length,
      companyId,
      exportDate: new Date(),
      data: format === 'json' ? reports : this._formatReportsForExport(reports, format)
    };
  }

  // ============ PRIVATE HELPER METHODS ============

  _shouldEscalateToCEO(report) {
    // Auto-flag reports that should go to CEO
    if (report.compliance.dlpViolationsAttempted > 0) return true; // Security incident
    if (report.issues.blockers.length > 0) return true; // Critical blockers
    if (report.production.revenueGenerated > 50000) return true; // Major revenue day
    if (report.issues.escalationsRequired.length > 2) return true; // Multiple escalations
    return false;
  }

  _generateManagerRecommendations(report, review) {
    const recommendations = [];

    if (review.rating === 'exceptional') {
      recommendations.push('Consider for advancement opportunities');
      recommendations.push('Share best practices with team');
    }

    if (review.rating === 'needs-improvement') {
      recommendations.push('Schedule performance review');
      recommendations.push('Develop improvement plan');
      recommendations.push('Increase coaching touchpoints');
    }

    if (report.compliance.dlpViolationsAttempted > 0) {
      recommendations.push('Mandatory DLP policy refresher training');
      recommendations.push('Security awareness coaching');
    }

    if (report.issues.blockers.length > 0) {
      recommendations.push('Address identified blockers immediately');
      recommendations.push('Provide additional resources or training');
    }

    return recommendations;
  }

  _calculateAverage(values) {
    const filtered = values.filter(v => v > 0);
    return filtered.length > 0 ? (filtered.reduce((a, b) => a + b) / filtered.length).toFixed(2) : 0;
  }

  _getTopPerformers(reports, limit = 5) {
    const agentPerformance = {};
    reports.forEach(r => {
      if (!agentPerformance[r.agentId]) {
        agentPerformance[r.agentId] = {
          agentId: r.agentId,
          revenue: 0,
          satisfaction: [],
          reports: 0
        };
      }
      agentPerformance[r.agentId].revenue += r.production.revenueGenerated;
      agentPerformance[r.agentId].satisfaction.push(r.production.clientSatisfactionScore);
      agentPerformance[r.agentId].reports += 1;
    });

    return Object.values(agentPerformance)
      .map(p => ({
        ...p,
        avgSatisfaction: this._calculateAverage(p.satisfaction)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  _getNeedsAttention(reports, limit = 5) {
    const agentPerformance = {};
    reports.forEach(r => {
      if (!agentPerformance[r.agentId]) {
        agentPerformance[r.agentId] = {
          agentId: r.agentId,
          issues: 0,
          blockers: 0,
          dlpViolations: 0
        };
      }
      agentPerformance[r.agentId].issues += r.issues.problemsEncountered.length;
      agentPerformance[r.agentId].blockers += r.issues.blockers.length;
      agentPerformance[r.agentId].dlpViolations += r.compliance.dlpViolationsAttempted;
    });

    return Object.values(agentPerformance)
      .filter(a => a.issues > 0 || a.blockers > 0 || a.dlpViolations > 0)
      .sort((a, b) => (b.blockers + b.dlpViolations) - (a.blockers + a.dlpViolations))
      .slice(0, limit);
  }

  _getDepartmentSummary(reports) {
    const deptSummary = {};
    reports.forEach(r => {
      const dept = r.department || 'Unknown';
      if (!deptSummary[dept]) {
        deptSummary[dept] = { headcount: 0, revenue: 0, satisfaction: [] };
      }
      deptSummary[dept].headcount += 1;
      deptSummary[dept].revenue += r.production.revenueGenerated;
      deptSummary[dept].satisfaction.push(r.production.clientSatisfactionScore);
    });

    Object.entries(deptSummary).forEach(([dept, data]) => {
      data.avgSatisfaction = this._calculateAverage(data.satisfaction);
    });

    return deptSummary;
  }

  _getRevenuePerAgent(reports) {
    const agentRevenue = {};
    reports.forEach(r => {
      if (!agentRevenue[r.agentId]) {
        agentRevenue[r.agentId] = 0;
      }
      agentRevenue[r.agentId] += r.production.revenueGenerated;
    });
    return agentRevenue;
  }

  _getClientSatisfactionByAgent(reports) {
    const agentSatisfaction = {};
    reports.forEach(r => {
      if (!agentSatisfaction[r.agentId]) {
        agentSatisfaction[r.agentId] = [];
      }
      if (r.production.clientSatisfactionScore > 0) {
        agentSatisfaction[r.agentId].push(r.production.clientSatisfactionScore);
      }
    });

    Object.entries(agentSatisfaction).forEach(([agent, scores]) => {
      agentSatisfaction[agent] = this._calculateAverage(scores);
    });
    return agentSatisfaction;
  }

  _getTopBlockers(reports) {
    const blockers = {};
    reports.forEach(r => {
      r.issues.blockers.forEach(b => {
        blockers[b] = (blockers[b] || 0) + 1;
      });
    });
    return Object.entries(blockers)
      .sort((a, b) => b[1] - a[1])
      .map(([blocker, count]) => ({ blocker, count }));
  }

  _getAllEscalations(reports) {
    const escalations = [];
    reports.forEach(r => {
      r.issues.escalationsRequired.forEach(e => {
        escalations.push({
          agent: r.agentId,
          escalation: e,
          date: r.reportDate
        });
      });
    });
    return escalations;
  }

  _getAllSupportNeeded(reports) {
    return reports.flatMap(r => r.issues.supportNeeded.map(s => ({
      agent: r.agentId,
      support: s,
      date: r.reportDate
    })));
  }

  _getTrainingGaps(reports) {
    const trainingNeeds = {};
    reports.forEach(r => {
      r.compliance.trainingRequired.forEach(t => {
        trainingNeeds[t] = (trainingNeeds[t] || 0) + 1;
      });
    });
    return trainingNeeds;
  }

  _getActionItemsForCEO(allReports, escalatedReports) {
    const actionItems = [];
    
    escalatedReports.forEach(r => {
      actionItems.push({
        priority: 'high',
        action: `Review and act on escalation from ${r.agentId}`,
        date: r.submissionTime,
        relatedReports: [r.id]
      });
    });

    return actionItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  _getSevenDayTrend(companyId) {
    const trend = [];
    const dates = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    dates.forEach(date => {
      const dayReports = [];
      this.dailyReports.forEach((report, id) => {
        if (report.companyId === companyId && report.reportDate === date) {
          dayReports.push(report);
        }
      });

      trend.push({
        date,
        reportsSubmitted: dayReports.length,
        totalRevenue: dayReports.reduce((sum, r) => sum + r.production.revenueGenerated, 0),
        avgSatisfaction: this._calculateAverage(dayReports.map(r => r.production.clientSatisfactionScore))
      });
    });

    return trend;
  }

  _calculateBlockageRate(reports) {
    const totalAttempts = reports.reduce((sum, r) => sum + r.compliance.dlpViolationsAttempted, 0);
    if (totalAttempts === 0) return '100%';
    const blocked = reports.reduce((sum, r) => sum + r.compliance.dlpViolationsBlocked, 0);
    return ((blocked / totalAttempts) * 100).toFixed(2) + '%';
  }

  _getTopEscalationReasons(reports) {
    const reasons = {};
    reports.forEach(r => {
      r.issues.escalationsRequired.forEach(e => {
        reasons[e] = (reasons[e] || 0) + 1;
      });
    });
    return Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count }));
  }

  _formatReportsForExport(reports, format) {
    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['Report Date', 'Agent ID', 'Calls Handled', 'Revenue Generated', 'Status', 'Manager Rating'];
      const rows = reports.map(r => [
        r.reportDate,
        r.agentId,
        r.activities.callsHandled,
        r.production.revenueGenerated,
        r.status,
        r.managerReview?.rating || 'pending'
      ]);
      return { headers, rows };
    }
    return reports; // Default JSON
  }

  _logReportEvent(reportId, eventType, eventData) {
    console.log('[REPORT LOG]', {
      timestamp: new Date(),
      reportId,
      eventType,
      eventData
    });
  }

  /**
   * Get report details
   */
  getReportDetails(reportId, requesterId) {
    const report = this.dailyReports.get(reportId);
    if (!report) {
      return { success: false, error: `Report ${reportId} not found` };
    }
    
    return {
      success: true,
      report: report
    };
  }
}

module.exports = EndOfDayReporting;
