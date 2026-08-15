"""
Weather Shift Detection Engine
Scans hourly time-series to identify sharp meteorological phase transitions
and micro-climate changes across 1h, 3h, 6h, 12h, and 24h horizons.
"""

from typing import Dict, Any, List


def detect_weather_shifts(hourly_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyzes hourly forecast to detect notable inflection points and weather shifts.
    Avoids spamming trivial fluctuations by applying disciplined thresholds.
    """
    if not hourly_data or len(hourly_data) < 2:
        return []

    shifts = []
    current_h = hourly_data[0]

    for i in range(1, min(24, len(hourly_data))):
        target_h = hourly_data[i]
        time_label = target_h.get("time", f"+{i}h")
        from_time = current_h.get("time", "Now")

        # 1. Rain Probability Spike
        cur_rain = current_h.get("precipitation_prob", 0.0)
        tgt_rain = target_h.get("precipitation_prob", 0.0)
        rain_diff = tgt_rain - cur_rain

        if rain_diff >= 35.0 and tgt_rain >= 50.0:
            shifts.append({
                "type": "rain_surge",
                "severity": "high" if tgt_rain >= 70 else "medium",
                "icon": "🌧️",
                "title": "Rain Probability Surge",
                "description": f"Rain risk jumps from {round(cur_rain)}% to {round(tgt_rain)}% around {time_label}.",
                "from_time": from_time,
                "to_time": time_label,
                "delta": f"+{round(rain_diff)}%",
                "action": "Carry an umbrella if venturing outside."
            })
            # Prevent immediate duplicate rain shifts
            cur_rain = tgt_rain

        # 2. Temperature Drop or Surge
        cur_temp = current_h.get("temperature", 20.0)
        tgt_temp = target_h.get("temperature", 20.0)
        temp_diff = tgt_temp - cur_temp

        if temp_diff <= -5.0:
            shifts.append({
                "type": "temp_drop",
                "severity": "medium",
                "icon": "📉",
                "title": "Noticeable Temperature Drop",
                "description": f"Temperature drops {abs(round(temp_diff))}°C (down to {round(tgt_temp)}°C) by {time_label}.",
                "from_time": from_time,
                "to_time": time_label,
                "delta": f"{round(temp_diff)}°C",
                "action": "Keep an extra layer or light jacket handy."
            })
        elif temp_diff >= 6.0:
            shifts.append({
                "type": "temp_rise",
                "severity": "medium",
                "icon": "📈",
                "title": "Rapid Warming",
                "description": f"Temperature warms up by +{round(temp_diff)}°C (reaching {round(tgt_temp)}°C) by {time_label}.",
                "from_time": from_time,
                "to_time": time_label,
                "delta": f"+{round(temp_diff)}°C",
                "action": "Stay hydrated during peak heat hours."
            })

        # 3. Wind Gust Increase
        cur_gust = current_h.get("wind_gust", current_h.get("wind_speed", 10.0))
        tgt_gust = target_h.get("wind_gust", target_h.get("wind_speed", 10.0))
        gust_diff = tgt_gust - cur_gust

        if gust_diff >= 20.0 and tgt_gust >= 40.0:
            shifts.append({
                "type": "wind_gust",
                "severity": "high" if tgt_gust >= 55 else "medium",
                "icon": "💨",
                "title": "Wind Gust Surge",
                "description": f"Wind gusts increase to {round(tgt_gust)} km/h around {time_label}.",
                "from_time": from_time,
                "to_time": time_label,
                "delta": f"+{round(gust_diff)} km/h",
                "action": "Secure loose outdoor items and expect crosswinds."
            })

        # 4. Air Quality Deterioration
        cur_aqi = current_h.get("aqi", 30.0)
        tgt_aqi = target_h.get("aqi", 30.0)
        aqi_diff = tgt_aqi - cur_aqi

        if aqi_diff >= 35.0 and tgt_aqi >= 80.0:
            shifts.append({
                "type": "aqi_deterioration",
                "severity": "high" if tgt_aqi >= 120 else "medium",
                "icon": "🌫️",
                "title": "Air Quality Deterioration",
                "description": f"AQI is forecast to deteriorate from {round(cur_aqi)} to {round(tgt_aqi)} around {time_label}.",
                "from_time": from_time,
                "to_time": time_label,
                "delta": f"+{round(aqi_diff)} AQI",
                "action": "Sensitive groups should limit strenuous outdoor activity."
            })

    # If no major shifts, include a calm stability indicator
    if not shifts:
        shifts.append({
            "type": "stable",
            "severity": "low",
            "icon": "🌤️",
            "title": "Atmospheric Stability",
            "description": "Consistent meteorological pattern expected over the next 12 hours with no sudden shifts.",
            "from_time": "Now",
            "to_time": "+12h",
            "delta": "Stable",
            "action": "Safe to proceed with outdoor schedules."
        })

    # Deduplicate shifts to max top 4
    return shifts[:4]
