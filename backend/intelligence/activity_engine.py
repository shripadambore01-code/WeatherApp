"""
Activity Engine — "Best Time to Do Anything"
Scores 16+ activities across every hourly forecast period, finds optimal/avoid windows,
and powers the Custom Activity Builder with adjustable importance weights.
"""

from typing import Dict, Any, List, Optional
from .weather_score import calculate_weather_score, clamp


# Activity preference definitions (ideal temp range, max acceptable rain%, max wind km/h, max UV, etc.)
ACTIVITY_PROFILES = {
    "running": {
        "name": "Running",
        "icon": "🏃",
        "temp_min": 10, "temp_max": 20, "temp_ideal": 14,
        "max_rain_p": 15, "max_wind": 22, "max_uv": 6, "max_aqi": 60,
        "description": "Prefers crisp cool air (10-18°C), low humidity, minimal rain, and moderate wind."
    },
    "walking": {
        "name": "Walking",
        "icon": "🚶",
        "temp_min": 14, "temp_max": 25, "temp_ideal": 20,
        "max_rain_p": 25, "max_wind": 30, "max_uv": 7, "max_aqi": 80,
        "description": "Enjoys mild pleasant temps, moderate breeze, and dry conditions."
    },
    "cycling": {
        "name": "Cycling",
        "icon": "🚴",
        "temp_min": 12, "temp_max": 24, "temp_ideal": 18,
        "max_rain_p": 15, "max_wind": 20, "max_uv": 6, "max_aqi": 70,
        "description": "Sensitive to wind resistance, wet slick roads, and extreme heat."
    },
    "workout": {
        "name": "Outdoor Workout",
        "icon": "💪",
        "temp_min": 12, "temp_max": 22, "temp_ideal": 16,
        "max_rain_p": 10, "max_wind": 25, "max_uv": 5, "max_aqi": 50,
        "description": "Requires clean air, low UV to avoid heat exhaustion, and dry ground."
    },
    "photography": {
        "name": "Photography",
        "icon": "📷",
        "temp_min": 8, "temp_max": 28, "temp_ideal": 19,
        "max_rain_p": 20, "max_wind": 35, "max_uv": 8, "max_aqi": 90,
        "description": "Favors dynamic cloud lighting, golden hour angles, and good visibility."
    },
    "picnic": {
        "name": "Picnic",
        "icon": "🧺",
        "temp_min": 18, "temp_max": 26, "temp_ideal": 22,
        "max_rain_p": 10, "max_wind": 18, "max_uv": 6, "max_aqi": 70,
        "description": "Needs warm dry ground, calm gentle breeze, and zero precipitation."
    },
    "travel": {
        "name": "Travel / Sightseeing",
        "icon": "✈️",
        "temp_min": 12, "temp_max": 28, "temp_ideal": 21,
        "max_rain_p": 30, "max_wind": 35, "max_uv": 8, "max_aqi": 100,
        "description": "Broad comfort band with tolerance for light cloud cover and exploring."
    },
    "shopping": {
        "name": "Shopping",
        "icon": "🛍️",
        "temp_min": 5, "temp_max": 35, "temp_ideal": 21,
        "max_rain_p": 50, "max_wind": 45, "max_uv": 10, "max_aqi": 120,
        "description": "Indoor/outdoor transit where heavy downpours are the primary obstacle."
    },
    "driving": {
        "name": "Driving",
        "icon": "🚗",
        "temp_min": -10, "temp_max": 40, "temp_ideal": 20,
        "max_rain_p": 35, "max_wind": 40, "max_uv": 11, "max_aqi": 150,
        "description": "Focused on road safety, visibility, heavy rain hydroplaning, and ice."
    },
    "sports": {
        "name": "Outdoor Sports",
        "icon": "⚽",
        "temp_min": 14, "temp_max": 24, "temp_ideal": 18,
        "max_rain_p": 15, "max_wind": 22, "max_uv": 6, "max_aqi": 60,
        "description": "Demands moderate temperature, dry grass/courts, and high air quality."
    },
    "hiking": {
        "name": "Hiking",
        "icon": "🥾",
        "temp_min": 10, "temp_max": 24, "temp_ideal": 17,
        "max_rain_p": 15, "max_wind": 28, "max_uv": 6, "max_aqi": 60,
        "description": "Needs sustained dry trail conditions, manageable heat, and clear vistas."
    },
    "beach": {
        "name": "Beach / Swimming",
        "icon": "🏖️",
        "temp_min": 24, "temp_max": 34, "temp_ideal": 28,
        "max_rain_p": 10, "max_wind": 22, "max_uv": 9, "max_aqi": 80,
        "description": "Requires sunny warm skies (25°C+), low cloud cover, and gentle sea breeze."
    },
    "gardening": {
        "name": "Gardening",
        "icon": "🌱",
        "temp_min": 14, "temp_max": 25, "temp_ideal": 19,
        "max_rain_p": 20, "max_wind": 25, "max_uv": 6, "max_aqi": 75,
        "description": "Best in overcast or mild sun, workable soil, and calm winds."
    },
    "stargazing": {
        "name": "Stargazing",
        "icon": "✨",
        "temp_min": -5, "temp_max": 25, "temp_ideal": 15,
        "max_rain_p": 5, "max_wind": 20, "max_uv": 0, "max_aqi": 50,
        "description": "Requires near-zero cloud cover, dry nighttime air, and clear atmosphere."
    },
    "commuting": {
        "name": "Commuting",
        "icon": "🚆",
        "temp_min": 0, "temp_max": 35, "temp_ideal": 20,
        "max_rain_p": 30, "max_wind": 35, "max_uv": 8, "max_aqi": 90,
        "description": "Evaluates delays caused by heavy rain, fog, storms, and extreme temperatures."
    },
    "study_outdoors": {
        "name": "Studying Outdoors",
        "icon": "📚",
        "temp_min": 18, "temp_max": 25, "temp_ideal": 21,
        "max_rain_p": 5, "max_wind": 15, "max_uv": 5, "max_aqi": 60,
        "description": "Needs calm breeze (so papers don't blow), comfortable shade, and zero rain."
    }
}


