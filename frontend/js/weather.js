/**
 * Atmos Weather — Current Weather Display
 * Updates all tactile hero metrics, sensor pods, range bars, and vector SVG weather icons.
 */

import { formatTemp, formatTempFull, formatWind, getWindDirection, formatTime, getWeatherDescription, getWeatherSvgIcon, getWeatherCondition, clamp } from './utils.js';

export function updateCurrentWeather(data, cityInfo, unit = 'celsius') {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily;
    const isDay = current.is_day === 1;

    // 1. City Name & Administrative Region
    const cityEl = document.getElementById('hero-city');
    if (cityEl) {
        let location = cityInfo.name || 'London';
        if (cityInfo.admin1 && !location.includes(cityInfo.admin1)) {
            location = `${cityInfo.admin1} (${cityInfo.name}), ${cityInfo.country || 'India'}`;
        } else if (cityInfo.country && !location.includes(cityInfo.country)) {
            location = `${cityInfo.name}, ${cityInfo.country}`;
        }
        cityEl.textContent = location;
    }

    // 2. Current Temperature
    const tempEl = document.getElementById('hero-temp');
    if (tempEl) {
        tempEl.textContent = formatTemp(current.temperature_2m, unit);
    }

    // 3. Weather Condition Text
    const condEl = document.getElementById('hero-condition');
    if (condEl) {
        condEl.textContent = getWeatherDescription(current.weather_code);
    }

    // 4. Feels Like Pill
    const feelsEl = document.getElementById('hero-feels-like');
    if (feelsEl) {
        feelsEl.textContent = `Feels like ${formatTempFull(current.apparent_temperature, unit)}`;
    }

    // 5. Humidity Sensor & Dynamic Dew Point
    const humidEl = document.getElementById('hero-humidity');
    if (humidEl) {
        const rh = Math.round(current.relative_humidity_2m || 0);
        humidEl.textContent = `${rh}%`;
    }
    const dewEl = document.getElementById('hero-dew-point');
    if (dewEl) {
        const t = current.temperature_2m || 20;
        const rh = current.relative_humidity_2m || 50;
        const dew = Math.round(t - ((100 - rh) / 5));
        dewEl.textContent = `Dew point ${formatTemp(dew, unit)}`;
    }

    // 6. Wind Speed, Direction & Gusts
    const windEl = document.getElementById('hero-wind');
    if (windEl) {
        const dir = getWindDirection(current.wind_direction_10m);
        windEl.textContent = `${formatWind(current.wind_speed_10m)} ${dir}`;
    }
    const gustEl = document.getElementById('hero-wind-gusts');
    if (gustEl) {
        const gust = current.wind_gusts_10m ? Math.round(current.wind_gusts_10m) : Math.round((current.wind_speed_10m || 10) * 1.3);
        gustEl.textContent = `Gusts up to ${formatWind(gust)}`;
    }

    // 7. Surface / Sea-Level Pressure & Barometer State
    const pressEl = document.getElementById('hero-pressure');
    if (pressEl) {
        const p = Math.round(current.pressure_msl || current.surface_pressure || 1013);
        pressEl.textContent = `${p} hPa`;
    }
    const pressTrendEl = document.getElementById('hero-pressure-trend');
    if (pressTrendEl) {
        const p = current.pressure_msl || current.surface_pressure || 1013;
        if (p > 1020) pressTrendEl.textContent = 'High pressure system (Fair skies)';
        else if (p < 1005) pressTrendEl.textContent = 'Low pressure system (Active storm)';
        else pressTrendEl.textContent = 'Steady barometer';
    }

    // 8. Sunrise & Sunset Rhythm
    if (daily && daily.sunrise && daily.sunset) {
        const sunriseEl = document.getElementById('hero-sunrise');
        const sunsetEl = document.getElementById('hero-sunset');
        if (sunriseEl) sunriseEl.textContent = formatTime(daily.sunrise[0], data.timezone);
        if (sunsetEl) sunsetEl.textContent = `Sunset: ${formatTime(daily.sunset[0], data.timezone)}`;
    }

    // 9. Min / Max Day Range Bar
    if (daily && daily.temperature_2m_min && daily.temperature_2m_max) {
        const minEl = document.getElementById('hero-temp-min');
        const maxEl = document.getElementById('hero-temp-max');
        const minVal = daily.temperature_2m_min[0];
        const maxVal = daily.temperature_2m_max[0];
        if (minEl) minEl.textContent = `Min: ${formatTemp(minVal, unit)}`;
        if (maxEl) maxEl.textContent = `Max: ${formatTemp(maxVal, unit)}`;

        const rangeFill = document.getElementById('hero-range-fill');
        if (rangeFill && maxVal > minVal) {
            const curT = current.temperature_2m;
            const pct = clamp(((curT - minVal) / (maxVal - minVal)) * 100, 10, 90);
            rangeFill.style.left = '0%';
            rangeFill.style.width = `${pct}%`;
        }
    }

    // 10. Hero Weather Icon (Clean Vector SVG)
    const iconContainer = document.getElementById('hero-icon-container');
    if (iconContainer) {
        iconContainer.innerHTML = getWeatherSvgIcon(current.weather_code, isDay, 88);
    }
}

export function setWeatherBackground(condition) {
    document.body.setAttribute('data-weather', condition);
}
