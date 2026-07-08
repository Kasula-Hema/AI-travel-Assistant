from travelagent import TravelAgent
import os
from dotenv import load_dotenv

load_dotenv()

agent = TravelAgent(
    mistral_key=os.getenv("MISTRAL_API_KEY"),
    serpapi_key=os.getenv("SERPAPI_API_KEY")
)

result = agent.generate_trip(
    departure_location="Tokyo",
    destination="Kyoto",
    num_days=3,
    start_date="2026-10-10",
    end_date="2026-10-13",
    travelers=2,
    travel_theme="Cultural",
    budget_type="total",
    budget_value=15000,
    flexible_dates=False,
    preferred_season="Autumn",
    companion_type="Couple",
    accommodation_type="Hotel",
    dietary_preference="No Preference",
    weather_preference="Sunny",
    additional_requirements="Prefer quiet and scenic paths.",
    activity_preferences="Temples, Gardens, Traditional food",
)

print(result)