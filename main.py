from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import TravelRequest, TripChatRequest, TransportRequest
from travelagent import TravelAgent
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = TravelAgent(
    mistral_key=os.getenv("MISTRAL_API_KEY"),
    serpapi_key=os.getenv("SERPAPI_API_KEY")
)


@app.get("/")
async def root():
    return {"status": "success", "message": "AI Travel Assistant Backend is running!"}


@app.post("/generate-plan")
async def generate_plan(request: TravelRequest):
    try:
        activity_prefs = request.interests
        if isinstance(activity_prefs, list):
            activity_prefs = ", ".join(activity_prefs)
        elif activity_prefs is None:
            activity_prefs = ""

        result = agent.generate_trip(
            departure_location=request.departureLocation or "Not specified",
            destination=request.destination,
            num_days=request.days,
            start_date=request.startDate or request.departureDate or "Not fixed",
            end_date=request.endDate or "Not fixed",
            travelers=request.travelers or 1,
            travel_theme=request.travelStyle,
            budget_type=request.budgetType,
            budget_value=request.totalBudget or request.budgetValue or 0,
            flexible_dates=request.flexibleDates,
            preferred_season=request.preferredSeason,
            companion_type=request.companionType,
            accommodation_type=request.accommodationType,
            dietary_preference=request.dietaryPreference,
            weather_preference=request.weatherPreference,
            additional_requirements=request.additionalRequirements or "",
            activity_preferences=activity_prefs,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat-trip")
async def chat_trip(request: TripChatRequest):
    try:
        return agent.update_trip(
            message=request.message,
            current_trip=request.currentTrip,
            destination=request.destination or "",
            user_preferences=request.userPreferences or "",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def format_inr(val):
    return f"₹{int(val):,}"


@app.post("/estimate-transport")
async def estimate_transport(request: TransportRequest):
    try:
        departure = request.departureLocation.strip()
        destination = request.destination.strip()
        days = request.days
        total_budget = request.totalBudget

        if not departure or not destination:
            raise ValueError("Departure and destination are required")

        route_weight = max(2, min(12, round((len(departure) + len(destination)) / 2)))
        budget_pressure = 'tight' if total_budget < 1800 else ('flexible' if total_budget > 5000 else 'balanced')

        flight_price = 2600 + route_weight * 240
        train_price = 520 + route_weight * 85
        bus_price = 650 + route_weight * 95
        drive_price = 1900 + route_weight * 180
        taxi_price = 3200 + route_weight * 260
        metro_price = 80 + route_weight * 12

        options = [
            {
                "id": "train-metro",
                "mode": "Train + Metro",
                "primaryMode": "Train",
                "price": int(train_price + metro_price),
                "duration": f"{max(6, route_weight + 3)}h {'30m' if route_weight % 2 else '10m'}",
                "comfort": "4/5",
                "transfers": 1,
                "badge": "Recommended",
                "explanation": f"Choosing the train keeps the trip comfortable and saves {format_inr(max(0, flight_price - train_price))} compared to flying.",
                "pros": ["Best value", "City-center arrival"],
                "cons": ["Longer travel time"],
            },
            {
                "id": "flight-taxi",
                "mode": "Flight + Taxi",
                "primaryMode": "Flight",
                "price": int(flight_price + round(taxi_price * 0.18)),
                "duration": f"{max(1, round(route_weight / 4))}h {20 + route_weight * 3}m",
                "comfort": "5/5",
                "transfers": 1,
                "badge": "Fastest",
                "explanation": "Best when saving time matters more than preserving the activity or hotel budget.",
                "pros": ["Shortest journey", "Low fatigue"],
                "cons": ["Higher fare"],
            },
            {
                "id": "bus-local",
                "mode": "Bus + Local Bus",
                "primaryMode": "Bus",
                "price": int(bus_price),
                "duration": f"{max(8, route_weight + 5)}h",
                "comfort": "3/5",
                "transfers": 1,
                "badge": "Budget",
                "explanation": "A practical low-cost route if you are comfortable with a slower overnight journey.",
                "pros": ["Lowest upfront cost", "Overnight option"],
                "cons": ["Less comfortable"],
            },
            {
                "id": "self-drive",
                "mode": "Self Drive",
                "primaryMode": "Self Drive",
                "price": int(drive_price),
                "duration": f"{max(5, route_weight + 2)}h",
                "comfort": "3.5/5",
                "transfers": 0,
                "badge": "Flexible",
                "explanation": "Useful when you want scenic stops and control over the route.",
                "pros": ["Flexible stops", "Good for groups"],
                "cons": ["Driving fatigue"],
            }
        ]

        # Filter by budget pressure
        available_options = [opt for opt in options if opt["primaryMode"] != "Taxi"] if budget_pressure == "tight" else options

        # Verify no incomplete options or forbidden placeholders
        forbidden_placeholders = ["checked by ai", "route dependent", "compared in result"]
        cleaned_options = []
        for opt in available_options:
            is_complete = True
            for k, v in opt.items():
                if v is None or v == "":
                    is_complete = False
                    break
                if isinstance(v, str):
                    v_lower = v.lower()
                    if any(placeholder in v_lower for placeholder in forbidden_placeholders):
                        is_complete = False
                        break
                elif isinstance(v, list):
                    if any(isinstance(x, str) and any(placeholder in x.lower() for placeholder in forbidden_placeholders) for x in v):
                        is_complete = False
                        break
            if is_complete:
                cleaned_options.append(opt)

        if not cleaned_options:
            return {"status": "unavailable"}

        # Choose recommended
        recommended = cleaned_options[0]
        if budget_pressure == "flexible" and days <= 3:
            flight_opt = next((opt for opt in cleaned_options if opt["id"] == "flight-taxi"), None)
            if flight_opt:
                recommended = flight_opt

        others = [opt for opt in cleaned_options if opt["id"] != recommended["id"]]

        # AI Insights
        savings_pct = max(5, round((flight_price - recommended["price"]) / max(total_budget, 1) * 100))
        insights = [
            f"{recommended['mode']} protects more of your trip budget for hotels, food, and experiences.",
            f"Compared with the fastest option, this recommendation can preserve about {savings_pct}% of your total budget.",
            "Flight is still worth choosing when minimizing travel time is the top priority."
        ]

        # Transport Combinations
        combinations = []
        for opt in cleaned_options:
            combinations.append({
                "id": opt["id"],
                "mode": opt["mode"],
                "price": opt["price"],
                "duration": opt["duration"]
            })

        return {
            "status": "ready",
            "recommended": recommended,
            "others": others,
            "insights": insights,
            "combinations": combinations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

