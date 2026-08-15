"""
Decision Engine — Smart Weather Decision Cards
Evaluates day-to-day decisions (umbrella, run, cycling, jacket, beach, travel, stargazing)
producing decisive YES / MAYBE / NO ratings with transparent meteorological reasoning.
"""

from typing import Dict, Any, List, Optional


def evaluate_decision_cards(
    current_data: Dict[str, Any],
    daily_data: Optional[Dict[str, Any]] = None,
    hourly_data: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Evaluates 7 practical weather decisions based on current and multi-hour telemetry.
    """
    temp = current_data.get("temperature_2m", 20.0)
    app_t = current_data.get("apparent_temperature", temp)
    rain_p = current_data.get("precipitation_probability", current_data.get("precipitation", 0.0) * 20.0)
    rain_mm = current_data.get("rain", current_data.get("precipitation", 0.0))
    wind = current_data.get("wind_speed_10m", 10.0)
    uv = current_data.get("uv_index", 3.0)
    aqi = current_data.get("aqi", 35.0)
    cloud = current_data.get("cloud_cover", 20.0)

    # Check max rain prob over next 12h if available
    max_12h_rain = rain_p
    min_12h_temp = temp
    if hourly_data:
        max_12h_rain = max([h.get("precipitation_prob", 0.0) for h in hourly_data[:12]] or [rain_p])
        min_12h_temp = min([h.get("temperature", temp) for h in hourly_data[:12]] or [temp])

    decisions = []

    # 1. Umbrella
    if max_12h_rain >= 50 or rain_mm >= 1.0:
        decisions.append({
            "id": "umbrella",
            "question": "Should I carry an umbrella?",
            "icon": "☂️",
            "verdict": "YES",
            "color": "#ef4444",
            "reason": f"Elevated precipitation probability ({round(max_12h_rain)}%) forecast during the day."
        })
    elif max_12h_rain >= 25:
        decisions.append({
            "id": "umbrella",
            "question": "Should I carry an umbrella?",
            "icon": "☂️",
            "verdict": "MAYBE",
            "color": "#f59e0b",
            "reason": f"Moderate rain chance ({round(max_12h_rain)}%); pack a compact umbrella just in case."
        })
    else:
        decisions.append({
            "id": "umbrella",
            "question": "Should I carry an umbrella?",
            "icon": "☂️",
            "verdict": "NO",
            "color": "#10b981",
            "reason": "Dry atmospheric conditions with negligible rain probability."
        })

    # 2. Jacket / Extra Layer
    if app_t < 15 or min_12h_temp < 14:
        decisions.append({
            "id": "jacket",
            "question": "Should I take a jacket?",
            "icon": "🧥",
            "verdict": "YES",
            "color": "#0284c7",
            "reason": f"Temperatures drop to {round(min_12h_temp)}°C. An extra layer is recommended."
        })
    elif app_t <= 19:
        decisions.append({
            "id": "jacket",
            "question": "Should I take a jacket?",
            "icon": "🧥",
            "verdict": "MAYBE",
            "color": "#f59e0b",
            "reason": "Mild daytime conditions, but could feel chilly in the shade or evening breeze."
        })
    else:
        decisions.append({
            "id": "jacket",
            "question": "Should I take a jacket?",
            "icon": "🧥",
            "verdict": "NO",
            "color": "#10b981",
            "reason": f"Warm thermal profile ({round(app_t)}°C feels-like). Single layer is sufficient."
        })

    # 3. Outdoor Run
    if max_12h_rain < 25 and 10 <= app_t <= 22 and aqi <= 65:
        decisions.append({
            "id": "run",
            "question": "Should I run outside?",
            "icon": "🏃",
            "verdict": "YES",
            "color": "#10b981",
            "reason": f"Great running temperature ({round(app_t)}°C), clean air (AQI {round(aqi)}), and dry ground."
        })
    elif max_12h_rain >= 55 or app_t > 30 or aqi > 120:
        decisions.append({
            "id": "run",
            "question": "Should I run outside?",
            "icon": "🏃",
            "verdict": "NO",
            "color": "#ef4444",
            "reason": "High heat index or rain/air quality makes treadmill or indoor workout preferable."
        })
    else:
        decisions.append({
            "id": "run",
            "question": "Should I run outside?",
            "icon": "🏃",
            "verdict": "MAYBE",
            "color": "#f59e0b",
            "reason": "Acceptable conditions; schedule your run during cooler morning/evening hours."
        })

    # 4. Cycling
    if wind < 20 and max_12h_rain < 20:
        decisions.append({
            "id": "cycling",
            "question": "Is today good for cycling?",
            "icon": "🚴",
            "verdict": "YES",
            "color": "#10b981",
            "reason": f"Calm winds ({round(wind)} km/h) and dry road pavement."
        })
    elif wind >= 30 or max_12h_rain >= 40:
        decisions.append({
            "id": "cycling",
            "question": "Is today good for cycling?",
            "icon": "🚴",
            "verdict": "NO",
            "color": "#ef4444",
            "reason": "Strong headwinds or wet roads reduce cycling comfort and traction."
        })
    else:
        decisions.append({
            "id": "cycling",
            "question": "Is today good for cycling?",
            "icon": "🚴",
            "verdict": "MAYBE",
            "color": "#f59e0b",
            "reason": "Moderate breeze present; pick sheltered bike paths."
        })

    # 5. Beach / Outdoor Swim
    if temp >= 24 and cloud <= 40 and max_12h_rain < 15:
        decisions.append({
            "id": "beach",
            "question": "Should I go to the beach?",
            "icon": "🏖️",
            "verdict": "YES",
            "color": "#10b981",
            "reason": f"Sunny skies ({round(cloud)}% cloud), warm air ({round(temp)}°C), and low rain."
        })
    elif temp < 20 or max_12h_rain >= 35:
        decisions.append({
            "id": "beach",
            "question": "Should I go to the beach?",
            "icon": "🏖️",
            "verdict": "NO",
            "color": "#ef4444",
            "reason": "Too cool or overcast for optimal beach/swimming enjoyment."
        })
    else:
        decisions.append({
            "id": "beach",
            "question": "Should I go to the beach?",
            "icon": "🏖️",
            "verdict": "MAYBE",
            "color": "#f59e0b",
            "reason": "Decent conditions; check water temperature and UV protection."
        })

    # 6. Photography
    if (20 <= cloud <= 60) and max_12h_rain < 20:
        decisions.append({
            "id": "photo",
            "question": "Is today good for photography?",
            "icon": "📷",
            "verdict": "YES",
            "color": "#10b981",
            "reason": "Rich dynamic cloud depth and pleasant natural lighting diffusion."
        })
    else:
        decisions.append({
            "id": "photo",
            "question": "Is today good for photography?",
            "icon": "📷",
            "verdict": "MAYBE",
            "color": "#f59e0b",
            "reason": "Standard lighting; best photos during golden hour (sunrise / sunset)."
        })

    return decisions
