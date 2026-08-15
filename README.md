# 🌦️ Atmos — Advanced Real-Time Weather Application

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Open-Meteo](https://img.shields.io/badge/API-Open--Meteo-blue.svg)](https://open-meteo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Atmos** is a full-stack, production-quality weather web application designed with a Hallmark-inspired anti-slop aesthetic. It delivers real-time meteorological conditions, atmospheric backgrounds, air quality monitoring, interactive trend charts, radar mapping, and multi-language internationalization without requiring any paid API keys.

---

## 📸 Preview

```
+-------------------------------------------------------------------------+
|  ⛅ Atmos            [ Search city... 🎤 📍 ]          [EN ▼] [°C/°F] 🌙  |
+-------------------------------------------------------------------------+
|                                                                         |
|     London, United Kingdom                                              |
|     18°C   ☀️ Partly Cloudy                                             |
|     Feels like 17°C · Humidity: 62% · Wind: 14 km/h SW · UV: 4 (Mod)    |
|                                                                         |
|  [ ⚡ 24-Hour Forecast Timeline ]                                        |
|  [ 📅 7-Day High / Low Range Forecast ]                                 |
|  [ 📈 Interactive ApexCharts Trends ]                                   |
|  [ 🍃 Air Quality Index & Pollutant Breakdown ]                         |
|  [ 🗺️ Radar & Weather Map (Leaflet) ]                                   |
|  [ ⚖️ City Comparison Panel ]                                           |
+-------------------------------------------------------------------------+
```

---

## ✨ Features (22+ Features)

### 🌍 Core Weather Experience
1. **City Search & Autocomplete**: Debounced fuzzy location search with country and administrative region tags.
2. **Current Weather Hero**: Real-time temperature, condition descriptor, animated SVG Meteocons, feels-like temperature.
3. **Atmospheric Dynamic Backgrounds**: Background styling that shifts dynamically according to live weather conditions and day/night cycles.
4. **Local Sunrise & Sunset**: Timezone-aware sunrise and sunset calculations.
5. **Browser Geolocation**: One-click geolocation detection with graceful fallback.
6. **24-Hour Hourly Timeline**: Scrollable hourly temperature and precipitation breakdown.
7. **7-Day Daily Forecast**: Daily forecast aggregated with high/low temperature distribution bars.
8. **Celsius ↔ Fahrenheit Toggle**: Instant client-side unit conversion without reloading.

### 🍃 Environmental & Health Intelligence
9. **Air Quality Index (AQI)**: US AQI scale with graded safety badges and pollutant metrics (PM2.5, PM10, O₃, NO₂, SO₂, CO).
10. **UV Index with Safety Recommendations**: Semicircular gauge with sun protection guidance.
11. **Weather Signal & Alert Detection**: Automatic triggers for high wind, extreme temperatures, heat index hazard, severe precipitation, and poor air quality.

### 📊 Advanced Data & Interactivity
12. **ApexCharts Visualizations**: Interactive temperature curves and precipitation probability bar charts.
13. **Leaflet Weather Radar**: Interactive map centering on current location with layer support.
14. **City Comparison Tool**: Side-by-side comparative analysis of weather and AQI for two cities.
15. **Voice Search**: Web Speech API integration for hands-free queries.
16. **Favorite Locations**: Save and quick-switch between top cities with persistence in `localStorage`.
17. **Search History**: Recent search tracking with one-click re-search and clear history options.
18. **Dark & Light Themes**: Responsive color schemes with system theme synchronization.
19. **Internationalization (i18n)**: Full localization in 6 languages (**English, Spanish, French, German, Hindi, Japanese**).
20. **Progressive Web App (PWA)**: Offline service worker caching and installable manifest.
21. **Auto-Refresh Engine**: Non-disruptive background polling every 10 minutes.
22. **Animated Skeleton Loading**: Shimmering states for smooth data transitions.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.9+, [FastAPI](https://fastapi.tiangolo.com/), [HTTPX](https://www.python-httpx.org/), [Pydantic](https://docs.pydantic.dev/)
- **Frontend**: Vanilla HTML5, CSS3 Custom Properties (Design System), Modular ES6 JavaScript
- **Charting**: [ApexCharts](https://apexcharts.com/)
- **Mapping**: [Leaflet.js](https://leafletjs.com/)
- **Icons**: [Meteocons](https://basmilius.github.io/weather-icons/) (Animated SVG)
- **Data Source**: [Open-Meteo](https://open-meteo.com/) (100% Free, no API keys required)
- **Testing**: [Pytest](https://docs.pytest.org/), `pytest-asyncio`

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/shripadambore01-code/WeatherApp.git
cd WeatherApp
```

### 2. Set Up Virtual Environment (Optional but recommended)
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Development Server
```bash
uvicorn backend.main:app --reload --port 8000
```

Open your browser and navigate to:
```
http://localhost:8000
```
Interactive API documentation is accessible at `http://localhost:8000/docs`.

---

## 🧪 Running Tests

Execute the automated async test suite with Pytest:
```bash
pytest tests/ -v
```

---

## 📁 Project Structure

```
WeatherApp/
├── .env.example              # Environment configuration template
├── .gitignore                # Git ignore rules
├── requirements.txt          # Python dependencies
├── manifest.json             # PWA manifest
├── service-worker.js         # PWA service worker
├── README.md                 # Project documentation
│
├── backend/
│   ├── main.py               # FastAPI application entry point
│   ├── config.py             # App configuration
│   ├── routes/
│   │   ├── weather.py        # Weather and forecast proxy endpoints
│   │   ├── geocoding.py      # Search and reverse geocoding
│   │   └── air_quality.py    # AQI and pollutant endpoints
│   ├── models/
│   │   └── schemas.py        # Response validation models
│   └── utils/
│       └── weather_codes.py  # WMO weather code dictionary
│
├── frontend/
│   ├── index.html            # Single page app shell
│   ├── css/
│   │   ├── design-system.css # Tokens, resets, variables
│   │   ├── layout.css        # Responsive layouts & grids
│   │   ├── components.css    # Component styles
│   │   ├── themes.css        # Light/dark mode styles
│   │   ├── animations.css    # Keyframes & transitions
│   │   └── weather-backgrounds.css # Dynamic weather gradients
│   ├── js/
│   │   ├── app.js            # Main controller
│   │   ├── api.js            # Fetch wrapper
│   │   ├── weather.js        # Current weather view
│   │   ├── forecast.js       # Daily & hourly view
│   │   ├── charts.js         # ApexCharts integration
│   │   ├── aqi.js            # Air Quality view
│   │   ├── uv.js             # UV Index view
│   │   ├── alerts.js         # Weather condition alerts
│   │   ├── search.js         # Autocomplete search
│   │   ├── geolocation.js    # Browser location detection
│   │   ├── favorites.js      # Saved cities
│   │   ├── history.js        # Search history
│   │   ├── theme.js          # Dark/light theme switcher
│   │   ├── units.js          # °C/°F switcher
│   │   ├── voice.js          # Voice recognition
│   │   ├── map.js            # Leaflet radar map
│   │   ├── compare.js        # City comparison
│   │   ├── i18n.js           # Multi-language translation
│   │   ├── pwa.js            # PWA registration
│   │   └── utils.js          # Helpers & formatters
│   └── locales/              # Translation files (en, es, fr, de, hi, ja)
│
└── tests/
    ├── conftest.py           # Async fixtures
    └── test_weather_routes.py# Endpoint test suite
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