def score_single_hour_for_activity(hour: Dict[str, Any], profile_key: str) -> Dict[str, Any]:
    """Scores a single hour for a specific activity profile."""
    prof = ACTIVITY_PROFILES.get(profile_key.lower(), ACTIVITY_PROFILES["walking"])
    temp = hour.get("temperature", 20.0)
    app_t = hour.get("apparent_temp", temp)
    rain_p = hour.get("precipitation_prob", 0.0)
    wind = hour.get("wind_speed", 10.0)
    uv = hour.get("uv_index", 2.0)
    aqi = hour.get("aqi", 30.0)
    cloud = hour.get("cloud_cover", 20.0)
    is_day = hour.get("is_day", 1) == 1

    # Special Stargazing filter: Daytime is 0
    if profile_key == "stargazing" and is_day:
        return {
            "time": hour.get("time", ""),
            "score": 0,
            "verdict": "Daylight",
            "reasons": ["Stargazing requires nighttime darkness"]
        }

    score = 100.0
    positive_reasons = []
    negative_reasons = []

    # 1. Temperature Fit
    ideal = prof["temp_ideal"]
    t_diff = abs(app_t - ideal)
    if t_diff <= 3:
        score += 5
        positive_reasons.append(f"Ideal temperature ({round(app_t)}°C)")
    else:
        score -= min(40.0, (t_diff ** 1.3) * 2.2)
        if app_t > prof["temp_max"]:
            negative_reasons.append(f"Too warm ({round(app_t)}°C feels-like)")
        elif app_t < prof["temp_min"]:
            negative_reasons.append(f"Too chilly ({round(app_t)}°C)")

    # 2. Rain Penalty
    if rain_p > prof["max_rain_p"]:
        r_pen = min(50.0, ((rain_p - prof["max_rain_p"]) / 50.0) * 45.0)
        score -= r_pen
        negative_reasons.append(f"High rain probability ({round(rain_p)}%)")
    elif rain_p <= 10:
        positive_reasons.append("Low rain risk")

    # 3. Wind Penalty
    if wind > prof["max_wind"]:
        w_pen = min(30.0, ((wind - prof["max_wind"]) / 25.0) * 30.0)
        score -= w_pen
        negative_reasons.append(f"Windy conditions ({round(wind)} km/h)")
    elif wind <= 12:
        positive_reasons.append("Calm wind")

    # 4. UV Penalty
    if uv > prof["max_uv"]:
        uv_pen = min(25.0, (uv - prof["max_uv"]) * 4.0)
        score -= uv_pen
        negative_reasons.append(f"Elevated UV exposure ({round(uv)})")
    elif uv <= 3 and is_day:
        positive_reasons.append("Safe UV levels")

    # 5. AQI Penalty
    if aqi > prof["max_aqi"]:
        aqi_pen = min(30.0, ((aqi - prof["max_aqi"]) / 80.0) * 30.0)
        score -= aqi_pen
        negative_reasons.append(f"Higher AQI levels ({round(aqi)})")
    elif aqi <= 45:
        positive_reasons.append("Clean fresh air")

    final_score = int(round(clamp(score, 0.0, 100.0)))

    if final_score >= 85:
        verdict = "Excellent"
    elif final_score >= 70:
        verdict = "Good"
    elif final_score >= 50:
        verdict = "Fair / Moderate"
    else:
        verdict = "Not Recommended"

    return {
        "time": hour.get("time", ""),
        "score": final_score,
        "verdict": verdict,
        "positive_reasons": positive_reasons[:3],
        "negative_reasons": negative_reasons[:3]
    }


