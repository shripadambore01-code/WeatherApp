"""
Atmos AI / SkyMind Assistant Engine
Multi-horizon structured weather intelligence orchestrator with location and date matching.
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from .weather_score import calculate_weather_score
from .activity_engine import score_activities
from ..utils.weather_codes import get_weather_info


def ask_atmos_ai(
    question: str,
    city_name: str,
    current_data: Dict[str, Any],
    hourly_data: Optional[List[Dict[str, Any]]] = None,
    daily_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Answers natural user questions with time-horizon awareness, date matching, and verified data.
    """
    q = question.lower()
    temp = current_data.get("temperature_2m", 20.0)
    app_t = current_data.get("apparent_temperature", temp)
    rain_p = current_data.get("precipitation_probability", 0.0)
    wind = current_data.get("wind_speed_10m", 10.0)
    uv = current_data.get("uv_index", 3.0)
    aqi = current_data.get("aqi", 35.0)

    # 1. Match specific Date or Horizon in Daily Data
    matched_idx = None
    date_label = ""

    if daily_data and "time" in daily_data and len(daily_data["time"]) > 0:
        times = daily_data["time"]

        # Check for tomorrow / next day
        if any(k in q for k in ["tomorrow", "next day", "day after"]):
            matched_idx = min(1, len(times) - 1)
            date_label = "Tomorrow"
        elif any(k in q for k in ["today", "now"]):
            matched_idx = 0
            date_label = "Today"
        else:
            # Check numerical date or month (e.g., "16 august", "17 aug", "16th")
            months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
            short_months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

            for i, iso in enumerate(times):
                try:
                    dt = datetime.fromisoformat(iso)
                    d_num = str(dt.day)
                    m_name = months[dt.month - 1]
                    s_m = short_months[dt.month - 1]

                    if (
                        f"{d_num} {m_name}" in q or f"{m_name} {d_num}" in q or
                        f"{d_num}th {m_name}" in q or f"{d_num}th" in q or
                        f"{d_num} {s_m}" in q or f"{s_m} {d_num}" in q or
                        iso in q or d_num in q
                    ):
                        matched_idx = i
                        date_label = f"{d_num} {m_name.capitalize()}"
                        break
                except Exception:
                    pass

    # If a specific date horizon was matched in daily forecast
    if matched_idx is not None and daily_data:
        t_date = daily_data["time"][matched_idx]
        t_code = daily_data.get("weather_code", [0] * len(daily_data["time"]))[matched_idx]
        t_desc = get_weather_info(t_code).get("description", "Variable Clouds")
        t_max = daily_data.get("temperature_2m_max", [20] * len(daily_data["time"]))[matched_idx]
        t_min = daily_data.get("temperature_2m_min", [15] * len(daily_data["time"]))[matched_idx]
        t_rain_prob = daily_data.get("precipitation_probability_max", [0] * len(daily_data["time"]))[matched_idx]
        t_rain_sum = daily_data.get("rain_sum", [0] * len(daily_data["time"]))[matched_idx] if "rain_sum" in daily_data else 0

        tool_used = "daily_forecast.date_matched_telemetry"
        confidence = "High"

        if any(k in q for k in ["rain", "umbrella", "shower", "wet", "precipitation"]):
            if t_rain_prob >= 50 or t_rain_sum > 1.0:
                answer = f"Yes, rain is expected in {city_name} on {date_label} ({t_date}) with {t_desc}. The rain probability is {round(t_rain_prob)}% with highs of {round(t_max)}°C and lows of {round(t_min)}°C. Carrying an umbrella is advised."
            elif t_rain_prob >= 25:
                answer = f"On {date_label} in {city_name}, there is a moderate chance of light rain ({round(t_rain_prob)}%) with {t_desc} (High: {round(t_max)}°C, Low: {round(t_min)}°C)."
            else:
                answer = f"No significant rain is expected in {city_name} on {date_label} ({t_date}). Conditions look dry with {t_desc}, a rain probability of only {round(t_rain_prob)}%, and highs reaching {round(t_max)}°C."
        else:
            answer = f"Weather forecast for {city_name} on {date_label} ({t_date}): Expect {t_desc} with a maximum temperature of {round(t_max)}°C and a minimum of {round(t_min)}°C. Rain probability is {round(t_rain_prob)}%."

        return {
            "question": question,
            "city": city_name,
            "answer": answer,
            "tool_called": tool_used,
            "confidence": confidence,
            "verified_metrics": {
                "forecast_horizon": date_label,
                "date": t_date,
                "condition": t_desc,
                "high_temperature": f"{round(t_max)}°C",
                "low_temperature": f"{round(t_min)}°C",
                "rain_probability": f"{round(t_rain_prob)}%"
            },
            "reasons": [f"Queried forecast for {city_name} on {t_date}"]
        }

    # 2. Check for Tonight / Later Today
    is_tonight = any(k in q for k in ["tonight", "evening", "later", "afternoon", "morning", "night"])
    if is_tonight and hourly_data:
        tonight_hours = hourly_data[2:10] if len(hourly_data) > 6 else hourly_data
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
            "reasons": [f"Scanned hourly window for {city_name}"]
        }

    # 3. Rain & Umbrella (Current)
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

        return {
            "question": question,
            "city": city_name,
            "answer": answer,
            "tool_called": "evaluate_rain_and_precipitation",
            "confidence": confidence,
            "verified_metrics": {"temperature": f"{round(temp)}°C", "rain_probability": f"{round(rain_p)}%"},
            "reasons": [f"Current rain probability: {round(rain_p)}%"]
        }

    # 4. Running & Outdoor Activities
    if any(k in q for k in ["run", "running", "jog", "workout", "exercise"]):
        act_res = score_activities(hourly_data or [], "running")
        best = act_res.get("best_window", {})
        best_time = best.get("time", "morning")
        best_score = best.get("score", 85)

        return {
            "question": question,
            "city": city_name,
            "answer": f"The best time to run in {city_name} is around {best_time} with a condition score of {best_score}/100. " + " ".join(best.get("reasons", [])),
            "tool_called": "activity_engine.score_activities('running')",
            "confidence": "High",
            "verified_metrics": {"temperature": f"{round(temp)}°C"},
            "reasons": best.get("reasons", ["Optimal temperature profile"])
        }

    # 5. General Overview
    score_res = calculate_weather_score(temp, app_t, uv_index=uv, aqi=aqi, wind_speed=wind)
    return {
        "question": question,
        "city": city_name,
        "answer": f"Currently in {city_name}, conditions are {round(temp)}°C with a Weather Score of {score_res['score']}/100 ({score_res['verdict']}). {score_res['summary']}",
        "tool_called": "weather_score.calculate_weather_score",
        "confidence": "High",
        "verified_metrics": {
            "temperature": f"{round(temp)}°C",
            "feels_like": f"{round(app_t)}°C",
            "rain_probability": f"{round(rain_p)}%",
            "wind": f"{round(wind)} km/h",
            "uv": round(uv),
            "aqi": round(aqi)
        },
        "reasons": score_res["reasons"]
    }
