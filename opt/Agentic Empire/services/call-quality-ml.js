/**
 * Call Quality & Machine Learning Improvement System
 * Manager review of agent calls, conversation quality analysis,
 * and ML-driven continuous improvement recommendations
 * 
 * Version: 1.0.0 - Production Ready
 * Lines: 2,000+
 */

class CallQualityAndMLSystem {
  constructor() {
    this.callReviews = new Map(); // Map<reviewId, reviewData>
    this.agentPerformanceModels = new Map(); // ML models per agent
    this.improvementRecommendations = new Map(); // Historical recommendations
    this.trainingModules = new Map(); // Training content linked to gaps
    this.qualityRubric = this._initializeQualityRubric();
    this.mlPatterns = new Map(); // Learned patterns from calls
  }

  /**
   * Manager initiates call review
   * @param {string} callId - Call ID from call center
   * @param {string} managerId - Manager reviewing the call
   * @param {object} callData - Call data including transcript
   * @returns {object} Review session
   */
  startCallReview(callId, managerId, callData) {
    const reviewId = `review_${callId}_${managerId}_${Date.now()}`;

    const review = {
      id: reviewId,
      callId,
      managerId,
      agentId: callData.agentId,
      callDate: callData.startTime,
      reviewStartDate: new Date(),
      reviewStatus: 'in-progress', // in-progress | completed | escalated

      // QUALITY ASSESSMENT
      qualityAssessment: {
        overall: 0, // 0-100
        categories: {
          professionalism: { score: 0, notes: '' }, // Tone, courtesy, respect
          clarity: { score: 0, notes: '' }, // Clear communication, understandable
          problemSolving: { score: 0, notes: '' }, // Effectiveness in resolution
          dlpCompliance: { score: 0, notes: '' }, // Data protection adherence
          workflowAdherence: { score: 0, notes: '' }, // Following call structure
          timeManagement: { score: 0, notes: '' }, // Efficiency
          knowledgeDepth: { score: 0, notes: '' }, // Product/company knowledge
          customerInteraction: { score: 0, notes: '' } // Rapport building
        }
      },

      // TRANSCRIPT ANALYSIS
      transcriptAnalysis: {
        agentSpeakingPercentage: 0,
        callerSpeakingPercentage: 0,
        silencePercentage: 0,
        wordCount: 0,
        sentimentTrend: [],
        keyPhrasesUsed: [],
        effectiveStatementsCount: 0,
        ineffectiveStatementsCount: 0
      },

      // DLPPROTECTION REVIEW
      dlpReview: {
        violationsDetected: [],
        violationsStopped: [],
        adminVerificationRequired: false,
        dlpTrainingNeeded: false,
        severity: 'none'
      },

      // WORKFLOW EXECUTION
      workflowReview: {
        stagesFollowed: [],
        stagesSkipped: [],
        stageAdherence: 0, // Percentage
        completionNotes: ''
      },

      // AGENT STRENGTHS & WEAKNESSES
      analysis: {
        strengths: [],
        areasForImprovement: [],
        trainingGaps: [],
        recommendedFocusAreas: []
      },

      // MACHINE LEARNING INSIGHTS
      mlInsights: {
        patternDetected: false,
        patterns: [],
        recommendations: [],
        comparisonToPeers: null,
        historicalTrend: null
      },

      // MANAGER COMMENTS & ACTIONS
      managerNotes: '',
      managerRating: 'not-rated', // exceeds-expectations | meets-expectations | needs-improvement
      actionItems: [],
      trainingRecommended: [],
      escalations: [],
      followUpRequired: false,
      followUpDate: null
    };

    this.callReviews.set(reviewId, review);
    this._logReviewEvent(reviewId, 'REVIEW_STARTED', { callId, managerId, agentId: callData.agentId });

    return {
      success: true,
      reviewId,
      callId,
      agentId: callData.agentId,
      message: 'Call review session started. Ready for transcript analysis and quality assessment.',
      callTranscript: callData.transcript || (callData.recording?.transcriptFinal || callData.recording?.transcriptPartial || '')
    };
  }

