WEATHER_CODES = {
    0: {"description": "Clear sky", "icon": lambda is_day: "clear-day" if is_day else "clear-night"},
    1: {"description": "Mainly clear", "icon": lambda is_day: "partly-cloudy-day" if is_day else "partly-cloudy-night"},
    2: {"description": "Partly cloudy", "icon": lambda is_day: "partly-cloudy-day" if is_day else "partly-cloudy-night"},
    3: {"description": "Overcast", "icon": lambda is_day: "overcast-day" if is_day else "overcast-night"},
    45: {"description": "Fog", "icon": lambda is_day: "fog-day" if is_day else "fog-night"},
    48: {"description": "Depositing rime fog", "icon": lambda is_day: "fog-day" if is_day else "fog-night"},
    51: {"description": "Light drizzle", "icon": lambda is_day: "drizzle"},
    53: {"description": "Moderate drizzle", "icon": lambda is_day: "drizzle"},
    55: {"description": "Dense drizzle", "icon": lambda is_day: "drizzle"},
    56: {"description": "Light freezing drizzle", "icon": lambda is_day: "sleet"},
    57: {"description": "Dense freezing drizzle", "icon": lambda is_day: "sleet"},
    61: {"description": "Slight rain", "icon": lambda is_day: "rain"},
    63: {"description": "Moderate rain", "icon": lambda is_day: "rain"},
    65: {"description": "Heavy rain", "icon": lambda is_day: "rain"},
    66: {"description": "Light freezing rain", "icon": lambda is_day: "sleet"},
    67: {"description": "Heavy freezing rain", "icon": lambda is_day: "sleet"},
    71: {"description": "Slight snow fall", "icon": lambda is_day: "snow"},
    73: {"description": "Moderate snow fall", "icon": lambda is_day: "snow"},
    75: {"description": "Heavy snow fall", "icon": lambda is_day: "snow"},
    77: {"description": "Snow grains", "icon": lambda is_day: "snow"},
    80: {"description": "Slight rain showers", "icon": lambda is_day: "rain"},
    81: {"description": "Moderate rain showers", "icon": lambda is_day: "rain"},
    82: {"description": "Violent rain showers", "icon": lambda is_day: "rain"},
    85: {"description": "Slight snow showers", "icon": lambda is_day: "snow"},
    86: {"description": "Heavy snow showers", "icon": lambda is_day: "snow"},
    95: {"description": "Thunderstorm", "icon": lambda is_day: "thunderstorms"},
    96: {"description": "Thunderstorm with slight hail", "icon": lambda is_day: "thunderstorms-rain"},
    99: {"description": "Thunderstorm with heavy hail", "icon": lambda is_day: "thunderstorms-rain"},
}

def get_weather_info(code: int, is_day: bool = True):
    info = WEATHER_CODES.get(code, {"description": "Unknown", "icon": lambda x: "unknown"})
    return {
        "description": info["description"],
        "icon": info["icon"](is_day)
    }
