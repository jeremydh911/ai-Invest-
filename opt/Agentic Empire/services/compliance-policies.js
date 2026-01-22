/**
 * Compliance Policies Service
 * Manages DLP (Data Loss Prevention), Banking, and HIPAA compliance policies
 * Enforces compliance rules across all agent personas
 * 
 * Compliance Frameworks:
 * - DLP (Data Loss Prevention): Protects sensitive data
 * - GLBA (Gramm-Leach-Bliley Act): Banking privacy
 * - SOX (Sarbanes-Oxley): Financial reporting controls
 * - HIPAA (Health Insurance Portability and Accountability Act): Healthcare privacy
 * - Fair Housing: Real estate compliance
 */

class CompliancePolicies {
  constructor() {
    this.policies = {};
    this.initializePolicies();
  }

  /**
   * Initialize all compliance policies
   */
  initializePolicies() {
    this.policies = {
      // ===============================
      // DATA LOSS PREVENTION (DLP) POLICIES
      // ===============================
      dlp: {
        name: 'Data Loss Prevention',
        description: 'Prevents sensitive data from being shared externally or in unsecured communications',
        enabled: true,
        enforcement: 'automatic_blocking',
        
        patterns: {
          // Financial data patterns
          account_numbers: {
            name: 'Bank Account Numbers',
            pattern: /\b\d{8,17}\b/, // Common account number length
            sensitivity: 'high',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'warn',
              internal_system: 'allow'
            },
            description: 'Full or partial bank account numbers'
          },

          routing_numbers: {
            name: 'Bank Routing Numbers',
            pattern: /\b\d{9}\b/, // US routing number format
            sensitivity: 'high',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'warn',
              internal_system: 'allow'
            },
            description: 'US bank routing numbers (9 digits)'
          },

          ssn: {
            name: 'Social Security Numbers',
            pattern: /\b\d{3}-\d{2}-\d{4}\b|(?<!\d)\d{9}(?!\d)/, // SSN with or without hyphens
            sensitivity: 'critical',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'block',
              internal_system: 'warn'
            },
            description: 'Social Security Numbers (both formats)'
          },

          credit_card: {
            name: 'Credit Card Numbers',
            pattern: /\b(?:\d[ -]*?){13,19}\b/, // 13-19 digit credit cards
            sensitivity: 'critical',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'block',
              internal_system: 'block'
            },
            description: 'Full or partial credit card numbers'
          },

          // Healthcare data patterns
          patient_id: {
            name: 'Patient Identification Numbers',
            pattern: /[Pp]atient[\s-]?[ID#]*[\s-]*\d{6,10}/,
            sensitivity: 'high',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'warn',
              internal_system: 'allow'
            },
            description: 'Patient ID or Medical Record Numbers'
          },

