/**
 * CRM Quick Templates Service
 * Provides pre-configured templates for common organizational roles
 * with expansive job descriptions and persona setup requirements
 * 
 * Includes: CEO, CFO, Department Managers, and Sales/Operations roles
 */

const compliancePolicies = require('./compliance-policies');

class CRMQuickTemplates {
  constructor() {
    this.templates = {};
    this.initializeTemplates();
  }

  /**
   * Initialize all quick templates with expansive job descriptions
   */
  initializeTemplates() {
    this.templates = {
      ceo: {
        id: 'ceo',
        title: 'Chief Executive Officer',
        icon: '🏢',
        category: 'executive',
        accessLevel: 'full_admin',
        
        jobDescription: `
# Chief Executive Officer (CEO) - Role Template

## Position Overview
The Chief Executive Officer serves as the highest-ranking executive responsible for overall strategic direction, operational management, and performance of the entire organization. This role requires comprehensive visibility across all business functions while maintaining strict compliance with banking, healthcare, and data protection regulations.

## Core Responsibilities
- **Strategic Leadership**: Define and execute long-term business strategy, market positioning, and growth initiatives
- **Organizational Management**: Oversee all departments (Sales, Operations, Finance, HR, Real Estate/MLS Operations), ensuring alignment with corporate objectives
- **Financial Oversight**: Monitor financial performance, profitability, cash flow, and investor relations
- **Stakeholder Management**: Serve as primary interface with board of directors, institutional investors, and strategic partners
- **Regulatory Compliance**: Ensure organization maintains all required certifications (banking, healthcare, real estate) and compliance standards
- **Risk Management**: Identify and mitigate strategic, operational, and compliance risks
- **Culture & Talent**: Shape organizational culture, approve executive appointments, and oversee talent development

## Key Competencies Required
- Strategic thinking and visionary planning
- P&L responsibility and financial acumen
- Executive leadership and decision-making
- Regulatory knowledge (banking, HIPAA, real estate)
- Crisis management and change leadership
- Stakeholder and investor relations
- Data governance and compliance awareness

## Data Access & Permissions
- **Financial Data**: Full access to all financial statements, forecasts, and budgets
- **Customer Data**: View-only access to aggregated customer metrics and health scores
- **Employee Data**: Full access to organizational structure, compensation (masked in HIPAA contexts), and performance
- **Compliance Data**: Full access to audit logs, compliance reports, risk assessments
- **MLS/Real Estate**: Strategic oversight access to market trends and transaction data
- **System Access**: Full administrative access with audit trail logging

## Compliance Requirements
- Banking Compliance (GLBA, SOX): Required for financial oversight
- HIPAA Awareness: Required for healthcare data interaction
- DLP Policy Enforcement: Strict - No sensitive data in public communications
- Annual Training: All compliance certifications required
- Audit Trail: Every action logged and reviewable
- Approval Authority: Executive approval required for high-risk operations

## Integrations & Tools
- CRM (Brivity, TopProducer): Full access for business intelligence
- MLS System (NWMLS): Strategic access for market analysis
- Banking APIs: Full financial transaction access
- Analytics & Reporting: Full access to all dashboards
- Email & Communications: Standard with compliance filtering
- Document Management: Full access with DLP scanning

## Success Metrics
- Company revenue growth and profitability
- Compliance record (zero violations)
- Employee retention and satisfaction
- Customer NPS and retention rates
- Strategic initiative completion
- Risk mitigation effectiveness
- Stakeholder satisfaction ratings

## Security & Compliance Training
- Annual GLBA and SOX training (4 hours)
- HIPAA fundamentals (2 hours)
- DLP policy and data governance (2 hours)
- Phishing and cybersecurity awareness (1 hour)
- Executive responsibility for compliance (2 hours)
        `,
        
        requiredPermissions: [
          'crm:view_all_contacts',
          'crm:edit_all_contacts',
          'crm:delete_contacts',
          'crm:manage_integrations',
          'crm:view_all_deals',
          'crm:edit_all_deals',
          'banking:view_all_accounts',
          'banking:approve_transactions',
          'banking:view_analytics',
          'mls:full_access',
          'hipaa:view_patient_data',
          'hipaa:approve_disclosures',
          'system:audit_logs',
          'system:user_management',
          'system:security_settings',
          'system:compliance_reports',
          'dlp:enforce_policies'
        ],

        complianceRequirements: {
          dlp: {
            required: true,
            level: 'strict',
            policies: ['no_external_financial_data', 'no_patient_data_sharing', 'no_personal_ssn', 'no_account_numbers'],
            enforcement: 'automatic_blocking'
          },
          banking: {
            required: true,
            certifications: ['GLBA', 'SOX'],
            trainingHours: 4,
            renewalFrequency: 'annual'
          },
          hipaa: {
            required: true,
            level: 'basic_awareness',
            trainingHours: 2,
            renewalFrequency: 'annual'
          },
          mls: {
            required: true,
            level: 'strategic',
            restrictions: ['no_price_disclosure_without_approval', 'no_agent_contact_sharing']
          },
          auditLogging: {
            enabled: true,
            retentionDays: 2555,
            alertingEnabled: true
          }
        },

        departmentAccess: {
          sales: 'full',
          operations: 'full',
          finance: 'full',
          hr: 'full',
          mls: 'full',
          it: 'full',
          compliance: 'full'
        },

        personaSetupRequirements: [
          'Complete executive onboarding program',
          'GLBA and SOX certification (passing score required)',
          'HIPAA awareness training completion',
          'DLP policy acknowledgment and testing',
          'CEO handbook review and acknowledgment',
          'Confidentiality agreement signature',
          'Background check completion',
          'IT security baseline setup (MFA, device encryption)',
          'Email secure communication setup',
          'Designated backup access provider'
        ],

        defaultAccessStartTime: 'full_hours',
        sessionTimeout: 1440, // minutes (24 hours)
        mfaRequired: true,
        ipWhitelistRequired: true
      },

      cfo: {
        id: 'cfo',
        title: 'Chief Financial Officer',
        icon: '💰',
        category: 'executive',
        accessLevel: 'financial_admin',

        jobDescription: `
# Chief Financial Officer (CFO) - Role Template

## Position Overview
The Chief Financial Officer is responsible for all financial planning, analysis, reporting, and control of the organization. This role requires deep access to financial data while ensuring strict compliance with banking regulations (GLBA, SOX) and fraud prevention measures. The CFO serves as the primary liaison with auditors, regulators, and investors.

## Core Responsibilities
- **Financial Planning & Analysis**: Develop budgets, forecasts, and financial strategies
- **Accounting & Reporting**: Oversee accounting operations, financial statement preparation, tax compliance
- **Cash Management**: Monitor cash flow, liquidity, and banking relationships
- **Internal Controls**: Establish and maintain internal control framework (SOX compliance)
- **Audit Management**: Coordinate with external and internal auditors, remediate findings
- **Banking Relationships**: Manage relationships with banks, credit facilities, and lenders
- **Cost Management**: Analyze expenses, identify savings opportunities, optimize operations
- **Investor Relations**: Prepare financial communications for investors and board
- **Risk Management**: Identify financial risks and implement mitigation strategies
- **Fraud Prevention**: Implement controls to prevent and detect fraud
- **Compliance**: Ensure compliance with all accounting standards (GAAP/IFRS), banking regulations, tax law

## Key Competencies Required
- Advanced financial analysis and modeling
- Accounting and reporting expertise
- Banking and capital markets knowledge
- Risk management and internal controls
- Regulatory knowledge (GLBA, SOX, tax)
- Data analysis and business intelligence
- Leadership and team management
- Vendor and relationship management

## Data Access & Permissions
- **Financial Records**: Full access to all accounts, ledgers, journals, and transactions
- **Banking Data**: Full access to all bank accounts, loans, credit facilities
- **Transaction Data**: View all payments, receipts, and transfers across organization
- **Payroll Data**: Full access to compensation, benefits, payroll records (with HIPAA safeguards)
- **Customer Financial Data**: Full access for credit analysis and risk assessment
- **Investment Data**: Full access to investment accounts and performance
- **Audit Data**: Full access to audit files and regulatory correspondence
- **Employee Data**: Restricted to financial metrics only (salary, benefits)

## Compliance Requirements
- Banking Compliance (GLBA): Required - highest level
- SOX Compliance: Required - internal control focus
- DLP Policy Enforcement: Strict - No account numbers, routing numbers in unencrypted communications
- Annual Training: 4+ hours banking/SOX training required
- Segregation of Duties: Cannot approve own payments or transfers
- Audit Trail: Every transaction logged and reviewable
- Regulatory Reporting: Responsible for accuracy and timeliness

## Integrations & Tools
- Banking APIs: Full access for account management
- Accounting Software: Full administrative access
- CRM Systems: View customer financial metrics
- MLS System: Access to transaction pricing and commission data
- Analytics & Reporting: Full access to financial dashboards
- Spreadsheet Access: Restricted (DLP scanning enabled)
- Email & Communications: Monitored for financial data leakage

## Success Metrics
- Financial accuracy (zero material errors in reporting)
- Audit findings (zero to minimal)
- Cash flow management effectiveness
- Cost control and savings realization
- Banking relationship satisfaction
- Compliance record (zero violations)
- Internal control effectiveness
- Investor confidence metrics

## Security & Compliance Training
- SOX and internal controls (4 hours)
- GLBA banking compliance (4 hours)
- Fraud prevention and detection (2 hours)
- DLP policy and secure communications (2 hours)
- Phishing and cybersecurity awareness (1 hour)
        `,

        requiredPermissions: [
          'banking:view_all_accounts',
          'banking:approve_transactions',
          'banking:manage_accounts',
          'banking:view_analytics',
          'crm:view_customer_financial',
          'crm:view_all_contacts',
          'accounting:full_access',
          'accounting:approve_entries',
          'mls:view_pricing',
          'mls:view_commissions',
          'system:audit_logs',
          'system:compliance_reports',
          'payroll:view_data',
          'dlp:enforce_policies'
        ],

        complianceRequirements: {
          dlp: {
            required: true,
            level: 'strict',
            policies: [
              'no_account_numbers_unencrypted',
              'no_routing_numbers_unencrypted',
              'no_ssn_in_communications',
              'no_external_financial_emails',
              'encrypt_balance_sheets'
            ],
            enforcement: 'automatic_blocking'
          },
          banking: {
            required: true,
            certifications: ['GLBA', 'SOX'],
            trainingHours: 8,
            renewalFrequency: 'annual'
          },
          sarbanes: {
            required: true,
            level: 'high',
            requirements: [
              'internal_control_assessment',
              'segregation_of_duties',
              'transaction_approval_flows',
              'audit_trail_maintenance'
            ]
          },
          auditLogging: {
            enabled: true,
            retentionDays: 2555,
            alertingEnabled: true,
            highValueTransactionAlerts: true,
            unusualActivityAlerts: true
          }
        },

        departmentAccess: {
          sales: 'financial_metrics_only',
          operations: 'financial_metrics_only',
          finance: 'full',
          hr: 'payroll_only',
          mls: 'commission_pricing',
          banking: 'full'
        },

        personaSetupRequirements: [
          'GLBA certification (passing score 80% minimum)',
          'SOX and internal controls training (4 hours)',
          'Fraud prevention workshop',
          'DLP policy training and test (passing required)',
          'Banking security procedures review',
          'Approval authority delegation setup',
          'Segregation of duties configuration',
          'Audit log review training',
          'Regulatory correspondence review',
          'Banking institution liaison setup'
        ],

        defaultAccessStartTime: 'business_hours',
        sessionTimeout: 480, // minutes (8 hours)
        mfaRequired: true,
        ipWhitelistRequired: true,
        transactionApprovalRequired: true,
        requiresHardwareSecurityKey: true
      },

      salesManager: {
        id: 'sales_manager',
        title: 'Sales Manager / VP Sales',
        icon: '📈',
        category: 'manager',
        accessLevel: 'department_admin',

        jobDescription: `
# Sales Manager / VP Sales - Role Template

## Position Overview
The Sales Manager or Vice President of Sales is responsible for leading the sales organization, managing sales pipelines, coaching team members, and driving revenue growth. This role requires deep access to customer data, deal information, and performance metrics while ensuring compliance with data privacy and DLP regulations.

## Core Responsibilities
- **Sales Leadership**: Recruit, hire, train, and develop sales team members
- **Pipeline Management**: Oversee sales opportunities from prospecting to close
- **Performance Management**: Monitor individual and team performance against targets
- **Coaching & Development**: Provide guidance to sales team on techniques and deals
- **Deal Management**: Approve large deals, negotiate terms, ensure proper closing
- **Forecasting**: Develop accurate sales forecasts and revenue predictions
- **Customer Relationship**: Manage relationships with key accounts and strategic customers
- **CRM Management**: Oversee data quality, process compliance, system usage
- **Competition & Market**: Monitor competitive landscape and market conditions
- **Compensation Management**: Manage commission structures and incentive programs
- **Compliance**: Ensure sales processes comply with regulations and company policies

## Key Competencies Required
- Sales expertise and deal-closing ability
- Leadership and team motivation
- Data analysis and forecasting
- Negotiation and relationship management
- Pipeline and opportunity management
- Performance metrics and KPI tracking
- Customer needs analysis
- Regulatory compliance awareness
- CRM system expertise

## Data Access & Permissions
- **Customer Data**: Full access to all contact information, history, interactions
- **Deal Data**: Full access to pipeline, opportunities, proposal, closing documents
- **Sales Team Data**: Full access to team member information, activities, performance
- **Compensation Data**: View team commission structures and calculations
- **CRM Data**: Full data entry and modification rights
- **Reporting & Analytics**: Full access to sales dashboards and forecasts
- **Historical Data**: Full access to past deals and customer information
- **Communications**: View all team communications and customer emails

## Compliance Requirements
- DLP Policy Enforcement: Moderate - No customer financial data externally
- Customer Privacy: Required - Respect data privacy regulations
- Annual Training: DLP and data privacy training required
- CRM Data Quality: Responsible for team data entry accuracy
- Sales Process Compliance: Ensure team follows approved sales processes
- Commission Accuracy: Oversee proper commission calculations
- Audit Trail: Sales activities logged for review
- Customer Consent: Verify customer consent for communications

## Integrations & Tools
- CRM (Brivity, TopProducer): Full administrative access
- MLS System: Full access to property listings and transaction data
- Sales Analytics: Full access to dashboards and forecasts
- Email & Communications: Standard with compliance monitoring
- Document Management: Access to proposals, contracts, closing documents
- Video Conferencing: Standard
- Spreadsheet Tools: Limited (DLP scanning enabled)

## Success Metrics
- Sales revenue achieved vs. target
- Deal close rates and average deal size
- Pipeline health and forecast accuracy
- Sales team performance and growth
- Customer satisfaction and retention
- CRM data quality scores
- Team development and promotion rates
- Compliance record (zero violations)

## Security & Compliance Training
- DLP policy and customer data protection (2 hours)
- Customer privacy regulations (1 hour)
- Sales compliance and ethical practices (2 hours)
- CRM best practices and data quality (1 hour)
- Phishing and cybersecurity awareness (1 hour)
        `,

        requiredPermissions: [
          'crm:view_all_contacts',
          'crm:edit_all_contacts',
          'crm:manage_team_data',
          'crm:view_all_deals',
          'crm:edit_all_deals',
          'crm:approve_large_deals',
          'crm:view_analytics',
          'crm:export_reports',
          'mls:full_access',
          'mls:view_commissions',
          'payroll:view_team_compensation',
          'system:audit_logs'
        ],

        complianceRequirements: {
          dlp: {
            required: true,
            level: 'moderate',
            policies: [
              'no_customer_bank_data_external',
              'no_personal_ssn_sharing',
              'restrict_external_customer_lists',
              'encrypt_customer_pii'
            ],
            enforcement: 'warning_and_block'
          },
          privacy: {
            required: true,
            level: 'moderate',
            requirements: [
              'customer_consent_verification',
              'data_minimization',
              'retention_policies',
              'right_to_delete_requests'
            ]
          },
          auditLogging: {
            enabled: true,
            retentionDays: 730,
            alertingEnabled: true
          }
        },

        departmentAccess: {
          sales: 'full',
          crm: 'full',
          mls: 'full',
          finance: 'commission_view'
        },

        personaSetupRequirements: [
          'DLP policy training and certification',
          'Customer privacy regulations training',
          'Sales compliance workshop',
          'CRM system administration training',
          'Team access provisioning',
          'Sales process documentation review',
          'Performance metric definitions review',
          'Compensation structure review',
          'Customer data handling procedures'
        ],

        defaultAccessStartTime: 'business_hours',
        sessionTimeout: 480, // minutes (8 hours)
        mfaRequired: true,
        ipWhitelistRequired: false
      },

      operationsManager: {
        id: 'operations_manager',
        title: 'Operations Manager / Director of Operations',
        icon: '⚙️',
        category: 'manager',
        accessLevel: 'department_admin',

        jobDescription: `
# Operations Manager / Director of Operations - Role Template

## Position Overview
The Operations Manager or Director of Operations is responsible for optimizing business processes, managing day-to-day operations, coordinating between departments, and ensuring efficient resource utilization. This role requires access to operational data and performance metrics while maintaining compliance with data protection and banking regulations where applicable.

## Core Responsibilities
- **Process Management**: Design, document, and optimize operational processes
- **Vendor Management**: Select, manage, and evaluate vendors and service providers
- **Resource Planning**: Allocate resources (staff, equipment, budget) efficiently
- **Quality Assurance**: Monitor quality metrics and continuous improvement
- **Cross-Functional Coordination**: Facilitate communication between departments
- **System Management**: Oversee operational systems and technology infrastructure
- **Compliance Management**: Ensure operations comply with regulations and standards
- **Performance Metrics**: Track KPIs and identify improvement opportunities
- **Cost Control**: Manage operational expenses and identify efficiencies
- **Project Management**: Oversee operational improvement projects
- **Documentation**: Maintain operational procedures and documentation

## Key Competencies Required
- Process optimization and continuous improvement
- Project management and timeline management
- Vendor and relationship management
- System thinking and problem solving
- Data analysis and metrics interpretation
- Cross-functional leadership
- Compliance and regulatory knowledge
- Technology system management
- Change management

## Data Access & Permissions
- **Operational Metrics**: Full access to performance dashboards and KPIs
- **System Data**: Access to all operational systems and databases
- **CRM Data**: View access to customer and transaction data
- **MLS Data**: Access to operational metrics and transaction data
- **Vendor Data**: Full access to vendor contracts and performance
- **Employee Data**: Access to organizational structure and availability
- **Financial Data**: Limited to operational expenses and budgets
- **Process Documentation**: Full access to operational procedures

## Compliance Requirements
- DLP Policy Enforcement: Moderate - Operational data handling
- Banking Compliance: Required if banking processes involved
- System Compliance: Ensure systems meet security standards
- Process Compliance: All processes follow regulatory requirements
- Audit Trail: Operations activities logged for review
- Documentation: All procedures documented and updated

## Integrations & Tools
- CRM Systems: View access for process analysis
- MLS System: View access for operational metrics
- Operational Dashboards: Full access and configuration
- Banking Systems: View access for operational efficiency
- Document Management: Full access to procedures
- Communication Tools: Standard
- Reporting Tools: Full access

## Success Metrics
- Operational efficiency improvements
- Process compliance rates
- Cost reductions achieved
- System uptime and reliability
- Vendor performance scores
- Cross-departmental satisfaction
- Project completion rates
- Continuous improvement metrics

## Security & Compliance Training
- DLP policy and data handling (2 hours)
- Banking compliance basics (1 hour)
- Process compliance and documentation (2 hours)
- System security and access controls (1 hour)
- Phishing and cybersecurity awareness (1 hour)
        `,

        requiredPermissions: [
          'crm:view_data',
          'crm:view_analytics',
          'banking:view_operational_metrics',
          'banking:view_accounts',
          'mls:view_operational_data',
          'system:view_logs',
          'system:manage_vendors',
          'payroll:view_org_structure',
          'operations:full_access'
        ],

        complianceRequirements: {
          dlp: {
            required: true,
            level: 'moderate',
            policies: ['protect_system_configurations', 'no_external_vendor_data']
          },
          banking: {
            required: false,
            level: 'basic'
          },
          auditLogging: {
            enabled: true,
            retentionDays: 365
          }
        },

        departmentAccess: {
          operations: 'full',
          crm: 'read_only',
          mls: 'read_only',
          finance: 'budget_view',
          it: 'coordination'
        },

        personaSetupRequirements: [
          'DLP policy training',
          'Operational procedures review',
          'System access training',
          'Process documentation review',
          'Vendor management guidelines',
          'Performance metric definitions'
        ],

        defaultAccessStartTime: 'business_hours',
        sessionTimeout: 480,
        mfaRequired: true,
        ipWhitelistRequired: false
      },

      financeManager: {
        id: 'finance_manager',
        title: 'Finance Manager / Controller',
        icon: '💳',
        category: 'manager',
        accessLevel: 'department_admin',

        jobDescription: `
# Finance Manager / Controller - Role Template

## Position Overview
The Finance Manager or Controller is responsible for accounting operations, financial reporting, accounts payable/receivable, payroll, and financial compliance. This role requires significant access to financial data while maintaining the highest levels of compliance with banking regulations (GLBA) and fraud prevention controls.

## Core Responsibilities
- **Accounting Operations**: Manage general ledger, accounts, and journal entries
- **Financial Reporting**: Prepare monthly, quarterly, and annual financial statements
- **Accounts Payable**: Manage vendor payments and expense processing
- **Accounts Receivable**: Manage customer payments and collections
- **Payroll**: Oversee payroll processing and tax withholdings
- **Tax Compliance**: Manage tax filings and compliance
- **Banking**: Reconcile bank accounts and manage deposits
- **Budget Management**: Track budgets and manage variance analysis
- **Internal Controls**: Implement and maintain internal controls
- **Audit Support**: Coordinate with auditors and provide documentation
- **Compliance**: Ensure all accounting is compliant with standards and regulations

## Key Competencies Required
- Accounting expertise and knowledge
- Financial statement preparation
- Internal control design and implementation
- Banking and cash management
- Payroll and tax knowledge
- System accounting software
- Regulatory compliance (GLBA, tax)
- Fraud prevention
- Attention to detail and accuracy

## Data Access & Permissions
- **General Ledger**: Full access to all accounts and entries
- **Financial Records**: Full access to all financial documents
- **Banking**: Full access to all bank accounts and transactions
- **Payroll**: Full access to payroll data and records
- **Accounts Payable**: Full access to vendor records and payments
- **Accounts Receivable**: Full access to customer payment data
- **Tax Records**: Full access to tax preparation documents
- **Employee Data**: Limited to payroll and compensation

## Compliance Requirements
- Banking Compliance (GLBA): Required - high level
- DLP Policy Enforcement: Strict - No financial data unencrypted
- SOX Compliance: Assist CFO in internal control implementation
- Audit Trail: All transactions logged and reviewable
- Segregation of Duties: Limited approval authority
- Fraud Prevention: Implement controls to prevent fraud
- Regulatory Compliance: Tax, banking, accounting standards

## Integrations & Tools
- Accounting Software: Full administrative access
- Banking APIs: Full access for reconciliation
- Payroll System: Full administrative access
- CRM Systems: View for customer payment status
- Document Management: Full access
- Encryption Tools: Required for sensitive data
- Spreadsheet Tools: Limited (DLP scanning enabled)

## Success Metrics
- Financial statement accuracy and timeliness
- Audit findings (zero to minimal)
- Banking reconciliation accuracy
- Payroll accuracy and compliance
- Accounts payable and receivable efficiency
- Internal control effectiveness
- Fraud detection and prevention
- Compliance record (zero violations)

## Security & Compliance Training
- GLBA banking compliance (4 hours)
- Fraud prevention and detection (2 hours)
- DLP and secure financial communications (2 hours)
- Payroll and tax compliance (2 hours)
- Internal controls and SOX awareness (1 hour)
        `,

        requiredPermissions: [
          'accounting:full_access',
          'accounting:approve_entries',
          'banking:view_all_accounts',
          'banking:reconcile_accounts',
          'banking:approve_payments',
          'payroll:full_access',
          'payroll:approve_payroll',
          'crm:view_customer_financial',
          'system:audit_logs',
          'system:compliance_reports',
          'dlp:enforce_policies'
        ],

        complianceRequirements: {
          dlp: {
            required: true,
            level: 'strict',
            policies: [
              'no_account_numbers_unencrypted',
              'no_unencrypted_financial_transfers',
              'no_ssn_in_email',
              'encrypt_sensitive_spreadsheets'
            ],
            enforcement: 'automatic_blocking'
          },
          banking: {
            required: true,
            certifications: ['GLBA'],
            trainingHours: 4,
            renewalFrequency: 'annual'
          },
          auditLogging: {
            enabled: true,
            retentionDays: 2555,
            alertingEnabled: true,
            highValueTransactionAlerts: true
          }
        },

        departmentAccess: {
          finance: 'full',
          crm: 'financial_metrics',
          mls: 'commission_view',
          banking: 'full'
        },

        personaSetupRequirements: [
          'GLBA compliance certification',
          'Accounting software training (4+ hours)',
          'Banking security procedures review',
          'Fraud prevention workshop',
          'DLP policy training and certification',
          'Internal controls review',
          'Segregation of duties understanding',
          'Audit procedures overview',
          'SOX awareness training'
        ],

        defaultAccessStartTime: 'business_hours',
        sessionTimeout: 480,
        mfaRequired: true,
        ipWhitelistRequired: false,
        transactionApprovalRequired: true
      },

      hrManager: {
        id: 'hr_manager',
        title: 'Human Resources Manager / Director',
        icon: '👥',
        category: 'manager',
        accessLevel: 'department_admin',

        jobDescription: `
# Human Resources Manager / Director - Role Template

## Position Overview
The Human Resources Manager or Director is responsible for recruitment, employee relations, benefits administration, compliance with employment laws, and development of company culture. This role requires access to sensitive employee data while maintaining the highest standards of data privacy and HIPAA compliance (where healthcare benefits are involved).

## Core Responsibilities
- **Recruitment & Hiring**: Post positions, screen candidates, conduct interviews, make offers
- **Onboarding**: Develop onboarding processes, train new employees
- **Employee Relations**: Address employee concerns, manage performance issues
- **Compensation & Benefits**: Administer pay systems, manage benefits programs
- **Training & Development**: Create training programs, track development
- **Compliance**: Ensure compliance with employment laws (EEOC, FMLA, ADA, etc.)
- **Records Management**: Maintain employee files and documentation
- **Policy Development**: Create and update HR policies
- **Performance Management**: Design appraisal systems and conduct reviews
- **Terminations**: Manage off-boarding and final paycheck administration
- **Culture & Engagement**: Foster company culture and employee engagement

## Key Competencies Required
- HR expertise and employment law knowledge
- Recruitment and interviewing skills
- Employee relations and conflict resolution
- Compensation and benefits knowledge
- Data privacy and confidentiality
- HIPAA awareness (if benefits include healthcare)
- Training and development design
- Systems and technology management
- Organizational development

## Data Access & Permissions
- **Employee Personal Data**: Full access to employee records (with HIPAA safeguards)
- **Compensation Data**: Full access to salary and benefits information
- **Health & Benefits Data**: Full access with HIPAA compliance
- **Recruitment Data**: Full access to candidate information
- **Performance Data**: Full access to performance reviews and ratings
- **Training Records**: Full access to development and training history
- **Compliance Records**: Full access to compliance documentation
- **Contact Data**: Full employee contact information

## Compliance Requirements
- HIPAA Compliance: Required - healthcare benefits and wellness programs
- DLP Policy Enforcement: Strict - No employee personal data externally
- Employment Law Compliance: Federal, state, and local employment laws
- Privacy Regulations: Respect employee privacy rights
- Audit Trail: HR activities logged for legal protection
- Data Retention: Follow data retention schedules
- Confidentiality: Maintain employee confidentiality
- Background Check Results: Secure handling of sensitive information

## Integrations & Tools
- HRIS System: Full administrative access
- Payroll System: View access for benefits/pay coordination
- CRM Systems: Limited access for employee contacts
- Email & Communications: Standard with privacy protection
- Document Management: Full access to employee files
- Video Conferencing: Standard
- Training Platform: Full access and management
- Benefits Administration: Full access

## Success Metrics
- Recruitment quality and time-to-fill
- Employee retention and satisfaction
- Compensation competitiveness
- Compliance record (zero violations)
- Benefits utilization and satisfaction
- Training completion rates
- Performance management effectiveness
- Diversity and inclusion metrics

## Security & Compliance Training
- HIPAA compliance (4 hours)
- DLP and employee data privacy (2 hours)
- Employment law compliance (2 hours)
- Data retention and legal hold (1 hour)
- Phishing and cybersecurity awareness (1 hour)
        `,

        requiredPermissions: [
          'hr:full_access',
          'hr:manage_employees',
          'hr:view_compensation',
          'hr:manage_benefits',
          'hr:view_health_data',
          'payroll:view_data',
          'payroll:manage_benefits',
          'crm:limited_access',
          'system:audit_logs',
          'dlp:enforce_policies'
        ],

        complianceRequirements: {
          hipaa: {
            required: true,
            level: 'moderate',
            requirements: [
              'health_data_privacy',
              'secure_communications',
              'access_controls',
              'audit_controls'
            ],
            trainingHours: 4
          },
          dlp: {
            required: true,
            level: 'strict',
            policies: [
              'no_employee_ssn_external',
              'no_health_data_unencrypted',
              'no_background_check_sharing',
              'protect_beneficiary_info'
            ],
            enforcement: 'automatic_blocking'
          },
          privacy: {
            required: true,
            requirements: [
              'employee_consent',
              'data_minimization',
              'retention_compliance',
              'third_party_oversight'
            ]
          },
          auditLogging: {
            enabled: true,
            retentionDays: 2555,
            alertingEnabled: true
          }
        },

        departmentAccess: {
          hr: 'full',
          payroll: 'view',
          all_departments: 'employee_records'
        },

        personaSetupRequirements: [
          'HIPAA compliance certification (4 hours)',
          'DLP policy training and certification',
          'Employment law overview training',
          'Data privacy and confidentiality agreement',
          'HRIS system administration training',
          'Background check handling procedures',
          'Employee file management standards',
          'Confidentiality agreement (employment attorney review)',
          'Benefits administration training'
        ],

        defaultAccessStartTime: 'business_hours',
        sessionTimeout: 480,
        mfaRequired: true,
        ipWhitelistRequired: false
      },

      mlsAgent: {
        id: 'mls_agent',
        title: 'Real Estate Agent / MLS User',
        icon: '🏠',
        category: 'specialist',
        accessLevel: 'user',

        jobDescription: `
# Real Estate Agent / MLS User - Role Template

## Position Overview
The Real Estate Agent uses the MLS (Multiple Listing Service) system to list properties, search for buyer properties, submit offers, generate agreements, and manage real estate transactions. This role requires access to MLS data while maintaining strict compliance with broker regulations, MLS rules, and customer data privacy.

## Core Responsibilities
- **Property Listing**: Create and manage property listings in MLS
- **Property Search**: Search MLS for buyer properties meeting criteria
- **Client Management**: Manage relationships with clients and customers
- **Offer Submission**: Prepare and submit purchase offers
- **Agreement Generation**: Create listing and purchase agreements
- **Transaction Management**: Manage timelines, inspections, closings
- **Communication**: Maintain contact with clients, other agents, lenders
- **Documentation**: Maintain transaction files and documentation
- **MLS Compliance**: Follow MLS rules and broker requirements
- **Market Analysis**: Analyze market trends and property values
- **Closing Coordination**: Coordinate with title companies, lenders, inspectors

## Key Competencies Required
- Real estate market knowledge
- MLS system expertise
- Client relationship management
- Negotiation and communication skills
- Legal and contract knowledge
- Property valuation and analysis
- Marketing and networking
- Regulatory compliance (MLS, broker, state laws)
- Time and transaction management
- Technology proficiency

## Data Access & Permissions
- **MLS Listings**: Full access to search, view, and list properties
- **MLS Offers**: Full access to submit and manage offers
- **MLS Documents**: Full access to agreements and extensions
- **Client Data**: Full access to own client information
- **Transaction Data**: Full access to own transactions
- **Market Data**: Access to pricing and trend information
- **Shared Data**: Limited access to team and office data
- **Communications**: Email and communication tools

## Compliance Requirements
- MLS Compliance: Follow all MLS rules and regulations
- Broker Compliance: Follow broker policies and procedures
- DLP Policy Enforcement: Strict - No customer financial data in public
- Customer Privacy: Respect customer privacy and consent
- Fair Housing: Comply with fair housing laws and regulations
- State Licensing: Maintain current real estate license
- Transaction Documentation: Maintain proper documentation
- Ethical Standards: Follow NAR Code of Ethics

## Integrations & Tools
- MLS System: Full access (NWMLS or other)
- CRM System: Full access to client management
- Email & Communications: Standard
- Document Management: Full access to transaction files
- Video Conferencing: Standard
- Document Signing: E-signature tools
- Banking Integration: View transaction financing

## Success Metrics
- Sales volume and revenue
- Average transaction size
- Days on market for listings
- Offer acceptance rates
- Customer satisfaction and referrals
- MLS compliance (zero violations)
- Transaction accuracy and timely close
- Market knowledge and expertise
- Client retention rates

## Security & Compliance Training
- MLS rules and compliance (2 hours)
- DLP and customer data privacy (1 hour)
- Fair housing compliance (1 hour)
- Broker policies and procedures (1 hour)
- Phishing and cybersecurity awareness (1 hour)
        `,

        requiredPermissions: [
          'mls:list_properties',
          'mls:search_listings',
          'mls:submit_offers',
          'mls:write_agreements',
          'mls:write_extensions',
          'mls:view_documents',
          'crm:manage_own_contacts',
          'crm:view_own_deals',
          'email:standard_access'
        ],

        complianceRequirements: {
          dlp: {
            required: true,
            level: 'moderate',
            policies: [
              'no_customer_financial_data_public',
              'no_agent_contact_external_sharing',
              'restrict_listing_data_external'
            ],
            enforcement: 'warning_and_block'
          },
          mls: {
            required: true,
            level: 'strict',
            requirements: [
              'mls_rule_compliance',
              'accurate_listing_data',
              'timely_status_updates',
              'offer_processing'
            ]
          },
          fairHousing: {
            required: true,
            trainingHours: 2,
            renewalFrequency: 'annual'
          },
          auditLogging: {
            enabled: true,
            retentionDays: 365
          }
        },

        departmentAccess: {
          mls: 'full',
          crm: 'own_contacts'
        },

        personaSetupRequirements: [
          'Real estate license verification',
          'MLS system training (4+ hours)',
          'DLP and customer privacy training',
          'Fair housing compliance certification',
          'Broker policies review and acknowledgment',
          'Ethics and standards agreement',
          'CRM system basics training',
          'Document handling procedures',
          'Compliance acknowledgment'
        ],

        defaultAccessStartTime: 'business_hours',
        sessionTimeout: 480,
        mfaRequired: true,
        ipWhitelistRequired: false
      }
    };
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    const templates = {};
    for (const [key, value] of Object.entries(this.templates)) {
      templates[key] = {
        id: value.id,
        title: value.title,
        icon: value.icon,
        category: value.category,
        accessLevel: value.accessLevel
      };
    }
    return templates;
  }

  /**
   * Get template details
   */
  getTemplate(templateId) {
    return this.templates[templateId] || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    return Object.values(this.templates).filter(t => t.category === category);
  }

  /**
   * Get all required compliance policies for a template
   */
  getCompliancePolicies(templateId) {
    const template = this.templates[templateId];
    if (!template) return null;

    const policies = {};
    
    if (template.complianceRequirements) {
      for (const [policyType, requirements] of Object.entries(template.complianceRequirements)) {
        policies[policyType] = {
          required: requirements.required,
          level: requirements.level,
          ...requirements
        };
      }
    }

    return policies;
  }

  /**
   * Validate persona setup completeness
   */
  validatePersonaSetup(templateId, completedRequirements = []) {
    const template = this.templates[templateId];
    if (!template) return { valid: false, error: 'Template not found' };

    const allRequirements = template.personaSetupRequirements || [];
    const missingRequirements = allRequirements.filter(req => !completedRequirements.includes(req));

    return {
      valid: missingRequirements.length === 0,
      totalRequired: allRequirements.length,
      completed: completedRequirements.length,
      missing: missingRequirements,
      completionPercentage: Math.round((completedRequirements.length / allRequirements.length) * 100)
    };
  }
}

module.exports = CRMQuickTemplates;
