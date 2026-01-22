# COMPANY SETUP - ENTERPRISE SECURITY & COMPLIANCE GUIDE
## Master Configuration Security Standards

**Document Version:** 1.0  
**Date:** January 20, 2026  
**Classification:** CONFIDENTIAL - ADMIN ACCESS ONLY  
**Compliance Level:** Enterprise Grade (AES-256, PBKDF2, GLBA, SOX Ready)

---

## 📋 Executive Summary

The Company Setup system manages critical master data for enterprise organizations scaling to 150+ employees. It provides:

- **AES-256 Encryption** for sensitive financial and personal data
- **Role-Based Access Control (RBAC)** with admin/power-user segregation
- **Complete Audit Trail** of all configuration changes
- **Data Integrity Verification** using cryptographic hashing
- **Secure Backup & Recovery** mechanisms
- **Industry Compliance** frameworks (GLBA, SOX, HIPAA, Fair Housing)

---

## 🔒 SECURITY ARCHITECTURE

### Encryption Standards

**Algorithm:** AES-256-CBC (Advanced Encryption Standard)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Key Size:** 256-bit (32 bytes)
- **IV Generation:** Random 16-byte initialization vector per encryption
- **Mode:** Cipher Block Chaining (CBC) for semantic security
- **Implementation:** Node.js native crypto module

**Encryption Process:**
1. Master encryption key derived from `MASTER_ENCRYPTION_KEY` environment variable
2. PBKDF2 with SHA-256 hash function (100,000 iterations for brute-force resistance)
3. Random IV generated for each encryption operation (semantic security)
4. Data encrypted with AES-256-CBC
5. IV prepended to ciphertext for decryption
6. Encrypted payload stored in database

**Key Management:**
- Encryption key stored in secured `.keys/company-setup.key` file
- File permissions: 0o600 (read/write by owner only)
- Environment variable: `MASTER_ENCRYPTION_KEY` (fallback to default - should be production-hardened)
- Key never logged or transmitted

### Sensitive Fields Requiring Encryption

The following fields are automatically encrypted before storage:

1. **Financial Data:**
   - EIN (Employer Identification Number)
   - Bank Account Numbers
   - Bank Routing Numbers
   - Credit Card Numbers
   - Tax ID Numbers
   - Business License Numbers

2. **Banking Information:**
   - Bank Name
   - Account Holder Name
   - Account Type
   - Bank Contact Information
   - GLBA/SOX Compliance Status

3. **Payroll Data:**
   - Payroll Provider Credentials
   - Payroll Account IDs
   - Payroll Service Passwords
   - Tax Service Credentials

4. **API Keys & Credentials:**
   - Third-party service API keys
   - Private encryption keys
   - Service account credentials
   - Integration passwords

### Non-Sensitive Fields (Stored as Plain Text)

The following can be stored non-encrypted:

- Company Name
- Industry Classification
- Incorporation Date
- Business Type (Corp, LLC, etc.)
- Headquarters Address (physical location)
- Contact Phone Numbers (public)
- Contact Email Addresses (public)
- Website URL
- Organizational Chart Structure
- Publicly available company information

---

## 🎯 ACCESS CONTROL FRAMEWORK

### Role-Based Permissions Matrix

```
╔════════════════════╦════════╦════════════╦═════════╦══════════╗
║ Action             ║ ADMIN  ║ POWER_USER ║ MANAGER ║ EMPLOYEE ║
╠════════════════════╬════════╬════════════╬═════════╬══════════╣
║ CREATE Config      ║   ✓    ║     ✓      ║    ✗    ║    ✗     ║
║ UPDATE Config      ║   ✓    ║     ✓      ║    ✗    ║    ✗     ║
║ DELETE Config      ║   ✓    ║     ✗      ║    ✗    ║    ✗     ║
║ VIEW Config        ║   ✓    ║     ✓      ║    ✓    ║    ✗     ║
║ VIEW SECRETS       ║   ✓    ║     ✗      ║    ✗    ║    ✗     ║
║ Audit Log Access   ║   ✓    ║     ✗      ║    ✗    ║    ✗     ║
║ Compliance Check   ║   ✓    ║     ✓      ║    ✓    ║    ✗     ║
║ Create Backup      ║   ✓    ║     ✗      ║    ✗    ║    ✗     ║
║ Restore Backup     ║   ✓    ║     ✗      ║    ✗    ║    ✗     ║
║ Modify Org Chart   ║   ✓    ║     ✓      ║    ✗    ║    ✗     ║
║ Verify Integrity   ║   ✓    ║     ✗      ║    ✗    ║    ✗     ║
╚════════════════════╩════════╩════════════╩═════════╩══════════╝
```

