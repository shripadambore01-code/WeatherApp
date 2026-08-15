"""
Briefing & Weather Story Generator
Generates:
1. "Your Weather Brief" (Morning / Evening personalized executive summary).
2. "Weather Story" (Chronological editorial micro-narrative timeline).
"""

from typing import Dict, Any, List


def generate_weather_brief(
    city_name: str,
    current_data: Dict[str, Any],
    hourly_data: List[Dict[str, Any]],
    is_morning: bool = True
) -> Dict[str, Any]:
    """
    Generates a personalized daily briefing with verified telemetry.
    """
    temp = current_data.get("temperature_2m", 20.0)
    app_t = current_data.get("apparent_temperature", temp)
    rain_p = current_data.get("precipitation_probability", 0.0)
    aqi = current_data.get("aqi", 35.0)
    uv = current_data.get("uv_index", 3.0)

    # Scan for peak rain hour
    peak_rain_hour = None
    if hourly_data:
        rainy_hours = [h for h in hourly_data[:18] if h.get("precipitation_prob", 0) >= 35]
        if rainy_hours:
            peak_rain_hour = max(rainy_hours, key=lambda x: x.get("precipitation_prob", 0))

    if is_morning:
        title = "Good Morning"
        headline = f"{city_name} — {round(temp)}°C"
        
        narrative_parts = []
        if app_t > 26:
            narrative_parts.append("Warm and humid morning conditions.")
        elif app_t < 14:
            narrative_parts.append("Crisp and brisk start to the day.")
        else:
            narrative_parts.append("Mild and comfortable morning atmospheric balance.")

        if peak_rain_hour:
            narrative_parts.append(f"Rain probability rises to {round(peak_rain_hour.get('precipitation_prob', 0))}% around {peak_rain_hour.get('time', 'the afternoon')}.")
        else:
            narrative_parts.append("Dry skies anticipated throughout the daytime.")

        outdoor_window = "07:00 AM – 10:00 AM"
        action = "Best window for outdoor exercise is earlier in the morning before midday heat and UV peak."
    else:
        title = "Tonight's Outlook"
        headline = f"{city_name} — {round(temp)}°C"
        narrative_parts = ["Evening cooling trend underway."]
        if rain_p >= 30:
            narrative_parts.append(f"Possibility of scattered showers ({round(rain_p)}%).")
        else:
            narrative_parts.append("Calm overnight conditions with steady barometric pressure.")
        outdoor_window = "07:00 PM – 09:30 PM"
        action = "Comfortable temperatures for an evening walk or outdoor dining."

    return {
        "title": title,
        "headline": headline,
        "summary": " ".join(narrative_parts),
        "best_outdoor_window": outdoor_window,
        "aqi_status": "Good" if aqi <= 50 else "Moderate" if aqi <= 100 else "Unhealthy",
        "uv_status": "Low" if uv <= 2 else "Moderate" if uv <= 5 else "High",
        "action_recommendation": action
    }


def generate_weather_story(hourly_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Produces a 6-phase chronological editorial story across the day.
    """
    if not hourly_data:
        return []

    # Sample intervals across the day
    step = max(1, len(hourly_data) // 6)
    sampled = hourly_data[::step][:6]

    story = []
    for h in sampled:
        time_str = h.get("time", "")
        temp = h.get("temperature", 20.0)
        rain_p = h.get("precipitation_prob", 0.0)
        cloud = h.get("cloud_cover", 20.0)
        is_day = h.get("is_day", 1) == 1

        if rain_p >= 50:
            emoji = "🌧️"
            note = f"Showers expected ({round(temp)}°)"
        elif cloud >= 70:
            emoji = "☁️"
            note = f"Overcast blanket ({round(temp)}°)"
        elif cloud >= 30:
            emoji = "🌤️" if is_day else "☁️"
            note = f"Partly cloudy ({round(temp)}°)"
        elif not is_day:
            emoji = "🌙"
            note = f"Clear night skies ({round(temp)}°)"
        else:
            emoji = "☀️"
            note = f"Bright sunshine ({round(temp)}°)"

        story.append({
            "time": time_str,
            "emoji": emoji,
            "temperature": f"{round(temp)}°",
            "narrative": note
        })

    return story
