# Copilot Instructions for Agentic Empire (formerly LucaExpress)

## 🏗️ Hybrid Architecture Strategy (MANDATORY)
This project follows a **Hybrid Stack** architecture to optimize for both real-time performance and advanced AI capabilities:

1.  **Node.js/Express (`opt/Agentic Empire/`)**: The "Traffic Controller".
    - **Responsibilities**: UI delivery (Dashboards), Authentication, Multi-tenant Isolation, Real-time Tickers (WebSockets), and User Database Management (`registry.db`).
    - **Patterns**: Use `services/company-db.js` for company-specific data isolation.
2.  **Python/FastAPI (`agentic-empire/`)**: The "Cognitive Engine".
    - **Responsibilities**: Complex Agentic Workflows (CrewAI), LLM Tiering, Data Loss Prevention (DLP), and CPU/GPU-intensive background tasks.
    - **Patterns**: Use `core/llm_tier.py` for model routing and `core/dlp.py` for content safety.

## 📜 Core Coding Standards
- **1000-Line Rule**: No file shall exceed 1000 lines of executable code.
- **File Splitting**: Split oversized files by logical domain (e.g., `services-db.js`, `services-auth.js`) and re-export via `index.js` or `index.py`.
- **Data Persistence**: Both stacks share access to company-scoped SQLite databases located in `opt/Agentic Empire/data/companies/app-company-{id}.db`.

## 🛠️ Developer Workflows
- **Deployment**: Use `deploy.sh` (Ubuntu) or `deploy-windows.ps1` (Windows). These scripts handle both Node.js (PM2) and Python (Ollama/FastAPI) setup.
- **Inter-Service Communication**: Node.js services should call Python API endpoints (usually on port 8000) for "thinking" tasks, while Python handles the AI heavy lifting.
- **Hardware Optimization**: Code is tuned for **AMD 9900X + RTX 5090**. Prefer local Ollama inference where possible to minimize latency.

## 🔗 Key Integration Patterns
- **LLM Tiering**: Route simple tasks to local models (Ollama) and complex reasoning to large/cloud models.
- **Isolation**: Always verify `company_id` from the JWT before performing DB operations to ensure zero data-leak between companies.

## 📂 Reference Points
- [MASTER_PROGRAMMING_GUIDE.md](MASTER_PROGRAMMING_GUIDE.md): Detailed splitting and performance rules.
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md): Service boundaries and network diagrams.
- [opt/Agentic Empire/services/company-db.js](opt/Agentic%20Empire/services/company-db.js): Reference for multi-company isolation logic.
- [agentic-empire/backend/core/llm_tier.py](agentic-empire/backend/core/llm_tier.py): Reference for AI model orchestration.
