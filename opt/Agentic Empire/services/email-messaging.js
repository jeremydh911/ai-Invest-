/**
 * Email & Messaging Service
 * 
 * Features:
 * - Gmail-like email interface
 * - Agent-to-agent messaging
 * - Rich email composition
 * - Mailbox management
 * - Search and filtering
 * - Attachment handling
 * - Email templates
 * - Auto-responses
 * 
 * Every agent has their own mailbox
 */

class EmailMessagingService {
  constructor() {
    this.userMailboxes = {}; // { userId: { inbox, sent, drafts, archive, trash } }
    this.messages = {}; // Central message storage
    this.emailTemplates = this._initializeEmailTemplates();
    this.autoResponses = {};
    this.mailboxSettings = {};
    this.conversationThreads = {};
  }

  /**
   * Get or create mailbox for user
   */
  getOrCreateMailbox(userId, userEmail) {
    try {
      if (!this.userMailboxes[userId]) {
        this.userMailboxes[userId] = {
          userId,
          email: userEmail,
          inbox: {
            messages: [],
            unreadCount: 0,
            filters: []
          },
          sent: {
            messages: [],
            totalCount: 0
          },
          drafts: {
            messages: [],
            totalCount: 0
          },
          archive: {
            messages: [],
            totalCount: 0
          },
          trash: {
            messages: [],
            totalCount: 0,
            autoDeleteDays: 30
          },
          starred: {
            messages: [],
            totalCount: 0
          },
          labels: {},
          createdAt: new Date()
        };

        this.mailboxSettings[userId] = {
          userId,
          signature: '',
          autoReplyEnabled: false,
          autoReplyMessage: '',
          theme: 'light',
          defaultFont: 'Arial',
          fontSize: 12,
          previewPane: 'split',
          notificationsEnabled: true
        };

        this._logEvent(`MAILBOX_${userId}`, 'mailbox_created', { userId, email: userEmail });
      }

      return {
        success: true,
        mailbox: this._getSafeMailboxInfo(this.userMailboxes[userId])
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Compose and send email
   */
  composeAndSendEmail(senderUserId, emailData) {
    try {
      if (!senderUserId || !emailData) {
        throw new Error('Missing required parameters');
      }

      const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const email = {
        messageId,
        sender: senderUserId,
        senderEmail: emailData.senderEmail,
        recipients: {
          to: emailData.to || [],
          cc: emailData.cc || [],
          bcc: emailData.bcc || []
        },
        subject: emailData.subject || '(No Subject)',
        body: emailData.body || '',
        htmlBody: emailData.htmlBody || null,
        attachments: emailData.attachments || [],
        createdAt: new Date(),
        sentAt: new Date(),
        isRead: false,
        starred: false,
        important: false,
        labels: emailData.labels || [],
        threadId: emailData.threadId || null,
        replyTo: emailData.replyTo || null,
        forwarded: false,
        status: 'sent',
        metadata: {
          priority: emailData.priority || 'normal',
          requestReadReceipt: emailData.requestReadReceipt || false,
          encryptionRequired: emailData.encryptionRequired || false
        },
        readBy: []
      };

      this.messages[messageId] = email;

      // Add to sender's sent folder
      const senderMailbox = this.userMailboxes[senderUserId];
      if (senderMailbox) {
        senderMailbox.sent.messages.push(messageId);
        senderMailbox.sent.totalCount++;
      }

      // Deliver to recipients
      const deliveryStatus = this._deliverToRecipients(messageId, email);

      // Create conversation thread
      if (emailData.threadId) {
        if (!this.conversationThreads[emailData.threadId]) {
          this.conversationThreads[emailData.threadId] = [];
        }
        this.conversationThreads[emailData.threadId].push(messageId);
      }

      this._logEvent(messageId, 'email_sent', {
        sender: senderUserId,
        recipients: emailData.to.length,
        subject: emailData.subject
      });

      return {
        success: true,
        messageId,
        deliveryStatus,
        sentAt: email.sentAt,
        message: 'Email sent successfully'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save draft email
   */
  saveDraft(userId, draftData) {
    try {
      const draftId = `DRAFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const draft = {
        messageId: draftId,
        sender: userId,
        recipients: {
          to: draftData.to || [],
          cc: draftData.cc || [],
          bcc: draftData.bcc || []
        },
        subject: draftData.subject || '(No Subject)',
        body: draftData.body || '',
        attachments: draftData.attachments || [],
        createdAt: new Date(),
        lastSavedAt: new Date(),
        status: 'draft'
      };

      this.messages[draftId] = draft;

      const userMailbox = this.userMailboxes[userId];
      if (userMailbox) {
        userMailbox.drafts.messages.push(draftId);
        userMailbox.drafts.totalCount++;
      }

      return {
        success: true,
        draftId,
        message: 'Draft saved',
        lastSavedAt: draft.lastSavedAt
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get inbox with filtering
   */
  getInbox(userId, filters = {}) {
    try {
      const mailbox = this.userMailboxes[userId];
      if (!mailbox) throw new Error('Mailbox not found');

      let messages = mailbox.inbox.messages.map(msgId => {
        const msg = this.messages[msgId];
        return msg ? this._formatMessageForDisplay(msg) : null;
      }).filter(m => m);

      // Apply filters
      if (filters.from) {
        messages = messages.filter(m => m.sender === filters.from);
      }
      if (filters.unreadOnly) {
        messages = messages.filter(m => !m.isRead);
      }
      if (filters.withAttachments) {
        messages = messages.filter(m => m.attachments.length > 0);
      }
      if (filters.starred) {
        messages = messages.filter(m => m.starred);
      }

      // Sort by date (newest first)
      messages.sort((a, b) => b.sentAt - a.sentAt);

      return {
        success: true,
        inbox: {
          totalMessages: messages.length,
          unreadCount: mailbox.inbox.unreadCount,
          messages: messages.slice(0, 50) // Paginate
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get message details
   */
  getMessage(messageId, userId) {
    try {
      const message = this.messages[messageId];
      if (!message) throw new Error('Message not found');

      // Mark as read if recipient
      if (message.recipients.to.includes(userId) && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
        message.readBy.push({ userId, readAt: new Date() });
      }

      // Load conversation thread if applicable
      const thread = message.threadId ? 
        this.conversationThreads[message.threadId] || [] : [];

      return {
        success: true,
        message: this._formatMessageForDisplay(message),
        thread: thread.map(msgId => this.messages[msgId]).filter(m => m)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send direct message between agents
   */
  sendDirectMessage(senderUserId, recipientUserId, messageContent) {
    try {
      if (!senderUserId || !recipientUserId || !messageContent) {
        throw new Error('Missing required parameters');
      }

      const messageId = `DM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create or get conversation thread
      const threadId = this._getOrCreateConversationThread(senderUserId, recipientUserId);

      const directMessage = {
        messageId,
        type: 'direct-message',
        sender: senderUserId,
        recipient: recipientUserId,
        content: messageContent,
        createdAt: new Date(),
        isRead: false,
        reactions: [],
        threadId,
        status: 'delivered'
      };

      this.messages[messageId] = directMessage;

      // Add to both users' direct message threads
      if (!this.conversationThreads[threadId]) {
        this.conversationThreads[threadId] = [];
      }
      this.conversationThreads[threadId].push(messageId);

      this._logEvent(messageId, 'direct_message_sent', {
        from: senderUserId,
        to: recipientUserId
      });

      return {
        success: true,
        messageId,
        threadId,
        deliveredAt: directMessage.createdAt
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get conversation thread
   */
  getConversationThread(threadId, userId) {
    try {
      const messages = (this.conversationThreads[threadId] || [])
        .map(msgId => this.messages[msgId])
        .filter(m => m);

      // Mark unread messages as read
      messages.forEach(msg => {
        if (msg.recipient === userId && !msg.isRead) {
          msg.isRead = true;
          msg.readAt = new Date();
        }
      });

      return {
        success: true,
        threadId,
        messages,
        participants: this._getThreadParticipants(messages)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Search emails
   */
  searchEmails(userId, searchTerm) {
    try {
      const mailbox = this.userMailboxes[userId];
      if (!mailbox) throw new Error('Mailbox not found');

      const searchResults = [];
      const allMessageIds = [
        ...mailbox.inbox.messages,
        ...mailbox.sent.messages,
        ...mailbox.drafts.messages,
        ...mailbox.archive.messages
      ];

      allMessageIds.forEach(msgId => {
        const msg = this.messages[msgId];
        if (!msg) return;

        const searchIn = [
          msg.subject || '',
          msg.body || '',
          msg.sender || '',
          (msg.recipients?.to || []).join(' ')
        ].join(' ').toLowerCase();

        if (searchIn.includes(searchTerm.toLowerCase())) {
          searchResults.push(this._formatMessageForDisplay(msg));
        }
      });

      return {
        success: true,
        searchTerm,
        resultCount: searchResults.length,
        results: searchResults
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create custom label/folder
   */
  createLabel(userId, labelName) {
    try {
      const mailbox = this.userMailboxes[userId];
      if (!mailbox) throw new Error('Mailbox not found');

      const labelId = `LABEL_${Date.now()}`;

      mailbox.labels[labelId] = {
        labelId,
        name: labelName,
        color: '#CCCCCC',
        messageCount: 0,
        createdAt: new Date()
      };

      return {
        success: true,
        labelId,
        label: mailbox.labels[labelId]
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get email templates
   */
  getEmailTemplates(category = null) {
    try {
      let templates = Object.values(this.emailTemplates);

      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      return {
        success: true,
        templates: templates.map(t => ({
          templateId: t.templateId,
          name: t.name,
          category: t.category,
          subject: t.subject
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Use email template
   */
  useEmailTemplate(templateId, userId) {
    try {
      const template = this.emailTemplates[templateId];
      if (!template) throw new Error('Template not found');

      return {
        success: true,
        template: {
          subject: template.subject,
          body: template.body,
          bodyHtml: template.bodyHtml
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Set auto-response
   */
  setAutoResponse(userId, autoResponseData) {
    try {
      const settings = this.mailboxSettings[userId];
      if (!settings) throw new Error('Mailbox settings not found');

      this.autoResponses[userId] = {
        enabled: autoResponseData.enabled || true,
        startDate: autoResponseData.startDate,
        endDate: autoResponseData.endDate,
        message: autoResponseData.message,
        subject: autoResponseData.subject || 'Auto-response',
        createdAt: new Date()
      };

      settings.autoReplyEnabled = autoResponseData.enabled;
      settings.autoReplyMessage = autoResponseData.message;

      return {
        success: true,
        message: 'Auto-response configured'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PRIVATE HELPERS ============

  _initializeEmailTemplates() {
    return {
      'TEMPLATE_client_response': {
        templateId: 'TEMPLATE_client_response',
        name: 'Client Response',
        category: 'professional',
        subject: 'Re: [Original Subject]',
        body: `Hi [Client Name],

Thank you for reaching out. 

[Your message here]

Best regards,
[Your Name]`,
        bodyHtml: null
      },
      'TEMPLATE_follow_up': {
        templateId: 'TEMPLATE_follow_up',
        name: 'Follow-up Email',
        category: 'sales',
        subject: 'Following Up on [Topic]',
        body: `Hi [Name],

I wanted to follow up on our previous conversation regarding [topic].

[Your message]

Looking forward to hearing from you.

Best regards,
[Your Name]`,
        bodyHtml: null
      },
      'TEMPLATE_meeting_request': {
        templateId: 'TEMPLATE_meeting_request',
        name: 'Meeting Request',
        category: 'professional',
        subject: 'Meeting Request: [Topic]',
        body: `Hi [Name],

I would like to schedule a meeting to discuss [topic].

Are you available on [date/time]?

Looking forward to your response.

Best regards,
[Your Name]`,
        bodyHtml: null
      }
    };
  }

  _deliverToRecipients(messageId, email) {
    const deliveryStatus = [];

    const allRecipients = [
      ...email.recipients.to,
      ...email.recipients.cc,
      ...email.recipients.bcc
    ];

    allRecipients.forEach(recipientId => {
      const mailbox = this.userMailboxes[recipientId];
      if (mailbox) {
        mailbox.inbox.messages.push(messageId);
        mailbox.inbox.unreadCount++;

        deliveryStatus.push({
          recipient: recipientId,
          status: 'delivered',
          deliveredAt: new Date()
        });
      }
    });

    return deliveryStatus;
  }

  _formatMessageForDisplay(message) {
    return {
      messageId: message.messageId,
      sender: message.sender || message.senderEmail,
      subject: message.subject,
      preview: message.body.substring(0, 100),
      sentAt: message.sentAt || message.createdAt,
      isRead: message.isRead,
      starred: message.starred,
      important: message.important,
      hasAttachments: message.attachments && message.attachments.length > 0,
      labels: message.labels
    };
  }

  _getOrCreateConversationThread(user1, user2) {
    const threadKey = [user1, user2].sort().join('_');
    const threadId = `THREAD_${threadKey}`;

    if (!this.conversationThreads[threadId]) {
      this.conversationThreads[threadId] = [];
    }

    return threadId;
  }

  _getThreadParticipants(messages) {
    const participants = new Set();
    messages.forEach(msg => {
      if (msg.sender) participants.add(msg.sender);
      if (msg.recipient) participants.add(msg.recipient);
    });
    return Array.from(participants);
  }

  _getSafeMailboxInfo(mailbox) {
    return {
      userId: mailbox.userId,
      email: mailbox.email,
      inboxCount: mailbox.inbox.messages.length,
      unreadCount: mailbox.inbox.unreadCount,
      sentCount: mailbox.sent.totalCount,
      draftCount: mailbox.drafts.totalCount,
      archiveCount: mailbox.archive.totalCount
    };
  }

  _logEvent(messageId, eventType, eventData) {
    console.log('[EMAIL_AUDIT]', {
      timestamp: new Date(),
      messageId,
      eventType,
      eventData
    });
  }
}

module.exports = EmailMessagingService;
