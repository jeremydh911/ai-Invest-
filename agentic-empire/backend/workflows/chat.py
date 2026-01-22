from core.llm_tier import tiered_generate

async def chat_workflow(prompt: str, dept: str):
    result = await tiered_generate(f"{dept}: {prompt}")
    return result