/**
 * Atmos Weather — Main Application
 * Orchestrates all modules and manages the app lifecycle
 */

import { fetchWeather, fetchAQI, searchCities, reverseGeocode } from './api.js';
import { updateCurrentWeather, setWeatherBackground } from './weather.js';
import { updateDailyForecast, updateHourlyForecast } from './forecast.js';
import { initCharts, updateChartsTheme, destroyCharts } from './charts.js';
import { updateAQI } from './aqi.js';
import { updateUV } from './uv.js';
import { checkAlerts, renderAlerts } from './alerts.js';
import { initSearch } from './search.js';
import { getCurrentPosition, initGeolocation } from './geolocation.js';
import { initFavorites, addFavorite, removeFavorite, isFavorite, renderFavorites } from './favorites.js';
import { addToHistory, renderHistory } from './history.js';
import { initTheme, getTheme } from './theme.js';
import { initUnits, getUnit } from './units.js';
import { initVoice } from './voice.js';
import { initMap, updateMapCenter } from './map.js';
import { initCompare } from './compare.js';
import { initI18n, t } from './i18n.js';
import { initPWA } from './pwa.js';
import { showToast, retrieve, store, getWeatherCondition } from './utils.js';

/* ─────────────────── State ─────────────────── */

const state = {
    currentCity: null,       // { name, country, lat, lon, admin1, timezone }
    weatherData: null,       // Full Open-Meteo response
    aqiData: null,           // Air quality response
    autoRefreshTimer: null,  // Interval ID
    refreshInterval: 600000, // 10 minutes in ms
    lastUpdated: null,       // Date of last data fetch
    isLoading: false
};

/* ─────────────────── Init ─────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c⛅ Atmos Weather', 'font-size:24px;font-weight:bold;color:#2196F3');
    console.log('%cAdvanced Weather App — Powered by Open-Meteo', 'color:#888');

    // Initialize all modules
    initTheme();
    initUnits();
    initSearch();
    initFavorites();
    renderHistory();
    initVoice();
    initCompare();
    await initI18n();
    initPWA();

    // Setup event listeners
    setupEventListeners();

    // Load weather — check for last city or use geolocation
    const lastCity = retrieve('lastCity');
    if (lastCity) {
        await loadWeather(lastCity.lat, lastCity.lon, lastCity);
    } else {
        await initGeolocation();
    }

    // Setup auto-refresh
    startAutoRefresh();

    // Hide loading overlay
    hideLoadingOverlay();
});

/* ─────────────────── Event Listeners ─────────────────── */

function setupEventListeners() {
    // City selected from search or favorites
    window.addEventListener('citySelected', (e) => {
        const city = e.detail;
        loadWeather(city.lat, city.lon, city);
        addToHistory(city);
        renderHistory();
    });

    // Geolocation result
    window.addEventListener('locationDetected', async (e) => {
        const { lat, lon } = e.detail;
        try {
            const result = await reverseGeocode(lat, lon);
            if (result && result.results && result.results.length > 0) {
                const city = result.results[0];
                const cityData = {
                    name: city.name,
                    country: city.country || '',
                    lat: city.latitude,
                    lon: city.longitude,
                    admin1: city.admin1 || '',
                    timezone: city.timezone || ''
                };
                loadWeather(lat, lon, cityData);
            } else {
                loadWeather(lat, lon, { name: 'My Location', country: '', lat, lon });
            }
        } catch {
            loadWeather(lat, lon, { name: 'My Location', country: '', lat, lon });
        }
    });

    // Unit change
    window.addEventListener('unitchange', () => {
        if (state.weatherData) {
            updateCurrentWeather(state.weatherData, state.currentCity, getUnit());
            if (state.weatherData.daily) {
                updateDailyForecast(state.weatherData.daily, state.weatherData.daily_units, getUnit());
            }
            if (state.weatherData.hourly) {
                updateHourlyForecast(state.weatherData.hourly, state.weatherData.hourly_units, getUnit());
            }
        }
    });

    // Theme change
    window.addEventListener('themechange', (e) => {
        const isDark = e.detail.theme === 'dark';
        updateChartsTheme(isDark);
    });

    // Sidebar toggle (mobile)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    const sidebarClose = document.getElementById('sidebar-close');
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Favorite toggle
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            if (!state.currentCity) return;
            if (isFavorite(state.currentCity.lat, state.currentCity.lon)) {
                removeFavorite(state.currentCity.lat, state.currentCity.lon);
                favoriteBtn.classList.remove('active');
                favoriteBtn.setAttribute('aria-label', 'Add to favorites');
                showToast(`${state.currentCity.name} removed from favorites`, 'info');
            } else {
                addFavorite(state.currentCity);
                favoriteBtn.classList.add('active');
                favoriteBtn.setAttribute('aria-label', 'Remove from favorites');
                showToast(`${state.currentCity.name} added to favorites`, 'success');
            }
            renderFavorites();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (state.currentCity) {
                loadWeather(state.currentCity.lat, state.currentCity.lon, state.currentCity);
                showToast('Weather data refreshed', 'success');
            }
        });
    }

    // Keyboard shortcut: / to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            const search = document.getElementById('search-input');
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
            e.preventDefault();
            search?.focus();
        }
    });
}