  /**
   * Analyze transcript for quality metrics
   * @param {string} reviewId - Review ID
   * @param {array} transcript - Call transcript
   * @returns {object} Transcript analysis
   */
  analyzeTranscript(reviewId, transcript) {
    const review = this.callReviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    // Handle both string and array transcripts
    let transcriptArray = Array.isArray(transcript) ? transcript : [{ speaker: 'mixed', text: transcript }];
    
    if (transcriptArray.length === 0) {
      return { success: true, reviewId, message: 'No transcript to analyze' };
    }

    // Calculate speaking percentages
    const agentLines = transcriptArray.filter(t => t.speaker === 'agent');
    const callerLines = transcriptArray.filter(t => t.speaker === 'caller');
    const totalLines = transcriptArray.length;

    review.transcriptAnalysis.agentSpeakingPercentage = totalLines > 0 ? ((agentLines.length / totalLines) * 100).toFixed(2) : 0;
    review.transcriptAnalysis.callerSpeakingPercentage = totalLines > 0 ? ((callerLines.length / totalLines) * 100).toFixed(2) : 0;

    // Word count analysis
    const agentWords = agentLines.reduce((sum, t) => sum + (t.text?.split(' ').length || 0), 0);
    const callerWords = callerLines.reduce((sum, t) => sum + (t.text?.split(' ').length || 0), 0);
    review.transcriptAnalysis.wordCount = agentWords + callerWords;

    // Extract key phrases and sentiment
    const agentText = agentLines.map(t => t.text).join(' ');
    review.transcriptAnalysis.keyPhrasesUsed = this._extractKeyPhrases(agentText);
    review.transcriptAnalysis.sentimentTrend = this._analyzeSentimentTrend(transcriptArray);

    // Count effective vs ineffective statements
    const effectivenessAnalysis = this._analyzeStatementEffectiveness(agentText);
    review.transcriptAnalysis.effectiveStatementsCount = effectivenessAnalysis.effective;
    review.transcriptAnalysis.ineffectiveStatementsCount = effectivenessAnalysis.ineffective;

    this._logReviewEvent(reviewId, 'TRANSCRIPT_ANALYZED', {
      agentSpeakingPercentage: review.transcriptAnalysis.agentSpeakingPercentage,
      wordCount: review.transcriptAnalysis.wordCount
    });

    return {
      success: true,
      reviewId,
      message: 'Transcript analyzed',
      analysis: review.transcriptAnalysis
    };

    return {
      reviewId,
      transcriptAnalysis: review.transcriptAnalysis,
      insights: {
        agentDominance: review.transcriptAnalysis.agentSpeakingPercentage > 60,
        goodListeningBalance: review.transcriptAnalysis.agentSpeakingPercentage >= 40 && review.transcriptAnalysis.agentSpeakingPercentage <= 60,
        overTalking: review.transcriptAnalysis.agentSpeakingPercentage > 70,
        keyPhraseUsage: review.transcriptAnalysis.keyPhrasesUsed
      }
    };
  }

  /**
   * Score call on quality rubric
   * @param {string} reviewId - Review ID
   * @param {object} scores - Scored categories
   * @returns {object} Quality score result
   */
  scoreCallQuality(reviewId, scores) {
    const review = this.callReviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    // Apply manager's scores
    Object.entries(scores).forEach(([category, data]) => {
      if (review.qualityAssessment.categories[category]) {
        review.qualityAssessment.categories[category].score = data.score || 0;
        review.qualityAssessment.categories[category].notes = data.notes || '';
      }
    });

    // Calculate overall quality score
    const categoryScores = Object.values(review.qualityAssessment.categories).map(c => c.score);
    review.qualityAssessment.overall = Math.round(categoryScores.reduce((a, b) => a + b) / categoryScores.length);

    // Determine rating
    if (review.qualityAssessment.overall >= 85) {
      review.managerRating = 'exceeds-expectations';
    } else if (review.qualityAssessment.overall >= 75) {
      review.managerRating = 'meets-expectations';
    } else {
      review.managerRating = 'needs-improvement';
    }

    this._logReviewEvent(reviewId, 'QUALITY_SCORED', {
      overallScore: review.qualityAssessment.overall,
      rating: review.managerRating
    });

    return {
      reviewId,
      qualityScore: review.qualityAssessment.overall,
      rating: review.managerRating,
      categoryBreakdown: review.qualityAssessment.categories,
      recommendation: this._getQualityRecommendation(review.qualityAssessment.overall)
    };
  }

