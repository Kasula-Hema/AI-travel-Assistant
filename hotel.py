from agno.agent import Agent
from agno.tools.serpapi import SerpApiTools
from agno.models.mistral import MistralChat


def create_hotel_agent(mistral_key, serpapi_key):

    return Agent(
        name="Hotel & Restaurant Finder",
        instructions=[
            "Analyze user's target destination, traveling group type, and budget plan.",
            "Search for accommodations matching the preferred style (e.g. Airbnb, Hostel, Resort, or Hotel).",
            "Search for highly rated restaurants that strictly accommodate the user's dietary preferences (e.g. Vegetarian, Vegan, Halal, Gluten Free).",
            "You MUST output all recommended accommodations and dining spots as clickable Markdown links (e.g., [Hotel Grand](https://www.google.com/search?q=...) or maps links). Never output simple text lists without active links.",
            "Ensure the choices match the daily or total budget limit specified."
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


def run_hotel_search(agent, prompt):
    return agent.run(prompt, stream=False)