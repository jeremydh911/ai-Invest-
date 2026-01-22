/**
 * Compliance Certification Manager
 * 
 * Manages industry certifications and compliance standards
 * - Track active certifications
 * - Monitor expiration dates
 * - Generate compliance reports
 * - Integrate free third-party certifications (no code sharing)
 * - Maintain compliance roadmap
 * 
 * Current Certifications:
 * - SOC2 Type II (in process)
 * - HIPAA Ready (prepared)
 * - GDPR Compliant (implemented)
 * - ISO 27001 (planned)
 * - PCI DSS (for payment processing)
 * 
 * Free Certifications (No Code Sharing Required):
 * - Google Cloud Security Best Practices
 * - AWS Well-Architected Framework
 * - OWASP Secure Coding
 * - Linux Foundation Security Training
 */

class ComplianceCertificationManager {
  constructor() {
    // Current certifications
    this.certifications = {
      soc2: {
        name: 'SOC2 Type II',
        status: 'in-progress',
        provider: 'Audit Firm (Internal)',
        certificationDate: null,
        expirationDate: null,
        scope: ['Access Controls', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
        requirements: 100,
        completedRequirements: 92,
        auditSchedule: {
          year1: 'In Progress (6-month monitoring)',
          year2: 'Full audit planned',
          continuingAudit: '6-month intervals thereafter'
        },
        cost: 'Part of operations',
        codeRequired: false,
        notes: 'Actively working with auditors'
      },
      hipaa: {
        name: 'HIPAA Ready',
        status: 'prepared',
        provider: 'Internal Compliance',
        certificationDate: null,
        expirationDate: null,
        scope: ['Patient Privacy', 'Data Security', 'Breach Notification'],
        requirements: 65,
        completedRequirements: 65,
        implementation: {
          encryption: 'AES-256 (ready)',
          accessControls: 'RBAC implemented',
          auditLogging: 'Comprehensive logging',
          incidentResponse: 'Plan established'
        },
        cost: 'Integrated into architecture',
        codeRequired: false,
        notes: 'Ready for healthcare provider clients'
      },
      gdpr: {
        name: 'GDPR Compliant',
        status: 'active',
        certificationDate: new Date('2024-09-15'),
        expirationDate: new Date('2027-09-15'),
        provider: 'Legal Review + Self-Assessment',
        scope: ['Right to Privacy', 'Data Portability', 'Right to Be Forgotten', 'Consent Management'],
        requirements: 75,
        completedRequirements: 75,
        implementation: {
          dataMinimization: 'Implemented',
          consentManagement: 'Cookie notice + opt-in',
          dpia: 'Data Protection Impact Assessment completed',
          dpo: 'Data Protection Officer assigned'
        },
        cost: 'Free (internal)',
        codeRequired: false,
        notes: 'Fully compliant for EU operations'
      },
      iso27001: {
        name: 'ISO 27001',
        status: 'planned',
        provider: 'TBD',
        certificationDate: null,
        expirationDate: null,
        targetDate: new Date('2026-12-31'),
        scope: ['Information Security Management', 'Risk Management', 'Asset Management'],
        requirements: 114,
        completedRequirements: 45,
        cost: '$15,000 - $50,000',
        codeRequired: false,
        notes: 'Planning for enterprise clients'
      },
      pciDss: {
        name: 'PCI DSS v3.2.1',
        status: 'prepared',
        provider: 'Internal + Third-party assessment',
        certificationDate: null,
        expirationDate: null,
        scope: ['Payment Card Data Protection', 'Network Security'],
        requirements: 95,
        completedRequirements: 75,
        status_detail: 'Ready if payment processing needed',
        cost: 'Integrated into security',
        codeRequired: false,
        notes: 'Prepared but not required for current model'
      }
    };

    // Free third-party certifications (no code sharing required)
    this.freeTrainings = {
      googleCloud: {
        name: 'Google Cloud Security Best Practices',
        provider: 'Google Cloud',
        cost: 'Free',
        url: 'https://cloud.google.com/training/security',
        certificates: ['Cloud Security Engineer', 'Security Best Practices'],
        relevance: ['Cloud Architecture', 'Data Protection', 'Network Security'],
        completedBy: [],
        targetDate: new Date('2026-03-31')
      },
      awsWellArchitected: {
        name: 'AWS Well-Architected Framework',
        provider: 'AWS',
        cost: 'Free',
        url: 'https://aws.amazon.com/architecture/well-architected/',
        modules: ['Operational Excellence', 'Security', 'Reliability', 'Performance Efficiency', 'Cost Optimization'],
        relevance: ['Infrastructure', 'Scalability', 'Security'],
        completedBy: [],
        targetDate: new Date('2026-02-28')
      },
      owaspSecure: {
        name: 'OWASP Secure Coding Practices',
        provider: 'OWASP (Open Web Application Security Project)',
        cost: 'Free',
        url: 'https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/',
        topics: [
          'Input Validation',
          'Authentication & Session Management',
          'Access Control',
          'Cryptography',
          'Error Handling & Logging',
          'Data Protection',
          'Communication Security',
          'System Configuration',
          'Database Security'
        ],
        relevance: ['Application Security', 'Code Review', 'Development Standards'],
        completedBy: [],
        targetDate: new Date('2026-01-31')
      },
      linuxFoundation: {
        name: 'Linux Foundation Security Training',
        provider: 'Linux Foundation',
        cost: 'Free (optional paid certification)',
        url: 'https://www.linuxfoundation.org/training/security-training/',
        courses: [
          'Secure Software Development',
          'Container Security',
          'Kubernetes Security'
        ],
        relevance: ['Container Infrastructure', 'DevOps Security', 'Cloud Native'],
        completedBy: [],
        targetDate: new Date('2026-04-30')
      },
      nistCybersecurity: {
        name: 'NIST Cybersecurity Framework',
        provider: 'National Institute of Standards & Technology',
        cost: 'Free',
        url: 'https://www.nist.gov/cyberframework',
        framework: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
        relevance: ['Risk Management', 'Security Operations', 'Incident Response'],
        completedBy: [],
        targetDate: new Date('2026-05-31')
      },
      certInfrastructure: {
        name: 'Cloud Native Computing Foundation Training',
        provider: 'CNCF',
        cost: 'Free',
        url: 'https://www.cncf.io/training/',
        certifications: ['Kubernetes Application Developer', 'Kubernetes Administrator'],
        relevance: ['Kubernetes', 'Container Orchestration', 'DevOps'],
        completedBy: [],
        targetDate: new Date('2026-06-30')
      }
    };

    // Compliance checklist
    this.complianceChecklist = {
      dataProtection: {
        category: 'Data Protection',
        items: [
          { task: 'Encryption at rest (AES-256)', status: 'completed' },
          { task: 'Encryption in transit (TLS 1.3)', status: 'completed' },
          { task: 'Key management (HSM-ready)', status: 'completed' },
          { task: 'Data classification policy', status: 'completed' },
          { task: 'Data retention policy', status: 'completed' }
        ]
      },
      accessControl: {
        category: 'Access Control',
        items: [
          { task: 'Role-based access control (RBAC)', status: 'completed' },
          { task: 'Multi-factor authentication (MFA)', status: 'completed' },
          { task: 'Admin passphrase security', status: 'completed' },
          { task: 'Principle of least privilege', status: 'completed' },
          { task: 'Access logging and audit trails', status: 'completed' }
        ]
      },
      auditLogging: {
        category: 'Audit & Logging',
        items: [
          { task: 'Comprehensive event logging', status: 'completed' },
          { task: 'Tamper-proof logs', status: 'completed' },
          { task: 'Log retention (7+ years)', status: 'completed' },
          { task: 'Log analysis and monitoring', status: 'in-progress' },
          { task: 'Incident response logging', status: 'completed' }
        ]
      },
      incidentResponse: {
        category: 'Incident Response',
        items: [
          { task: 'Incident response plan', status: 'completed' },
          { task: 'Security breach notification', status: 'completed' },
          { task: 'Data breach response procedures', status: 'completed' },
          { task: 'Recovery procedures', status: 'completed' },
          { task: 'Incident communication plan', status: 'in-progress' }
        ]
      },
      privacy: {
        category: 'Privacy',
        items: [
          { task: 'Privacy policy', status: 'completed' },
          { task: 'Consent management', status: 'completed' },
          { task: 'Right to deletion (GDPR)', status: 'completed' },
          { task: 'Data subject rights', status: 'completed' },
          { task: 'Third-party data processing agreements', status: 'in-progress' }
        ]
      },
      testing: {
        category: 'Security Testing',
        items: [
          { task: 'Vulnerability scanning', status: 'in-progress' },
          { task: 'Penetration testing', status: 'planned' },
          { task: 'Security code review', status: 'in-progress' },
          { task: 'DLP testing', status: 'completed' },
          { task: 'Load and stress testing', status: 'planned' }
        ]
      }
    };

    // Compliance roadmap
    this.roadmap = [
      {
        quarter: 'Q1 2026',
        goals: [
          'Complete SOC2 Type II audit preparations',
          'Implement Google Cloud Security training for team',
          'Full OWASP secure coding training'
        ],
        priority: 'high'
      },
      {
        quarter: 'Q2 2026',
        goals: [
          'Begin ISO 27001 certification process',
          'Complete AWS Well-Architected assessment',
          'Implement penetration testing program'
        ],
        priority: 'high'
      },
      {
        quarter: 'Q3 2026',
        goals: [
          'Continue SOC2 Type II surveillance audits',
          'Complete Linux Foundation Kubernetes security',
          'Implement NIST Cybersecurity Framework'
        ],
        priority: 'medium'
      },
      {
        quarter: 'Q4 2026',
        goals: [
          'Achieve ISO 27001 certification',
          'Complete CNCF certifications',
          'Year-end compliance review and planning'
        ],
        priority: 'high'
      }
    ];
  }

  /**
   * Get current compliance status
   */
  getComplianceStatus() {
    const activeCount = Object.values(this.certifications).filter(c => c.status === 'active').length;
    const inProgressCount = Object.values(this.certifications).filter(c => c.status === 'in-progress').length;
    const plannedCount = Object.values(this.certifications).filter(c => c.status === 'planned').length;
    const preparedCount = Object.values(this.certifications).filter(c => c.status === 'prepared').length;

    return {
      summary: {
        active: activeCount,
        inProgress: inProgressCount,
        prepared: preparedCount,
        planned: plannedCount,
        totalCertifications: Object.keys(this.certifications).length
      },
      certifications: this.certifications,
      timestamp: new Date()
    };
  }

  /**
   * Get compliance checklist status
   */
  getComplianceChecklist() {
    const summaryByCategory = {};
    
    Object.entries(this.complianceChecklist).forEach(([key, categoryData]) => {
      const completed = categoryData.items.filter(i => i.status === 'completed').length;
      const inProgress = categoryData.items.filter(i => i.status === 'in-progress').length;
      const total = categoryData.items.length;
      
      summaryByCategory[key] = {
        category: categoryData.category,
        completed,
        inProgress,
        total,
        completionPercentage: Math.round((completed / total) * 100),
        items: categoryData.items
      };
    });

    return {
      summary: {
        totalItems: Object.values(summaryByCategory).reduce((sum, c) => sum + c.total, 0),
        completedItems: Object.values(summaryByCategory).reduce((sum, c) => sum + c.completed, 0),
        inProgressItems: Object.values(summaryByCategory).reduce((sum, c) => sum + c.inProgress, 0)
      },
      byCategoryStatus: summaryByCategory,
      timestamp: new Date()
    };
  }

  /**
   * Get free training and certification opportunities
   */
  getFreeTrainings() {
    const trainingList = Object.entries(this.freeTrainings).map(([key, training]) => ({
      id: key,
      name: training.name,
      provider: training.provider,
      cost: training.cost,
      url: training.url,
      targetDate: training.targetDate,
      completedBy: training.completedBy,
      relevance: training.relevance || training.modules || training.framework || training.courses || []
    }));

    return {
      total: trainingList.length,
      trainings: trainingList,
      costSavings: 'All trainings are free. No code sharing required.',
      timestamp: new Date()
    };
  }

  /**
   * Record team member completion of free training
   */
  completeTraining(trainingId, teamMemberId, completionDate = null) {
    try {
      if (!this.freeTrainings[trainingId]) {
        throw new Error(`Training ${trainingId} not found`);
      }

      const training = this.freeTrainings[trainingId];
      
      if (!training.completedBy.includes(teamMemberId)) {
        training.completedBy.push(teamMemberId);
      }

      this._logComplianceEvent(`TRAINING_${trainingId}_${teamMemberId}`, 'training_completed', {
        trainingId,
        trainingName: training.name,
        teamMemberId,
        completionDate: completionDate || new Date()
      });

      return {
        success: true,
        message: `Training '${training.name}' marked as completed`,
        training: {
          name: training.name,
          provider: training.provider,
          completedBy: training.completedBy.length
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get compliance roadmap
   */
  getComplianceRoadmap() {
    return {
      roadmap: this.roadmap,
      lastUpdated: new Date(),
      nextMilestone: this.roadmap[0]
    };
  }

  /**
   * Get certification details
   */
  getCertificationDetails(certId) {
    try {
      const cert = this.certifications[certId];
      if (!cert) {
        throw new Error(`Certification ${certId} not found`);
      }

      return {
        success: true,
        certification: cert,
        nextActions: this._getNextActions(certId, cert),
        timeline: this._getTimeline(certId, cert)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(includeDetails = true) {
    const status = this.getComplianceStatus();
    const checklist = this.getComplianceChecklist();
    const trainings = this.getFreeTrainings();
    const roadmap = this.getComplianceRoadmap();

    return {
      reportDate: new Date(),
      executiveSummary: {
        activeCompliances: status.summary.active,
        inProgressCompliances: status.summary.inProgress,
        checklistCompletion: `${checklist.summary.completedItems}/${checklist.summary.totalItems} items`,
        checklistPercentage: Math.round((checklist.summary.completedItems / checklist.summary.totalItems) * 100),
        freeTrainingsAvailable: trainings.total,
        teamMembersInTraining: trainings.trainings.reduce((sum, t) => sum + t.completedBy.length, 0)
      },
      certifications: includeDetails ? status.certifications : 'See certifications endpoint',
      checklist: includeDetails ? checklist.byCategoryStatus : 'See checklist endpoint',
      freeTrainings: includeDetails ? trainings.trainings : 'See trainings endpoint',
      roadmap: includeDetails ? roadmap.roadmap : 'See roadmap endpoint',
      recommendations: this._generateRecommendations()
    };
  }

  /**
   * Update certification status
   */
  updateCertificationStatus(certId, newStatus, notes = '') {
    try {
      const cert = this.certifications[certId];
      if (!cert) {
        throw new Error(`Certification ${certId} not found`);
      }

      const oldStatus = cert.status;
      cert.status = newStatus;
      cert.lastUpdated = new Date();
      
      if (notes) {
        cert.notes = notes;
      }

      this._logComplianceEvent(`CERT_${certId}`, 'certification_status_updated', {
        certId,
        certName: cert.name,
        oldStatus,
        newStatus,
        notes
      });

      return {
        success: true,
        message: `Certification status updated: ${oldStatus} → ${newStatus}`,
        certification: {
          id: certId,
          name: cert.name,
          status: newStatus
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPERS ============

  _getNextActions(certId, cert) {
    const actions = [];
    
    if (cert.status === 'in-progress') {
      actions.push(`Complete remaining ${100 - cert.completedRequirements}% of requirements`);
      actions.push('Schedule audit review');
    } else if (cert.status === 'planned') {
      actions.push('Select certification provider');
      actions.push('Plan timeline and budget');
      actions.push('Assign compliance owner');
    } else if (cert.status === 'active') {
      actions.push('Monitor expiration date');
      actions.push('Plan renewal process');
    }
    
    return actions;
  }

  _getTimeline(certId, cert) {
    if (cert.certificationDate && cert.expirationDate) {
      return {
        certified: cert.certificationDate,
        expires: cert.expirationDate,
        daysRemaining: Math.floor((cert.expirationDate - new Date()) / (1000 * 60 * 60 * 24))
      };
    } else if (cert.targetDate) {
      return {
        target: cert.targetDate,
        daysToTarget: Math.floor((cert.targetDate - new Date()) / (1000 * 60 * 60 * 24))
      };
    }
    return null;
  }

  _generateRecommendations() {
    const recommendations = [
      '✓ Continue SOC2 Type II audit process on schedule',
      '✓ Enroll team in AWS Well-Architected Framework training',
      '✓ Begin OWASP secure coding training for all developers',
      '→ Schedule quarterly compliance review meetings',
      '→ Plan ISO 27001 certification for Q2 2026',
      '→ Implement continuous vulnerability scanning'
    ];
    
    return recommendations;
  }

  _logComplianceEvent(eventId, eventType, eventData) {
    const log = {
      timestamp: new Date(),
      eventId,
      eventType,
      eventData,
      severity: 'info',
      service: 'ComplianceCertification',
      complianceRelevant: true
    };
    console.log('[COMPLIANCE_AUDIT]', log);
  }
}

module.exports = ComplianceCertificationManager;
