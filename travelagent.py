import json

from resercher import create_researcher, run_research
from planner import create_planner, run_planner
from hotel import create_hotel_agent, run_hotel_search


class TravelAgent:

    def __init__(self, mistral_key, serpapi_key):

        self.researcher = create_researcher(
            mistral_key,
            serpapi_key
        )

        self.planner = create_planner(
            mistral_key
        )

        self.hotel = create_hotel_agent(
            mistral_key,
            serpapi_key
        )

    def generate_trip(
        self,
        departure_location,
        destination,
        num_days,
        start_date,
        end_date,
        travelers,
        travel_theme,
        budget_type,
        budget_value,
        flexible_dates,
        preferred_season,
        companion_type,
        accommodation_type,
        dietary_preference,
        weather_preference,
        additional_requirements,
        activity_preferences,
    ):
        budget_str = f"₹{budget_value}/day (Daily)" if budget_type == "daily" else f"₹{budget_value} total"
        flex_str = "Yes" if flexible_dates else "No"

        research_prompt = (
            f"Research current travel planning data for a trip from {departure_location} to {destination} "
            f"for a {num_days}-day {travel_theme.lower()} trip.\n"
            f"Travel Details:\n"
            f"- Start Date: {start_date}\n"
            f"- End Date: {end_date}\n"
            f"- Travelers: {travelers}\n"
            f"- Companion Profile: {companion_type}\n"
            f"- Preferred Season: {preferred_season}\n"
            f"- Weather Preference: {weather_preference}\n"
            f"- Traveler Interests: {activity_preferences}\n"
            f"- Additional Requirements: {additional_requirements}\n"
            f"- Flexible dates: {flex_str}\n\n"
            "Find, when available from search results: transport options and price ranges for flight/train/bus/self drive/taxi/metro, "
            "weather forecast clues, current offers/coupons, top attractions, hidden gems, local markets, cafes, food spots, and safety notes. "
            "If reliable live data is unavailable for a category, explicitly say so."
        )

        research = run_research(
            self.researcher,
            research_prompt
        )

        hotel_prompt = (
            f"Find top-rated accommodation and dining spots in {destination}.\n"
            f"Preferences:\n"
            f"- Accommodation Style: {accommodation_type}\n"
            f"- Dietary Restriction/Preference: {dietary_preference}\n"
            f"- Budget Level: {budget_str}\n"
            f"- Traveling Group: {companion_type}\n"
            f"- Travelers: {travelers}\n"
            f"- Additional Requirements: {additional_requirements}\n\n"
            "Return only options that can be linked. If current rates are not available, say 'Live rate unavailable' rather than guessing."
        )

        hotels = run_hotel_search(
            self.hotel,
            hotel_prompt
        )

        planner_prompt = (
            f"Create a premium AI travel plan for a {num_days}-day trip from {departure_location} to {destination}.\n"
            f"User Preferences:\n"
            f"- Start Date: {start_date}\n"
            f"- End Date: {end_date}\n"
            f"- Travelers: {travelers}\n"
            f"- Theme: {travel_theme}\n"
            f"- Companion Profile: {companion_type}\n"
            f"- Budget Plan: {budget_str}\n"
            f"- Accommodation Style: {accommodation_type}\n"
            f"- Dietary Preference: {dietary_preference}\n"
            f"- Weather Preference: {weather_preference}\n"
            f"- Additional Requirements: {additional_requirements}\n"
            f"- Interests: {activity_preferences}\n\n"
            "Required Output Sections:\n"
            "1. Trip Snapshot\n"
            "2. Multi-Modal Transport Comparison with cards-style bullets for Flight, Train, Bus, Self Drive, Taxi, Metro where applicable. Include price, duration, comfort, transfers, advantages, disadvantages. Use 'Live data unavailable' for missing values.\n"
            "3. AI Budget Optimizer comparing combinations like Flight + Taxi + Hotel, Train + Metro + Hotel, Bus + Walk + Hostel, Flight + Rental Vehicle, and Train + Local Bus.\n"
            "4. Recommended Options: Best Budget, Best Value, Fastest, Luxury, with why each was chosen.\n"
            "5. Offers: flights, trains, buses, hotels, rental vehicles, coupons, promo codes. Do not invent offers.\n"
            "6. Weather Intelligence with travel advice and clothing recommendations.\n"
            "7. Interactive Budget Breakdown: transport, accommodation, food, activities, shopping, emergency buffer, taxes, remaining budget, savings.\n"
            "8. Day-by-Day Timeline Itinerary with maps route links.\n"
            "9. Hidden Gems separated from tourist attractions.\n"
            "10. Smart Packing Checklist using markdown checkboxes.\n"
            "11. AI Suggestions that are personalized and data-driven.\n\n"
            f"Research Data:\n{research.content}\n\n"
            f"Hotel & Dining Options:\n{hotels.content}"
        )

        itinerary = run_planner(
            self.planner,
            planner_prompt
        )

        return {
            "research": research.content,
            "hotels": hotels.content,
            "itinerary": itinerary.content
        }

    def update_trip(self, message, current_trip, destination, user_preferences):
        chat_prompt = (
            "You are editing an existing AI travel plan based on a user chat request.\n"
            "Modify only the relevant sections and keep unchanged sections stable. "
            "Do not regenerate the entire plan unless the user explicitly requests a full rebuild. "
            "Keep all places, hotels, restaurants, and maps as clickable markdown links.\n\n"
            f"Destination: {destination}\n"
            f"User Preferences: {user_preferences}\n"
            f"User Request: {message}\n\n"
            f"Current Trip Plan:\n{current_trip}\n\n"
            "Return the updated travel plan in markdown."
        )
        updated = run_planner(self.planner, chat_prompt)
        return {"itinerary": updated.content}
