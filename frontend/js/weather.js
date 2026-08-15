/**
 * Atmos Weather — Current Weather Display
 * Updates the hero section using inline Vector SVG icons for 100% reliability.
 */

import { formatTemp, formatTempFull, formatWind, getWindDirection, formatTime, getWeatherDescription, getWeatherSvgIcon, getWeatherCondition } from './utils.js';

export function updateCurrentWeather(data, cityInfo, unit = 'celsius') {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily;
    const isDay = current.is_day === 1;

    // City name
    const cityEl = document.getElementById('hero-city');
    if (cityEl) {
        const location = cityInfo.country
            ? `${cityInfo.name}, ${cityInfo.country}`
            : cityInfo.name;
        cityEl.textContent = location;
    }

    // Current temperature
    const tempEl = document.getElementById('hero-temp');
    if (tempEl) {
        tempEl.textContent = formatTemp(current.temperature_2m, unit);
    }

    // Weather condition
    const condEl = document.getElementById('hero-condition');
    if (condEl) {
        condEl.textContent = getWeatherDescription(current.weather_code);
    }

    // Feels like
    const feelsEl = document.getElementById('hero-feels-like');
    if (feelsEl) {
        feelsEl.textContent = `Feels like ${formatTempFull(current.apparent_temperature, unit)}`;
    }

    // Humidity
    const humidEl = document.getElementById('hero-humidity');
    if (humidEl) {
        humidEl.textContent = `${Math.round(current.relative_humidity_2m || 0)}%`;
    }

    // Wind
    const windEl = document.getElementById('hero-wind');
    if (windEl) {
        const dir = getWindDirection(current.wind_direction_10m);
        windEl.textContent = `${formatWind(current.wind_speed_10m)} ${dir}`;
    }

    // Pressure
    const pressEl = document.getElementById('hero-pressure');
    if (pressEl) {
        pressEl.textContent = `${Math.round(current.pressure_msl || current.surface_pressure || 0)} hPa`;
    }

    // Sunrise / Sunset (from daily data)
    if (daily && daily.sunrise && daily.sunset) {
        const sunriseEl = document.getElementById('hero-sunrise');
        const sunsetEl = document.getElementById('hero-sunset');
        if (sunriseEl) sunriseEl.textContent = formatTime(daily.sunrise[0], data.timezone);
        if (sunsetEl) sunsetEl.textContent = formatTime(daily.sunset[0], data.timezone);
    }

    // Min / Max Day Range
    if (daily && daily.temperature_2m_min && daily.temperature_2m_max) {
        const minEl = document.getElementById('hero-temp-min');
        const maxEl = document.getElementById('hero-temp-max');
        const minVal = daily.temperature_2m_min[0];
        const maxVal = daily.temperature_2m_max[0];
        if (minEl) minEl.textContent = `Min: ${formatTemp(minVal, unit)}`;
        if (maxEl) maxEl.textContent = `Max: ${formatTemp(maxVal, unit)}`;
    }

    // Hero Weather Icon (Clean Inline Vector SVG)
    const iconContainer = document.getElementById('hero-icon-container');
    if (iconContainer) {
        iconContainer.innerHTML = getWeatherSvgIcon(current.weather_code, isDay, 88);
    }
}

export function setWeatherBackground(condition) {
    document.body.setAttribute('data-weather', condition);
}
