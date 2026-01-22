from .base import BaseAgent

class ITAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="IT Specialist",
            goal="Solve technical issues efficiently",
            backstory="Expert in software development and system administration."
        )

    async def perform_task(self, task: str):
        prompt = f"As an IT specialist, {task}"
        return await self.generate_response(prompt)