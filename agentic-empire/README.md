# Agentic Empire

A scalable, AI-powered backend for multi-agent workflows, built with FastAPI, Ollama, and Celery.

## Features

- **Tiered LLM Dispatch**: Automatically routes tasks to small/large models based on complexity, prioritizing GPU/CPU.
- **Multi-Agent Workflows**: Department-specific agents (e.g., lobbying, IT) using CrewAI.
- **Authentication & Authorization**: JWT-based auth with RBAC.
- **Task Queuing**: Celery with Redis for balanced heavy/light tasks.
- **Database & Auditing**: PostgreSQL with SQLAlchemy for data persistence and audit logs.
- **Monitoring**: Prometheus integration.
- **Voice Support**: WebSocket endpoints for voice chat with STT/TTS placeholders.
- **Security**: Vault for secrets, encryption utilities.

## Setup

1. **Clone/Download** the project.

2. **Environment**:
   - Copy `.env.example` to `.env` and fill in secrets.
   - Ensure Docker and Docker Compose are installed.

3. **Build and Run**:
   ```bash
   cd agentic-empire/deploy
   docker-compose up --build
   ```

4. **Access**:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Prometheus: http://localhost:9090
   - Vault: http://localhost:8200

## Development

- **Install Dependencies** (local):
  ```bash
  cd backend
  pip install -r requirements.txt
  ```

- **Run Locally**:
  ```bash
  uvicorn api.main:app --reload
  ```

- **Run Celery Worker**:
  ```bash
  celery -A services.queue worker --loglevel=info
  ```

- **Run Tests**:
  ```bash
  pytest tests/
  ```

## API Endpoints

- `POST /token`: Login
- `GET /api/health`: Health check
- `POST /api/execute`: Execute tasks with workflows
- `POST /api/generate`: Direct LLM generation
- `WS /ws/voice-chat`: Voice chat

## Architecture

- **Core**: Config, auth, encryption, LLM tiering
- **Services**: Ollama, DB, queue
- **API**: Routes and WebSockets
- **Agents**: Base and department-specific
- **Workflows**: Connected agent processes
- **Deploy**: Docker Compose for full stack

## Security

- Use Vault for secrets.
- Audit logs in DB.
- FIPS-compliant encryption (placeholder).

## Frontend

A React-based dashboard is included in `frontend/index.html`. Open it in a browser to access the login and quick actions interface.

It integrates with the backend API for authentication and can be extended for full functionality.

## License

MIT