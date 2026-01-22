from abc import ABC, abstractmethod
from core.llm_tier import tiered_generate

class BaseAgent(ABC):
    def __init__(self, role: str, goal: str, backstory: str):
        self.role = role
        self.goal = goal
        self.backstory = backstory

    @abstractmethod
    async def perform_task(self, task: str):
        pass

    async def generate_response(self, prompt: str):
        return await tiered_generate(prompt)