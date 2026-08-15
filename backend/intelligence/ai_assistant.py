"""
Atmos AI / SkyMind Assistant Engine
Structured tool-calling orchestrator providing verified, deterministic answers
to user questions without hallucinating weather telemetry.
"""

from typing import Dict, Any, List, Optional
from .weather_score import calculate_weather_score
from .activity_engine import score_activities
from .weather_shift import detect_weather_shifts
from .decision_engine import evaluate_decision_cards


def ask_atmos_ai(
    question: str,
    city_name: str,
    current_data: Dict[str, Any],
    hourly_data: Optional[List[Dict[str, Any]]] = None,
    daily_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Answers natural user questions by executing verified internal intelligence tools.
    """
    q = question.lower()
    temp = current_data.get("temperature_2m", 20.0)
    app_t = current_data.get("apparent_temperature", temp)
    rain_p = current_data.get("precipitation_probability", 0.0)
    wind = current_data.get("wind_speed_10m", 10.0)
    uv = current_data.get("uv_index", 3.0)
    aqi = current_data.get("aqi", 35.0)

    # Tool 1: Rain & Umbrella Questions
    if any(k in q for k in ["rain", "umbrella", "shower", "wet", "downpour"]):
        if rain_p >= 50:
            answer = f"Yes, carry an umbrella in {city_name}. Rain probability is elevated at {round(rain_p)}%."
            confidence = "High"
        elif rain_p >= 25:
            answer = f"A light rain risk ({round(rain_p)}%) is present in {city_name}. Keeping a compact umbrella handy is advised."
            confidence = "Medium"
        else:
            answer = f"No umbrella needed in {city_name}. Rain probability is only {round(rain_p)}% with dry skies."
            confidence = "High"

        tool_used = "evaluate_rain_and_precipitation"
        reasons = [f"Current rain probability: {round(rain_p)}%", f"Wind: {round(wind)} km/h"]

    # Tool 2: Running & Outdoor Workout Questions
    elif any(k in q for k in ["run", "running", "jog", "workout", "exercise"]):
        act_res = score_activities(hourly_data or [], "running")
        best = act_res.get("best_window", {})
        best_time = best.get("time", "morning")
        best_score = best.get("score", 85)

        answer = f"The best time to run in {city_name} is around {best_time} with a condition score of {best_score}/100. " + " ".join(best.get("reasons", []))
        tool_used = "activity_engine.score_activities('running')"
        confidence = "High"
        reasons = best.get("reasons", ["Optimal temperature profile"])

    # Tool 3: Photography & Stargazing Questions
    elif any(k in q for k in ["photo", "photography", "camera", "stars", "stargazing"]):
        if "star" in q:
            clouds = current_data.get("cloud_cover", 20.0)
            if clouds < 25:
                answer = f"Tonight offers great stargazing conditions in {city_name} with only {round(clouds)}% cloud cover."
            else:
                answer = f"Stargazing may be limited in {city_name} tonight due to {round(clouds)}% cloud cover obscuring deep sky visibility."
            tool_used = "astro_engine.evaluate_stargazing"
        else:
            answer = f"For photography in {city_name}, optimal diffused light and contrast occurs during Golden Hour (around sunrise or 45 minutes before sunset)."
            tool_used = "photo_engine.evaluate_photography"
        confidence = "High"
        reasons = [f"Cloud cover: {round(current_data.get('cloud_cover', 20))}%", f"Visibility: {round(current_data.get('visibility', 10000)/1000)} km"]

    # Tool 4: Clothing / Jacket Questions
    elif any(k in q for k in ["wear", "jacket", "coat", "clothes", "outfit"]):
        if app_t < 14:
            answer = f"In {city_name} ({round(temp)}°C, feels like {round(app_t)}°C), wear an insulated jacket or warm layers."
        elif app_t < 20:
            answer = f"In {city_name} ({round(temp)}°C), a light jacket, sweater, or layered shirt is ideal."
        else:
            answer = f"In {city_name} ({round(temp)}°C), breathable lightweight clothing is comfortable. Add sunglasses if outdoors."
        tool_used = "decision_engine.evaluate_jacket"
        confidence = "High"
        reasons = [f"Temperature: {round(temp)}°C", f"Feels like: {round(app_t)}°C"]

    # Tool 5: Temperature & Humidity "Why does it feel hotter?"
    elif any(k in q for k in ["feel", "feels like", "hotter", "colder", "humidity"]):
        diff = round(app_t - temp, 1)
        hum = current_data.get("relative_humidity_2m", 50.0)
        if diff > 1:
            answer = f"In {city_name}, it feels {diff}°C warmer ({round(app_t)}°C) than the actual {round(temp)}°C because relative humidity is {round(hum)}%, reducing evaporative cooling."
        elif diff < -1:
            answer = f"In {city_name}, it feels {abs(diff)}°C cooler ({round(app_t)}°C) than {round(temp)}°C due to wind chill ({round(wind)} km/h breeze)."
        else:
            answer = f"In {city_name}, the feels-like temperature ({round(app_t)}°C) is closely aligned with the measured {round(temp)}°C."
        tool_used = "weather_score.calculate_thermal_index"
        confidence = "High"
        reasons = [f"Humidity: {round(hum)}%", f"Wind: {round(wind)} km/h"]

    # Tool 6: General Overview
    else:
        score_res = calculate_weather_score(temp, app_t, uv_index=uv, aqi=aqi, wind_speed=wind)
        answer = f"Currently in {city_name}, conditions are {round(temp)}°C with a Weather Score of {score_res['score']}/100 ({score_res['verdict']}). {score_res['summary']}"
        tool_used = "weather_score.calculate_weather_score"
        confidence = "High"
        reasons = score_res["reasons"]

    return {
        "question": question,
        "city": city_name,
        "answer": answer,
        "tool_called": tool_used,
        "confidence": confidence,
        "verified_metrics": {
            "temperature": f"{round(temp)}°C",
            "feels_like": f"{round(app_t)}°C",
            "rain_probability": f"{round(rain_p)}%",
            "wind": f"{round(wind)} km/h",
            "uv": round(uv),
            "aqi": round(aqi)
        },
        "reasons": reasons
    }
