"""
Atmos Weather — Weather Score 2.0 Backend Engine
Audited 6-factor composite weather scoring algorithm.
"""

from typing import Dict, Any, List

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))

def calculate_weather_score(
    temperature: float,
    apparent_temp: float,
    humidity: float = 55.0,
    precipitation_prob: float = 0.0,
    precipitation_amount: float = 0.0,
    wind_speed: float = 10.0,
    wind_gust: float = 14.0,
    uv_index: float = 3.5,
    aqi: float = 35.0,
    cloud_cover: float = 20.0,
    profile: str = "general"
) -> Dict[str, Any]:
    # 1. Temp Subscore
    temp_sub = 100.0
    if apparent_temp < 18.0:
        delta = 18.0 - apparent_temp
        temp_sub -= min(65.0, (delta ** 1.25) * 2.8)
    elif apparent_temp > 24.0:
        delta = apparent_temp - 24.0
        temp_sub -= min(70.0, (delta ** 1.3) * 3.2)
    temp_sub = max(10, min(100, round(temp_sub)))

    # 2. Rain Subscore
    rain_sub = max(5, min(100, round(100.0 - (precipitation_prob * 0.75) - (precipitation_amount * 12.0))))

    # 3. Wind Subscore
    wind_sub = 100.0
    if wind_speed > 15.0:
        wind_sub -= ((wind_speed - 15.0) / 35.0) * 45.0
    if wind_gust > 30.0:
        wind_sub -= ((wind_gust - 30.0) / 40.0) * 35.0
    wind_sub = max(15, min(100, round(wind_sub)))

    # 4. AQI Subscore
    aqi_sub = 100.0
    if aqi > 30.0:
        aqi_sub -= ((aqi - 30.0) / 220.0) * 85.0
    aqi_sub = max(10, min(100, round(aqi_sub)))

    # 5. UV Subscore
    uv_sub = 100.0
    if uv_index > 5.0:
        uv_sub -= (uv_index - 5.0) * 12.0
    uv_sub = max(15, min(100, round(uv_sub)))

    # 6. Outdoor Suitability
    outdoor_sub = max(10, min(100, round((temp_sub * 0.35) + (rain_sub * 0.4) + (wind_sub * 0.15) + (aqi_sub * 0.1))))

    # Composite
    composite = (temp_sub * 0.25) + (rain_sub * 0.25) + (wind_sub * 0.15) + (aqi_sub * 0.15) + (uv_sub * 0.10) + (outdoor_sub * 0.10)
    final_score = max(5, min(99, round(composite)))

    if final_score >= 85:
        verdict = "Excellent"
    elif final_score >= 70:
        verdict = "Good"
    elif final_score >= 50:
        verdict = "Moderate"
    elif final_score >= 35:
        verdict = "Challenging"
    else:
        verdict = "Hazardous"

    reasons = []
    if precipitation_prob >= 40:
        reasons.append(f"Rain probability is {round(precipitation_prob)}%")
    if apparent_temp > 30:
        reasons.append(f"Warm heat index ({round(apparent_temp)}°C feels-like)")
    if aqi > 100:
        reasons.append(f"Elevated AQI ({round(aqi)})")
    if not reasons:
        reasons.append("Optimal thermal balance & dry conditions")

    summary = (
        "Today's atmospheric conditions are highly favorable for outdoor activities and travel."
        if final_score >= 75
        else "Moderate conditions today. Check rain and UV windows before heading out."
        if final_score >= 50
        else "Challenging weather conditions. Plan indoor activities and take precautions."
    )

    return {
        "score": final_score,
        "verdict": verdict,
        "profile": profile,
        "subscores": {
            "temperature": temp_sub,
            "rain": rain_sub,
            "wind": wind_sub,
            "aqi": aqi_sub,
            "uv": uv_sub,
            "outdoor": outdoor_sub
        },
        "reasons": reasons,
        "summary": summary
    }

def get_score_profile(profile_name: str) -> Dict[str, Any]:
    profiles = {
        "general": {"ideal_temp": 21.0, "weights": {"temp": 0.25, "rain": 0.25, "wind": 0.15, "aqi": 0.15, "uv": 0.10, "outdoor": 0.10}},
        "running": {"ideal_temp": 16.0, "weights": {"temp": 0.35, "rain": 0.30, "wind": 0.15, "aqi": 0.20}},
        "cycling": {"ideal_temp": 18.0, "weights": {"temp": 0.25, "rain": 0.30, "wind": 0.30, "aqi": 0.15}},
        "travel": {"ideal_temp": 22.0, "weights": {"temp": 0.20, "rain": 0.35, "wind": 0.25, "aqi": 0.20}},
        "student": {"ideal_temp": 22.0, "weights": {"temp": 0.25, "rain": 0.40, "wind": 0.15, "aqi": 0.20}}
    }
    return profiles.get(profile_name.lower(), profiles["general"])
