/**
 * Agent Backstory & Life Story Service
 * 
 * Manages agent personal profiles and life stories
 * - Maintain agent backstory information
 * - Track daily life updates and events
 * - Personal achievements and milestones
 * - Dreams, goals, hobbies, off-time activities
 * - Help executives and managers get to know agents personally
 * 
 * Goal: Foster human connection within the organization
 * Compliance: Privacy-focused, GDPR-compliant (personal data)
 */

class AgentBackstoryService {
  constructor() {
    // Agent profiles storage (in production: database)
    this.agentProfiles = {};
    this.lifeUpdates = {};
    this.backstories = {};
    this.milestones = {};
    this.dreamBoard = {};
    this.offTimeActivities = {};
    
    // Privacy settings per agent
    this.privacySettings = {};
  }

  /**
   * Create or update agent's main backstory profile
   * Called during onboarding and when agent wants to update profile
   */
  createAgentProfile(agentId, profileData) {
    try {
      if (!agentId || !profileData) {
        throw new Error('Missing required profile data');
      }

      const profile = {
        agentId,
        name: profileData.name,
        jobTitle: profileData.jobTitle,
        department: profileData.department,
        hireDate: profileData.hireDate || new Date(),
        
        // Personal background
        hometown: profileData.hometown || 'Not shared',
        education: profileData.education || 'Not shared',
        yearsOfExperience: profileData.yearsOfExperience || 0,
        previousRoles: profileData.previousRoles || [],
        
        // Life story
        backstory: profileData.backstory || '',
        personalGoals: profileData.personalGoals || [],
        values: profileData.values || [],
        
        // Hobbies and interests
        hobbies: profileData.hobbies || [],
        sports: profileData.sports || [],
        arts: profileData.arts || [],
        volunteer: profileData.volunteer || [],
        
        // Dream board
        dreams: profileData.dreams || [],
        targetMilestones: profileData.targetMilestones || [],
        
        // Current life
        familyStatus: profileData.familyStatus || 'Not shared',
        location: profileData.location || 'Not shared',
        timezone: profileData.timezone || 'America/New_York',
        
        // Preferences
        communicationStyle: profileData.communicationStyle || 'Professional',
        learningStyle: profileData.learningStyle || 'Mixed',
        workPreferences: profileData.workPreferences || [],
        
        createdAt: new Date(),
        updatedAt: new Date(),
        privacyLevel: profileData.privacyLevel || 'team' // team, department, company, private
      };

      this.agentProfiles[agentId] = profile;

      // Initialize life updates array for this agent
      if (!this.lifeUpdates[agentId]) {
        this.lifeUpdates[agentId] = [];
      }

      this._logEvent(`PROFILE_${agentId}`, 'agent_profile_created', {
        agentName: profile.name,
        jobTitle: profile.jobTitle
      });

      return {
        success: true,
        agentId,
        message: 'Agent profile created successfully',
        profile: {
          name: profile.name,
          jobTitle: profile.jobTitle,
          department: profile.department,
          createdAt: profile.createdAt
        }
      };
    } catch (error) {
      this._logEvent('BACKSTORY_ERROR', 'profile_creation_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Agent adds daily life update
   * Called daily: "What have you been doing, learned, enjoyed?"
   */
  addDailyLifeUpdate(agentId, updateData) {
    try {
      if (!agentId || !updateData) {
        throw new Error('Missing update data');
      }

      const profile = this.agentProfiles[agentId];
      if (!profile) {
        throw new Error('Agent profile not found. Create profile first.');
      }

      const update = {
        updateId: `UPDATE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        date: new Date(),
        
        // Daily activities and events
        activities: updateData.activities || [],
        highlights: updateData.highlights || '',
        challenges: updateData.challenges || '',
        lessonsLearned: updateData.lessonsLearned || [],
        
        // Life events (fun, significant, milestone moments)
        lifeEvents: updateData.lifeEvents || [], // e.g., "Got promoted", "Started new hobby", "Traveled to X"
        achievements: updateData.achievements || [],
        
        // Personal growth
        skillsDeveloped: updateData.skillsDeveloped || [],
        goalsProgress: updateData.goalsProgress || [],
        
        // Off-time activities
        offTimeActivities: updateData.offTimeActivities || [], // e.g., "Went hiking", "Read 3 chapters of book"
        socialActivities: updateData.socialActivities || [],
        
        // Dreams and aspirations
        dreamProgress: updateData.dreamProgress || [], // "Working towards getting certified", "Saving for trip"
        inspiration: updateData.inspiration || '',
        
        // Mood and engagement
        mood: updateData.mood || 'neutral', // positive, neutral, challenging
        energyLevel: updateData.energyLevel || 5, // 1-10
        engagementWithTeam: updateData.engagementWithTeam || 'normal',
        
        mood_details: updateData.mood_details || '',
        visibility: updateData.visibility || profile.privacyLevel
      };

      if (!this.lifeUpdates[agentId]) {
        this.lifeUpdates[agentId] = [];
      }

      this.lifeUpdates[agentId].push(update);

      // Track milestones if any
      if (update.lifeEvents && update.lifeEvents.length > 0) {
        update.lifeEvents.forEach(event => {
          this._trackMilestone(agentId, event, update.date);
        });
      }

      // Update agent profile with latest info
      profile.updatedAt = new Date();
      profile.lastLifeUpdate = update.date;

      this._logEvent(update.updateId, 'life_update_added', {
        agentId,
        agentName: profile.name,
        mood: update.mood,
        events: update.lifeEvents.length
      });

      return {
        success: true,
        updateId: update.updateId,
        agentId,
        message: 'Daily life update recorded successfully',
        update: {
          date: update.date,
          highlights: update.highlights,
          lifeEvents: update.lifeEvents,
          offTimeActivities: update.offTimeActivities
        }
      };
    } catch (error) {
      this._logEvent('BACKSTORY_ERROR', 'life_update_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add milestone achievement to agent's life story
   */
  recordMilestone(agentId, milestoneData) {
    try {
      if (!agentId || !milestoneData) {
        throw new Error('Missing milestone data');
      }

      const milestone = {
        milestoneId: `MILE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        type: milestoneData.type, // 'personal', 'professional', 'family', 'health', 'learning', 'dream'
        title: milestoneData.title,
        description: milestoneData.description,
        date: milestoneData.date || new Date(),
        impact: milestoneData.impact || 'significant', // minor, significant, major
        tags: milestoneData.tags || [],
        photo: milestoneData.photo || null,
        publicize: milestoneData.publicize || false, // Share with team?
        recordedAt: new Date()
      };

      if (!this.milestones[agentId]) {
        this.milestones[agentId] = [];
      }

      this.milestones[agentId].push(milestone);

      const profile = this.agentProfiles[agentId];
      if (profile) {
        profile.updatedAt = new Date();
      }

      this._logEvent(milestone.milestoneId, 'milestone_recorded', {
        agentId,
        milestoneType: milestone.type,
        title: milestone.title,
        publicize: milestone.publicize
      });

      return {
        success: true,
        milestoneId: milestone.milestoneId,
        message: `Milestone recorded: ${milestone.title}`,
        milestone: {
          type: milestone.type,
          title: milestone.title,
          date: milestone.date,
          publicize: milestone.publicize
        }
      };
    } catch (error) {
      this._logEvent('BACKSTORY_ERROR', 'milestone_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update agent's dream board
   * Dreams, goals, aspirations for the future
   */
  updateDreamBoard(agentId, dreamData) {
    try {
      if (!agentId || !dreamData) {
        throw new Error('Missing dream data');
      }

      const dreamEntry = {
        dreamId: `DREAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        category: dreamData.category, // 'career', 'travel', 'learning', 'family', 'lifestyle', 'creative'
        title: dreamData.title,
        description: dreamData.description,
        targetDate: dreamData.targetDate || null,
        status: dreamData.status || 'dreaming', // dreaming, planning, pursuing, achieved
        progressPercentage: dreamData.progressPercentage || 0,
        nextSteps: dreamData.nextSteps || [],
        resources: dreamData.resources || [],
        constraints: dreamData.constraints || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!this.dreamBoard[agentId]) {
        this.dreamBoard[agentId] = [];
      }

      this.dreamBoard[agentId].push(dreamEntry);

      const profile = this.agentProfiles[agentId];
      if (profile && !profile.dreams) profile.dreams = [];
      if (profile) {
        profile.dreams.push(dreamEntry.title);
        profile.updatedAt = new Date();
      }

      this._logEvent(dreamEntry.dreamId, 'dream_added', {
        agentId,
        category: dreamEntry.category,
        dream: dreamEntry.title
      });

      return {
        success: true,
        dreamId: dreamEntry.dreamId,
        message: 'Dream added to your dream board',
        dream: {
          category: dreamEntry.category,
          title: dreamEntry.title,
          status: dreamEntry.status,
          targetDate: dreamEntry.targetDate
        }
      };
    } catch (error) {
      this._logEvent('BACKSTORY_ERROR', 'dream_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update dream progress
   */
  updateDreamProgress(agentId, dreamId, progressData) {
    try {
      if (!agentId || !dreamId || !progressData) {
        throw new Error('Missing progress data');
      }

      const dreams = this.dreamBoard[agentId] || [];
      const dream = dreams.find(d => d.dreamId === dreamId);

      if (!dream) {
        throw new Error('Dream not found');
      }

      dream.status = progressData.status || dream.status;
      dream.progressPercentage = Math.min(100, progressData.progressPercentage || dream.progressPercentage);
      
      if (progressData.nextSteps) {
        dream.nextSteps = progressData.nextSteps;
      }
      
      dream.updatedAt = new Date();

      this._logEvent(dreamId, 'dream_progress_updated', {
        agentId,
        dream: dream.title,
        progress: dream.progressPercentage
      });

      return {
        success: true,
        dreamId,
        dream: {
          title: dream.title,
          status: dream.status,
          progressPercentage: dream.progressPercentage,
          updatedAt: dream.updatedAt
        }
      };
    } catch (error) {
      this._logEvent('BACKSTORY_ERROR', 'progress_update_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Record off-time activities and hobbies
   */
  addOffTimeActivity(agentId, activityData) {
    try {
      if (!agentId || !activityData) {
        throw new Error('Missing activity data');
      }

      const activity = {
        activityId: `ACTIVITY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        type: activityData.type, // 'hobby', 'sport', 'creative', 'social', 'wellness', 'travel'
        name: activityData.name,
        description: activityData.description,
        frequency: activityData.frequency, // 'daily', 'weekly', 'monthly', 'occasional'
        passionLevel: activityData.passionLevel || 5, // 1-10
        startDate: activityData.startDate || new Date(),
        achievements: activityData.achievements || [],
        communities: activityData.communities || [],
        createdAt: new Date()
      };

      if (!this.offTimeActivities[agentId]) {
        this.offTimeActivities[agentId] = [];
      }

      this.offTimeActivities[agentId].push(activity);

      const profile = this.agentProfiles[agentId];
      if (profile) {
        profile.updatedAt = new Date();
        // Add to appropriate hobby list
        if (activity.type === 'hobby' && !profile.hobbies.includes(activity.name)) {
          profile.hobbies.push(activity.name);
        } else if (activity.type === 'sport' && !profile.sports.includes(activity.name)) {
          profile.sports.push(activity.name);
        } else if (activity.type === 'creative' && !profile.arts.includes(activity.name)) {
          profile.arts.push(activity.name);
        }
      }

      this._logEvent(activity.activityId, 'activity_added', {
        agentId,
        activityType: activity.type,
        activityName: activity.name
      });

      return {
        success: true,
        activityId: activity.activityId,
        message: 'Off-time activity recorded',
        activity: {
          type: activity.type,
          name: activity.name,
          frequency: activity.frequency,
          passionLevel: activity.passionLevel
        }
      };
    } catch (error) {
      this._logEvent('BACKSTORY_ERROR', 'activity_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent's complete life story profile
   * Used by managers, CEO, and team members (with privacy respect)
   */
  getAgentProfile(agentId, requesterLevel = 'basic') {
    try {
      if (!agentId) throw new Error('Agent ID required');

      const profile = this.agentProfiles[agentId];
      if (!profile) {
        throw new Error('Agent profile not found');
      }

      // Build response based on privacy settings
      const response = {
        agentId,
        name: profile.name,
        jobTitle: profile.jobTitle,
        department: profile.department,
        hireDate: profile.hireDate,
        lastUpdated: profile.updatedAt,
        
        // Always visible
        publicInfo: {
          name: profile.name,
          jobTitle: profile.jobTitle,
          department: profile.department,
          timezone: profile.timezone
        },
        
        // Visible to team members and above
        teamInfo: requesterLevel !== 'basic' ? {
          hometown: profile.hometown,
          hobbies: profile.hobbies,
          sports: profile.sports,
          arts: profile.arts,
          communicationStyle: profile.communicationStyle,
          learningStyle: profile.learningStyle
        } : null,
        
        // Visible to managers and above
        managerInfo: requesterLevel === 'manager' || requesterLevel === 'executive' ? {
          backstory: profile.backstory,
          values: profile.values,
          personalGoals: profile.personalGoals,
          recentLifeUpdates: this._getRecentUpdates(agentId, 7),
          dreams: this.dreamBoard[agentId] || [],
          milestones: this.milestones[agentId] || [],
          offTimeActivities: this.offTimeActivities[agentId] || []
        } : null,
        
        // Full details only for executive/admin
        executiveInfo: requesterLevel === 'executive' ? {
          fullBackstory: profile.backstory,
          allPersonalGoals: profile.personalGoals,
          allDreams: this.dreamBoard[agentId] || [],
          allMilestones: this.milestones[agentId] || [],
          allLifeUpdates: this.lifeUpdates[agentId] || [],
          allActivities: this.offTimeActivities[agentId] || [],
          educationBackground: profile.education,
          yearsOfExperience: profile.yearsOfExperience,
          previousRoles: profile.previousRoles
        } : null
      };

      return {
        success: true,
        profile: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent's recent life updates (last N days)
   */
  getRecentUpdates(agentId, days = 7) {
    try {
      return {
        success: true,
        agentId,
        updates: this._getRecentUpdates(agentId, days)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Manager/CEO dashboard: get all agent profiles summary
   */
  getAllAgentProfilesSummary(department = null) {
    try {
      let profiles = Object.values(this.agentProfiles);

      if (department) {
        profiles = profiles.filter(p => p.department === department);
      }

      const summary = profiles.map(p => ({
        agentId: p.agentId,
        name: p.name,
        jobTitle: p.jobTitle,
        department: p.department,
        hireDate: p.hireDate,
        lastUpdate: p.updatedAt,
        hobbies: p.hobbies.slice(0, 3), // Top 3
        recentMilestones: (this.milestones[p.agentId] || []).slice(-2), // Last 2
        dreams: (this.dreamBoard[p.agentId] || []).length,
        activities: (this.offTimeActivities[p.agentId] || []).length
      }));

      return {
        success: true,
        total: summary.length,
        profiles: summary
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Search agent profiles by interest, hobby, or activity
   */
  searchAgentsByInterest(keyword) {
    try {
      if (!keyword) throw new Error('Search keyword required');

      const results = [];
      const keywordLower = keyword.toLowerCase();

      Object.entries(this.agentProfiles).forEach(([agentId, profile]) => {
        const hasMatch = 
          profile.hobbies.some(h => h.toLowerCase().includes(keywordLower)) ||
          profile.sports.some(s => s.toLowerCase().includes(keywordLower)) ||
          profile.arts.some(a => a.toLowerCase().includes(keywordLower)) ||
          profile.volunteer.some(v => v.toLowerCase().includes(keywordLower)) ||
          profile.values.some(v => v.toLowerCase().includes(keywordLower));

        if (hasMatch) {
          results.push({
            agentId,
            name: profile.name,
            jobTitle: profile.jobTitle,
            matchedInterests: [
              ...profile.hobbies,
              ...profile.sports,
              ...profile.arts,
              ...profile.volunteer
            ].filter(i => i.toLowerCase().includes(keywordLower))
          });
        }
      });

      return {
        success: true,
        keyword,
        resultsCount: results.length,
        results
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Celebrate agent milestone publicly
   */
  celebrateMilestone(milestoneId, celebrationMessage) {
    try {
      if (!milestoneId) throw new Error('Milestone ID required');

      // Find milestone
      let foundMilestone = null;
      let agentId = null;

      for (const [aId, miles] of Object.entries(this.milestones)) {
        const mile = miles.find(m => m.milestoneId === milestoneId);
        if (mile) {
          foundMilestone = mile;
          agentId = aId;
          break;
        }
      }

      if (!foundMilestone) {
        throw new Error('Milestone not found');
      }

      foundMilestone.celebration = {
        message: celebrationMessage,
        celebratedBy: 'Company',
        celebratedAt: new Date(),
        shared: true
      };

      this._logEvent(milestoneId, 'milestone_celebrated', {
        agentId,
        milestone: foundMilestone.title,
        celebrated: true
      });

      return {
        success: true,
        message: 'Milestone celebrated! 🎉'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Team connection report: Find agents with similar interests
   */
  findTeamConnections(agentId) {
    try {
      const profile = this.agentProfiles[agentId];
      if (!profile) throw new Error('Agent profile not found');

      const connections = [];
      const targetInterests = [
        ...profile.hobbies,
        ...profile.sports,
        ...profile.arts,
        ...profile.values
      ];

      Object.entries(this.agentProfiles).forEach(([otherId, otherProfile]) => {
        if (otherId === agentId) return;

        const otherInterests = [
          ...otherProfile.hobbies,
          ...otherProfile.sports,
          ...otherProfile.arts,
          ...otherProfile.values
        ];

        const commonInterests = targetInterests.filter(i =>
          otherInterests.some(o => o.toLowerCase() === i.toLowerCase())
        );

        if (commonInterests.length > 0) {
          connections.push({
            agentId: otherId,
            name: otherProfile.name,
            jobTitle: otherProfile.jobTitle,
            department: otherProfile.department,
            commonInterests,
            connectionStrength: Math.round((commonInterests.length / Math.max(targetInterests.length, otherInterests.length)) * 100)
          });
        }
      });

      // Sort by connection strength
      connections.sort((a, b) => b.connectionStrength - a.connectionStrength);

      return {
        success: true,
        agentId,
        agentName: profile.name,
        totalConnections: connections.length,
        connections: connections.slice(0, 10) // Top 10
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPERS ============

  _getRecentUpdates(agentId, days = 7) {
    const updates = this.lifeUpdates[agentId] || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return updates
      .filter(u => u.date >= cutoffDate)
      .sort((a, b) => b.date - a.date)
      .map(u => ({
        date: u.date,
        highlights: u.highlights,
        lifeEvents: u.lifeEvents,
        offTimeActivities: u.offTimeActivities,
        mood: u.mood
      }));
  }

  _trackMilestone(agentId, eventTitle, date) {
    // Automatic milestone tracking for significant life events
    const milestone = {
      milestoneId: `AUTO_${Date.now()}`,
      agentId,
      type: 'life',
      title: eventTitle,
      date,
      autoCreated: true,
      recordedAt: new Date()
    };

    if (!this.milestones[agentId]) {
      this.milestones[agentId] = [];
    }

    this.milestones[agentId].push(milestone);
  }

  _logEvent(eventId, eventType, eventData) {
    const log = {
      timestamp: new Date(),
      eventId,
      eventType,
      eventData,
      severity: 'info',
      service: 'AgentBackstory',
      privacyFocused: true
    };
    console.log('[BACKSTORY_AUDIT]', log);
  }
}

module.exports = AgentBackstoryService;
