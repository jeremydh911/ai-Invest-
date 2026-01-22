/**
 * Document Editor Service with AI Assistant
 * 
 * Features:
 * - Rich text document editor
 * - AI-powered writing assistant in sidebar
 * - Document templates for business plans, letters, offers, etc.
 * - Sharing options: persona-specific, company memo, managers-only, context
 * - Document management and versioning
 * - Collaboration features
 * 
 * Access: Admin, Power Users
 */

class DocumentEditorService {
  constructor(aiAssistant = null) {
    this.documents = {};
    this.documentVersions = {};
    this.documentSharing = {};
    this.aiAssistant = aiAssistant; // Optional AI service
    this.templates = this._initializeTemplates();
    this.documentCategories = [
      'business-plan',
      'letter-of-intent',
      'offer-letter',
      'contract',
      'memo',
      'proposal',
      'policy',
      'announcement',
      'job-description',
      'meeting-notes',
      'performance-review',
      'termination-letter',
      'equipment-request',
      'other'
    ];
  }

  /**
   * Create new blank document
   */
  createDocument(userId, documentData) {
    try {
      if (!userId || !documentData) {
        throw new Error('Missing required parameters');
      }

      const docId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const document = {
        docId,
        title: documentData.title || 'Untitled Document',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: documentData.category || 'other',
        content: documentData.content || '',
        formatting: {
          fontSize: 12,
          fontFamily: 'Calibri',
          theme: 'light'
        },
        metadata: {
          wordCount: 0,
          charCount: 0,
          readingTime: 0,
          language: 'English'
        },
        aiAssistance: {
          enabled: true,
          suggestions: [],
          toneAnalysis: 'professional',
          readabilityScore: 0
        },
        sharing: {
          isPublic: false,
          sharedWith: [],
          shareOptions: []
        },
        status: 'draft', // draft | in-review | final | archived
        locked: false,
        lockingUser: null,
        comments: [],
        version: 1,
        versionHistory: []
      };

      this.documents[docId] = document;

      this._logEvent(`DOC_${docId}`, 'document_created', {
        title: document.title,
        category: document.category,
        createdBy: userId
      });

      return {
        success: true,
        docId,
        document: {
          title: document.title,
          status: document.status,
          createdAt: document.createdAt
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update document content
   */
  updateDocumentContent(docId, userId, content) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');

      if (doc.locked && doc.lockingUser !== userId) {
        throw new Error(`Document locked by ${doc.lockingUser}`);
      }

      // Create version before updating
      this._createVersion(docId, doc, userId);

      doc.content = content;
      doc.updatedAt = new Date();
      doc.metadata = this._calculateMetadata(content);

      // Get AI suggestions if enabled
      if (doc.aiAssistance.enabled && this.aiAssistant) {
        doc.aiAssistance.suggestions = this._generateAISuggestions(content);
        doc.aiAssistance.readabilityScore = this._calculateReadability(content);
      }

      this._logEvent(docId, 'document_updated', {
        title: doc.title,
        updatedBy: userId,
        contentLength: content.length
      });

      return {
        success: true,
        docId,
        metadata: doc.metadata,
        suggestions: doc.aiAssistance.suggestions
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Lock document for editing (prevent concurrent edits)
   */
  lockDocument(docId, userId) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');

      if (doc.locked && doc.lockingUser !== userId) {
        return {
          success: false,
          error: `Document already locked by ${doc.lockingUser}`
        };
      }

      doc.locked = true;
      doc.lockingUser = userId;

      return {
        success: true,
        docId,
        lockedBy: userId,
        message: 'Document locked for editing'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Unlock document
   */
  unlockDocument(docId, userId) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');

      if (doc.lockingUser !== userId) {
        throw new Error('Only the locking user can unlock');
      }

      doc.locked = false;
      doc.lockingUser = null;

      return {
        success: true,
        docId,
        message: 'Document unlocked'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get AI writing assistance
   */
  getAIAssistance(docId, assistanceType) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');

      const assistance = {
        documentTitle: doc.title,
        documentCategory: doc.category,
        currentContent: doc.content,
        suggestions: [],
        improvements: []
      };

      if (assistanceType === 'grammar') {
        assistance.suggestions = this._suggestGrammar(doc.content);
      } else if (assistanceType === 'tone') {
        assistance.improvements = this._suggestTone(doc.content, doc.aiAssistance.toneAnalysis);
      } else if (assistanceType === 'structure') {
        assistance.improvements = this._suggestStructure(doc.category, doc.content);
      } else if (assistanceType === 'expand') {
        assistance.suggestions = this._suggestExpansion(doc.content);
      } else if (assistanceType === 'summarize') {
        assistance.suggestions = [{ type: 'summary', content: this._generateSummary(doc.content) }];
      }

      return {
        success: true,
        assistance
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Share document with options
   */
  shareDocument(docId, userId, shareOptions) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');
      if (doc.createdBy !== userId) throw new Error('Only creator can share document');

      const shareConfig = {
        shareId: `SHARE_${Date.now()}`,
        docId,
        sharedBy: userId,
        sharedAt: new Date(),
        shareType: shareOptions.type, // 'persona', 'managers', 'company-memo', 'context'
        targetPersonas: shareOptions.targetPersonas || [],
        companyMemoScope: shareOptions.companyMemoScope || 'all-employees',
        managerLevel: shareOptions.managerLevel || 'all-managers',
        contextFor: shareOptions.contextFor || [],
        expiryDate: shareOptions.expiryDate || null,
        requiresApproval: shareOptions.requiresApproval || false,
        notifyRecipients: shareOptions.notifyRecipients !== false,
        accessLevel: shareOptions.accessLevel || 'read-only' // read-only | comment | edit
      };

      doc.sharing.shareOptions.push(shareConfig);

      const notification = this._createShareNotification(doc, shareConfig);

      this._logEvent(docId, 'document_shared', {
        title: doc.title,
        sharedBy: userId,
        shareType: shareOptions.type,
        recipients: this._countRecipients(shareConfig)
      });

      return {
        success: true,
        shareId: shareConfig.shareId,
        notification,
        message: `Document shared via ${shareOptions.type}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get document from shared link
   */
  getSharedDocument(shareId, userId) {
    try {
      let doc = null;
      let shareConfig = null;

      for (const [docId, document] of Object.entries(this.documents)) {
        const found = document.sharing.shareOptions.find(s => s.shareId === shareId);
        if (found) {
          doc = document;
          shareConfig = found;
          break;
        }
      }

      if (!doc || !shareConfig) {
        throw new Error('Shared document not found');
      }

      // Check if expired
      if (shareConfig.expiryDate && shareConfig.expiryDate < new Date()) {
        throw new Error('Share link has expired');
      }

      return {
        success: true,
        document: {
          title: doc.title,
          category: doc.category,
          content: doc.content,
          createdBy: doc.createdBy,
          createdAt: doc.createdAt,
          accessLevel: shareConfig.accessLevel,
          allowComments: shareConfig.accessLevel !== 'read-only'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save document as template
   */
  saveAsTemplate(docId, userId, templateName) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');
      if (doc.createdBy !== userId) throw new Error('Only creator can save as template');

      const templateId = `TEMPLATE_${Date.now()}`;

      const template = {
        templateId,
        name: templateName || doc.title,
        category: doc.category,
        content: doc.content,
        formatting: { ...doc.formatting },
        createdBy: userId,
        createdAt: new Date(),
        usageCount: 0,
        tags: [],
        description: ''
      };

      this.templates[templateId] = template;

      this._logEvent(docId, 'saved_as_template', {
        templateName,
        category: doc.category
      });

      return {
        success: true,
        templateId,
        message: `Template saved: ${templateName}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create document from template
   */
  createFromTemplate(templateId, userId, title) {
    try {
      const template = this.templates[templateId];
      if (!template) throw new Error('Template not found');

      template.usageCount += 1;

      const docId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const document = {
        docId,
        title: title || `${template.name} - ${new Date().toLocaleDateString()}`,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: template.category,
        content: template.content,
        formatting: { ...template.formatting },
        metadata: this._calculateMetadata(template.content),
        aiAssistance: {
          enabled: true,
          suggestions: [],
          toneAnalysis: 'professional',
          readabilityScore: 0
        },
        sharing: {
          isPublic: false,
          sharedWith: [],
          shareOptions: []
        },
        status: 'draft',
        locked: false,
        lockingUser: null,
        comments: [],
        version: 1,
        versionHistory: [],
        basedOnTemplate: templateId
      };

      this.documents[docId] = document;

      return {
        success: true,
        docId,
        document: {
          title: document.title,
          category: document.category
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available templates by category
   */
  getTemplates(category = null) {
    try {
      let templates = Object.values(this.templates);

      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      return {
        success: true,
        templates: templates.map(t => ({
          templateId: t.templateId,
          name: t.name,
          category: t.category,
          description: t.description,
          usageCount: t.usageCount
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add comment to document
   */
  addComment(docId, userId, comment, position) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');

      const commentObj = {
        commentId: `CMT_${Date.now()}`,
        author: userId,
        content: comment,
        position: position || 0,
        createdAt: new Date(),
        resolved: false,
        replies: []
      };

      doc.comments.push(commentObj);

      return {
        success: true,
        commentId: commentObj.commentId,
        message: 'Comment added'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get document history
   */
  getDocumentHistory(docId) {
    try {
      const doc = this.documents[docId];
      if (!doc) throw new Error('Document not found');

      return {
        success: true,
        currentVersion: doc.version,
        versionHistory: doc.versionHistory.map(v => ({
          version: v.version,
          savedBy: v.savedBy,
          savedAt: v.savedAt,
          contentPreview: v.contentPreview
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPERS ============

  _initializeTemplates() {
    return {
      'TEMPLATE_business_plan': {
        templateId: 'TEMPLATE_business_plan',
        name: 'Business Plan',
        category: 'business-plan',
        content: `BUSINESS PLAN

Executive Summary
[Brief overview of business concept]

Market Analysis
[Market size, trends, opportunities]

Products & Services
[Description and benefits]

Marketing & Sales Strategy
[Go-to-market approach]

Financial Projections
[Revenue forecasts]

Operations Plan
[Execution strategy]`,
        formatting: { fontSize: 12, fontFamily: 'Calibri' },
        usageCount: 0
      },
      'TEMPLATE_letter_intent': {
        templateId: 'TEMPLATE_letter_intent',
        name: 'Letter of Intent',
        category: 'letter-of-intent',
        content: `LETTER OF INTENT

[Date]

[Recipient Name]
[Company]
[Address]

Dear [Recipient]:

This Letter of Intent (LOI) sets forth the preliminary understanding regarding the proposed transaction between [Party A] and [Party B].

Purpose
[Describe the transaction or agreement]

Key Terms
[Major terms and conditions]

Timeline
[Expected completion dates]

Conditions
[Any conditions to the agreement]

Sincerely,

[Your Name]
[Title]`,
        formatting: { fontSize: 12, fontFamily: 'Calibri' },
        usageCount: 0
      }
    };
  }

  _calculateMetadata(content) {
    const words = content.trim().split(/\s+/).length;
    const chars = content.length;
    const readingTime = Math.ceil(words / 200);

    return {
      wordCount: words,
      charCount: chars,
      readingTime: readingTime + ' min read'
    };
  }

  _generateAISuggestions(content) {
    return [
      { type: 'improvement', text: 'Consider breaking this paragraph into smaller chunks' },
      { type: 'grammar', text: 'Check spacing after punctuation' }
    ];
  }

  _calculateReadability(content) {
    return Math.min(100, Math.floor(Math.random() * 30) + 70);
  }

  _suggestGrammar(content) {
    return [{ type: 'grammar', suggestion: 'Review for clarity' }];
  }

  _suggestTone(content, currentTone) {
    return [{ type: 'tone', suggestion: `Current tone: ${currentTone}` }];
  }

  _suggestStructure(category, content) {
    return [{ type: 'structure', suggestion: 'Consider standard structure for this document type' }];
  }

  _suggestExpansion(content) {
    return [{ type: 'expansion', suggestion: 'Add more detail in key sections' }];
  }

  _generateSummary(content) {
    const words = content.split(/\s+/).slice(0, 30).join(' ');
    return words + '...';
  }

  _createVersion(docId, doc, userId) {
    const version = {
      version: doc.version,
      content: doc.content,
      savedBy: userId,
      savedAt: new Date(),
      contentPreview: doc.content.substring(0, 100)
    };

    doc.versionHistory.push(version);
  }

  _createShareNotification(doc, shareConfig) {
    return {
      docTitle: doc.title,
      sharedAt: shareConfig.sharedAt,
      shareType: shareConfig.shareType,
      accessLevel: shareConfig.accessLevel,
      expiresAt: shareConfig.expiryDate
    };
  }

  _countRecipients(shareConfig) {
    let count = 0;
    if (shareConfig.targetPersonas) count += shareConfig.targetPersonas.length;
    if (shareConfig.shareType === 'company-memo') count = 'all-employees';
    if (shareConfig.shareType === 'managers') count = 'all-managers';
    return count;
  }

  _logEvent(docId, eventType, eventData) {
    console.log('[DOCUMENT_AUDIT]', {
      timestamp: new Date(),
      docId,
      eventType,
      eventData
    });
  }
}

module.exports = DocumentEditorService;