### Role Definitions

**ADMIN**
- Full access to all company configuration
- Can view encrypted sensitive data
- Exclusive access to audit logs
- Can create, restore backups
- Can modify organizational structure
- Can verify data integrity
- Typically: CEO, CFO, or Chief Information Officer
- **Training Required:** 16 hours (GLBA, SOX, HIPAA, DLP, Security)

**POWER_USER**
- Can create and update company configuration
- Cannot view encrypted sensitive data
- Can set organizational charts
- Cannot access audit logs
- Cannot create backups or verify integrity
- Typically: VP Finance, VP Operations, Chief People Officer
- **Training Required:** 12 hours (GLBA, SOX, Data Security)

**MANAGER**
- Read-only access to company configuration
- Cannot see encrypted sensitive data
- Can view compliance status
- Cannot make any changes
- Typically: Department Managers, Team Leads
- **Training Required:** 4 hours (Compliance Overview)

**EMPLOYEE**
- No access to company setup
- Can view organizational chart (read-only)
- Cannot modify any configuration
- Typically: Individual Contributors
- **Training Required:** 2 hours (Company Policy)

---

## 📊 DATA SENSITIVITY CLASSIFICATION

### Classification Levels

**LEVEL 1: PUBLIC (No Encryption)**
- Company name
- Industry classification
- Public business address
- Public phone numbers
- Website URL
- Incorporation date
- Business type

**LEVEL 2: INTERNAL (Limited Access)**
- Employee directory
- Internal phone numbers
- Internal email addresses
- Organizational chart structure
- Department information

**LEVEL 3: CONFIDENTIAL (Admin Only)**
- Bank account numbers
- Routing numbers
- Credit card information
- Payroll service credentials
- Tax ID numbers

**LEVEL 4: HIGHLY CONFIDENTIAL (Encrypted + Audit)**
- EIN (Employer Identification Number)
- Banking credentials
- Encryption keys
- Service account passwords
- Private API keys
- Financial records

---

## ✅ COMPLIANCE STANDARDS IMPLEMENTATION

### GLBA Compliance (Gramm-Leach-Bliley Act)

**Privacy Notice Requirement:**
- Must disclose what customer information is collected
- Must disclose what information is shared
- Must provide opt-out mechanisms
- **Implementation:** Documented in company configuration

**Information Security Program:**
- Must have written security program
- Designated information security officer
- Regular security audits
- Incident response procedures
- **Implementation:** Enforced through access controls

**Safeguards Rule:**
- Access controls on financial information
- Encryption of sensitive data
- Network security monitoring
- Employee training requirements
- **Implementation:** AES-256 encryption, RBAC, audit logging

**Data Breach Notification:**
- 60-day notification requirement
- Individual notification procedures
- Media notification (if 500+ affected)
- **Implementation:** Backup & recovery procedures, audit trail

**GLBA Compliance Verification Checklist:**
- [ ] Privacy notice on file (documented)
- [ ] Security program established (written plan)
- [ ] Safeguards implemented (encryption + access controls)
- [ ] Breach notification procedures (documented)

### SOX Compliance (Sarbanes-Oxley Act)

**Section 302 - CEO/CFO Certification:**
- CEO must certify financial reports
- CFO must certify financial reports
- Quarterly and annual certifications
- Personal legal liability for certifications
- **Implementation:** Required signatures documented

**Section 404 - Internal Control Assessment:**
- Management must assess internal controls
- Auditor must attest to assessment
- Document control deficiencies
- Maintain audit trail
- **Implementation:** Control testing, segregation of duties

**Section 906 - Criminal Penalties:**
- 10 years imprisonment for false certifications
- $1M fine for intentional violations
- $5M fine for deliberate violations
- **Implementation:** Control procedures, audit logging

