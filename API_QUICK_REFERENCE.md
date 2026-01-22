# Luca Express - Quick Reference Guide

## 🎯 All 12 Services at a Glance

### 1️⃣ Agent Onboarding Service
**Purpose:** Onboard new agents with 12-step workflow
```javascript
// Start onboarding
startOnboarding(agentId, position, department)
→ { success, sessionId, onboardingSteps }

// Track progress
getProgress(sessionId)
→ { success, progress, currentStep, completedSteps }

// Complete a step
completeStep(sessionId, stepId, result)
→ { success, nextStep }

// Get checklist
getOnboardingChecklist(sessionId)
→ { success, checklist }

// Assign training
assignTrainingModules(sessionId, modules)
→ { success, assignment }
```

**Key Features:**
- 12-step progression (orientation → systems → policies → shadowing → etc.)
- Training module assignments
- Manager oversight
- Progress tracking

---

### 2️⃣ CEO Hiring Engine
**Purpose:** CEO creates hiring requests and makes data-driven decisions
```javascript
// Create hiring request
createHiringRequest(positionTitle, department, urgency)
→ { success, hiringRequestId, request }

// View hiring dashboard
getCEOHiringDashboard(userId)
→ { success, openRequests, pipeline, metrics }

// Make hiring decision
decideOnHiringRequest(requestId, decision, reasoning)
→ { success, decision, hrNotification }

// Get request details
getHiringRequestDetails(requestId)
→ { success, requestDetails }

// Get industry charts
getIndustryGrowthCharts(industry)
→ { success, charts, metrics }
```

**Key Features:**
- Flexible hiring decision logic
- Production metrics vs. industry standards
- Automatic HR notification
- Growth forecasting charts

---

### 3️⃣ HR Voice Interview
**Purpose:** HR conducts candidate voice interviews and routes to admin
```javascript
// Schedule interview
scheduleVoiceInterview(hiringRequestId, candidateName, interviewSlot)
→ { success, interviewId, scheduledTime }

// Start interview
startVoiceInterview(interviewId)
→ { success, status, recordingStarted }

// Complete interview
completeVoiceInterview(interviewId, transcript)
→ { success, transcriptProcessed }

// Score interview
scoreInterview(interviewId, scores)
→ { success, overallScore, recommendation }

// Get admin inbox
getAdminInbox(userId)
→ { success, inbox, interviews }

// Route to inbox
routeInterviewToInbox(interviewId, inboxType)
→ { success, notification }
```

**Scoring Rubric:** Communication, Professionalism, Culture Fit, Problem Solving, Experience, Enthusiasm, Integrity

---

### 4️⃣ Agent Backstory
**Purpose:** Agents maintain personal profiles and life stories
```javascript
// Create profile
createAgentProfile(agentId, basicInfo)
→ { success, profileId, profile }

// Add daily update
addDailyLifeUpdate(agentId, update)
→ { success, updateId, update }

// Record milestone
recordMilestone(agentId, milestone)
→ { success, milestoneId, milestone }

// Update dream board
updateDreamBoard(agentId, dream)
→ { success, dreamId }

// Add off-time activity
addOffTimeActivity(agentId, activity)
→ { success, activityId }

// Get profile (with privacy)
getAgentProfile(agentId, viewerRole)
→ { success, profile, visibleFields }

// Find team connections
findTeamConnections(agentId)
→ { success, connections, sharedInterests }
```

**Privacy Tiers:** Basic, Team, Manager, Executive

---

### 5️⃣ End-of-Day Reporting
**Purpose:** Agents submit daily reports, managers review, CEO sees trends
```javascript
// Submit report
submitDailyReport(agentId, reportData)
→ { success, reportId, report }

// Review report
reviewAgentReport(reportId, review)
→ { success, reviewed, feedback }

// Get report details
getReportDetails(reportId)
→ { success, reportDetails }

// Manager dashboard
getManagerDashboard(userId)
→ { success, dashboard, teamReports, metrics }

// CEO dashboard
getCEOReportingDashboard(userId)
→ { success, dashboard, companyMetrics, trends }

// Trend analysis
getTrendAnalysis(days)
→ { success, trends, insights }
```

---

