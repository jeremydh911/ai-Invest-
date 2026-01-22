from .base import BaseAgent

class LobbyingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Lobbying Specialist",
            goal="Advocate for policies effectively",
            backstory="Experienced in policy advocacy and stakeholder engagement."
        )

    async def perform_task(self, task: str):
        prompt = f"As a lobbying specialist, {task}"
        return await self.generate_response(prompt)