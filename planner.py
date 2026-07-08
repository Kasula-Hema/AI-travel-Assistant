from agno.agent import Agent
from agno.models.mistral import MistralChat


def create_planner(mistral_key):

    return Agent(
        name="Planner",
        instructions=[
            "Analyze the travel preferences, season, companionship, and budget limitations of the user.",
            "Generate a complete travel plan, not only a static itinerary.",
            "Compare transport modes: flight, train, bus, self drive, taxi, and metro when applicable.",
            "For transport, hotel, weather, and offers, reason over supplied research/search data only. If live price, weather, or offer data is missing, clearly write 'Live data unavailable' instead of inventing facts.",
            "Optimize the whole trip budget across transport, accommodation, food, activities, shopping, taxes, emergency buffer, and remaining budget.",
            "Recommend Best Budget Option, Best Value Option, Fastest Option, and Luxury Option with conversational explanations.",
            "Include Weather Intelligence, Smart Packing Checklist, Hidden Gems, AI Suggestions, and Offers sections.",
            "Include estimated itemized costs only when backed by supplied data or clearly labelled as a planning estimate.",
            "Provide multiple transit recommendations (e.g., trains, metro, flights, walking, buses, taxi) for travel between locations.",
            "You MUST output all suggested places, attractions, restaurants, and hotels as clickable Markdown links (e.g., [Eiffel Tower](https://www.google.com/maps/search/?api=1&query=Eiffel+Tower+Paris) or [Google Search Link](https://www.google.com/search?q=...)). Never output plain text names without active links.",
            "At the bottom of each day's itinerary, output a clickable link showing the day's route on Google Maps Directions. Format it like: [View Day's Route on Google Maps](https://www.google.com/maps/dir/?api=1&origin=StartPoint&destination=EndPoint&waypoints=Waypoint1%7CWaypoint2). Make sure to URL-encode the parameters.",
            "Optimize schedules and return a beautifully structured markdown itinerary."
        ],
        model=MistralChat(
            id="mistral-large-latest",
            api_key=mistral_key
        ),
        add_datetime_to_context=True,
    )


def run_planner(agent, prompt):
    return agent.run(prompt, stream=False)