### 6️⃣ Call Center
**Purpose:** Handle inbound/outbound calls with DLP protection
```javascript
// Handle inbound call
handleInboundCall(callerId, callData)
→ { success, callId, callInfo, recordingStarted }

// Handle outbound call
handleOutboundCall(agentId, recipientId, callData)
→ { success, callId, callInfo, dlpCheckActive }

// Process speech with DLP
processSpeechWithDLPCheck(callId, transcript)
→ { success, dlpCheck, violations, muteApplied }

// Verify passphrase
verifyAdminPassphraseVerbally(callId, passphrase)
→ { verified, securityLevel }

// Complete call
completeCall(callId, duration)
→ { success, callSummary, recording }
```

**DLP Protections:** SSN, Credit Card, Bank Account, Healthcare PHI

---

### 7️⃣ Call Quality ML
**Purpose:** Review calls, score quality, identify training gaps
```javascript
// Start review
startCallReview(callId, transcript, metadata)
→ { success, reviewId, analysis }

// Analyze transcript
analyzeTranscript(reviewId, transcript)
→ { success, analysis, patterns }

// Score quality
scoreCallQuality(reviewId, scores)
→ { success, overallScore, rating }

// Identify training gaps
identifyTrainingGaps(agentId)
→ { success, gaps, recommendations }

// Get ML recommendations
generateMLImprovementRecommendations(reviewId)
→ { success, recommendations, predictedImpact }

// Team dashboard
getTeamPerformanceDashboard(userId)
→ { success, dashboard, teamMetrics, trends }
```

**Quality Scoring:** Clarity, Professionalism, Empathy, Helpfulness, Pace, Tone, Resolution, Follow-up

---

### 8️⃣ Compliance Certification
**Purpose:** Track certifications and training compliance
```javascript
// Get compliance status
getComplianceStatus()
→ { success, status, certifications, progress }

// Get checklist
getComplianceChecklist()
→ { success, checklist, categories, completion }

// Get free trainings
getFreeTrainings()
→ { success, trainings, providers, links }

// Complete training
completeTraining(trainingId, agentId, certificateUrl)
→ { success, completionRecord, certificate }

// Get certification details
getCertificationDetails(certName)
→ { success, certification, requirements, timeline }

// Generate report
generateComplianceReport(agentId)
→ { success, report, completionStatus }
```

**Certifications:** SOC2 Type II, HIPAA, GDPR, ISO 27001, PCI DSS
**Free Trainings:** Google Cloud, AWS, OWASP, Linux Foundation, NIST, CNCF

---

### 9️⃣ Document Editor
**Purpose:** Create and edit documents with AI assistance
```javascript
// Create document
createDocument(userId, documentData)
→ { success, docId, document }

// Update content
updateDocumentContent(docId, userId, content)
→ { success, updated, newVersion }

// Lock document
lockDocument(docId, userId)
→ { success, lockedBy, lockedUntil }

// Get AI assistance
getAIAssistance(docId, assistanceType)
→ { success, assistance, suggestions }

// Share document
shareDocument(docId, userId, shareOptions)
→ { success, shareId, notification }

// Save as template
saveAsTemplate(docId, userId, templateName)
→ { success, templateId, template }

// Create from template
createFromTemplate(userId, templateId, title)
→ { success, docId, document }

// Add comment
addComment(docId, userId, comment, position)
→ { success, commentId, comment }

// Get history
getDocumentHistory(docId)
→ { success, history, versions }
```

**AI Assistance:** Grammar, Tone Analysis, Structure, Expansion, Summarization
**Sharing:** Persona-specific, Company-wide Memo, Managers-only, Add to Context

---

### 🔟 Email & Messaging
**Purpose:** Email and direct messaging between agents
```javascript
// Get or create mailbox
getOrCreateMailbox(userId, email)
→ { success, mailbox, folders }

// Send email
composeAndSendEmail(userId, emailData)
→ { success, messageId, deliveryStatus }

// Save draft
saveDraft(userId, draftData)
→ { success, draftId, draft }

// Get inbox
getInbox(userId, limit)
→ { success, messages, unreadCount }

// Send direct message
sendDirectMessage(senderUserId, recipientUserId, content)
→ { success, messageId, threadId }

// Get conversation thread
getConversationThread(threadId, userId)
→ { success, threadId, messages, participants }

// Search emails
searchEmails(userId, searchTerm)
→ { success, resultCount, results }

// Create label
createLabel(userId, name, color)
→ { success, labelId, label }

// Get templates
getEmailTemplates()
→ { success, templates }

// Set auto-response
setAutoResponse(userId, message, enabled)
→ { success, autoResponse }
```

