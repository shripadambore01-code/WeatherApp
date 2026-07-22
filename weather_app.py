"""
Weather App - Real-time weather using OpenWeatherMap API + Tkinter GUI
Author: (your name here)

Features:
- Search weather by city name
- Displays temperature (°C), humidity, wind speed
- Displays weather condition icon (fetched from OpenWeatherMap)
- Displays weather description
- Handles errors: city not found, invalid API key, no internet connection

Before running:
1. pip install requests pillow
2. Get a free API key from https://openweathermap.org/api (see README.md)
3. Paste your API key into API_KEY below, OR set it as an environment
   variable called OPENWEATHER_API_KEY (recommended, safer).
"""

import os
import io
import tkinter as tk
from tkinter import ttk, messagebox

import requests
from PIL import Image, ImageTk

# ----------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------

# Option 1: paste your key directly here (quick, but not great for sharing c
API_KEY = "0fa9b6f39106bfc809dfe71e5aa8f235"

# Option 2 (safer): read it from an environment variable instead.
# If OPENWEATHER_API_KEY is set, it overrides the hardcoded value above.
API_KEY = os.environ.get("OPENWEATHER_API_KEY", API_KEY)

BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
ICON_URL = "https://openweathermap.org/img/wn/{icon}@2x.png"

REQUEST_TIMEOUT = 8  # seconds, so the app never freezes forever on a bad connection


# ----------------------------------------------------------------------
# APP CLASS
# ----------------------------------------------------------------------