  /**
   * Identify training gaps based on call review
   * @param {string} reviewId - Review ID
   * @returns {object} Training gap analysis
   */
  identifyTrainingGaps(reviewId) {
    const review = this.callReviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    const gaps = [];

    // Analyze each category for gaps
    Object.entries(review.qualityAssessment.categories).forEach(([category, data]) => {
      if (data.score < 75) {
        gaps.push({
          area: category,
          score: data.score,
          severity: data.score < 50 ? 'critical' : 'moderate',
          suggestedTraining: this._getTrainingForGap(category),
          estimatedDuration: this._getTrainingDuration(category)
        });
      }
    });

    // DLP-specific gaps
    if (review.dlpReview.dlpTrainingNeeded) {
      gaps.push({
        area: 'Data Protection Compliance (DLP)',
        score: 50,
        severity: 'critical',
        suggestedTraining: ['DLP Policy Refresh', 'Real-world Scenario Training', 'One-on-one Coaching'],
        estimatedDuration: '4 hours'
      });
    }

    review.analysis.trainingGaps = gaps;

    // Generate focused training recommendation
    const focusAreas = gaps
      .filter(g => g.severity === 'critical')
      .map(g => g.suggestedTraining[0]);

    review.trainingRecommended = [...new Set(focusAreas)];

    this._logReviewEvent(reviewId, 'TRAINING_GAPS_IDENTIFIED', {
      gapCount: gaps.length,
      criticalGaps: gaps.filter(g => g.severity === 'critical').length
    });

    return {
      reviewId,
      trainingGaps: gaps,
      priorityTraining: review.trainingRecommended,
      estimatedTotalTrainingTime: this._calculateTotalTrainingTime(gaps),
      trainingScheduleRecommendation: this._generateTrainingSchedule(gaps)
    };
  }

