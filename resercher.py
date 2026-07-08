from agno.agent import Agent
from agno.tools.serpapi import SerpApiTools
from agno.models.mistral import MistralChat


def create_researcher(mistral_key, serpapi_key):

    return Agent(
        name="Researcher",
        instructions=[
            "Identify the travel destination specified by the user.",
            "Gather detailed information on the destination, including climate, culture, and safety tips.",
            "Find popular attractions, landmarks, and must-visit places.",
            "Search for activities that match the user’s interests and travel style.",
            "Prioritize information from reliable sources and official travel guides.",
            "Provide well-structured summaries with key insights and recommendations."
        ],
        model=MistralChat(
            id="mistral-large-latest",
            api_key=mistral_key
        ),
        tools=[
            SerpApiTools(api_key=serpapi_key)
        ],
        add_datetime_to_context=True,
    )


def run_research(agent, prompt):
    return agent.run(prompt, stream=False)