import os

# JWT Secret
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

# LLM Models
SMALL_LLM_MODEL = os.getenv("SMALL_LLM_MODEL", "llama2:7b")
LARGE_LLM_MODEL = os.getenv("LARGE_LLM_MODEL", "llama2:13b")

# Ollama Host
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/agentic_empire")

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")