def score_activities(hourly_data: List[Dict[str, Any]], activity_key: str = "running") -> Dict[str, Any]:
    """
    Evaluates all hourly periods for a given activity and computes the Best Window and Avoid Window.
    """
    profile = ACTIVITY_PROFILES.get(activity_key.lower(), ACTIVITY_PROFILES["running"])
    hourly_scores = [score_single_hour_for_activity(h, activity_key) for h in hourly_data]

    if not hourly_scores:
        return {"activity": profile["name"], "hourly": [], "best_window": None, "avoid_window": None}

    # Identify Best Window (Highest scoring consecutive 2-hour window or top hour)
    best_hour = max(hourly_scores, key=lambda x: x["score"])
    avoid_hour = min(hourly_scores, key=lambda x: x["score"])

    # Format best time range
    best_time_str = best_hour["time"]
    avoid_time_str = avoid_hour["time"]

    return {
        "activity_key": activity_key,
        "activity_name": profile["name"],
        "activity_icon": profile["icon"],
        "description": profile["description"],
        "hourly_scores": hourly_scores,
        "best_window": {
            "time": best_time_str,
            "score": best_hour["score"],
            "verdict": best_hour["verdict"],
            "reasons": best_hour["positive_reasons"] or ["Optimal overall meteorological balance"]
        },
        "avoid_window": {
            "time": avoid_time_str,
            "score": avoid_hour["score"],
            "verdict": avoid_hour["verdict"],
            "reasons": avoid_hour["negative_reasons"] or ["Sub-optimal timing for this activity"]
        }
    }


def score_custom_activity(
    hourly_data: List[Dict[str, Any]],
    activity_name: str,
    weights: Dict[str, int],  # 1 to 5 stars for temp, rain, wind, aqi, uv
    preferred_temp: float = 20.0
) -> Dict[str, Any]:
    """
    Calculates hourly scores for a custom user-defined activity using custom 1-5 star weights.
    """
    w_temp = max(1, min(5, weights.get("temperature", 3)))
    w_rain = max(1, min(5, weights.get("rain", 5)))
    w_wind = max(1, min(5, weights.get("wind", 3)))
    w_aqi = max(1, min(5, weights.get("aqi", 3)))
    w_uv = max(1, min(5, weights.get("uv", 3)))

    total_weight = w_temp + w_rain + w_wind + w_aqi + w_uv

    hourly_results = []
    for h in hourly_data:
        temp = h.get("temperature", 20.0)
        rain_p = h.get("precipitation_prob", 0.0)
        wind = h.get("wind_speed", 10.0)
        aqi = h.get("aqi", 30.0)
        uv = h.get("uv_index", 2.0)

        # Individual sub-scores (0-100)
        # Temp fit
        t_sub = max(0.0, 100.0 - (abs(temp - preferred_temp) * 6.0))
        # Rain fit
        r_sub = max(0.0, 100.0 - (rain_p * 1.5))
        # Wind fit (< 15 is 100)
        w_sub = max(0.0, 100.0 - (max(0.0, wind - 15.0) * 3.5))
        # AQI fit (< 40 is 100)
        a_sub = max(0.0, 100.0 - (max(0.0, aqi - 40.0) * 0.75))
        # UV fit (< 4 is 100)
        u_sub = max(0.0, 100.0 - (max(0.0, uv - 4.0) * 12.0))

        weighted_score = (
            (t_sub * w_temp) +
            (r_sub * w_rain) +
            (w_sub * w_wind) +
            (a_sub * w_aqi) +
            (u_sub * w_uv)
        ) / total_weight

        final_s = int(round(clamp(weighted_score, 0.0, 100.0)))
        hourly_results.append({
            "time": h.get("time", ""),
            "score": final_s,
            "verdict": "Excellent" if final_s >= 85 else "Good" if final_s >= 70 else "Moderate" if final_s >= 50 else "Poor"
        })

    best_h = max(hourly_results, key=lambda x: x["score"]) if hourly_results else None
    avoid_h = min(hourly_results, key=lambda x: x["score"]) if hourly_results else None

    return {
        "activity_name": activity_name,
        "weights": weights,
        "preferred_temp": preferred_temp,
        "hourly_scores": hourly_results,
        "best_window": best_h,
        "avoid_window": avoid_h
    }


def get_best_time_window(hourly_data: List[Dict[str, Any]], activity: str) -> Dict[str, Any]:
    return score_activities(hourly_data, activity)
