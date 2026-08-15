import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.intelligence import (
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
    parse_natural_query
)

@pytest.mark.asyncio
async def test_weather_score_calculation():
    # Ideal weather
    res = calculate_weather_score(
        temperature=21.0, apparent_temp=21.0, humidity=50.0,
        precipitation_prob=0.0, wind_speed=10.0, uv_index=3.0, aqi=25.0
    )
    assert res["score"] >= 90
    assert res["verdict"] == "Excellent"

    # Extreme heat and storm
    res_bad = calculate_weather_score(
        temperature=42.0, apparent_temp=48.0, humidity=90.0,
        precipitation_prob=90.0, precipitation_amount=15.0,
        wind_speed=45.0, wind_gust=70.0, uv_index=11.0, aqi=220.0
    )
    assert res_bad["score"] <= 30
    assert "reasons" in res_bad


@pytest.mark.asyncio
async def test_score_profiles():
    # Running in cool vs hot
    cool_run = calculate_weather_score(temperature=14.0, apparent_temp=14.0, profile="running")
    hot_run = calculate_weather_score(temperature=35.0, apparent_temp=38.0, profile="running")
    assert cool_run["score"] > hot_run["score"]


@pytest.mark.asyncio
async def test_activity_engine_hourly():
    hourly_mock = [
        {"time": "06:00 AM", "temperature": 16.0, "precipitation_prob": 0.0, "wind_speed": 8.0, "is_day": 1, "aqi": 30.0, "uv_index": 1.0},
        {"time": "07:00 AM", "temperature": 18.0, "precipitation_prob": 5.0, "wind_speed": 10.0, "is_day": 1, "aqi": 28.0, "uv_index": 2.0},
        {"time": "02:00 PM", "temperature": 34.0, "precipitation_prob": 75.0, "wind_speed": 28.0, "is_day": 1, "aqi": 95.0, "uv_index": 9.0},
    ]
    res = score_activities(hourly_mock, "running")
    assert res["best_window"]["time"] in ["06:00 AM", "07:00 AM"]
    assert res["avoid_window"]["time"] == "02:00 PM"


@pytest.mark.asyncio
async def test_custom_activity_builder():
    hourly_mock = [
        {"time": "08:00 AM", "temperature": 20.0, "precipitation_prob": 0.0, "wind_speed": 10.0, "aqi": 30.0, "uv_index": 2.0},
        {"time": "01:00 PM", "temperature": 32.0, "precipitation_prob": 80.0, "wind_speed": 30.0, "aqi": 110.0, "uv_index": 8.0}
    ]
    weights = {"temperature": 4, "rain": 5, "wind": 3, "aqi": 2, "uv": 3}
    res = score_custom_activity(hourly_mock, "College Commute", weights, preferred_temp=20.0)
    assert res["best_window"]["time"] == "08:00 AM"
    assert res["avoid_window"]["time"] == "01:00 PM"


@pytest.mark.asyncio
async def test_weather_shift_detection():
    hourly_mock = [
        {"time": "02:00 PM", "precipitation_prob": 10.0, "temperature": 25.0, "wind_speed": 10.0, "aqi": 30.0},
        {"time": "04:00 PM", "precipitation_prob": 75.0, "temperature": 18.0, "wind_speed": 40.0, "wind_gust": 55.0, "aqi": 35.0}
    ]
    shifts = detect_weather_shifts(hourly_mock)
    assert len(shifts) >= 1
    shift_types = [s["type"] for s in shifts]
    assert "rain_surge" in shift_types or "temp_drop" in shift_types


@pytest.mark.asyncio
async def test_forecast_comparison():
    cur = {"current": {"temperature_2m": 24.0, "precipitation": 5.0, "wind_speed_10m": 18.0}}
    old = {"current": {"temperature_2m": 21.0, "precipitation": 0.0, "wind_speed_10m": 10.0}}
    res = compare_forecasts(cur, old)
    assert res["has_comparison"] is True
    assert "+3.0°C" in res["deltas"]["temperature"]["delta"]


@pytest.mark.asyncio
async def test_decision_cards():
    current_data = {
        "temperature_2m": 12.0,
        "apparent_temperature": 10.0,
        "precipitation_probability": 80.0,
        "wind_speed_10m": 35.0,
        "uv_index": 2.0,
        "aqi": 40.0,
        "cloud_cover": 85.0
    }
    cards = evaluate_decision_cards(current_data)
    card_map = {c["id"]: c["verdict"] for c in cards}
    assert card_map["umbrella"] == "YES"
    assert card_map["jacket"] == "YES"
    assert card_map["beach"] == "NO"


@pytest.mark.asyncio
async def test_nlp_parser():
    p1 = parse_natural_query("compare Pune and Mumbai")
    assert p1["intent"] == "compare"
    assert p1["city_1"] == "Pune"
    assert p1["city_2"] == "Mumbai"

    p2 = parse_natural_query("best time to run in Tokyo")
    assert p2["intent"] == "activity_best_time"
    assert p2["activity"] == "running"

    p3 = parse_natural_query("will it rain tonight")
    assert p3["intent"] == "rain_check"
    assert p3["time_frame"] == "tonight"


@pytest.mark.asyncio
async def test_intelligence_api_endpoints(client: AsyncClient):
    # Test POST /api/intelligence/score
    resp = await client.post("/api/intelligence/score", json={
        "temperature": 22.0, "apparent_temp": 22.0, "humidity": 55.0,
        "precipitation_prob": 0.0, "wind_speed": 12.0, "uv_index": 4.0, "aqi": 30.0
    })
    assert resp.status_code == 200
    assert resp.json()["score"] >= 80

    # Test POST /api/ai/parse-query
    resp_ai = await client.post("/api/ai/parse-query", json={"query": "best time for cycling tomorrow"})
    assert resp_ai.status_code == 200
    assert resp_ai.json()["intent"] == "activity_best_time"
    assert resp_ai.json()["activity"] == "cycling"


@pytest.mark.asyncio
async def test_ai_tomorrow_query(client: AsyncClient):
    req_payload = {
        "question": "will it rain tomorrow in Alandi, 16 august?",
        "city_name": "Alandi",
        "current_data": {"temperature_2m": 22.0, "precipitation_probability": 0.0},
        "daily_data": {
            "time": ["2026-08-15", "2026-08-16", "2026-08-17"],
            "weather_code": [1, 61, 2],
            "temperature_2m_max": [28.0, 27.0, 27.0],
            "temperature_2m_min": [22.0, 22.0, 23.0],
            "precipitation_probability_max": [10.0, 80.0, 20.0],
            "rain_sum": [0.0, 4.5, 0.2]
        }
    }
    resp = await client.post("/api/ai/ask", json=req_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "rain" in data["answer"].lower()
    assert "80%" in data["answer"] or "alandi" in data["answer"].lower()