          medical_record: {
            name: 'Medical Record Numbers',
            pattern: /[Mm][Rr][\s-]?#?[\s-]*\d{6,12}/,
            sensitivity: 'high',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'block',
              internal_system: 'allow'
            },
            description: 'Medical Record Numbers'
          },

          // Real Estate data patterns
          property_price_external: {
            name: 'Property Pricing (External)',
            pattern: /(?:sold for|sale price|list price|asking)[\s:\$]*[\$]?[\d,]+/i,
            sensitivity: 'medium',
            contexts: {
              email: 'warn',
              web: 'block',
              print: 'warn',
              internal_system: 'allow'
            },
            description: 'Property sales prices in external communications'
          },

          mls_data_external: {
            name: 'MLS Data (External Sharing)',
            pattern: /\b[Mm][Ll][Ss]\s+#?\d+\b|\b[Ll]isting\s+#?\d+\b/,
            sensitivity: 'medium',
            contexts: {
              email: 'allow',
              web: 'block',
              print: 'allow',
              internal_system: 'allow'
            },
            description: 'MLS numbers and listing data sharing restrictions'
          },

          // Personal Identification
          drivers_license: {
            name: 'Driver License Numbers',
            pattern: /[Dd](?:riving|river\'s)?[\s-]?[Ll]icense[\s#:]*(?:[A-Z0-9]{4,8}\s?){2,3}/,
            sensitivity: 'high',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'warn',
              internal_system: 'allow'
            },
            description: 'Driver license numbers'
          },

          passport: {
            name: 'Passport Numbers',
            pattern: /[Pp]assport[\s#:]*[A-Z0-9]{6,9}/,
            sensitivity: 'high',
            contexts: {
              email: 'block',
              web: 'block',
              print: 'block',
              internal_system: 'allow'
            },
            description: 'Passport numbers'
          }
        },

        policies: {
          no_external_financial_data: {
            name: 'No External Financial Data',
            description: 'Financial information cannot be sent externally',
            appliedTo: ['account_numbers', 'routing_numbers', 'credit_card'],
            enforcement: 'block',
            exceptions: ['encrypted_email', 'secure_portal']
          },

          no_patient_data_sharing: {
            name: 'No Patient Data Sharing',
            description: 'Patient data cannot be shared externally without encryption',
            appliedTo: ['patient_id', 'medical_record'],
            enforcement: 'block',
            exceptions: ['hipaa_compliant_portal', 'authorized_provider']
          },

          no_personal_ssn: {
            name: 'No SSN in Communications',
            description: 'Social Security Numbers cannot be in any external communication',
            appliedTo: ['ssn'],
            enforcement: 'block',
            exceptions: [] // No exceptions - always block
          },

          restrict_pricing_data: {
            name: 'Restrict Pricing Data External',
            description: 'Property pricing restricted in external communications',
            appliedTo: ['property_price_external'],
            enforcement: 'warn',
            exceptions: ['to_authorized_agents', 'to_customers']
          },

          mls_compliance: {
            name: 'MLS Data Compliance',
            description: 'MLS data sharing compliance with MLS rules',
            appliedTo: ['mls_data_external'],
            enforcement: 'warn',
            exceptions: ['agent_to_agent', 'agent_to_customer']
          }
        },

        actions: {
          block: {
            description: 'Content is blocked from being sent',
            severity: 'high',
            logging: 'detailed',
            notification: 'immediate',
            alertAdmin: true
          },
          warn: {
            description: 'User is warned but content can proceed',
            severity: 'medium',
            logging: 'standard',
            notification: 'immediate',
            alertAdmin: false
          },
          allow: {
            description: 'Content is allowed',
            severity: 'none',
            logging: 'none',
            notification: 'none',
            alertAdmin: false
          }
        }
      },

      // ===============================
      // BANKING COMPLIANCE POLICIES (GLBA, SOX)
      // ===============================
      banking: {
        name: 'Banking Compliance',
        description: 'Gramm-Leach-Bliley Act (GLBA) and Sarbanes-Oxley (SOX) compliance',
        enabled: true,
        frameworks: ['GLBA', 'SOX'],

        glba: {
          name: 'Gramm-Leach-Bliley Act',
          description: 'Privacy, security, and safeguarding of customer financial information',
          requirements: {
            privacy_notice: {
              name: 'Privacy Policy Disclosure',
              description: 'Must provide privacy notice to customers',
              implementation: 'Privacy policy published and acknowledged'
            },

            information_security: {
              name: 'Information Security Program',
              description: 'Develop, implement, and maintain information security program',
              controls: [
                'access_controls',
                'encryption',
                'monitoring',
                'incident_response',
                'employee_training',
                'third_party_oversight'
              ]
            },

            safeguards_rule: {
              name: 'Safeguards Rule',
              description: 'Maintain safeguards to protect customer information',
              requirements: [
                'designate_information_security_officer',
                'risk_assessments',
                'access_controls',
                'encryption',
                'monitoring_and_testing',
                'employee_training',
                'third_party_vendor_management',
                'incident_response_plan',
                'board_oversight'
              ]
            },

            data_breach_notification: {
              name: 'Data Breach Notification',
              description: 'Notify customers of unauthorized access to personal information',
              timeline: '30_days_or_sooner',
              requiresNotification: [
                'customers',
                'credit_agencies',
                'media_if_significant'
              ]
            }
          }
        },

        sox: {
          name: 'Sarbanes-Oxley Act',
          description: 'Financial reporting controls and accountability',
          applicableToPublicCompanies: true,
          requirements: {
            section_302: {
              name: 'CEO/CFO Certification',
              description: 'CEO and CFO must certify financial statements',
              penalties: 'civil_and_criminal'
            },

            section_404: {
              name: 'Internal Control Assessment',
              description: 'Assess effectiveness of internal controls',
              requirements: [
                'control_framework_documentation',
                'risk_assessment',
                'control_design',
                'control_testing',
                'annual_assessment'
              ]
            },

            section_906: {
              name: 'Criminal Penalties',
              description: 'Criminal penalties for certification violations',
              penalties: 'up_to_20_years_imprisonment'
            },

            audit_committee: {
              name: 'Audit Committee',
              description: 'Establish audit committee with financial expert',
              requirements: [
                'financial_expert_required',
                'independence_required',
                'oversee_auditors',
                'handle_complaints'
              ]
            },

            document_retention: {
              name: 'Document Retention',
              description: 'Maintain documents for minimum 7 years',
              retentionPeriod: 'years_7',
              documents: [
                'financial_records',
                'email',
                'internal_communications',
                'working_papers',
                'audit_records'
              ]
            }
          }
        },

        controls: {
          segregation_of_duties: {
            name: 'Segregation of Duties',
            description: 'Critical financial functions separated',
            requiresSeparation: [
              'authorization',
              'execution',
              'custody',
              'reconciliation'
            ]
          },

          authorization_approval: {
            name: 'Authorization and Approval',
            description: 'All transactions require proper authorization',
            levels: [
              'user_creation_approval',
              'high_value_transaction_approval',
              'policy_exception_approval'
            ]
          },

          audit_trails: {
            name: 'Audit Trail Logging',
            description: 'Complete logging of all financial transactions',
            logContent: [
              'who',
              'what',
              'when',
              'where',
              'result'
            ],
            retention: 'years_7'
          },

          reconciliation: {
            name: 'Reconciliation',
            description: 'Regular reconciliation of accounts and transactions',
            frequency: 'monthly',
            documentation: 'required'
          }
        }
      },

      // ===============================
      // HIPAA COMPLIANCE POLICIES
      // ===============================
      hipaa: {
        name: 'HIPAA Compliance',
        description: 'Health Insurance Portability and Accountability Act - Healthcare privacy and security',
        enabled: true,
        applicableWhen: 'handling_health_information',

        definitions: {
          protected_health_information: {
            name: 'Protected Health Information (PHI)',
            description: 'Any health information that can identify an individual',
            examples: [
              'patient_names',
              'medical_record_numbers',
              'health_conditions',
              'medications',
              'treatment_records',
              'health_plan_information',
              'payment_information_for_healthcare'
            ]
          },

          personally_identifiable_information: {
            name: 'Personally Identifiable Information (PII)',
            description: 'Information that can identify an individual (in healthcare context)',
            examples: [
              'name',
              'address',
              'phone_number',
              'email',
              'social_security_number',
              'medical_record_number',
              'health_plan_beneficiary_number'
            ]
          },

          de_identified_health_information: {
            name: 'De-Identified Health Information',
            description: 'Health information with identifiers removed',
            requirements: [
              'remove_names',
              'remove_medical_record_numbers',
              'remove_addresses',
              'remove_dates_of_birth',
              'remove_phone_numbers',
              'remove_email_addresses'
            ]
          }
        },

        rules: {
          privacy_rule: {
            name: 'Privacy Rule',
            description: 'Standards for use and disclosure of PHI',
            requirements: {
              minimum_necessary: {
                name: 'Minimum Necessary',
                description: 'Only use/disclose minimum necessary PHI',
                implementation: 'Access controls and role-based permissions'
              },

              use_limitation: {
                name: 'Use Limitation',
                description: 'PHI can only be used for specified purpose',
                implementation: 'System controls and training'
              },

              patient_rights: {
                name: 'Patient Rights',
                description: 'Patients have rights to their health information',
                rights: [
                  'access_to_records',
                  'amendment_of_records',
                  'accounting_of_disclosures',
                  'restriction_of_uses',
                  'confidential_communications'
                ]
              },

              de_identification: {
                name: 'De-Identification',
                description: 'Health information can be used if properly de-identified',
                methods: [
                  'remove_18_specific_identifiers',
                  'expert_determination',
                  'statistical_methods'
              ]
              }
            }
          },

          security_rule: {
            name: 'Security Rule',
            description: 'Standards for protecting electronic PHI (ePHI)',
            safeguards: {
              administrative: {
                name: 'Administrative Safeguards',
                controls: [
                  'security_management_process',
                  'assigned_security_responsibility',
                  'workforce_security',
                  'information_access_management',
                  'security_awareness_training',
                  'security_incident_procedures',
                  'contingency_planning',
                  'business_associate_agreements'
                ]
              },

              physical: {
                name: 'Physical Safeguards',
                controls: [
                  'facility_access_controls',
                  'workstation_use_and_security',
                  'workstation_security',
                  'device_and_media_controls'
                ]
              },

              technical: {
                name: 'Technical Safeguards',
                controls: [
                  'access_controls',
                  'audit_controls',
                  'integrity_controls',
                  'transmission_security',
                  'encryption_and_decryption'
                ]
              }
            }
          },

          breach_notification_rule: {
            name: 'Breach Notification Rule',
            description: 'Notification requirements in case of PHI breach',
            requirements: {
              define_breach: {
                description: 'Unauthorized acquisition, access, use, or disclosure of PHI',
                exceptions: [
                  'unintentional_access',
                  'authorized_access_by_workforce',
                  'transmitted_outside_network_but_not_acquired'
                ]
              },

              notice_to_individuals: {
                timeline: '60_days',
                content: [
                  'description_of_breach',
                  'types_of_information_involved',
                  'steps_individuals_should_take',
                  'what_organization_is_doing',
                  'contact_information'
                ],
                methods: ['email', 'encrypted_mail', 'phone', 'media_notice']
              },

              notice_to_media: {
                timeline: '60_days',
                trigger: 'more_than_500_residents_affected',
                requirement: 'prominent_media_in_area'
              },

              notice_to_hhs: {
                timeline: '60_days',
                trigger: 'any_breach',
                requirement: 'always_required'
              }
            }
          }
        }
      },

      // ===============================
      // REAL ESTATE COMPLIANCE POLICIES
      // ===============================
      mls: {
        name: 'MLS and Real Estate Compliance',
        description: 'Multiple Listing Service rules and fair housing compliance',
        enabled: true,

        mls_rules: {
          data_integrity: {
            name: 'Data Integrity',
            description: 'MLS data must be accurate and timely',
            requirements: [
              'accurate_property_information',
              'timely_status_updates',
              'proper_price_modifications',
              'accurate_expiration_dates'
            ]
          },

          confidentiality: {
            name: 'Confidentiality',
            description: 'Restrict sharing of certain MLS data',
            restrictions: [
              'no_sharing_pending_sales_data_until_authorized',
              'no_agent_contact_external_sharing',
              'no_financial_terms_external_sharing',
              'respect_seller_privacy'
            ]
          },

          professional_conduct: {
            name: 'Professional Conduct',
            description: 'Maintain professional standards',
            requirements: [
              'no_misrepresentation',
              'no_false_advertising',
              'no_disparagement',
              'respect_other_agents',
              'maintain_confidentiality'
            ]
          }
        },

        fair_housing: {
          name: 'Fair Housing Compliance',
          description: 'Fair Housing Act and related regulations',
          protected_classes: [
            'race',
            'color',
            'religion',
            'sex',
            'national_origin',
            'familial_status',
            'disability'
          ],
          prohibitions: [
            'steering',
            'redlining',
            'false_advertising',
            'discriminatory_terms',
            'different_treatment',
            'harassment'
          ],
          requirements: [
            'annual_training',
            'non_discriminatory_practices',
            'equal_access_to_properties',
            'no_restricted_communications',
            'document_equal_treatment'
          ]
        }
      }
    };
  }

  /**
   * Check if content violates DLP policies
   */
  checkDLPViolation(content, context = 'email') {
    if (!this.policies.dlp.enabled) {
      return { violated: false, violations: [] };
    }

    const violations = [];

    for (const [patternKey, pattern] of Object.entries(this.policies.dlp.patterns)) {
      const patternObj = pattern;
      const contextAction = patternObj.contexts[context] || 'allow';

      if (contextAction !== 'allow') {
        const regex = new RegExp(patternObj.pattern, 'gi');
        const matches = content.match(regex);

        if (matches) {
          violations.push({
            pattern: patternKey,
            name: patternObj.name,
            count: matches.length,
            action: contextAction,
            severity: patternObj.sensitivity,
            matches: matches.slice(0, 3) // Show first 3 matches
          });
        }
      }
    }

    const hasBlockingViolations = violations.some(v => v.action === 'block');

    return {
      violated: hasBlockingViolations,
      violations,
      context,
      summary: {
        total: violations.length,
        blocked: violations.filter(v => v.action === 'block').length,
        warned: violations.filter(v => v.action === 'warn').length
      }
    };
  }

  /**
   * Check banking compliance requirements
   */
  checkBankingCompliance(userId, userRole) {
    const banking = this.policies.banking;
    const requirements = {
      glba: {
        required: false,
        satisfied: false,
        certifications: []
      },
      sox: {
        required: false,
        satisfied: false,
        requirements: []
      }
    };

    // Determine requirements based on role
    const rolesRequiringGLBA = ['cfo', 'finance_manager', 'ceo'];
    const rolesRequiringSOX = ['cfo', 'ceo'];

    if (rolesRequiringGLBA.includes(userRole)) {
      requirements.glba.required = true;
      requirements.glba.certifications = ['GLBA_Certification'];
    }

    if (rolesRequiringSOX.includes(userRole)) {
      requirements.sox.required = true;
      requirements.sox.requirements = [
        'internal_control_assessment',
        'segregation_of_duties',
        'audit_trail_maintenance'
      ];
    }

    return requirements;
  }

  /**
   * Check HIPAA compliance requirements
   */
  checkHIPAACompliance(content, userRole) {
    if (!this.policies.hipaa.enabled) {
      return { required: false, violations: [] };
    }

    const hipaa = this.policies.hipaa;
    const violations = [];

    // Check for PHI in content
    const phiPatterns = [
      { name: 'Patient ID', pattern: /[Pp]atient[\s-]?[ID#]*[\s-]*\d{6,10}/ },
      { name: 'Medical Record', pattern: /[Mm][Rr][\s-]?#?[\s-]*\d{6,12}/ },
      { name: 'Health Condition', pattern: /(?:diagnosed with|patient has|treatment for|medication)[\s\w]*/i }
    ];

    phiPatterns.forEach(phiPattern => {
      const regex = new RegExp(phiPattern.pattern, 'gi');
      const matches = content.match(regex);
      if (matches) {
        violations.push({
          type: phiPattern.name,
          count: matches.length,
          severity: 'high'
        });
      }
    });

    return {
      required: ['hr_manager', 'cfo', 'ceo'].includes(userRole),
      violated: violations.length > 0,
      violations,
      minimumNecessary: true, // Always enforce minimum necessary
      auditTrail: true // Always required
    };
  }

  /**
   * Get policy for a specific compliance area
   */
  getPolicy(policyArea) {
    return this.policies[policyArea] || null;
  }

  /**
   * Get all applicable compliance policies
   */
  getApplicablePolicies(userRole, context = {}) {
    const applicable = {};

    // DLP always applies
    applicable.dlp = this.policies.dlp;

    // Banking compliance for financial roles
    if (['cfo', 'finance_manager', 'ceo'].includes(userRole)) {
      applicable.banking = this.policies.banking;
    }

    // HIPAA for HR roles
    if (['hr_manager', 'ceo', 'cfo'].includes(userRole)) {
      applicable.hipaa = this.policies.hipaa;
    }

    // MLS for real estate roles
    if (['mls_agent', 'sales_manager', 'ceo'].includes(userRole)) {
      applicable.mls = this.policies.mls;
    }

    return applicable;
  }

  /**
   * Enforce a compliance policy action
   */
  enforcePolicy(action) {
    const policyAction = this.policies.dlp.actions[action];
    if (!policyAction) return null;

    return {
      action,
      severity: policyAction.severity,
      logging: policyAction.logging,
      notification: policyAction.notification,
      alertAdmin: policyAction.alertAdmin,
      description: policyAction.description
    };
  }
}

module.exports = CompliancePolicies;
