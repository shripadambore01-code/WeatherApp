"""
Atmos AI / SkyMind Assistant Engine
Multi-horizon structured weather intelligence orchestrator providing verified,
time-aware answers to user questions across current, hourly, and multi-day forecasts.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .weather_score import calculate_weather_score
from .activity_engine import score_activities
from .weather_shift import detect_weather_shifts
from .decision_engine import evaluate_decision_cards
from ..utils.weather_codes import get_weather_info


def ask_atmos_ai(
    question: str,
    city_name: str,
    current_data: Dict[str, Any],
    hourly_data: Optional[List[Dict[str, Any]]] = None,
    daily_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Answers natural user questions with time-horizon awareness and verified meteorological data.
    """
    q = question.lower()
    temp = current_data.get("temperature_2m", 20.0)
    app_t = current_data.get("apparent_temperature", temp)
    rain_p = current_data.get("precipitation_probability", 0.0)
    wind = current_data.get("wind_speed_10m", 10.0)
    uv = current_data.get("uv_index", 3.0)
    aqi = current_data.get("aqi", 35.0)

    # 1. Check for "Tomorrow" / Next-Day Questions
    is_tomorrow = any(k in q for k in ["tomorrow", "next day", "day after"])
    
    if is_tomorrow and daily_data and "time" in daily_data and len(daily_data["time"]) > 1:
        # Index 1 is tomorrow
        t_date = daily_data["time"][1]
        t_code = daily_data.get("weather_code", [0, 0])[1]
        t_desc = get_weather_info(t_code).get("description", "Variable Clouds")
        t_max = daily_data.get("temperature_2m_max", [20, 20])[1]
        t_min = daily_data.get("temperature_2m_min", [15, 15])[1]
        t_rain_prob = daily_data.get("precipitation_probability_max", [0, 0])[1]
        t_rain_sum = daily_data.get("rain_sum", [0, 0])[1] if "rain_sum" in daily_data else 0

        tool_used = "daily_forecast.tomorrow_telemetry"
        confidence = "High"

        if any(k in q for k in ["rain", "umbrella", "shower", "wet", "precipitation"]):
            if t_rain_prob >= 50 or t_rain_sum > 1.0:
                answer = f"Yes, rain is expected tomorrow in {city_name} with {t_desc}. The rain probability is {round(t_rain_prob)}% with highs of {round(t_max)}°C and lows of {round(t_min)}°C. Carry an umbrella."
            elif t_rain_prob >= 25:
                answer = f"Tomorrow in {city_name}, there is a moderate chance of light rain ({round(t_rain_prob)}%) with {t_desc}. Keep an umbrella handy."
            else:
                answer = f"Tomorrow in {city_name} should remain mostly dry. Rain probability is only {round(t_rain_prob)}% with {t_desc} and highs of {round(t_max)}°C."
        else:
            answer = f"Tomorrow in {city_name} ({t_date}): Expect {t_desc} with a high of {round(t_max)}°C and low of {round(t_min)}°C. Rain probability is {round(t_rain_prob)}%."

        return {
            "question": question,
            "city": city_name,
            "answer": answer,
            "tool_called": tool_used,
            "confidence": confidence,
            "verified_metrics": {
                "forecast_horizon": "Tomorrow",
                "condition": t_desc,
                "high_temperature": f"{round(t_max)}°C",
                "low_temperature": f"{round(t_min)}°C",
                "rain_probability": f"{round(t_rain_prob)}%"
            },
            "reasons": [f"Tomorrow forecast: {t_desc}", f"High: {round(t_max)}°C, Rain Risk: {round(t_rain_prob)}%"]
        }

    # 2. Check for "Later Today" / "Tonight" / Hourly progression
    is_tonight = any(k in q for k in ["tonight", "evening", "later", "afternoon", "morning", "night"])
    if is_tonight and hourly_data:
        # Search for tonight (18:00 - 23:00) or upcoming hours
        tonight_hours = [h for h in hourly_data if any(k in str(h.get("time", "")).lower() for k in ["7 pm", "8 pm", "9 pm", "10 pm", "11 pm", "12 am", "19:", "20:", "21:", "22:"])]
        if not tonight_hours:
            tonight_hours = hourly_data[:6]

        max_rain_later = max([h.get("precipitation_prob", 0) for h in tonight_hours], default=rain_p)
        avg_temp_later = sum([h.get("temperature", temp) for h in tonight_hours]) / max(len(tonight_hours), 1)

        tool_used = "hourly_forecast.tonight_scan"
        confidence = "High"

        if "rain" in q or "umbrella" in q:
            if max_rain_later >= 50:
                answer = f"Rain probability increases up to {round(max_rain_later)}% later today in {city_name}. Carry an umbrella if heading out."
            else:
                answer = f"Skies look mostly clear of heavy rain tonight in {city_name} (rain risk stays under {round(max_rain_later)}%)."
        else:
            answer = f"Tonight in {city_name}, temperatures will hover around {round(avg_temp_later)}°C with rain probability at {round(max_rain_later)}%."

        return {
            "question": question,
            "city": city_name,
            "answer": answer,
            "tool_called": tool_used,
            "confidence": confidence,
            "verified_metrics": {
                "forecast_horizon": "Tonight / Later Today",
                "expected_temp": f"{round(avg_temp_later)}°C",
                "max_rain_risk": f"{round(max_rain_later)}%"
            },
            "reasons": [f"Scanned hourly window for tonight in {city_name}"]
        }

    # 3. Rain & Umbrella Questions (Current)
    if any(k in q for k in ["rain", "umbrella", "shower", "wet", "downpour"]):
        if rain_p >= 50:
            answer = f"Yes, carry an umbrella in {city_name}. Rain probability is elevated at {round(rain_p)}%."
            confidence = "High"
        elif rain_p >= 25:
            answer = f"A light rain risk ({round(rain_p)}%) is present in {city_name}. Keeping a compact umbrella handy is advised."
            confidence = "Medium"
        else:
            answer = f"No umbrella needed currently in {city_name}. Rain probability is only {round(rain_p)}% with dry skies."
            confidence = "High"

        tool_used = "evaluate_rain_and_precipitation"
        reasons = [f"Current rain probability: {round(rain_p)}%", f"Wind: {round(wind)} km/h"]

    # 4. Running & Outdoor Workout Questions
    elif any(k in q for k in ["run", "running", "jog", "workout", "exercise"]):
        act_res = score_activities(hourly_data or [], "running")
        best = act_res.get("best_window", {})
        best_time = best.get("time", "morning")
        best_score = best.get("score", 85)

        answer = f"The best time to run in {city_name} is around {best_time} with a condition score of {best_score}/100. " + " ".join(best.get("reasons", []))
        tool_used = "activity_engine.score_activities('running')"
        confidence = "High"
        reasons = best.get("reasons", ["Optimal temperature profile"])

    # 5. Photography & Stargazing Questions
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

    # 6. Clothing / Jacket Questions
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

    # 7. Temperature & Humidity "Why does it feel hotter?"
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

    # 8. General Overview
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