class WeatherApp(tk.Tk):
    """Main application window."""

    def __init__(self):
        super().__init__()

        self.title("Weather App")
        self.geometry("380x520")
        self.resizable(False, False)
        self.configure(bg="#1e293b")  # slate-800 background

        # Keep a reference to the icon image so it doesn't get garbage collected
        self.icon_image = None

        self._build_widgets()

    # ------------------------------------------------------------------
    # UI CONSTRUCTION
    # ------------------------------------------------------------------
    def _build_widgets(self):
        # --- Title ---
        title_label = tk.Label(
            self, text="🌤️  Weather App",
            font=("Segoe UI", 20, "bold"),
            bg="#1e293b", fg="white"
        )
        title_label.pack(pady=(20, 10))

        # --- Search bar ---
        search_frame = tk.Frame(self, bg="#1e293b")
        search_frame.pack(pady=5)

        self.city_entry = ttk.Entry(search_frame, width=22, font=("Segoe UI", 12))
        self.city_entry.grid(row=0, column=0, padx=(0, 8))
        self.city_entry.insert(0, "Enter city name")
        self.city_entry.bind("<FocusIn>", self._clear_placeholder)
        self.city_entry.bind("<Return>", lambda event: self.fetch_weather())

        search_button = tk.Button(
            search_frame, text="Search", command=self.fetch_weather,
            bg="#3b82f6", fg="white", font=("Segoe UI", 11, "bold"),
            relief="flat", padx=12, pady=4, cursor="hand2"
        )
        search_button.grid(row=0, column=1)

        # --- Card that holds the results ---
        self.card = tk.Frame(self, bg="#334155", bd=0)
        self.card.pack(pady=25, padx=25, fill="both", expand=True)

        self.city_label = tk.Label(
            self.card, text="", font=("Segoe UI", 16, "bold"),
            bg="#334155", fg="white"
        )
        self.city_label.pack(pady=(20, 5))

        self.icon_label = tk.Label(self.card, bg="#334155")
        self.icon_label.pack(pady=5)

        self.temp_label = tk.Label(
            self.card, text="", font=("Segoe UI", 32, "bold"),
            bg="#334155", fg="#38bdf8"
        )
        self.temp_label.pack()

        self.desc_label = tk.Label(
            self.card, text="", font=("Segoe UI", 13, "italic"),
            bg="#334155", fg="#cbd5e1"
        )
        self.desc_label.pack(pady=(0, 15))

        # --- Details row: humidity & wind ---
        details_frame = tk.Frame(self.card, bg="#334155")
        details_frame.pack(pady=10)

        self.humidity_label = tk.Label(
            details_frame, text="💧 Humidity: --%",
            font=("Segoe UI", 11), bg="#334155", fg="white"
        )
        self.humidity_label.grid(row=0, column=0, padx=15)

        self.wind_label = tk.Label(
            details_frame, text="💨 Wind: -- m/s",
            font=("Segoe UI", 11), bg="#334155", fg="white"
        )
        self.wind_label.grid(row=0, column=1, padx=15)

        self.feels_like_label = tk.Label(
            details_frame,
            text="🌡️ Feels Like: --°C",
            font=("Segoe UI", 11),
            bg="#334155",
            fg="white"
        )
        self.feels_like_label.grid(row=1, column=0, columnspan=2, pady=8)

        # --- Status bar for errors / loading messages ---
        self.status_label = tk.Label(
            self, text="", font=("Segoe UI", 10),
            bg="#1e293b", fg="#f87171", wraplength=340
        )
        self.status_label.pack(pady=(0, 10))

    def _clear_placeholder(self, event):
        """Removes the placeholder text the first time the entry gets focus."""
        if self.city_entry.get() == "Enter city name":
            self.city_entry.delete(0, tk.END)

    # ------------------------------------------------------------------
    # CORE LOGIC
    # ------------------------------------------------------------------
    def fetch_weather(self):
        """Reads the city from the entry box, calls the API, and updates the UI."""
        city = self.city_entry.get().strip()
        self.status_label.config(text="")

        # --- Basic input validation ---
        if not city or city == "Enter city name":
            self.status_label.config(text="Please enter a city name.")
            return

        if not API_KEY or API_KEY == "PASTE_YOUR_API_KEY_HERE":
            messagebox.showerror(
                "Missing API Key",
                "Please set your OpenWeatherMap API key in weather_app.py "
                "(or as the OPENWEATHER_API_KEY environment variable)."
            )
            return

        self.status_label.config(text="Loading...", fg="#38bdf8")
        self.update_idletasks()  # force the UI to repaint before the (blocking) request

        params = {
            "q": city,
            "appid": API_KEY,
            "units": "metric"  # gives temperature in Celsius directly
        }

        try:
            response = requests.get(BASE_URL, params=params, timeout=REQUEST_TIMEOUT)

            # --- Handle specific HTTP error codes from OpenWeatherMap ---
            if response.status_code == 404:
                self._show_error("City not found. Check the spelling and try again.")
                return
            elif response.status_code == 401:
                self._show_error("Invalid API key. Double-check your OpenWeatherMap key.")
                return
            elif response.status_code != 200:
                self._show_error(f"Unexpected error (status code {response.status_code}).")
                return

            data = response.json()
            self._update_ui(data)
            self.status_label.config(text="")

        except requests.exceptions.ConnectionError:
            self._show_error("No internet connection. Please check your network.")
        except requests.exceptions.Timeout:
            self._show_error("The request timed out. Please try again.")
        except requests.exceptions.RequestException as e:
            # Catch-all for any other 'requests' related issue
            self._show_error(f"Network error: {e}")
        except (KeyError, ValueError):
            # KeyError -> unexpected JSON structure, ValueError -> bad JSON
            self._show_error("Received an unexpected response from the server.")

    def _show_error(self, message: str):
        """Displays an error message and clears any stale weather data."""
        self.status_label.config(text=message, fg="#f87171")
        self.city_label.config(text="")
        self.temp_label.config(text="")
        self.desc_label.config(text="")
        self.humidity_label.config(text="💧 Humidity: --%")
        self.wind_label.config(text="💨 Wind: -- m/s")
        self.feels_like_label.config(text="🌡️ Feels Like: --°C")
        self.icon_label.config(image="")
        self.icon_image = None

    def _update_ui(self, data: dict):
        """Populates the widgets with data returned from the API."""
        city_name = data.get("name", "Unknown")
        country = data.get("sys", {}).get("country", "")

        main = data.get("main", {})
        temp = main.get("temp")
        humidity = main.get("humidity")
        feels_like = main.get("feels_like")

        wind = data.get("wind", {}).get("speed")

        weather_list = data.get("weather", [])
        description = weather_list[0].get("description", "").title() if weather_list else ""
        icon_code = weather_list[0].get("icon", "") if weather_list else ""

        self.city_label.config(text=f"{city_name}, {country}")
        self.temp_label.config(text=f"{temp:.1f}°C" if temp is not None else "--°C")
        self.desc_label.config(text=description)
        self.humidity_label.config(text=f"💧 Humidity: {humidity}%" if humidity is not None else "💧 Humidity: --%")
        self.wind_label.config(text=f"💨 Wind: {wind} m/s" if wind is not None else "💨 Wind: -- m/s")
        self.feels_like_label.config(
            text=f"🌡️ Feels Like: {feels_like:.1f}°C"
            if feels_like is not None
            else "🌡️ Feels Like: --°C"
        )

        self._load_icon(icon_code)

    def _load_icon(self, icon_code: str):
        """Downloads and displays the weather condition icon. Fails silently if unavailable."""
        if not icon_code:
            self.icon_label.config(image="")
            self.icon_image = None
            return

        try:
            url = ICON_URL.format(icon=icon_code)
            response = requests.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()

            image_data = Image.open(io.BytesIO(response.content))
            self.icon_image = ImageTk.PhotoImage(image_data)
            self.icon_label.config(image=self.icon_image)

        except requests.exceptions.RequestException:
            # Icon is a nice-to-have; don't crash the app if it fails to load
            self.icon_label.config(image="")
            self.icon_image = None


# ----------------------------------------------------------------------
# ENTRY POINT
# ----------------------------------------------------------------------
if __name__ == "__main__":
    app = WeatherApp()
    app.mainloop()
