from typing import List, Optional, Union
from pydantic import BaseModel


class TravelRequest(BaseModel):
    departureLocation: Optional[str] = None
    destination: str
    days: int
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    travelers: Optional[int] = 1
    totalBudget: Optional[float] = None
    travelStyle: str
    budgetType: Optional[str] = "total"
    budgetValue: Optional[float] = None
    departureDate: Optional[str] = None
    flexibleDates: Optional[bool] = False
    preferredSeason: Optional[str] = "No Preference"
    companionType: Optional[str] = "Solo"
    accommodationType: Optional[str] = "Hotel"
    dietaryPreference: Optional[str] = "No Preference"
    weatherPreference: Optional[str] = "Doesn't Matter"
    additionalRequirements: Optional[str] = None
    interests: Optional[Union[List[str], str]] = None


class TripChatRequest(BaseModel):
    message: str
    currentTrip: str
    destination: Optional[str] = None
    userPreferences: Optional[str] = None


class TransportRequest(BaseModel):
    departureLocation: str
    destination: str
    days: int
    totalBudget: float