**SOX Compliance Verification Checklist:**
- [ ] CEO/CFO certification (signed documents)
- [ ] Internal controls assessment (documented)
- [ ] Control testing completed (audit trail)
- [ ] Audit committee oversight (established)
- [ ] Document retention (7+ years)

### HIPAA Compliance (Healthcare Only)

**Privacy Rule:**
- Minimum necessary principle
- Use limitation enforcement
- Patient rights (access, amendment, accounting)
- De-identification standards
- **Implementation:** Access controls, role-based permissions

**Security Rule:**
- Administrative safeguards (policies, training)
- Physical safeguards (facility access control)
- Technical safeguards (encryption, access logs)
- **Implementation:** AES-256 encryption, MFA, audit logging

**Breach Notification:**
- 60-day notification requirement
- Individual notification by mail/email
- Media notification if 500+ affected
- HHS notification (Office for Civil Rights)
- **Implementation:** Audit trail, backup procedures

### Fair Housing Compliance (Real Estate)

**Protected Classes:**
1. Race or Color
2. Religion
3. National Origin
4. Sex/Gender
5. Familial Status
6. Disability
7. Sexual Orientation

**Prohibited Actions:**
- Denying housing based on protected class
- Steering customers to specific properties
- Redlining (discriminatory lending)
- Discriminatory advertising
- Steering or channeling
- Harassing or intimidating

**Compliance Requirements:**
- Annual fair housing training
- Quarterly audits for discrimination
- Complaint procedures documented
- Investigation procedures for violations
- **Implementation:** Policy enforcement, audit logging

---

## 🔐 DATA PROTECTION PROCEDURES

### Data At Rest

**Encryption:**
- All sensitive fields encrypted with AES-256
- Encryption keys stored separately from data
- Key rotation policy: Quarterly
- No plaintext storage of sensitive data

**Database Security:**
- SQLite with encrypted connection
- Database file permissions: 0o600
- Regular backups with encryption
- Backup storage in secure location

**File System Security:**
- Configuration files: 0o600 (owner only)
- Encryption key files: 0o600
- Log files: 0o640 (owner/group read)
- Audit trail files: 0o600

### Data In Transit

**Communication Security:**
- HTTPS/TLS 1.2+ for all transmissions
- Self-signed certificates for localhost
- Certificate pinning for API endpoints
- No HTTP fallback

**API Security:**
- JWT authentication for all endpoints
- Token expiration: 1 hour
- Token refresh: Available
- Rate limiting: 100 req/min per user

**Email Transmission:**
- TLS encryption required
- No PII in email subjects
- Encrypted attachments only
- Secure link tokens (time-limited)

### Data In Use

**Memory Protection:**
- No sensitive data in logs
- Immediate clearing after use
- Secure random generation for IVs
- No string concatenation of secrets

**Process Isolation:**
- Separate encryption process
- Limited process permissions
- No shared memory pools
- Segregated duty enforcement

---

## 📝 AUDIT LOGGING FRAMEWORK

### What Gets Logged

**Configuration Changes:**
- CREATE: New company configuration
- UPDATE: Changes to company data
- DELETE: Configuration removal (if enabled)
- Timestamp, user ID, user role
- Changed fields (public only, sensitive encrypted)

**Access Events:**
- User login with config access
- Configuration view/read
- Compliance check requests
- Audit log access requests
- Access denials/failures
- Timestamp, user ID, resource accessed

**Security Events:**
- Encryption key operations
- Backup creation
- Data integrity verification
- Failed access attempts
- Permission changes
- Timestamp, details

**Compliance Events:**
- Compliance verification runs
- GLBA/SOX/HIPAA checks
- Fair Housing audits
- Audit log exports
- Timestamp, results

### Audit Log Retention

**Retention Period:**
- All logs: Minimum 7 years (SOX requirement)
- Sensitive operations: 10 years
- Access logs: 7 years
- Backup logs: 10 years

**Log Storage:**
- Immutable append-only database
- Encrypted backup copies
- Off-site replication (daily)
- Tamper-evident checksums

**Access to Logs:**
- ADMIN only can view audit logs
- Cannot be modified or deleted
- Cannot be exported by non-admin
- Exported with integrity certification