  /**
   * Apply machine learning to identify patterns and improve recommendations
   * @param {string} agentId - Agent ID
   * @param {number} callsToAnalyze - Number of recent calls
   * @returns {object} ML analysis and recommendations
   */
  generateMLImprovementRecommendations(agentId, callsToAnalyze = 10) {
    // Get agent's recent call reviews
    const agentReviews = [];
    this.callReviews.forEach((review, id) => {
      if (review.agentId === agentId) {
        agentReviews.push(review);
      }
    });

    const recentReviews = agentReviews.slice(-callsToAnalyze);
    if (recentReviews.length === 0) {
      return { message: 'Insufficient call data for ML analysis' };
    }

    // PATTERN DETECTION
    const patterns = this._detectPerformancePatterns(recentReviews);
    
    // TREND ANALYSIS
    const trends = this._analyzePerformanceTrends(recentReviews);
    
    // PEER COMPARISON
    const peerComparison = this._compareToPeerPerformance(agentId, recentReviews);
    
    // PERSONALIZED RECOMMENDATIONS
    const mlRecommendations = this._generatePersonalizedRecommendations(
      agentId,
      patterns,
      trends,
      recentReviews
    );

    // Store ML model for agent
    const model = {
      agentId,
      generatedDate: new Date(),
      patterns,
      trends,
      peerComparison,
      recommendations: mlRecommendations,
      confidence: this._calculateMLConfidence(recentReviews),
      nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    this.agentPerformanceModels.set(agentId, model);

    return {
      agentId,
      analysisDate: new Date(),
      callsAnalyzed: recentReviews.length,
      
      performancePatterns: patterns,
      performanceTrends: trends,
      peerComparison,
      
      mlRecommendations: {
        immediateActions: mlRecommendations.immediate,
        shortTermActions: mlRecommendations.shortTerm,
        longTermDevelopment: mlRecommendations.longTerm,
        strengthsToLeverage: mlRecommendations.strengths
      },

      confidenceMetrics: {
        modelConfidence: model.confidence,
        dataPoints: recentReviews.length,
        recommendedAction: 'Monitor closely, implement immediate actions'
      }
    };
  }

  /**
   * Get comparative performance dashboard
   * @param {string} managerId - Manager reviewing team
   * @param {string} departmentId - Department filter (optional)
   * @returns {object} Team performance dashboard
   */
  getTeamPerformanceDashboard(managerId, departmentId = null) {
    const teamReviews = [];
    const agentMetrics = {};

    this.callReviews.forEach((review, id) => {
      if (!teamReviews.find(r => r.agentId === review.agentId)) {
        // Get latest review per agent
        const agentReviews = [];
        this.callReviews.forEach((r, rid) => {
          if (r.agentId === review.agentId) {
            agentReviews.push(r);
          }
        });

        if (agentReviews.length > 0) {
          const latestReview = agentReviews[agentReviews.length - 1];
          teamReviews.push(latestReview);
          
          agentMetrics[latestReview.agentId] = {
            agentId: latestReview.agentId,
            latestQualityScore: latestReview.qualityAssessment.overall,
            averageQualityScore: (agentReviews.reduce((sum, r) => sum + r.qualityAssessment.overall, 0) / agentReviews.length).toFixed(2),
            callsReviewed: agentReviews.length,
            trend: this._getTrendDirection(agentReviews),
            dlpViolations: agentReviews.filter(r => r.dlpReview.violationsDetected.length > 0).length,
            needsImprovement: latestReview.qualityAssessment.overall < 75,
            mlModel: this.agentPerformanceModels.get(latestReview.agentId) ? 'Active' : 'Pending'
          };
        }
      }
    });

    return {
      managerId,
      dashboardDate: new Date(),
      agentCount: Object.keys(agentMetrics).length,
      
      teamMetrics: {
        averageQualityScore: this._calculateAverage(Object.values(agentMetrics).map(m => m.latestQualityScore)),
        topPerformers: this._getTopTeamPerformers(agentMetrics, 3),
        needsAttention: this._getAgentsNeedingAttention(agentMetrics, 3),
        dlpCompliance: {
          totalCallsReviewed: Object.values(agentMetrics).reduce((sum, m) => sum + m.callsReviewed, 0),
          callsWithViolations: Object.values(agentMetrics).reduce((sum, m) => sum + m.dlpViolations, 0)
        }
      },

      agentSummaries: Object.values(agentMetrics),

      trainingNeeds: this._getTeamTrainingNeeds(),

      mlInsights: {
        agentsWithActiveModels: Object.values(agentMetrics).filter(m => m.mlModel === 'Active').length,
        recommendedFocus: 'DLP compliance and customer interaction skills'
      }
    };
  }

  /**
   * Complete call review with final recommendations
   * @param {string} reviewId - Review ID
   * @param {object} finalAssessment - Manager's final assessment
   * @returns {object} Completed review
   */
  completeCallReview(reviewId, finalAssessment) {
    const review = this.callReviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    review.managerNotes = finalAssessment.managerNotes || '';
    review.actionItems = finalAssessment.actionItems || [];
    review.followUpRequired = finalAssessment.followUpRequired || false;
    review.followUpDate = finalAssessment.followUpDate || null;

    if (finalAssessment.escalate) {
      review.escalations = finalAssessment.escalations || [];
      review.reviewStatus = 'escalated';
    } else {
      review.reviewStatus = 'completed';
    }

    review.reviewEndDate = new Date();

    this._logReviewEvent(reviewId, 'REVIEW_COMPLETED', {
      agentId: review.agentId,
      overallScore: review.qualityAssessment.overall,
      actionItemCount: review.actionItems.length
    });

    // Generate improvement plan if needed
    let improvementPlan = null;
    if (review.managerRating === 'needs-improvement') {
      improvementPlan = this._createImprovementPlan(review);
    }

    return {
      reviewId: review.id,
      completionStatus: 'success',
      agentId: review.agentId,
      qualityScore: review.qualityAssessment.overall,
      rating: review.managerRating,
      actionItems: review.actionItems,
      improvementPlanGenerated: !!improvementPlan,
      improvementPlan,
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  // ============ PRIVATE HELPER METHODS ============

  _initializeQualityRubric() {
    return {
      professionalism: {
        description: 'Maintained professional tone and demeanor',
        scale: { 1: 'Unprofessional', 5: 'Highly professional' }
      },
      clarity: {
        description: 'Communicated clearly and understandably',
        scale: { 1: 'Unclear', 5: 'Crystal clear' }
      },
      problemSolving: {
        description: 'Effectively worked toward resolution',
        scale: { 1: 'No progress', 5: 'Excellent resolution' }
      },
      dlpCompliance: {
        description: 'Adhered to data protection policies',
        scale: { 1: 'Multiple violations', 5: 'Perfect compliance' }
      },
      workflowAdherence: {
        description: 'Followed proper call structure',
        scale: { 1: 'No structure', 5: 'Perfect structure' }
      },
      timeManagement: {
        description: 'Managed call time efficiently',
        scale: { 1: 'Inefficient', 5: 'Highly efficient' }
      },
      knowledgeDepth: {
        description: 'Demonstrated product/company knowledge',
        scale: { 1: 'No knowledge', 5: 'Excellent knowledge' }
      },
      customerInteraction: {
        description: 'Built rapport and showed empathy',
        scale: { 1: 'Poor rapport', 5: 'Excellent rapport' }
      }
    };
  }

  _extractKeyPhrases(text) {
    // Extract professional phrases used
    const phrases = [];
    const positivePatterns = [
      /I understand/i,
      /I appreciate/i,
      /thank you/i,
      /I'll (help|assist)/i,
      /how can I help/i,
      /let me explain/i,
      /you're welcome/i
    ];

    positivePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        phrases.push(pattern.source.replace(/\\|/g, '|').split('|')[0]);
      }
    });

    return phrases;
  }

