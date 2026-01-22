/**
 * Agent Profile Service
 * 
 * Comprehensive agent/employee profile management system
 * Handles creation, management, and voice configuration for all agents
 * 
 * Features:
 * - Complete agent profiles (personal, professional, voice)
 * - Job description management (industry-specific)
 * - Reporting structure and hierarchy
 * - Voice synthesis and emotion control
 * - Work schedules and availability
 * - Agent specialties and expertise areas
 */

const crypto = require('crypto');
const logger = require('./logger');

class AgentProfile {
  constructor(encryptionKey = null) {
    this.encryptionKey = encryptionKey;
    this.agents = [];
    this.jobDescriptions = {};
    this.departmentManagers = {};
    this.voiceSynthesisProfiles = {};
    this.minimumStaffing = {
      marketing: { count: 1, priority: 'high' },
      legal: { count: 1, priority: 'high' },
      hr: { count: 1, priority: 'high' },
      executive: { count: 3, priority: 'critical' } // CEO, COO, CFO minimum
    };
  }

  /**
   * Create comprehensive agent profile
   * @param {Object} agentData - Complete agent information
   * @returns {Object} Created agent profile with validation
   */
  createAgentProfile(agentData) {
    try {
      const requiredFields = [
        'firstName', 'lastName', 'dateOfBirth', 'email', 'phone',
        'address', 'department', 'jobTitle', 'reportsTo',
        'specialty', 'industry', 'companyId'
      ];

      // Validate required fields
      for (const field of requiredFields) {
        if (!agentData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      const agentProfile = {
        id: crypto.randomUUID(),
        companyId: agentData.companyId,
        
        // Personal Information
        personal: {
          firstName: agentData.firstName,
          lastName: agentData.lastName,
          fullName: `${agentData.firstName} ${agentData.lastName}`,
          dateOfBirth: agentData.dateOfBirth, // Encrypted
          ssn: agentData.ssn || null, // Encrypted if provided
          address: agentData.address, // Encrypted
          city: agentData.city,
          state: agentData.state,
          zipCode: agentData.zipCode,
          email: agentData.email, // Encrypted
          phone: agentData.phone, // Encrypted
          personalPhone: agentData.personalPhone || null, // Encrypted
          emergencyContact: agentData.emergencyContact || null, // Encrypted
          emergencyContactPhone: agentData.emergencyContactPhone || null // Encrypted
        },

        // Professional Information
        professional: {
          employeeId: crypto.randomUUID(),
          department: agentData.department,
          jobTitle: agentData.jobTitle,
          reportsTo: agentData.reportsTo, // ID of manager
          specialty: agentData.specialty,
          industry: agentData.industry,
          yearsOfExperience: agentData.yearsOfExperience || 0,
          licenseCertifications: agentData.licenseCertifications || [],
          skills: agentData.skills || [],
          expertise: agentData.expertise || []
        },

        // Work Schedule
        workSchedule: {
          hoursPerWeek: agentData.hoursPerWeek || 40,
          timezone: agentData.timezone || 'America/New_York',
          workDays: agentData.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: agentData.startTime || '09:00',
          endTime: agentData.endTime || '17:00',
          breakSchedule: agentData.breakSchedule || ['12:00-13:00'],
          availability: agentData.availability || 'full-time'
        },

        // Agent Backstory
        backstory: {
          professionalBackground: agentData.professionalBackground || '',
          accomplishments: agentData.accomplishments || [],
          personalInterests: agentData.personalInterests || [],
          motivations: agentData.motivations || [],
          communicationStyle: agentData.communicationStyle || 'professional'
        },

        // Voice Synthesis Configuration
        voiceSynthesis: {
          voiceId: agentData.voiceId || crypto.randomUUID(),
          voiceProvider: agentData.voiceProvider || 'google', // google, azure, elevenlabs
          language: agentData.language || 'en-US',
          gender: agentData.gender || 'neutral', // male, female, neutral
          age: agentData.age || 'adult', // young, adult, senior
          accent: agentData.accent || 'neutral',
          speechRate: agentData.speechRate || 1.0, // 0.5 to 2.0
          pitch: agentData.pitch || 1.0, // 0.5 to 2.0
          volume: agentData.volume || 1.0, // 0.0 to 1.0
          emotionalTone: {
            confidence: agentData.emotionalConfidence || 0.7, // 0-1
            warmth: agentData.emotionalWarmth || 0.8, // 0-1
            enthusiasm: agentData.emotionalEnthusiasm || 0.7, // 0-1
            professionalism: agentData.emotionalProfessionalism || 0.9, // 0-1
            empathy: agentData.emotionalEmpathy || 0.8 // 0-1
          },
          voiceAdjustments: {} // Stores real-time voice modifications
        },

        // Job Description (Industry-Specific)
        jobDescription: {
          title: agentData.jobTitle,
          level: agentData.jobLevel || 'mid', // entry, mid, senior, lead, manager, director, executive
          industry: agentData.industry,
          description: '', // Will be populated from template
          responsibilities: [],
          qualifications: [],
          requiredSkills: [],
          keyPerformanceIndicators: [],
          compensationRange: agentData.compensationRange || null,
          reportingManager: agentData.reportsTo
        },

        // Agent Status
        status: {
          active: true,
          startDate: agentData.startDate || new Date().toISOString(),
          endDate: null,
          employmentType: agentData.employmentType || 'full-time',
          performanceRating: 0,
          lastReviewDate: null,
          nextReviewDate: null
        },

        // System Information
        system: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: agentData.createdBy,
          lastModifiedBy: agentData.createdBy,
          encryptedFields: [
            'dateOfBirth', 'ssn', 'address', 'email', 'phone',
            'personalPhone', 'emergencyContact', 'emergencyContactPhone'
          ]
        }
      };

      // Encrypt sensitive fields
      this._encryptSensitiveFields(agentProfile);

      // Store agent profile
      this.agents.push(agentProfile);

      logger.info(`Agent profile created: ${agentProfile.personal.fullName} (${agentProfile.professional.jobTitle})`);
      return agentProfile;
    } catch (error) {
      logger.error(`Error creating agent profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set job description from industry template
   * @param {string} agentId - Agent ID
   * @param {string} industry - Industry type
   * @param {string} jobLevel - Job level
   * @param {Object} jobDescription - Industry-specific job description
   * @returns {boolean} Success status
   */
  setJobDescription(agentId, industry, jobLevel, jobDescription) {
    try {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      agent.jobDescription = {
        ...agent.jobDescription,
        ...jobDescription,
        title: agent.professional.jobTitle,
        level: jobLevel,
        industry: industry,
        reportingManager: agent.professional.reportsTo
      };

      agent.system.updatedAt = new Date().toISOString();
      logger.info(`Job description set for ${agent.personal.fullName}`);
      return true;
    } catch (error) {
      logger.error(`Error setting job description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update agent's voice synthesis settings
   * @param {string} agentId - Agent ID
   * @param {Object} voiceSettings - Voice configuration
   * @returns {Object} Updated voice settings
   */
  updateVoiceSynthesis(agentId, voiceSettings) {
    try {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Update voice settings
      if (voiceSettings.speechRate !== undefined) {
        if (voiceSettings.speechRate < 0.5 || voiceSettings.speechRate > 2.0) {
          throw new Error('Speech rate must be between 0.5 and 2.0');
        }
        agent.voiceSynthesis.speechRate = voiceSettings.speechRate;
      }

      if (voiceSettings.pitch !== undefined) {
        if (voiceSettings.pitch < 0.5 || voiceSettings.pitch > 2.0) {
          throw new Error('Pitch must be between 0.5 and 2.0');
        }
        agent.voiceSynthesis.pitch = voiceSettings.pitch;
      }

      if (voiceSettings.volume !== undefined) {
        if (voiceSettings.volume < 0.0 || voiceSettings.volume > 1.0) {
          throw new Error('Volume must be between 0.0 and 1.0');
        }
        agent.voiceSynthesis.volume = voiceSettings.volume;
      }

      // Update emotional tone
      if (voiceSettings.emotionalTone) {
        for (const [key, value] of Object.entries(voiceSettings.emotionalTone)) {
          if (value < 0 || value > 1) {
            throw new Error(`Emotional ${key} must be between 0 and 1`);
          }
          agent.voiceSynthesis.emotionalTone[key] = value;
        }
      }

      // Store voice adjustment for real-time use
      if (voiceSettings.voiceAdjustment) {
        agent.voiceSynthesis.voiceAdjustments = {
          ...agent.voiceSynthesis.voiceAdjustments,
          ...voiceSettings.voiceAdjustment,
          timestamp: new Date().toISOString()
        };
      }

      agent.system.updatedAt = new Date().toISOString();
      logger.info(`Voice synthesis updated for ${agent.personal.fullName}`);
      return agent.voiceSynthesis;
    } catch (error) {
      logger.error(`Error updating voice synthesis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent's current voice synthesis profile
   * @param {string} agentId - Agent ID
   * @returns {Object} Voice synthesis profile
   */
  getVoiceSynthesisProfile(agentId) {
    try {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      return {
        voiceId: agent.voiceSynthesis.voiceId,
        voiceProvider: agent.voiceSynthesis.voiceProvider,
        language: agent.voiceSynthesis.language,
        gender: agent.voiceSynthesis.gender,
        age: agent.voiceSynthesis.age,
        accent: agent.voiceSynthesis.accent,
        speechRate: agent.voiceSynthesis.speechRate,
        pitch: agent.voiceSynthesis.pitch,
        volume: agent.voiceSynthesis.volume,
        emotionalTone: agent.voiceSynthesis.emotionalTone,
        recentAdjustments: agent.voiceSynthesis.voiceAdjustments
      };
    } catch (error) {
      logger.error(`Error getting voice profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent profile by ID
   * @param {string} agentId - Agent ID
   * @returns {Object} Agent profile
   */
  getAgentProfile(agentId) {
    try {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Decrypt sensitive fields for display
      const decryptedAgent = JSON.parse(JSON.stringify(agent));
      this._decryptSensitiveFields(decryptedAgent);

      return decryptedAgent;
    } catch (error) {
      logger.error(`Error getting agent profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all agents for a company
   * @param {string} companyId - Company ID
   * @returns {Array} Array of agent profiles
   */
  getCompanyAgents(companyId) {
    try {
      const agents = this.agents.filter(a => a.companyId === companyId);
      
      // Decrypt sensitive fields
      return agents.map(agent => {
        const decryptedAgent = JSON.parse(JSON.stringify(agent));
        this._decryptSensitiveFields(decryptedAgent);
        return decryptedAgent;
      });
    } catch (error) {
      logger.error(`Error getting company agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agents by department
   * @param {string} companyId - Company ID
   * @param {string} department - Department name
   * @returns {Array} Array of agents in department
   */
  getAgentsByDepartment(companyId, department) {
    try {
      return this.getCompanyAgents(companyId)
        .filter(a => a.professional.department === department);
    } catch (error) {
      logger.error(`Error getting agents by department: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reporting chain for agent
   * @param {string} agentId - Agent ID
   * @returns {Array} Array of agents in reporting chain
   */
  getReportingChain(agentId) {
    try {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const chain = [agent];
      let currentManagerId = agent.professional.reportsTo;
      const visited = new Set([agent.id]);
      let depth = 0;
      const MAX_DEPTH = 20;

      while (currentManagerId && depth < MAX_DEPTH) {
        if (visited.has(currentManagerId)) {
          logger.warn(`Circular reporting detected for agent ${agentId} at manager ${currentManagerId}`);
          break;
        }
        
        const manager = this.agents.find(a => a.id === currentManagerId);
        if (!manager) break;
        
        chain.push(manager);
        visited.add(currentManagerId);
        currentManagerId = manager.professional.reportsTo;
        depth++;
      }

      return chain;
    } catch (error) {
      logger.error(`Error getting reporting chain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get direct reports for manager
   * @param {string} managerId - Manager ID
   * @returns {Array} Array of direct reports
   */
  getDirectReports(managerId) {
    try {
      return this.agents.filter(a => a.professional.reportsTo === managerId);
    } catch (error) {
      logger.error(`Error getting direct reports: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update agent profile
   * @param {string} agentId - Agent ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User making update
   * @returns {Object} Updated agent profile
   */
  updateAgentProfile(agentId, updates, userId) {
    try {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const allowedUpdates = [
        'firstName', 'lastName', 'email', 'phone', 'address',
        'city', 'state', 'zipCode', 'reportsTo', 'specialty',
        'yearsOfExperience', 'skills', 'expertise', 'timezone',
        'workDays', 'startTime', 'endTime', 'communicationStyle'
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key)) {
          if (key === 'firstName' || key === 'lastName') {
            agent.personal[key] = value;
            agent.personal.fullName = `${agent.personal.firstName} ${agent.personal.lastName}`;
          } else if (['city', 'state', 'zipCode'].includes(key)) {
            agent.personal[key] = value;
          } else if (['email', 'phone', 'address'].includes(key)) {
            agent.personal[key] = value;
            // Re-encrypt if needed
          } else if (['reportsTo', 'specialty'].includes(key)) {
            agent.professional[key] = value;
          } else if (key === 'yearsOfExperience') {
            agent.professional[key] = value;
          } else if (['skills', 'expertise'].includes(key)) {
            agent.professional[key] = value;
          } else if (['timezone', 'workDays', 'startTime', 'endTime'].includes(key)) {
            agent.workSchedule[key] = value;
          } else if (key === 'communicationStyle') {
            agent.backstory[key] = value;
          }
        }
      }

      agent.system.updatedAt = new Date().toISOString();
      agent.system.lastModifiedBy = userId;

      logger.info(`Agent profile updated: ${agent.personal.fullName}`);
      return agent;
    } catch (error) {
      logger.error(`Error updating agent profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get minimum staffing requirements by industry
   * @param {string} industry - Industry type
   * @returns {Object} Minimum staffing requirements
   */
  getMinimumStaffingRequirements(industry) {
    try {
      return {
        mandatory: {
          marketing: { count: 1, title: 'Head of Marketing', priority: 'high' },
          legal: { count: 1, title: 'General Counsel', priority: 'high' },
          hr: { count: 1, title: 'Head of HR', priority: 'high' },
          executive: { count: 3, titles: ['CEO', 'COO/VP Operations', 'CFO'], priority: 'critical' }
        },
        recommended: {
          sales: { count: 1, title: 'VP Sales', priority: 'high' },
          operations: { count: 1, title: 'Operations Manager', priority: 'medium' },
          technology: { count: 1, title: 'CTO/VP Technology', priority: 'high' }
        },
        industrySpecific: this._getIndustrySpecificStaffing(industry)
      };
    } catch (error) {
      logger.error(`Error getting staffing requirements: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recommend next hires based on company size and industry
   * @param {string} companyId - Company ID
   * @param {string} industry - Industry type
   * @param {number} currentHeadcount - Current employee count
   * @returns {Array} Recommended hires with job descriptions
   */
  recommendNextHires(companyId, industry, currentHeadcount) {
    try {
      const recommendations = [];

      // Growth stage recommendations
      if (currentHeadcount <= 10) {
        recommendations.push(
          { role: 'Head of Marketing', priority: 'high', reason: 'Essential for growth' },
          { role: 'General Counsel', priority: 'high', reason: 'Legal compliance critical' },
          { role: 'Head of HR', priority: 'high', reason: 'People processes needed' }
        );
      } else if (currentHeadcount <= 30) {
        recommendations.push(
          { role: 'VP Sales', priority: 'high', reason: 'Revenue acceleration' },
          { role: 'Operations Manager', priority: 'medium', reason: 'Process optimization' },
          { role: `${industry} Specialist`, priority: 'medium', reason: 'Industry expertise' }
        );
      } else if (currentHeadcount <= 75) {
        recommendations.push(
          { role: 'Head of Product', priority: 'high', reason: 'Product strategy' },
          { role: 'Regional Manager', priority: 'medium', reason: 'Market expansion' },
          { role: 'Finance Manager', priority: 'high', reason: 'Financial controls' }
        );
      } else if (currentHeadcount <= 150) {
        recommendations.push(
          { role: 'Chief Compliance Officer', priority: 'high', reason: 'Regulatory compliance' },
          { role: 'Director of Business Development', priority: 'high', reason: 'Strategic growth' },
          { role: 'Chief Marketing Officer', priority: 'medium', reason: 'Marketing expansion' }
        );
      }

      return recommendations;
    } catch (error) {
      logger.error(`Error recommending next hires: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encrypt sensitive agent fields
   * @private
   */
  _encryptSensitiveFields(agent) {
    if (!this.encryptionKey) return;

    const crypto = require('crypto');
    const fieldsToEncrypt = [
      { path: 'personal.dateOfBirth', value: agent.personal.dateOfBirth },
      { path: 'personal.ssn', value: agent.personal.ssn },
      { path: 'personal.address', value: agent.personal.address },
      { path: 'personal.email', value: agent.personal.email },
      { path: 'personal.phone', value: agent.personal.phone },
      { path: 'personal.personalPhone', value: agent.personal.personalPhone },
      { path: 'personal.emergencyContact', value: agent.personal.emergencyContact },
      { path: 'personal.emergencyContactPhone', value: agent.personal.emergencyContactPhone }
    ];

    // Implement AES-256 encryption for each field
    for (const field of fieldsToEncrypt) {
      if (!field.value) continue;
      
      try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(String(field.value), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Store encrypted value with IV prepended (IV is not secret, needed for decryption)
        const parts = field.path.split('.');
        let obj = agent;
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = `enc:${iv.toString('hex')}:${encrypted}`;
      } catch (error) {
        console.warn(`[AgentProfile] Encryption failed for ${field.path}:`, error.message);
      }
    }
  }

  /**
   * Decrypt sensitive agent fields
   * @private
   */
  _decryptSensitiveFields(agent) {
    if (!this.encryptionKey) return;

    const crypto = require('crypto');
    const sensitiveFields = [
      'personal.dateOfBirth',
      'personal.ssn',
      'personal.address',
      'personal.email',
      'personal.phone',
      'personal.personalPhone',
      'personal.emergencyContact',
      'personal.emergencyContactPhone'
    ];

    // Implement AES-256 decryption for sensitive fields
    for (const fieldPath of sensitiveFields) {
      const parts = fieldPath.split('.');
      let obj = agent;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      
      const value = obj[parts[parts.length - 1]];
      if (!value || typeof value !== 'string' || !value.startsWith('enc:')) continue;
      
      try {
        const [, iv, encrypted] = value.split(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        obj[parts[parts.length - 1]] = decrypted;
      } catch (error) {
        console.warn(`[AgentProfile] Decryption failed for ${fieldPath}:`, error.message);
        obj[parts[parts.length - 1]] = null;
      }
    }
  }

  /**
   * Get industry-specific staffing recommendations
   * @private
   */
  _getIndustrySpecificStaffing(industry) {
    const staffingByIndustry = {
      'real-estate': [
        { role: 'Broker in Charge', priority: 'critical' },
        { role: 'Transaction Coordinator', priority: 'high' },
        { role: 'Marketing Manager', priority: 'high' },
        { role: 'Technology Manager', priority: 'medium' }
      ],
      'technology': [
        { role: 'CTO', priority: 'critical' },
        { role: 'VP Engineering', priority: 'high' },
        { role: 'Product Manager', priority: 'high' },
        { role: 'Customer Success Manager', priority: 'high' }
      ],
      'finance': [
        { role: 'Chief Compliance Officer', priority: 'critical' },
        { role: 'Risk Manager', priority: 'critical' },
        { role: 'Trading Lead', priority: 'high' },
        { role: 'Operations Manager', priority: 'high' }
      ],
      'healthcare': [
        { role: 'Chief Medical Officer', priority: 'critical' },
        { role: 'HIPAA Compliance Officer', priority: 'critical' },
        { role: 'Medical Records Manager', priority: 'high' },
        { role: 'Patient Advocate', priority: 'medium' }
      ],
      'legal': [
        { role: 'Managing Partner', priority: 'critical' },
        { role: 'Practice Group Lead', priority: 'high' },
        { role: 'Office Manager', priority: 'high' },
        { role: 'Paralegal Supervisor', priority: 'high' }
      ],
      'insurance': [
        { role: 'Underwriting Manager', priority: 'critical' },
        { role: 'Claims Manager', priority: 'critical' },
        { role: 'Compliance Officer', priority: 'high' },
        { role: 'Sales Manager', priority: 'high' }
      ],
      'manufacturing': [
        { role: 'Plant Manager', priority: 'critical' },
        { role: 'Quality Manager', priority: 'critical' },
        { role: 'Supply Chain Manager', priority: 'high' },
        { role: 'Maintenance Manager', priority: 'high' }
      ],
      'nonprofit': [
        { role: 'Executive Director', priority: 'critical' },
        { role: 'Program Director', priority: 'high' },
        { role: 'Development Manager', priority: 'high' },
        { role: 'Grants Manager', priority: 'high' }
      ]
    };

    return staffingByIndustry[industry] || [];
  }
}

module.exports = AgentProfile;
