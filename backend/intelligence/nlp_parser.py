"""
Natural Language Weather Search Parser
Parses flexible conversational queries to extract intent, activity, location, date, and time.
"""

import re
from typing import Dict, Any, Optional


def parse_natural_query(query: str) -> Dict[str, Any]:
    """
    Parses natural language strings into structured query intent.
    Examples:
    - "compare Pune and Mumbai" -> intent: "compare", city_1: "Pune", city_2: "Mumbai"
    - "best time to run in London" -> intent: "activity_best_time", activity: "running", city: "London"
    - "will it rain tonight" -> intent: "rain_check", time: "tonight"
    - "weather Pune tomorrow" -> intent: "weather_lookup", city: "Pune", date: "tomorrow"
    """
    q = query.strip().lower()
    
    # 1. Compare Intent ("compare X and Y" or "X vs Y")
    comp_match = re.search(r'(?:compare|vs|versus)\s+([a-zA-Z\s]+?)\s+(?:and|with|to|vs|versus)\s+([a-zA-Z\s]+)', q)
    if comp_match:
        return {
            "intent": "compare",
            "city_1": comp_match.group(1).strip().title(),
            "city_2": comp_match.group(2).strip().title(),
            "activity": None,
            "time_frame": "now",
            "raw": query
        }

    # 2. Activity Best Time ("best time to run", "good time for photography in Paris")
    activities_map = {
        "run": "running", "running": "running", "jog": "running",
        "walk": "walking", "walking": "walking",
        "cycle": "cycling", "cycling": "cycling", "bike": "cycling",
        "workout": "workout", "gym": "workout", "exercise": "workout",
        "photo": "photography", "photography": "photography", "photos": "photography",
        "picnic": "picnic",
        "beach": "beach", "swim": "beach", "swimming": "beach",
        "hike": "hiking", "hiking": "hiking",
        "stargazing": "stargazing", "stars": "stargazing", "telescope": "stargazing",
        "study": "study_outdoors", "gardening": "gardening"
    }

    detected_activity = None
    for keyword, act_key in activities_map.items():
        if re.search(rf'\b{keyword}\b', q):
            detected_activity = act_key
            break

    # 3. Rain / Umbrella Check
    is_rain_check = bool(re.search(r'\b(rain|umbrella|shower|storm|downpour)\b', q))

    # 4. Date / Time extraction
    time_frame = "today"
    if "tomorrow" in q:
        time_frame = "tomorrow"
    elif "weekend" in q:
        time_frame = "weekend"
    elif "tonight" in q or "night" in q:
        time_frame = "tonight"
    elif "morning" in q:
        time_frame = "morning"
    elif "afternoon" in q:
        time_frame = "afternoon"

    # 5. Extract City Name (strip filler words)
    clean_q = re.sub(
        r'\b(weather|forecast|best|time|to|for|will|it|rain|in|at|today|tomorrow|tonight|this|weekend|good|should|i|go|outside|what|is|how|the)\b',
        ' ', q
    ).strip()
    
    city = clean_q.title() if clean_q else None

    # Determine intent classification
    if detected_activity:
        intent = "activity_best_time"
    elif is_rain_check:
        intent = "rain_check"
    else:
        intent = "weather_lookup"

    return {
        "intent": intent,
        "activity": detected_activity,
        "city": city,
        "time_frame": time_frame,
        "raw": query
    }