/* ─────────────────── Core Data Loading ─────────────────── */

/**
 * Load weather data for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} cityInfo - City metadata
 */
async function loadWeather(lat, lon, cityInfo = {}) {
    if (state.isLoading) return;
    state.isLoading = true;
    showLoadingState(true);

    try {
        // Fetch weather and AQI in parallel
        const [weatherResponse, aqiResponse] = await Promise.allSettled([
            fetchWeather(lat, lon),
            fetchAQI(lat, lon)
        ]);

        const weatherData = weatherResponse.status === 'fulfilled' ? weatherResponse.value : null;
        const aqiData = aqiResponse.status === 'fulfilled' ? aqiResponse.value : null;

        if (!weatherData || weatherData.error) {
            const msg = weatherData?.message || 'Failed to fetch weather data';
            showToast(msg, 'error');
            showLoadingState(false);
            state.isLoading = false;
            return;
        }

        // Update state
        state.weatherData = weatherData;
        state.aqiData = aqiData;
        state.currentCity = {
            name: cityInfo.name || 'Unknown',
            country: cityInfo.country || '',
            lat,
            lon,
            admin1: cityInfo.admin1 || '',
            timezone: weatherData.timezone || cityInfo.timezone || ''
        };
        state.lastUpdated = new Date();

        // Save last city
        store('lastCity', state.currentCity);

        // Update all UI sections
        const unit = getUnit();

        // Current weather
        updateCurrentWeather(weatherData, state.currentCity, unit);

        // Set atmospheric background
        if (weatherData.current) {
            const condition = getWeatherCondition(
                weatherData.current.weather_code,
                weatherData.current.is_day === 1
            );
            setWeatherBackground(condition);
        }

        // Forecasts
        if (weatherData.daily) {
            updateDailyForecast(weatherData.daily, weatherData.daily_units, unit);
        }
        if (weatherData.hourly) {
            updateHourlyForecast(weatherData.hourly, weatherData.hourly_units, unit);
            initCharts(weatherData.hourly, getTheme() === 'dark');
        }

        // AQI
        if (aqiData && !aqiData.error) {
            updateAQI(aqiData);
        }

        // UV Index (from daily data)
        if (weatherData.daily && weatherData.daily.uv_index_max) {
            updateUV(weatherData.daily.uv_index_max[0]);
        }

        // Weather Alerts
        const alerts = checkAlerts(weatherData, aqiData);
        renderAlerts(alerts);

        // Map
        updateMapCenter(lat, lon, state.currentCity.name);

        // Update favorite button state
        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
            if (isFavorite(lat, lon)) {
                favoriteBtn.classList.add('active');
            } else {
                favoriteBtn.classList.remove('active');
            }
        }

        // Update last updated time
        updateLastUpdated();

        // Update page title
        document.title = `${state.currentCity.name} Weather — Atmos`;

    } catch (error) {
        console.error('Error loading weather:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
        showLoadingState(false);
        state.isLoading = false;
    }
}

/* ─────────────────── Auto Refresh ─────────────────── */

function startAutoRefresh() {
    stopAutoRefresh();
    state.autoRefreshTimer = setInterval(() => {
        if (state.currentCity && !document.hidden) {
            loadWeather(state.currentCity.lat, state.currentCity.lon, state.currentCity);
            updateRefreshIndicator();
        }
    }, state.refreshInterval);

    // Update countdown display every second
    updateRefreshIndicator();
}

function stopAutoRefresh() {
    if (state.autoRefreshTimer) {
        clearInterval(state.autoRefreshTimer);
        state.autoRefreshTimer = null;
    }
}

function updateRefreshIndicator() {
    const indicator = document.getElementById('refresh-indicator');
    if (!indicator || !state.lastUpdated) return;

    const elapsed = Date.now() - state.lastUpdated.getTime();
    const remaining = Math.max(0, state.refreshInterval - elapsed);
    const minutes = Math.ceil(remaining / 60000);

    indicator.textContent = `Auto-refresh in ${minutes}m`;
    indicator.title = `Last updated: ${state.lastUpdated.toLocaleTimeString()}`;
}

function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && state.lastUpdated) {
        el.textContent = `Updated ${state.lastUpdated.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }
}

/* ─────────────────── UI Helpers ─────────────────── */

function showLoadingState(show) {
    const skeleton = document.getElementById('loading-skeleton');
    const content = document.getElementById('weather-content');
    const heroSection = document.getElementById('hero-section');

    if (show) {
        skeleton?.classList.remove('hidden');
        heroSection?.classList.add('loading');
    } else {
        skeleton?.classList.add('hidden');
        heroSection?.classList.remove('loading');
        content?.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 600);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

// Expose loadWeather globally for other modules
window.atmosLoadWeather = loadWeather;
window.atmosState = state;
