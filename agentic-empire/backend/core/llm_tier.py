from ollama_service import OllamaService
from config import SMALL_LLM_MODEL, LARGE_LLM_MODEL

ollama_svc = OllamaService()

async def tiered_generate(prompt: str):
    token_est = len(prompt) // 4  # Rough estimate
    model = LARGE_LLM_MODEL if token_est > 500 else SMALL_LLM_MODEL
    device_priority = 'gpu' if token_est > 500 else 'cpu'  # Heavy to GPU
    return await ollama_svc.generate(prompt, gpu_priority=(device_priority == 'gpu'))