### Sample Audit Log Entry

```json
{
  "timestamp": "2026-01-20T14:23:45.123Z",
  "action": "UPDATE_COMPANY_CONFIG",
  "companyId": "company-uuid-123",
  "performedBy": "user-uuid-456",
  "userRole": "admin",
  "resource": "company_setup:banking_info",
  "changes": [
    {
      "field": "bankName",
      "type": "public_field",
      "oldValue": "Chase Bank",
      "newValue": "Bank of America"
    },
    {
      "field": "bankAccountNumber",
      "type": "sensitive_field",
      "oldValue": "***encrypted***",
      "newValue": "***encrypted***"
    }
  ],
  "status": "success",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "auditHash": "sha256-hash-for-integrity"
}
```

---

## 🚨 INCIDENT RESPONSE PROCEDURES

### Data Breach Response

**Detection (within 24 hours):**
1. Identify breach scope (what data, how many records)
2. Determine breach type (external attack, internal misuse, accident)
3. Activate incident response team
4. Preserve evidence (logs, system state, forensics)

**Containment (within 24-48 hours):**
1. Isolate affected systems
2. Reset compromised credentials
3. Block unauthorized access
4. Revoke affected security tokens

**Notification (within 60 days GLBA/HIPAA):**
1. Notify affected individuals by mail/email
2. Notify media if 500+ affected
3. Notify regulatory bodies (HHS, FTC, state AG)
4. Provide credit monitoring (if applicable)

**Recovery (ongoing):**
1. Restore from clean backups
2. Verify data integrity
3. Implement preventive controls
4. Post-incident review and remediation

### Access Violation Response

**Detection:**
1. Access log review (daily)
2. Anomaly detection (unusual access patterns)
3. User reports
4. System alerts

**Investigation:**
1. Review access log history
2. Determine scope (what data accessed)
3. Assess intentionality (accidental vs deliberate)
4. Document findings

**Actions:**
1. Revoke access immediately
2. Initiate disciplinary process
3. Notify legal/compliance
4. Update security policies if needed

---

## 🔄 BACKUP & RECOVERY PROCEDURES

### Backup Strategy

**Full Backup Schedule:**
- Daily encrypted full backups
- Retention: 30 days (rotating)
- Storage: Local + off-site replicas
- Verification: Integrity checks required

**Incremental Backup Schedule:**
- Hourly incremental backups
- Retention: 7 days
- Storage: Local only
- Compression: Enabled

**Backup Contents:**
- Company configuration data
- Encrypted sensitive fields
- Audit logs
- Organizational charts
- Compliance status snapshots

**Backup Security:**
- Encrypted with separate key
- Stored in secure location (0o600)
- Replicated to off-site storage
- Tamper-evident checksums
- Tested monthly for recoverability

### Disaster Recovery Plan

**Recovery Objectives:**
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 1 hour
- Data loss tolerance: Maximum 1 hour of recent activity

**Recovery Scenarios:**

**Scenario 1: Corrupted Configuration**
1. Verify data integrity (detects corruption)
2. Restore from last known-good backup
3. Apply incremental changes from audit log
4. Verify integrity post-restoration

**Scenario 2: Unauthorized Access**
1. Isolate system (disconnect from network)
2. Preserve audit logs and evidence
3. Investigate scope and impact
4. Reset all credentials
5. Restore from clean backup
6. Implement additional controls

**Scenario 3: Encryption Key Loss**
1. System-level alert triggered
2. Activate fallback decryption key
3. Initiate key rotation procedure
4. Re-encrypt all data with new key
5. Destroy old key material

**Scenario 4: Complete System Failure**
1. Boot from backup media
2. Restore latest full backup (1 hour max)
3. Apply incremental changes (within RPO)
4. Verify data integrity
5. Bring system online
6. Post-incident review

---

## 📊 COMPLIANCE MONITORING & REPORTING

### Continuous Monitoring

**Daily Reviews:**
- Access logs for suspicious activity
- Configuration changes (audit trail)
- System health and encryption status
- Backup completion and integrity

**Weekly Reports:**
- User access summary
- Configuration changes summary
- Security events
- System performance metrics