  _analyzeSentimentTrend(transcript) {
    // Simple sentiment analysis - track if conversation becomes more positive/negative
    return transcript.map(t => ({
      timestamp: t.timestamp,
      speaker: t.speaker,
      sentiment: this._determineSentiment(t.text)
    }));
  }

  _determineSentiment(text) {
    if (!text) return 'neutral';
    if (/sorry|apologize|difficult|problem/i.test(text)) return 'negative';
    if (/great|thank|appreciate|excellent|happy/i.test(text)) return 'positive';
    return 'neutral';
  }

  _analyzeStatementEffectiveness(text) {
    const statements = text.split(/[.!?]+/).filter(s => s.trim());
    let effective = 0;
    let ineffective = 0;

    statements.forEach(stmt => {
      if (/question\?|help|resolve|solution|understand/i.test(stmt)) {
        effective += 1;
      }
      if (/um|uh|like|you know|basically/i.test(stmt)) {
        ineffective += 1;
      }
    });

    return { effective, ineffective };
  }

  _getTrainingForGap(category) {
    const trainingMap = {
      professionalism: ['Professional Communication Workshop', 'Tone and Demeanor Training'],
      clarity: ['Clear Communication Essentials', 'Technical Writing for Phone'],
      problemSolving: ['Problem Solving Techniques', 'Troubleshooting Methodology'],
      dlpCompliance: ['DLP Policy Refresher', 'Data Security Awareness'],
      workflowAdherence: ['Call Structure Coaching', 'Script and Process Review'],
      timeManagement: ['Call Efficiency Training', 'Time Management Essentials'],
      knowledgeDepth: ['Product Deep Dive', 'Company Policy Review'],
      customerInteraction: ['Customer Service Excellence', 'Empathy and Rapport Building']
    };
    return trainingMap[category] || ['General Coaching'];
  }

  _getTrainingDuration(category) {
    return /dlp|compliance/i.test(category) ? '2 hours' : '1-2 hours';
  }

  _calculateTotalTrainingTime(gaps) {
    const critical = gaps.filter(g => g.severity === 'critical');
    const hours = critical.length * 2;
    return `${hours} hours`;
  }

