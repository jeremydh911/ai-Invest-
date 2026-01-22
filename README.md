# Agentic Empire (formerly Aloha-Bot-Company)

Multi-container “agent ops” scaffold for running an enterprise-style team of agents (CEO, CFO/Finance, HR, Legal, IT, etc.), optimized for high-performance hardware (AMD 9900X + RTX 5090).

## 🚀 Quick Start

1. Start here: **[00_START_HERE.md](./00_START_HERE.md)**
2. Explore documenation: **[docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)**

## 🏗️ Architecture

This project follows a **Hybrid Stack** architecture:
- **Node.js/Express (`opt/Agentic Empire/`)**: Traffic Controller, UI delivery, and Real-time Tickers.
- **Python/FastAPI (`agentic-empire/`)**: Cognitive Engine, Complex Workflows (CrewAI), and LLM Tiering.

## 📁 Documentation Hierarchy

- **[docs/architecture/](./docs/architecture/)**: System design, diagrams, and API references.
- **[docs/implementation/](./docs/implementation/)**: Technical guides, deployment steps, and feature details.
- **[docs/checklists/](./docs/checklists/)**: Deliverables, deployment status, and project summaries.

## 🛠️ Developer Workflows

- **Deployment**: Use `deploy.sh` (Ubuntu) or `deploy-windows.ps1` (Windows).
- **Inter-Service Communication**: Node.js services call Python API endpoints for AI tasks.
- **Hardware Optimization**: Code is tuned for local Ollama inference on RTX 5090.

## Templates

- `policy/master_instructions.template.md`

## Notes

- This repository is meant to hold process/templates; it is not coupled to any one backend implementation.
