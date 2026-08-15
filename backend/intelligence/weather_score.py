"""
Weather Comfort Score 2.0
Deterministic, multi-attribute scoring algorithm producing 0-100 comfort rating
with contextual profiles and human-interpretable explanations.
"""

from typing import Dict, Any, List, Optional


def clamp(val: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    return max(min_val, min(max_val, val))


def calculate_weather_score(
    temperature: float,
    apparent_temp: Optional[float] = None,
    humidity: Optional[float] = 50.0,
    precipitation_prob: Optional[float] = 0.0,
    precipitation_amount: Optional[float] = 0.0,
    wind_speed: Optional[float] = 10.0,
    wind_gust: Optional[float] = 15.0,
    uv_index: Optional[float] = 3.0,
    aqi: Optional[float] = 30.0,
    cloud_cover: Optional[float] = 20.0,
    profile: str = "general"
) -> Dict[str, Any]:
    """
    Calculates universal Comfort Score (0-100) based on weighted meteorological parameters
    and profile-specific calibration.
    """
    app_t = apparent_temp if apparent_temp is not None else temperature
    hum = humidity if humidity is not None else 50.0
    rain_p = precipitation_prob if precipitation_prob is not None else 0.0
    rain_mm = precipitation_amount if precipitation_amount is not None else 0.0
    wind = wind_speed if wind_speed is not None else 10.0
    gust = wind_gust if wind_gust is not None else wind * 1.3
    uv = uv_index if uv_index is not None else 3.0
    air_q = aqi if aqi is not None else 35.0
    clouds = cloud_cover if cloud_cover is not None else 20.0

    score = 100.0
    reasons = []
    penalties = {}

    # 1. Thermal Comfort Penalty (Optimal 18°C - 24°C)
    if app_t < 18.0:
        delta = 18.0 - app_t
        t_penalty = min(40.0, (delta ** 1.3) * 1.5)
        score -= t_penalty
        penalties["temperature"] = t_penalty
        if delta > 8:
            reasons.append(f"Chilly thermal condition ({round(app_t)}°C)")
    elif app_t > 24.0:
        delta = app_t - 24.0
        t_penalty = min(45.0, (delta ** 1.35) * 1.8)
        score -= t_penalty
        penalties["temperature"] = t_penalty
        if delta > 6:
            reasons.append(f"Warm/hot thermal condition ({round(app_t)}°C feels-like)")

    # 2. Humidity Stickiness Penalty (Optimal 35% - 60%)
    if hum > 65.0:
        h_penalty = min(20.0, ((hum - 65.0) / 35.0) * 20.0)
        score -= h_penalty
        penalties["humidity"] = h_penalty
        if hum > 80.0:
            reasons.append(f"High muggy humidity ({round(hum)}%)")
    elif hum < 25.0:
        h_penalty = min(10.0, ((25.0 - hum) / 25.0) * 10.0)
        score -= h_penalty
        penalties["humidity"] = h_penalty

    # 3. Precipitation Penalty
    p_penalty = 0.0
    if rain_p > 15.0:
        p_penalty += (rain_p / 100.0) * 35.0
    if rain_mm > 0.5:
        p_penalty += min(25.0, rain_mm * 8.0)
    p_penalty = min(50.0, p_penalty)
    score -= p_penalty
    penalties["precipitation"] = p_penalty
    if rain_p > 40.0 or rain_mm > 1.0:
        reasons.append(f"High precipitation risk ({round(rain_p)}%)")

    # 4. Wind & Gust Penalty (Optimal < 18 km/h)
    w_penalty = 0.0
    if wind > 20.0:
        w_penalty += min(25.0, ((wind - 20.0) / 40.0) * 25.0)
    if gust > 35.0:
        w_penalty += min(20.0, ((gust - 35.0) / 45.0) * 20.0)
    w_penalty = min(35.0, w_penalty)
    score -= w_penalty
    penalties["wind"] = w_penalty
    if wind > 30.0 or gust > 45.0:
        reasons.append(f"Breezy/gusty wind ({round(wind)} km/h, gusts {round(gust)} km/h)")

    # 5. Air Quality Index Penalty (Optimal < 50 AQI)
    if air_q > 50.0:
        aqi_penalty = min(35.0, ((air_q - 50.0) / 250.0) * 35.0)
        score -= aqi_penalty
        penalties["aqi"] = aqi_penalty
        if air_q > 100.0:
            reasons.append(f"Elevated AQI pollutant levels ({round(air_q)})")

    # 6. UV Radiation Penalty (Optimal < 5)
    if uv > 6.0:
        uv_penalty = min(18.0, (uv - 6.0) * 3.0)
        score -= uv_penalty
        penalties["uv"] = uv_penalty
        if uv >= 8.0:
            reasons.append(f"Intense UV radiation index ({round(uv)})")

    # Profile-Specific Calibration Modifiers
    prof = profile.lower()
    if prof == "running":
        # Runners prefer cooler temps (10-18°C) and suffer in heat/humidity
        if app_t > 21.0:
            score -= min(20.0, (app_t - 21.0) * 2.5)
        elif 8.0 <= app_t <= 16.0:
            score += 10.0  # Ideal running weather
        if hum > 75.0:
            score -= 10.0
    elif prof == "cycling":
        if wind > 18.0:
            score -= min(25.0, (wind - 18.0) * 1.8)
        if rain_p > 20.0:
            score -= 15.0
    elif prof == "photography":
        # Overcast/golden clouds can be positive, but heavy rain/fog limits visibility
        if 20.0 <= clouds <= 70.0:
            score += 8.0  # Dynamic sky
        if rain_p > 30.0:
            score -= 20.0
    elif prof == "beach":
        # Beach wants warm sunny weather (24-32°C), low rain, moderate wind
        if app_t < 22.0:
            score -= min(40.0, (22.0 - app_t) * 3.5)
        elif 25.0 <= app_t <= 32.0 and clouds < 40.0:
            score += 15.0
        if rain_p > 20.0:
            score -= 30.0
    elif prof == "stargazing":
        # Stargazing strictly requires 0-15% cloud cover and high visibility
        score = 100.0 - (clouds * 0.85) - (rain_p * 0.5) - (air_q * 0.15)
        if clouds > 40.0:
            reasons.append("Cloud cover obscures night sky visibility")

    final_score = int(round(clamp(score, 0.0, 100.0)))

    # Classification & Summary
    if final_score >= 85:
        verdict = "Excellent"
        summary = "Ideal meteorological conditions with high physical comfort."
    elif final_score >= 70:
        verdict = "Good"
        summary = "Pleasant weather with minor environmental factors."
    elif final_score >= 50:
        verdict = "Moderate"
        summary = "Acceptable conditions; consider timing your outdoor activities."
    elif final_score >= 30:
        verdict = "Poor"
        summary = "Sub-optimal conditions; outdoor exposure should be planned with care."
    else:
        verdict = "Hazardous / Extreme"
        summary = "Adverse weather conditions detected. Stay protected indoors."

    if not reasons:
        reasons.append("Comfortable thermal balance and calm atmospheric conditions.")

    return {
        "score": final_score,
        "verdict": verdict,
        "summary": summary,
        "profile": prof,
        "reasons": reasons,
        "penalties": penalties,
        "metrics": {
            "temperature": temperature,
            "apparent_temp": app_t,
            "humidity": hum,
            "precipitation_prob": rain_p,
            "wind_speed": wind,
            "uv_index": uv,
            "aqi": air_q
        }
    }


def get_score_profile(hourly_item: Dict[str, Any], profile: str = "general") -> Dict[str, Any]:
    """Helper to score a single hourly weather slice."""
    return calculate_weather_score(
        temperature=hourly_item.get("temperature", 20.0),
        apparent_temp=hourly_item.get("apparent_temp", None),
        humidity=hourly_item.get("humidity", 50.0),
        precipitation_prob=hourly_item.get("precipitation_prob", 0.0),
        precipitation_amount=hourly_item.get("precipitation_amount", 0.0),
        wind_speed=hourly_item.get("wind_speed", 10.0),
        wind_gust=hourly_item.get("wind_gust", 15.0),
        uv_index=hourly_item.get("uv_index", 3.0),
        aqi=hourly_item.get("aqi", 30.0),
        cloud_cover=hourly_item.get("cloud_cover", 20.0),
        profile=profile
    )
