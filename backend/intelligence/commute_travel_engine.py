"""
Commute & Travel Intelligence Engine
1. Commute Mode: Evaluates departure & return trip safety and comfort across 4 transport modalities.
2. Travel Weather & Smart Packing: Generates tailored multi-day forecasts and structured packing lists.
"""

from typing import Dict, Any, List, Optional


def evaluate_commute(
    hourly_data: List[Dict[str, Any]],
    departure_hour: int = 8,
    return_hour: int = 18,
    transport_mode: str = "transit"
) -> Dict[str, Any]:
    """
    Scores morning departure and evening return conditions based on transport modality.
    """
    mode = transport_mode.lower()

    # Find closest hourly items
    dep_data = hourly_data[min(departure_hour, len(hourly_data) - 1)] if hourly_data else {}
    ret_data = hourly_data[min(return_hour, len(hourly_data) - 1)] if hourly_data else {}

    def score_leg(h_data: Dict[str, Any], label: str) -> Dict[str, Any]:
        temp = h_data.get("temperature", 20.0)
        rain_p = h_data.get("precipitation_prob", 0.0)
        wind = h_data.get("wind_speed", 10.0)
        aqi = h_data.get("aqi", 35.0)

        score = 100.0
        hazards = []

        if mode == "walking":
            if rain_p > 20: score -= (rain_p * 0.6); hazards.append(f"Rain chance {round(rain_p)}%")
            if wind > 25: score -= 15; hazards.append("Brisk wind")
            if temp < 5 or temp > 32: score -= 20; hazards.append(f"Challenging temp ({round(temp)}°C)")
        elif mode == "cycling":
            if rain_p > 15: score -= (rain_p * 0.7); hazards.append("Wet road traction risk")
            if wind > 20: score -= (wind * 0.8); hazards.append(f"Headwinds ({round(wind)} km/h)")
        elif mode == "car":
            if rain_p > 60: score -= 20; hazards.append("Heavy rain / reduced visibility")
        else:  # public transit
            if rain_p > 40: score -= 15; hazards.append("Potential transit delays due to rain")

        final_s = max(10, min(100, int(round(score))))
        verdict = "Excellent" if final_s >= 85 else "Good" if final_s >= 70 else "Risky" if final_s <= 55 else "Moderate"

        return {
            "leg": label,
            "score": final_s,
            "verdict": verdict,
            "temperature": round(temp),
            "rain_prob": round(rain_p),
            "hazards": hazards or ["Smooth transit expected"]
        }

    morning_leg = score_leg(dep_data, "Morning Departure")
    evening_leg = score_leg(ret_data, "Evening Return")

    return {
        "transport_mode": transport_mode,
        "morning": morning_leg,
        "evening": evening_leg,
        "summary": f"{morning_leg['verdict']} morning departure ({morning_leg['score']}/100) and {evening_leg['verdict'].lower()} evening commute ({evening_leg['score']}/100)."
    }


def generate_packing_list(
    daily_data: Dict[str, Any],
    packing_mode: str = "balanced"
) -> Dict[str, Any]:
    """
    Generates intelligent packing items based on temperature ranges, rain sums, and UV indexes.
    Modes: 'minimal', 'balanced', 'prepared'
    """
    temps_max = daily_data.get("temperature_2m_max", [22.0])
    temps_min = daily_data.get("temperature_2m_min", [14.0])
    rain_probs = daily_data.get("precipitation_probability_max", [10.0])
    uv_maxes = daily_data.get("uv_index_max", [4.0])

    min_t = min(temps_min) if temps_min else 14.0
    max_t = max(temps_max) if temps_max else 22.0
    max_rain = max(rain_probs) if rain_probs else 0.0
    max_uv = max(uv_maxes) if uv_maxes else 3.0

    items = []

    # Rain protection
    if max_rain >= 30:
        items.append({
            "item": "Compact Umbrella",
            "category": "Weather Protection",
            "reason": f"Rain probability reaches {round(max_rain)}%."
        })
        if packing_mode == "prepared" or max_rain >= 60:
            items.append({
                "item": "Waterproof Shell / Rain Jacket",
                "category": "Outerwear",
                "reason": "Protection against sustained showers."
            })

    # Cold / Thermal layer
    if min_t < 10:
        items.append({
            "item": "Warm Insulated Jacket",
            "category": "Clothing",
            "reason": f"Lows dip to {round(min_t)}°C."
        })
    elif min_t < 16:
        items.append({
            "item": "Light Sweater or Cardigan",
            "category": "Clothing",
            "reason": f"Cool mornings/evenings around {round(min_t)}°C."
        })

    # Warm weather
    if max_t > 25:
        items.append({
            "item": "Breathable Linen / Cotton Tops",
            "category": "Clothing",
            "reason": f"Daytime highs reach {round(max_t)}°C."
        })

    # Sun protection
    if max_uv >= 6:
        items.append({
            "item": "Sunscreen (SPF 30+) & Sunglasses",
            "category": "Sun Protection",
            "reason": f"High UV Index ({round(max_uv)}) forecast."
        })
        if packing_mode in ["balanced", "prepared"]:
            items.append({
                "item": "Wide-Brim Sun Hat",
                "category": "Sun Protection",
                "reason": "Direct midday sun protection."
            })

    # Always recommended footwear
    items.append({
        "item": "Comfortable Walking Shoes",
        "category": "Footwear",
        "reason": "Essential for general mobility."
    })

    return {
        "packing_mode": packing_mode,
        "temperature_range": f"{round(min_t)}°C – {round(max_t)}°C",
        "max_rain_risk": f"{round(max_rain)}%",
        "items": items
    }
