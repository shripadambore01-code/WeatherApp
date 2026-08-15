"""
Recommendation Engine — "What Should I Do?"
Analyzes current meteorological patterns and hourly trajectory to synthesize
practical, personalized daily activity guidance.
"""

from typing import Dict, Any, List
from .activity_engine import score_activities, ACTIVITY_PROFILES


def generate_what_should_i_do(
    current_data: Dict[str, Any],
    hourly_data: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates all activities to recommend top positive opportunities, flagged activities,
    the best outdoor time window, and meteorological rationale.
    """
    if not hourly_data:
        return {
            "good_for": ["Indoor work", "Reading"],
            "not_ideal_for": [],
            "best_window": "10:00 AM - 12:00 PM",
            "why": "Atmospheric data is processing."
        }

    # Score a representative sample of popular activities
    candidates = ["walking", "running", "cycling", "photography", "picnic", "sports", "gardening", "beach", "stargazing", "study_outdoors"]
    activity_results = []

    for key in candidates:
        res = score_activities(hourly_data, key)
        best = res.get("best_window")
        if best:
            activity_results.append({
                "key": key,
                "name": res["activity_name"],
                "icon": res["activity_icon"],
                "score": best["score"],
                "best_time": best["time"],
                "reasons": best["reasons"]
            })

    # Sort activities by score
    sorted_act = sorted(activity_results, key=lambda x: x["score"], reverse=True)

    good_for = [
        {"name": a["name"], "icon": a["icon"], "score": a["score"], "time": a["best_time"]}
        for a in sorted_act if a["score"] >= 70
    ][:4]

    not_ideal_for = [
        {"name": a["name"], "icon": a["icon"], "score": a["score"], "reasons": a["reasons"]}
        for a in sorted_act if a["score"] < 55
    ][:3]

    top_act = sorted_act[0] if sorted_act else None
    best_window = top_act["best_time"] if top_act else "08:00 AM - 10:00 AM"

    # Synthesize human-readable meteorological explanation
    temp = current_data.get("temperature_2m", 20.0)
    rain_p = current_data.get("precipitation_probability", 0.0)
    wind = current_data.get("wind_speed_10m", 10.0)
    aqi = current_data.get("aqi", 35.0)

    reasons = []
    if 16 <= temp <= 24:
        reasons.append("comfortable temperature profile")
    elif temp > 28:
        reasons.append("warm heat index")
    elif temp < 12:
        reasons.append("brisk chill")

    if rain_p < 20:
        reasons.append("low rain probability")
    else:
        reasons.append(f"intermittent rain risk ({round(rain_p)}%)")

    if wind <= 15:
        reasons.append("gentle breeze")
    else:
        reasons.append("active winds")

    if aqi <= 50:
        reasons.append("clean air quality")

    why_text = f"Conditions are highlighted by {' and '.join(reasons)}."

    return {
        "good_for": good_for,
        "not_ideal_for": not_ideal_for,
        "best_window": best_window,
        "top_activity": top_act["name"] if top_act else "Walking",
        "why": why_text
    }