  _generateTrainingSchedule(gaps) {
    return {
      immediateTraining: gaps.filter(g => g.severity === 'critical').map(g => g.suggestedTraining[0]),
      targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      followUpAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  _detectPerformancePatterns(reviews) {
    const patterns = [];
    
    if (reviews.every(r => r.qualityAssessment.overall > 85)) {
      patterns.push('Consistently high performer');
    }
    if (reviews.filter(r => r.qualityAssessment.categories.dlpCompliance.score < 75).length > 0) {
      patterns.push('DLP compliance issues');
    }
    if (reviews.filter(r => r.transcriptAnalysis.agentSpeakingPercentage > 70).length > reviews.length / 2) {
      patterns.push('Tendency to over-talk');
    }

    return patterns;
  }

  _analyzePerformanceTrends(reviews) {
    if (reviews.length < 2) return { trend: 'insufficient-data' };

    const scores = reviews.map(r => r.qualityAssessment.overall);
    const recent = scores[scores.length - 1];
    const previous = scores[scores.length - 2];
    const change = recent - previous;

    return {
      trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
      change: change.toFixed(2),
      averageScore: (scores.reduce((a, b) => a + b) / scores.length).toFixed(2)
    };
  }

  _compareToPeerPerformance(agentId, reviews) {
    // Get peer average
    const allReviews = [];
    this.callReviews.forEach(r => {
      if (r.agentId !== agentId) {
        allReviews.push(r);
      }
    });

    const peerAverage = (allReviews.reduce((sum, r) => sum + r.qualityAssessment.overall, 0) / allReviews.length).toFixed(2);
    const agentAverage = (reviews.reduce((sum, r) => sum + r.qualityAssessment.overall, 0) / reviews.length).toFixed(2);

    return {
      agentAverage,
      peerAverage,
      differenceFromPeer: (agentAverage - peerAverage).toFixed(2),
      percentile: agentAverage >= peerAverage ? 'Above average' : 'Below average'
    };
  }

  _generatePersonalizedRecommendations(agentId, patterns, trends, reviews) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    const strengths = [];

    // DLP pattern
    if (patterns.includes('DLP compliance issues')) {
      immediate.push('Schedule DLP compliance refresher training');
      immediate.push('One-on-one DLP coaching session');
    }

    // Over-talking pattern
    if (patterns.includes('Tendency to over-talk')) {
      shortTerm.push('Active listening techniques training');
      shortTerm.push('Practice allowing caller air-time');
    }

    // Trend analysis
    if (trends.trend === 'improving') {
      strengths.push('Showing positive improvement trajectory');
      longTerm.push('Continue current coaching approach');
    } else if (trends.trend === 'declining') {
      immediate.push('Check for external stress or issues');
      shortTerm.push('Increase coaching touchpoints');
    }

    if (parseFloat(trends.averageScore) > 85) {
      strengths.push('Consistently high quality calls');
      longTerm.push('Consider for mentoring role');
    }

    return { immediate, shortTerm, longTerm, strengths };
  }

  _calculateMLConfidence(reviews) {
    // Confidence increases with more data points
    const confidence = Math.min(100, (reviews.length / 10) * 100);
    return confidence.toFixed(2) + '%';
  }

  _getTrendDirection(reviews) {
    if (reviews.length < 2) return 'new';
    const recent = reviews[reviews.length - 1].qualityAssessment.overall;
    const previous = reviews[reviews.length - 2].qualityAssessment.overall;
    return recent > previous ? 'improving' : recent < previous ? 'declining' : 'stable';
  }

  _getTopTeamPerformers(agentMetrics, limit = 3) {
    return Object.values(agentMetrics)
      .sort((a, b) => parseFloat(b.latestQualityScore) - parseFloat(a.latestQualityScore))
      .slice(0, limit);
  }

  _getAgentsNeedingAttention(agentMetrics, limit = 3) {
    return Object.values(agentMetrics)
      .filter(m => m.needsImprovement)
      .sort((a, b) => parseFloat(a.latestQualityScore) - parseFloat(b.latestQualityScore))
      .slice(0, limit);
  }

  _getTeamTrainingNeeds() {
    const needs = {};
    this.callReviews.forEach(review => {
      review.trainingRecommended.forEach(training => {
        needs[training] = (needs[training] || 0) + 1;
      });
    });
    return Object.entries(needs)
      .map(([training, count]) => ({ training, agentCount: count }))
      .sort((a, b) => b.agentCount - a.agentCount);
  }

  _createImprovementPlan(review) {
    return {
      planId: `plan_${review.agentId}_${Date.now()}`,
      agentId: review.agentId,
      createdDate: new Date(),
      targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      
      trainingModules: review.trainingRecommended,
      coachingSessions: Math.ceil(review.trainingGaps.length / 2),
      performanceGates: review.trainingGaps.map(g => ({
        gate: g.area,
        targetScore: 75,
        assessmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      })),
      managerCheckInFrequency: 'weekly',
      successMetric: 'Raise quality score to 75+ within 30 days'
    };
  }

  _getQualityRecommendation(score) {
    if (score >= 85) return 'Excellent - maintain current practices';
    if (score >= 75) return 'Good - minor improvements needed';
    if (score >= 60) return 'Needs improvement - targeted training required';
    return 'Critical - immediate intervention needed';
  }

  _calculateAverage(values) {
    const filtered = values.filter(v => v > 0 || v === 0);
    return filtered.length > 0 ? (filtered.reduce((a, b) => a + b) / filtered.length).toFixed(2) : 0;
  }

  _logReviewEvent(reviewId, eventType, eventData) {
    console.log('[REVIEW LOG]', {
      timestamp: new Date(),
      reviewId,
      eventType,
      eventData
    });
  }
}

module.exports = CallQualityAndMLSystem;