**Folders:** Inbox, Sent, Drafts, Archive, Trash, Custom Labels

---

### 1️⃣1️⃣ Industry Workflow Engine
**Purpose:** Keep agents on task with industry-specific workflows
```javascript
// Start workflow
startWorkflow(agentId, workflowType, industryType, agentLevel)
→ { success, workflowInstanceId, workflow }

// Get status
getWorkflowStatus(agentId, workflowInstanceId)
→ { success, workflow, progress, currentStep }

// Complete step
completeStep(agentId, workflowInstanceId, stepResult)
→ { success, nextStep, message }

// Handle error
handleStepError(agentId, workflowInstanceId, errorData)
→ { success, action, suggestion }

// Skip step
skipStep(agentId, workflowInstanceId, reason)
→ { success, message, nextStep }

// Escalate workflow
escalateWorkflow(agentId, workflowInstanceId, reason, escalatedBy)
→ { success, escalatedTo, message }

// Get available workflows
getAvailableWorkflows(agentId, industryType, agentLevel)
→ { success, workflows }
```

**Industries:** Technology, Sales, Customer Service, Finance
**Agent Levels:** Entry-level, Mid-level, Senior, Manager, Executive

---

### 1️⃣2️⃣ Agent Focus Control
**Purpose:** Keep agents productive and focused during work hours
```javascript
// Start work session
startWorkSession(agentId, agentInfo)
→ { success, sessionId, focusMode, workHours }

// Log activity
logActivity(agentId, activity, data)
→ { success, message, focusScore }

// Get metrics
getFocusMetrics(agentId)
→ { success, metrics, focusScore, productivity }

// Request focus mode
requestFocusMode(agentId, duration, context)
→ { success, message, blockedActivities }

// Exit focus mode
exitFocusMode(agentId, reason)
→ { success, focusDuration, focusScore }

// Take break
takeBreak(agentId, breakType, duration)
→ { success, breakId, allowanceRemaining }

// End session
endWorkSession(agentId)
→ { success, report, metrics }

// Manager dashboard
getManagerDashboard(userId, teamAgentIds)
→ { success, dashboard, teamMetrics }

// Agent daily summary
getAgentDailySummary(agentId)
→ { success, summary, insights }
```

**Work Hours:** 9-5 M-F (configurable)
**Activity Limits:** Email 30min, Messaging 15min, Breaks 60min
**Break Schedule:** 2×15min morning/afternoon + 30min lunch

---

## 📊 API Endpoints Summary

**Total: 69 Endpoints**
- Onboarding: 5
- Hiring: 4
- HR Interviews: 6
- Backstory: 5
- EOD Reporting: 4
- Call Center: 5
- Call Quality: 4
- Compliance: 4
- Documents: 6
- Email: 8
- Workflows: 6
- Focus Control: 6
- Management: 6

---

## 🔄 Integration Examples

```javascript
// Example 1: CEO hiring to HR to onboarding
const hireReq = hiringService.createHiringRequest('Dev', 'Engineering', 'high');
const interview = hrService.scheduleVoiceInterview(hireReq.hiringRequestId, 'John', '2024-01-25');
const onboard = onboardingService.startOnboarding('new-agent', 'Developer', 'Engineering');

// Example 2: Daily work session
const session = focusService.startWorkSession('agent-001', { timezone: 'UTC' });
focusService.requestFocusMode('agent-001', 90, { workflowId: 'wf-001' });
const workflow = workflowService.startWorkflow('agent-001', 'customer-support', 'technology', 'entry-level');
focusService.endWorkSession('agent-001');
const report = eodService.submitDailyReport('agent-001', { tasksCompleted: 10 });

// Example 3: Call quality review
const call = callService.handleInboundCall('customer-123', { reason: 'Support' });
callService.processSpeechWithDLPCheck(call.callId, 'Customer transcript');
callService.completeCall(call.callId, 12);
const review = qualityService.startCallReview(call.callId, 'transcript', { agentId: 'agent-002' });
qualityService.analyzeTranscript(review.reviewId, 'updated transcript');
```

---

**Status:** ✅ Production Ready
**Version:** 1.0
**Last Updated:** January 20, 2026
