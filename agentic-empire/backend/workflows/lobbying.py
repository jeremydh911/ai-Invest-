from crewai import Agent, Task, Crew, Process
from core.llm_tier import tiered_generate

async def lobbying_workflow(prompt: str):
    agents = [  # Trimmed for efficiency
        Agent(role="Researcher", goal="Research", backstory="Policy expert", llm_call=tiered_generate),  # Connected to tier
        Agent(role="Drafter", goal="Draft", backstory="Advocacy writer"),
    ]
    tasks = [
        Task(description=prompt, agent=agents[0]),
        Task(description="Draft based on research", agent=agents[1]),
    ]
    crew = Crew(agents=agents, tasks=tasks, process=Process.hierarchical)
    result = await crew.kickoff_async()
    # Connect to audit DB (CPU)
    # ... Log to db.py
    return result