/**
 * Industry Templates & Growth Charts
 * 
 * Provides industry-specific templates with:
 * - Recommended agent positions
 * - Growth stage visualization
 * - Hiring recommendations
 * - Chart data for visualization
 */

class IndustryTemplates {
  constructor() {
    this.templates = {
      'Technology': {
        description: 'Software, SaaS, Cloud Services',
        stages: {
          'Startup': {
            description: 'Initial product development',
            agents: [
              { name: 'CTO - Chief Technology Officer', type: 'Leadership', priority: 1, salary_range: '150-250k' },
              { name: 'Lead Engineer', type: 'Technical', priority: 2, salary_range: '120-180k' },
              { name: 'QA Engineer', type: 'Quality', priority: 3, salary_range: '80-120k' }
            ],
            timeline: 'Months 1-6'
          },
          'Growth': {
            description: 'Scaling products and team',
            agents: [
              { name: 'DevOps Engineer', type: 'Technical', priority: 1, salary_range: '110-160k' },
              { name: 'Product Manager', type: 'Product', priority: 2, salary_range: '100-150k' },
              { name: 'Security Engineer', type: 'Security', priority: 3, salary_range: '110-170k' }
            ],
            timeline: 'Months 7-18'
          },
          'Enterprise': {
            description: 'Multi-product enterprise scaling',
            agents: [
              { name: 'VP Engineering', type: 'Leadership', priority: 1, salary_range: '200-300k' },
              { name: 'Solutions Architect', type: 'Technical', priority: 2, salary_range: '130-190k' },
              { name: 'Technical Recruiter', type: 'HR', priority: 3, salary_range: '80-130k' }
            ],
            timeline: 'Months 19+'
          }
        },
        chartType: 'expansion',
        chartSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="30" font-weight="bold">Tech Startup Growth</text>
          <rect x="50" y="60" width="80" height="100" fill="#667eea" opacity="0.8"/>
          <text x="90" y="170" text-anchor="middle" font-size="12">Startup</text>
          <text x="90" y="185" text-anchor="middle" font-size="10">3 agents</text>
          
          <line x1="130" y1="110" x2="170" y2="110" stroke="#667eea" stroke-width="2" marker-end="url(#arrowhead)"/>
          
          <rect x="170" y="50" width="100" height="120" fill="#667eea" opacity="0.6"/>
          <text x="220" y="170" text-anchor="middle" font-size="12">Growth</text>
          <text x="220" y="185" text-anchor="middle" font-size="10">6+ agents</text>
          
          <line x1="270" y1="110" x2="310" y2="110" stroke="#667eea" stroke-width="2" marker-end="url(#arrowhead)"/>
          
          <rect x="310" y="40" width="80" height="130" fill="#667eea" opacity="0.4"/>
          <text x="350" y="170" text-anchor="middle" font-size="12">Enterprise</text>
          <text x="350" y="185" text-anchor="middle" font-size="10">10+ agents</text>
          
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#667eea"/>
            </marker>
          </defs>
        </svg>`
      },
      'Finance': {
        description: 'Banking, Investment, Accounting',
        stages: {
          'Startup': {
            description: 'Financial services launch',
            agents: [
              { name: 'CFO - Chief Financial Officer', type: 'Leadership', priority: 1, salary_range: '140-220k' },
              { name: 'Accounting Manager', type: 'Finance', priority: 2, salary_range: '90-130k' },
              { name: 'Compliance Officer', type: 'Compliance', priority: 3, salary_range: '100-150k' }
            ],
            timeline: 'Months 1-6'
          },
          'Growth': {
            description: 'Regulatory expansion',
            agents: [
              { name: 'Financial Analyst', type: 'Analysis', priority: 1, salary_range: '80-120k' },
              { name: 'Risk Manager', type: 'Risk', priority: 2, salary_range: '110-160k' },
              { name: 'Treasury Specialist', type: 'Treasury', priority: 3, salary_range: '95-140k' }
            ],
            timeline: 'Months 7-18'
          },
          'Enterprise': {
            description: 'Multi-region financial operations',
            agents: [
              { name: 'Controller', type: 'Leadership', priority: 1, salary_range: '160-240k' },
              { name: 'Internal Auditor', type: 'Audit', priority: 2, salary_range: '100-150k' },
              { name: 'Investment Advisor AI', type: 'Advisory', priority: 3, salary_range: '120-180k' }
            ],
            timeline: 'Months 19+'
          }
        },
        chartType: 'regulation',
        chartSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="30" font-weight="bold">Finance Growth Path</text>
          <circle cx="80" cy="110" r="40" fill="#28a745" opacity="0.8"/>
          <text x="80" y="115" text-anchor="middle" font-size="12" fill="white">Launch</text>
          <line x1="120" y1="110" x2="160" y2="110" stroke="#28a745" stroke-width="2" marker-end="url(#arrowhead)"/>
          <circle cx="200" cy="110" r="50" fill="#28a745" opacity="0.6"/>
          <text x="200" y="115" text-anchor="middle" font-size="12" fill="white">Compliance</text>
          <line x1="250" y1="110" x2="290" y2="110" stroke="#28a745" stroke-width="2" marker-end="url(#arrowhead)"/>
          <circle cx="340" cy="110" r="40" fill="#28a745" opacity="0.4"/>
          <text x="340" y="115" text-anchor="middle" font-size="10" fill="white">Multi-Region</text>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#28a745"/>
            </marker>
          </defs>
        </svg>`
      },
      'Healthcare': {
        description: 'Medical Services, Pharma, Wellness',
        stages: {
          'Startup': {
            description: 'Medical practice launch',
            agents: [
              { name: 'Medical Director', type: 'Leadership', priority: 1, salary_range: '160-240k' },
              { name: 'Clinical Coordinator', type: 'Clinical', priority: 2, salary_range: '50-75k' },
              { name: 'HIPAA Compliance Officer', type: 'Compliance', priority: 3, salary_range: '80-120k' }
            ],
            timeline: 'Months 1-6'
          },
          'Growth': {
            description: 'Clinic expansion',
            agents: [
              { name: 'Patient Scheduler AI', type: 'Operations', priority: 1, salary_range: 'N/A' },
              { name: 'Medical Records Manager', type: 'Admin', priority: 2, salary_range: '45-65k' },
              { name: 'Billing Specialist', type: 'Finance', priority: 3, salary_range: '50-75k' }
            ],
            timeline: 'Months 7-18'
          },
          'Enterprise': {
            description: 'Healthcare network',
            agents: [
              { name: 'Chief Medical Officer', type: 'Leadership', priority: 1, salary_range: '200-300k' },
              { name: 'Quality Assurance Manager', type: 'Quality', priority: 2, salary_range: '90-130k' },
              { name: 'Data Privacy Officer', type: 'Privacy', priority: 3, salary_range: '120-170k' }
            ],
            timeline: 'Months 19+'
          }
        },
        chartType: 'care',
        chartSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="30" font-weight="bold">Healthcare Expansion</text>
          <polygon points="80,60 100,120 60,120" fill="#dc3545" opacity="0.8"/>
          <text x="80" y="145" text-anchor="middle" font-size="10">Practice</text>
          <line x1="120" y1="90" x2="160" y2="90" stroke="#dc3545" stroke-width="2" marker-end="url(#arrowhead)"/>
          <polygon points="200,50 230,130 170,130" fill="#dc3545" opacity="0.6"/>
          <text x="200" y="155" text-anchor="middle" font-size="10">Clinic</text>
          <line x1="240" y1="90" x2="280" y2="90" stroke="#dc3545" stroke-width="2" marker-end="url(#arrowhead)"/>
          <polygon points="320,40 360,140 280,140" fill="#dc3545" opacity="0.4"/>
          <text x="320" y="165" text-anchor="middle" font-size="10">Network</text>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#dc3545"/>
            </marker>
          </defs>
        </svg>`
      },
      'Retail': {
        description: 'E-commerce, Stores, Inventory',
        stages: {
          'Startup': {
            description: 'Online store launch',
            agents: [
              { name: 'Store Manager AI', type: 'Leadership', priority: 1, salary_range: 'N/A' },
              { name: 'Inventory Manager', type: 'Operations', priority: 2, salary_range: '50-80k' },
              { name: 'Customer Service Agent', type: 'Service', priority: 3, salary_range: 'N/A' }
            ],
            timeline: 'Months 1-6'
          },
          'Growth': {
            description: 'Multi-channel expansion',
            agents: [
              { name: 'Sales Coach AI', type: 'Sales', priority: 1, salary_range: 'N/A' },
              { name: 'Marketing Manager', type: 'Marketing', priority: 2, salary_range: '70-110k' },
              { name: 'Analytics Specialist', type: 'Data', priority: 3, salary_range: '75-120k' }
            ],
            timeline: 'Months 7-18'
          },
          'Enterprise': {
            description: 'Retail network',
            agents: [
              { name: 'VP Retail Operations', type: 'Leadership', priority: 1, salary_range: '140-220k' },
              { name: 'Supply Chain Manager', type: 'Operations', priority: 2, salary_range: '100-150k' },
              { name: 'Business Intelligence Manager', type: 'Data', priority: 3, salary_range: '110-160k' }
            ],
            timeline: 'Months 19+'
          }
        },
        chartType: 'commerce',
        chartSvg: null
      },
      'Manufacturing': {
        description: 'Production, Supply Chain, Quality',
        stages: {
          'Startup': {
            description: 'Small workshop',
            agents: [
              { name: 'Plant Manager', type: 'Leadership', priority: 1, salary_range: '80-120k' },
              { name: 'Quality Supervisor', type: 'Quality', priority: 2, salary_range: '50-75k' },
              { name: 'Safety Officer', type: 'Safety', priority: 3, salary_range: '45-70k' }
            ],
            timeline: 'Months 1-6'
          },
          'Growth': {
            description: 'Factory operations',
            agents: [
              { name: 'Production Supervisor', type: 'Operations', priority: 1, salary_range: '55-85k' },
              { name: 'Maintenance Technician AI', type: 'Maintenance', priority: 2, salary_range: 'N/A' },
              { name: 'Supply Chain Coordinator', type: 'Supply Chain', priority: 3, salary_range: '50-80k' }
            ],
            timeline: 'Months 7-18'
          },
          'Enterprise': {
            description: 'Complex manufacturing',
            agents: [
              { name: 'Operations Director', type: 'Leadership', priority: 1, salary_range: '130-190k' },
              { name: 'Lean Process Manager', type: 'Optimization', priority: 2, salary_range: '90-130k' },
              { name: 'Logistics Coordinator', type: 'Supply Chain', priority: 3, salary_range: '70-110k' }
            ],
            timeline: 'Months 19+'
          }
        },
        chartType: 'production',
        chartSvg: null
      },
      'Education': {
        description: 'Schools, Training, Online Learning',
        stages: {
          'Startup': {
            description: 'Individual instructor',
            agents: [
              { name: 'Curriculum Manager', type: 'Academic', priority: 1, salary_range: '50-80k' },
              { name: 'Course Facilitator AI', type: 'Instruction', priority: 2, salary_range: 'N/A' },
              { name: 'Student Advisor', type: 'Support', priority: 3, salary_range: 'N/A' }
            ],
            timeline: 'Months 1-6'
          },
          'Growth': {
            description: 'School operations',
            agents: [
              { name: 'School Principal', type: 'Leadership', priority: 1, salary_range: '80-130k' },
              { name: 'Admissions Coordinator', type: 'Admin', priority: 2, salary_range: '40-60k' },
              { name: 'Learning Analytics AI', type: 'Data', priority: 3, salary_range: 'N/A' }
            ],
            timeline: 'Months 7-18'
          },
          'Enterprise': {
            description: 'Education network',
            agents: [
              { name: 'Director of Education', type: 'Leadership', priority: 1, salary_range: '120-180k' },
              { name: 'Curriculum Director', type: 'Academic', priority: 2, salary_range: '90-140k' },
              { name: 'EdTech Specialist', type: 'Technology', priority: 3, salary_range: '80-130k' }
            ],
            timeline: 'Months 19+'
          }
        },
        chartType: 'learning',
        chartSvg: null
      }
    };
  }

  /**
   * Get template for industry
   * @param {string} industry - Industry name
   * @returns {Object} Industry template
   */
  getTemplate(industry) {
    return this.templates[industry] || null;
  }

  /**
   * Get all available industries
   * @returns {Array} Industry names
   */
  listIndustries() {
    return Object.keys(this.templates);
  }

  /**
   * Get positions for a specific stage
   * @param {string} industry - Industry name
   * @param {string} stage - Growth stage
   * @returns {Array} Agent positions
   */
  getPositions(industry, stage = 'Startup') {
    const template = this.getTemplate(industry);
    if (!template || !template.stages[stage]) {
      return [];
    }
    return template.stages[stage].agents;
  }

  /**
   * Get chart SVG for industry
   * @param {string} industry - Industry name
   * @returns {string} SVG markup
   */
  getChartSvg(industry) {
    const template = this.getTemplate(industry);
    return template ? template.chartSvg : null;
  }

  /**
   * Get all stages for industry
   * @param {string} industry - Industry name
   * @returns {Array} Stage names with descriptions
   */
  getStages(industry) {
    const template = this.getTemplate(industry);
    if (!template) return [];
    
    return Object.keys(template.stages).map(stage => ({
      name: stage,
      description: template.stages[stage].description,
      timeline: template.stages[stage].timeline,
      agentCount: template.stages[stage].agents.length
    }));
  }

  /**
   * Get recommended hiring order
   * @param {string} industry - Industry name
   * @returns {Array} Agents sorted by priority
   */
  getHiringOrder(industry) {
    const allAgents = [];
    const template = this.getTemplate(industry);
    
    if (!template) return [];

    Object.keys(template.stages).forEach(stage => {
      template.stages[stage].agents.forEach(agent => {
        allAgents.push({
          ...agent,
          stage
        });
      });
    });

    return allAgents.sort((a, b) => a.priority - b.priority);
  }
}

module.exports = new IndustryTemplates();
