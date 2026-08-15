"""
Astronomy & Photography Intelligence Engine
1. Stargazing Engine: Calculates night-sky clarity, cloud obscuration, transparency score, and observation window.
2. Photography Engine: Computes golden hour, blue hour, landscape contrast, and sunrise/sunset photo suitability.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


def evaluate_stargazing(
    hourly_data: List[Dict[str, Any]],
    current_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes Stargazing Suitability Score (0-100) based on nighttime cloud cover,
    atmospheric humidity, visibility, and precipitation.
    """
    if not hourly_data:
        return {"score": 50, "verdict": "Moderate", "best_window": "11:00 PM - 02:00 AM", "reasons": ["Limited nighttime data"]}

    # Filter night hours (where is_day == 0 or between 9 PM and 5 AM)
    night_hours = [h for h in hourly_data if h.get("is_day") == 0]
    if not night_hours:
        night_hours = hourly_data[21:28] if len(hourly_data) > 28 else hourly_data[-6:]

    scores = []
    for h in night_hours:
        clouds = h.get("cloud_cover", 20.0)
        rain_p = h.get("precipitation_prob", 0.0)
        hum = h.get("humidity", 60.0)
        aqi = h.get("aqi", 30.0)

        # Stargazing formula
        h_score = 100.0 - (clouds * 0.9) - (rain_p * 0.8) - (max(0, hum - 70) * 0.5) - (aqi * 0.1)
        h_score = max(0, min(100, int(round(h_score))))
        scores.append({
            "time": h.get("time", ""),
            "score": h_score,
            "cloud_cover": round(clouds)
        })

    if not scores:
        return {"score": 50, "verdict": "Moderate", "best_window": "10:30 PM - 01:00 AM", "reasons": ["Night data pending"]}

    best_night = max(scores, key=lambda x: x["score"])
    avg_score = int(round(sum(s["score"] for s in scores) / len(scores)))

    reasons = []
    if best_night["cloud_cover"] <= 15:
        reasons.append(f"Clear night skies ({best_night['cloud_cover']}% cloud cover)")
    elif best_night["cloud_cover"] <= 35:
        reasons.append(f"Scattered light clouds ({best_night['cloud_cover']}%)")
    else:
        reasons.append(f"Significant cloud deck ({best_night['cloud_cover']}%) obscuring observation")

    verdict = "Excellent" if avg_score >= 80 else "Good" if avg_score >= 65 else "Fair" if avg_score >= 45 else "Poor"

    return {
        "score": avg_score,
        "verdict": verdict,
        "best_window": best_night["time"] or "10:30 PM - 01:00 AM",
        "best_score": best_night["score"],
        "reasons": reasons
    }


def evaluate_photography(
    current_data: Dict[str, Any],
    daily_data: Optional[Dict[str, Any]] = None,
    hourly_data: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates Photography conditions for sunrise, sunset, landscape, and golden hour windows.
    """
    cloud = current_data.get("cloud_cover", 20.0)
    rain_p = current_data.get("precipitation_probability", 0.0)
    vis = current_data.get("visibility", 10000.0) / 1000.0  # km

    # Golden Cloud Sweet Spot (30-65% clouds catch vivid dawn/dusk colors)
    if 25 <= cloud <= 65:
        sky_score = 92
        sky_note = "Dynamic mid-level cloud layer provides dramatic light scattering and color depth."
    elif cloud < 25:
        sky_score = 78
        sky_note = "Clear blue skies with crisp contrast, ideal for architectural and direct light shots."
    else:
        sky_score = 58
        sky_note = "Heavy overcast cloud blanket provides natural soft-box diffusion for macro & portraits."

    sunrise_score = min(100, max(20, sky_score + (5 if rain_p < 10 else -20)))
    sunset_score = min(100, max(20, sky_score + (3 if rain_p < 15 else -25)))
    landscape_score = min(100, max(20, int(round((vis / 10.0) * 50.0 + (50 - rain_p * 0.5)))))

    # Extract sunrise/sunset if available
    sunrise_str = "06:15 AM"
    sunset_str = "06:45 PM"
    if daily_data and daily_data.get("sunrise") and daily_data.get("sunset"):
        try:
            sr_dt = datetime.fromisoformat(daily_data["sunrise"][0])
            ss_dt = datetime.fromisoformat(daily_data["sunset"][0])
            sunrise_str = sr_dt.strftime("%I:%M %p")
            sunset_str = ss_dt.strftime("%I:%M %p")
        except Exception:
            pass

    return {
        "overall_score": int(round((sunrise_score + sunset_score + landscape_score) / 3)),
        "sunrise_score": sunrise_score,
        "sunset_score": sunset_score,
        "landscape_score": landscape_score,
        "golden_hour_morning": f"{sunrise_str} – +45 min",
        "golden_hour_evening": f"-45 min – {sunset_str}",
        "sky_note": sky_note,
        "recommendation": "Optimal time for landscape captures is during Golden Hour around " + sunset_str
    }
