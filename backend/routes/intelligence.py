"""
Weather Intelligence API Routes
Provides structured endpoints for Weather Score, Best Time Activities,
Weather Shifts, Smart Decisions, Briefings, Commute, and Travel.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from ..intelligence import (
    calculate_weather_score,
    score_activities,
    score_custom_activity,
    detect_weather_shifts,
    compare_forecasts,
    generate_what_should_i_do,
    evaluate_decision_cards,
    evaluate_commute,
    generate_packing_list,
    evaluate_stargazing,
    evaluate_photography,
    generate_weather_brief,
    generate_weather_story
)

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


class WeatherScoreRequest(BaseModel):
    temperature: float
    apparent_temp: Optional[float] = None
    humidity: Optional[float] = 50.0
    precipitation_prob: Optional[float] = 0.0
    wind_speed: Optional[float] = 10.0
    uv_index: Optional[float] = 3.0
    aqi: Optional[float] = 30.0
    cloud_cover: Optional[float] = 20.0
    profile: Optional[str] = "general"


class ActivityScoreRequest(BaseModel):
    hourly_data: List[Dict[str, Any]]
    activity: Optional[str] = "running"


class CustomActivityRequest(BaseModel):
    hourly_data: List[Dict[str, Any]]
    activity_name: str
    weights: Dict[str, int] = Field(default_factory=dict)
    preferred_temp: Optional[float] = 20.0


class ShiftRequest(BaseModel):
    hourly_data: List[Dict[str, Any]]


class CompareRequest(BaseModel):
    current_forecast: Dict[str, Any]
    cached_forecast: Optional[Dict[str, Any]] = None


class DecisionRequest(BaseModel):
    current_data: Dict[str, Any]
    daily_data: Optional[Dict[str, Any]] = None
    hourly_data: Optional[List[Dict[str, Any]]] = None


class CommuteRequest(BaseModel):
    hourly_data: List[Dict[str, Any]]
    departure_hour: Optional[int] = 8
    return_hour: Optional[int] = 18
    transport_mode: Optional[str] = "transit"


class TravelRequest(BaseModel):
    daily_data: Dict[str, Any]
    packing_mode: Optional[str] = "balanced"


@router.post("/score")
async def get_weather_score(req: WeatherScoreRequest):
    return calculate_weather_score(
        temperature=req.temperature,
        apparent_temp=req.apparent_temp,
        humidity=req.humidity,
        precipitation_prob=req.precipitation_prob,
        wind_speed=req.wind_speed,
        uv_index=req.uv_index,
        aqi=req.aqi,
        cloud_cover=req.cloud_cover,
        profile=req.profile or "general"
    )


@router.post("/activities")
async def get_activity_scores(req: ActivityScoreRequest):
    return score_activities(req.hourly_data, req.activity or "running")


@router.post("/custom-activity")
async def get_custom_activity_scores(req: CustomActivityRequest):
    return score_custom_activity(
        hourly_data=req.hourly_data,
        activity_name=req.activity_name,
        weights=req.weights,
        preferred_temp=req.preferred_temp or 20.0
    )


@router.post("/shift")
async def get_weather_shifts(req: ShiftRequest):
    return {"shifts": detect_weather_shifts(req.hourly_data)}


@router.post("/compare")
async def get_forecast_comparison(req: CompareRequest):
    return compare_forecasts(req.current_forecast, req.cached_forecast)


@router.post("/what-should-i-do")
async def get_recommendation(req: DecisionRequest):
    return generate_what_should_i_do(req.current_data, req.hourly_data or [])


@router.post("/decisions")
async def get_decisions(req: DecisionRequest):
    return {"decisions": evaluate_decision_cards(req.current_data, req.daily_data, req.hourly_data)}


@router.post("/commute")
async def get_commute_analysis(req: CommuteRequest):
    return evaluate_commute(req.hourly_data, req.departure_hour or 8, req.return_hour or 18, req.transport_mode or "transit")


@router.post("/packing")
async def get_travel_packing(req: TravelRequest):
    return generate_packing_list(req.daily_data, req.packing_mode or "balanced")
