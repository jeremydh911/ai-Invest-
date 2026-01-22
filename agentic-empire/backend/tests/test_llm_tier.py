import pytest
from core.llm_tier import tiered_generate

@pytest.mark.asyncio
async def test_tiered_generate_small_prompt():
    prompt = "Hello"
    response = await tiered_generate(prompt)
    assert isinstance(response, str)
    # Check that small model is used (mock needed for full test)

@pytest.mark.asyncio
async def test_tiered_generate_large_prompt():
    prompt = "A" * 2000  # Large prompt
    response = await tiered_generate(prompt)
    assert isinstance(response, str)
    # Check that large model and GPU priority are used