**Monthly Audits:**
- GLBA/SOX compliance assessment
- HIPAA (if applicable) compliance check
- Fair Housing (if applicable) compliance check
- Backup recovery testing
- Access control validation

**Quarterly Reviews:**
- Comprehensive security audit
- Encryption key status review
- Incident review and remediation
- Policy updates needed
- Training effectiveness assessment

### Compliance Reporting

**Required Reports:**

**For Regulators:**
- GLBA: Annual to Federal Trade Commission (no specific report, but documentation required)
- SOX: Annual 10-K filing (if public)
- HIPAA: Breach reporting to HHS (if applicable)
- Fair Housing: Annual to Department of Housing (if applicable)

**For Management:**
- Monthly compliance dashboard
- Quarterly compliance audit
- Annual SOX assessment
- Annual HIPAA compliance audit

**Sample Monthly Compliance Report:**

```
COMPANY SETUP - MONTHLY COMPLIANCE REPORT
Period: January 2026

SECURITY METRICS:
✓ Encryption Status: 100% (All sensitive fields encrypted)
✓ Access Control: 100% (RBAC enforced)
✓ Audit Logging: 100% (All changes logged)
✓ Backup Status: 100% (Daily backups, verified)

DATA PROTECTION:
✓ Sensitive Fields Encrypted: 12/12
✓ Encryption Key Status: Secure
✓ Backup Integrity: Verified
✓ Zero Data Breaches

COMPLIANCE:
✓ GLBA: Compliant (all requirements met)
✓ SOX: Compliant (controls in place)
✓ HIPAA: N/A (healthcare not applicable)
✓ Fair Housing: N/A (real estate not applicable)

ACCESS EVENTS:
- Total Logins: 847
- Admin Access: 23
- Power User Access: 156
- Manager Access: 668
- Failed Login Attempts: 3 (all logged/investigated)

CONFIGURATION CHANGES:
- Creates: 0
- Updates: 4 (all by authorized users)
- Deletes: 0
- Changes Reviewed: 4/4 (100%)

AUDIT FINDINGS:
- Critical Issues: 0
- High Issues: 0
- Medium Issues: 0
- Low Issues: 0
- Recommendations: None

STATUS: FULLY COMPLIANT ✓
```

---

## 🎓 TRAINING & CERTIFICATION

### ADMIN Role Training

**Required Hours:** 16 hours annually

**Topics:**
1. **GLBA Compliance** (4 hours)
   - Privacy Act overview
   - Safeguards rule requirements
   - Data breach notification
   - Audit procedures

2. **SOX Compliance** (4 hours)
   - CEO/CFO certification requirements
   - Internal control assessment
   - Document retention (7 years)
   - Penalties for non-compliance

3. **Data Security** (4 hours)
   - Encryption standards
   - Access control best practices
   - Incident response procedures
   - Disaster recovery

4. **Audit & Forensics** (4 hours)
   - Audit log interpretation
   - Evidence preservation
   - Investigation procedures
   - Reporting requirements

### POWER_USER Role Training

**Required Hours:** 12 hours annually

**Topics:**
1. **GLBA Compliance** (4 hours) - Same as ADMIN
2. **SOX Compliance** (2 hours) - Overview only
3. **Data Security** (4 hours) - Same as ADMIN
4. **Access Control** (2 hours) - Role-based permissions

### MANAGER Role Training

**Required Hours:** 4 hours annually

**Topics:**
1. **Compliance Overview** (2 hours)
   - Regulatory requirements summary
   - Company policies
   - Incident reporting

2. **Access Control** (2 hours)
   - What data can you access
   - What you cannot access
   - Information security best practices

### EMPLOYEE Role Training

**Required Hours:** 2 hours annually

**Topics:**
1. **Data Protection** (1 hour)
   - Protecting company data
   - Incident reporting
   - Password management

2. **Company Security Policies** (1 hour)
   - Acceptable use policy
   - Confidentiality agreement
   - Disciplinary procedures

---

## ✨ BEST PRACTICES

### For Administrators

1. **Encryption Key Management**
   - Store encryption key in secure location
   - Never share encryption key
   - Rotate key annually
   - Backup key separately (encrypted)

