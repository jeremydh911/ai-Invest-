from services.dlp import DLPScanner
from core.llm_tier import tiered_generate

dlp = DLPScanner()

class CompanyAgent:
    def __init__(self, role, goal, backstory, dept):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.dept = dept

    async def execute_task(self, task):
        if not dlp.scan(task):
            raise ValueError("DLP violation - PII detected")
        result = await tiered_generate(task)
        return result

# 20-25 person company (autonomous, compliant)
agents = [
    CompanyAgent("CEO", "Strategic decisions, oversight", "Experienced leader", "executive"),
    CompanyAgent("CFO", "Financial planning, audits", "Finance expert, HIPAA compliant budgeting", "finance"),
    CompanyAgent("CTO", "Tech strategy, ML integration", "AI/ML specialist, gov security standards", "it"),
    CompanyAgent("COO", "Operations efficiency", "Process optimizer", "ops"),
    # Sales (5)
    CompanyAgent("Sales Lead", "Lead gen, deals", "B2B sales pro", "sales"),
    CompanyAgent("Sales Rep 1", "Client outreach", "Relationship builder", "sales"),
    CompanyAgent("Sales Rep 2", "Negotiation", "Closer", "sales"),
    CompanyAgent("Sales Rep 3", "Market analysis", "Analyst", "sales"),
    CompanyAgent("Sales Rep 4", "CRM management", "Data handler, HIPAA safe", "sales"),
    # Legal (3)
    CompanyAgent("General Counsel", "Contracts, compliance", "JD, HIPAA/gov expert", "legal"),
    CompanyAgent("Compliance Officer", "Audits, regs", "Certified in HIPAA/SOC2", "legal"),
    CompanyAgent("Litigation Specialist", "Disputes", "Trial lawyer", "legal"),
    # Real Estate (3, WA law experts)
    CompanyAgent("Real Estate Lead", "Property acquisitions, WA zoning", "WA bar certified, commercial real estate", "real_estate"),
    CompanyAgent("Real Estate Attorney 1", "Title searches, contracts", "WA real estate law specialist", "real_estate"),
    CompanyAgent("Real Estate Attorney 2", "Leases, compliance", "HIPAA for healthcare properties", "real_estate"),
    # Others to 20-25 (HR, Support, etc.)
    CompanyAgent("HR Director", "Talent, training", "Employee compliance", "hr"),
    CompanyAgent("HR Specialist 1", "Recruiting", "Diversity expert", "hr"),
    CompanyAgent("Customer Support Lead", "Issue resolution", "24/7 compliant", "support"),
    CompanyAgent("Support Agent 1", "Ticketing", "HIPAA data handling", "support"),
    CompanyAgent("Support Agent 2", "Escalations", "Gov reporting", "support"),
    CompanyAgent("Ops Manager", "Supply chain", "Efficiency", "ops"),
    CompanyAgent("Ops Analyst", "Data ops", "ML for optimization", "ops"),
    CompanyAgent("Marketing Lead", "Campaigns", "Branding", "marketing"),
    CompanyAgent("Content Creator", "Materials", "Compliant messaging", "marketing"),
]

def get_agents_by_dept(dept):
    return [a for a in agents if a.dept == dept]