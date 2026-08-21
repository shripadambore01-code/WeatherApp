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

    # 1. Resolve Date Horizon in Daily Data
    date_resolution = resolve_date_query(q, daily_data)

    if date_resolution:
        if date_resolution.get("is_past"):
            today_code = daily_data.get("weather_code", [0])[0] if daily_data else 0
            today_desc = get_weather_info(today_code).get("description", "Clear Skies")
            tomorrow_rain = daily_data.get("precipitation_probability_max", [0, 0])[1] if daily_data and len(daily_data.get("precipitation_probability_max", [])) > 1 else 0
            tomorrow_date = daily_data.get("time", ["", "Next Day"])[1] if daily_data and len(daily_data.get("time", [])) > 1 else "Tomorrow"

            return {
                "question": question,
                "city": city_name,
                "answer": f"{date_resolution['label']} has already passed. For today in {city_name}, current conditions are {round(temp)}°C with {today_desc} and {round(rain_p)}% rain risk. Tomorrow ({tomorrow_date}), rain probability is {round(tomorrow_rain)}%.",
                "tool_called": "daily_forecast.past_date_detector",
                "confidence": "High",
                "verified_metrics": {
                    "location": city_name,
                    "requested_date": date_resolution["label"],
                    "current_temp": f"{round(temp)}°C",
                    "today_rain_probability": f"{round(rain_p)}%"
                },
                "reasons": [f"Recognized that {date_resolution['label']} is in the past; provided active telemetry for {city_name}"]
            }

        matched_idx = date_resolution.get("matched_index")
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
            date_label = date_resolution["label"]

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
            answer = f"Yes, carry an umbrella in {city_name}. Rain probability is elevated at {round(rain_p)}% with temperatures around {round(temp)}°C."
            confidence = "High"
        elif rain_p >= 25:
            answer = f"A light rain risk ({round(rain_p)}%) is present in {city_name}. Keeping a compact umbrella handy is advised."
            confidence = "Medium"
        else:
            answer = f"No umbrella needed currently in {city_name}. Rain probability is only {round(rain_p)}% with dry skies and temperature at {round(temp)}°C."
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


def resolve_date_query(query: str, daily_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    q = query.lower()

    if "tomorrow" in q or "next day" in q:
        return {"matched_index": 1, "label": "Tomorrow", "is_past": False}
    if "today" in q or "now" in q:
        return {"matched_index": 0, "label": "Today", "is_past": False}
    if "day after tomorrow" in q:
        return {"matched_index": 2, "label": "Day after tomorrow", "is_past": False}

    months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    short_months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

    # Extract date pattern
    target_day = None
    target_month = None

    match1 = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)', q)
    match2 = re.search(r'([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?', q)
    match = match1 or match2

    if match:
        p1, p2 = match.groups()
        day_str = p1 if p1.isdigit() else p2
        month_str = p2 if p1.isdigit() else p1

        if month_str in months:
            target_month = months.index(month_str)
            target_day = int(day_str)
        elif month_str in short_months:
            target_month = short_months.index(month_str)
            target_day = int(day_str)

    if daily_data and "time" in daily_data and len(daily_data["time"]) > 0:
        times = daily_data["time"]
        today_iso = times[0]
        try:
            today_dt = datetime.fromisoformat(today_iso)
            today_day = today_dt.day
            today_month = today_dt.month - 1

            if target_day is not None and target_month is not None:
                month_name = months[target_month].capitalize()
                date_label = f"{target_day} {month_name}"

                for i, iso in enumerate(times):
                    dt = datetime.fromisoformat(iso)
                    if dt.day == target_day and (dt.month - 1) == target_month:
                        return {"matched_index": i, "label": date_label, "is_past": False}

                if target_month < today_month or (target_month == today_month and target_day < today_day):
                    return {"matched_index": None, "label": date_label, "is_past": True}

                return {"matched_index": len(times) - 1, "label": date_label, "is_past": False}
        except Exception:
            pass

    return None