2. **Access Control**
   - Follow principle of least privilege
   - Regularly audit who has access
   - Remove access when roles change
   - Document all access changes

3. **Audit Logging**
   - Review audit logs daily
   - Investigate all access denials
   - Preserve evidence for security incidents
   - Export logs monthly for compliance

4. **Backup & Recovery**
   - Test recovery monthly
   - Maintain off-site backup copies
   - Document recovery procedures
   - Time recovery operations

5. **Compliance Monitoring**
   - Schedule monthly compliance reviews
   - Maintain compliance documentation
   - Update policies as regulations change
   - Provide training on changes

### For Power Users

1. **Configuration Management**
   - Make changes during business hours
   - Provide clear descriptions of changes
   - Review changes before saving
   - Notify admins of major updates

2. **Data Accuracy**
   - Verify all entered data
   - Update information quarterly
   - Maintain current contact information
   - Flag data quality issues

3. **Organizational Structure**
   - Keep org chart current
   - Update when roles change
   - Document reporting lines clearly
   - Review alignment with strategy

4. **Compliance Status**
   - Monitor compliance alerts
   - Address compliance issues promptly
   - Maintain certifications current
   - Participate in training

### For All Users

1. **Information Security**
   - Never share credentials
   - Use strong passwords (12+ characters)
   - Enable MFA (multi-factor authentication)
   - Report suspicious activity immediately

2. **Data Protection**
   - Never save passwords
   - Close sessions when away
   - Don't use public WiFi for access
   - Clear browser cache after use

3. **Incident Reporting**
   - Report security concerns immediately
   - Report suspected breaches
   - Report unauthorized access attempts
   - Report suspicious emails or calls

---

## 📞 SUPPORT & RESOURCES

### Technical Support

**For Configuration Questions:**
- Email: support@AgenticEmpire.com
- Phone: (555) 123-4567
- Hours: 8 AM - 6 PM EST

**For Security Incidents:**
- Email: security@AgenticEmpire.com
- Phone: (555) 123-4567 ext. 911 (24/7)
- Response Time: 1 hour for critical

### Compliance Resources

**GLBA Information:**
- Federal Trade Commission: www.ftc.gov/glba
- Your Bank Compliance Officer
- Internal Legal Department

**SOX Information:**
- SEC EDGAR: www.sec.gov/edgar
- Your External Auditor
- Internal Audit Department

**HIPAA Information:**
- HHS Office for Civil Rights: www.hhs.gov/ocr/hipaa
- Privacy Officer (if applicable)
- Internal Compliance Officer

**Fair Housing Information:**
- HUD: www.hud.gov/fairhousing
- State Real Estate Commission
- Internal Legal Department

---

## ✅ IMPLEMENTATION CHECKLIST

### Before Going Live

- [ ] Encryption key generated and secured
- [ ] All admin staff trained (16 hours)
- [ ] All power users trained (12 hours)
- [ ] Access control matrix defined
- [ ] Audit logging verified
- [ ] Backup procedures tested
- [ ] Disaster recovery plan documented
- [ ] Compliance checklist completed
- [ ] Legal review completed
- [ ] Security audit completed

### Monthly Operations

- [ ] Access logs reviewed
- [ ] Audit log entries reviewed
- [ ] Backup integrity verified
- [ ] Disaster recovery test (sample)
- [ ] Compliance status updated
- [ ] Security incidents reviewed
- [ ] Policy updates reviewed

### Quarterly Operations

- [ ] Comprehensive security audit
- [ ] Encryption key status review
- [ ] Full disaster recovery test
- [ ] Compliance audit (GLBA/SOX/HIPAA)
- [ ] Training effectiveness review
- [ ] Policy updates and training

### Annual Operations

- [ ] Full compliance audit
- [ ] Security architecture review
- [ ] Encryption key rotation
- [ ] Policy updates
- [ ] Training renewal (all staff)
- [ ] External security audit

---

**Document Classification:** CONFIDENTIAL  
**Distribution:** ADMIN ONLY  
**Last Updated:** January 20, 2026  
**Next Review:** April 20, 2026

---

**For Questions, Contact:**  
Chief Information Security Officer  
(555) 123-4567 ext. 2000  
security@AgenticEmpire.com
