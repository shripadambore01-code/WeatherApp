"""
Forecast Comparison Engine — "What Changed?"
Compares current forecast data against a previously cached snapshot to highlight
temperature, precipitation, wind, and AQI variance with natural language insight.
"""

from typing import Dict, Any, Optional


def compare_forecasts(
    current_forecast: Dict[str, Any],
    cached_forecast: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes delta metrics and generates an editorial summary explaining what shifted
    between the previously fetched forecast and the newest meteorological model run.
    """
    if not cached_forecast or not current_forecast:
        return {
            "has_comparison": False,
            "status": "baseline_saved",
            "message": "Initial forecast snapshot recorded. Subsequent updates will track atmospheric variance.",
            "deltas": {}
        }

    cur_cur = current_forecast.get("current", {})
    old_cur = cached_forecast.get("current", {})

    cur_temp = cur_cur.get("temperature_2m", 20.0)
    old_temp = old_cur.get("temperature_2m", 20.0)
    temp_delta = round(cur_temp - old_temp, 1)

    cur_rain = cur_cur.get("precipitation", 0.0)
    old_rain = old_cur.get("precipitation", 0.0)
    rain_delta = round(cur_rain - old_rain, 1)

    cur_wind = cur_cur.get("wind_speed_10m", 10.0)
    old_wind = old_cur.get("wind_speed_10m", 10.0)
    wind_delta = round(cur_wind - old_wind, 1)

    insights = []

    if abs(temp_delta) >= 1.5:
        dir_t = "warmer" if temp_delta > 0 else "cooler"
        insights.append(f"Temperature is now trending {abs(temp_delta)}°C {dir_t} than previously modeled.")

    if abs(rain_delta) >= 1.0:
        dir_r = "increased" if rain_delta > 0 else "decreased"
        insights.append(f"Precipitation expectations have {dir_r} by {abs(rain_delta)} mm.")

    if abs(wind_delta) >= 5.0:
        dir_w = "stronger" if wind_delta > 0 else "calmer"
        insights.append(f"Wind speeds are now {abs(wind_delta)} km/h {dir_w}.")

    if not insights:
        summary = "Latest model run shows consistent atmospheric alignment with earlier forecast."
    else:
        summary = " ".join(insights)

    return {
        "has_comparison": True,
        "status": "variance_detected",
        "summary": summary,
        "deltas": {
            "temperature": {"current": cur_temp, "previous": old_temp, "delta": f"{'+' if temp_delta > 0 else ''}{temp_delta}°C"},
            "precipitation": {"current": cur_rain, "previous": old_rain, "delta": f"{'+' if rain_delta > 0 else ''}{rain_delta} mm"},
            "wind": {"current": cur_wind, "previous": old_wind, "delta": f"{'+' if wind_delta > 0 else ''}{wind_delta} km/h"}
        }
    }
