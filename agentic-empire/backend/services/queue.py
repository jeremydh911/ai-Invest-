from celery import Celery
from config import REDIS_URL
from core.llm_tier import tiered_generate

app = Celery('agentic_empire', broker=REDIS_URL, backend=REDIS_URL)

@app.task(queue='gpu_queue')  # Heavy
def heavy_task(prompt: str):
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(tiered_generate(prompt))
    return result

@app.task(queue='cpu_queue')  # Light
def light_task(prompt: str):
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(tiered_generate(prompt))
    return result