/**
 * Atmos Weather — Forecast Display
 * Renders daily and hourly forecast from Open-Meteo data
 */

import { formatTemp, formatDate, formatHour, getWeatherDescription, getWeatherIcon } from './utils.js';

/**
 * Update the 7-day daily forecast section
 * @param {Object} daily - Open-Meteo daily data object
 * @param {Object} units - Open-Meteo daily_units object
 * @param {string} unit - 'celsius' or 'fahrenheit'
 */
export function updateDailyForecast(daily, units, unit = 'celsius') {
    const container = document.getElementById('daily-container');
    if (!container || !daily || !daily.time) return;

    container.innerHTML = '';

    daily.time.forEach((date, i) => {
        const high = daily.temperature_2m_max?.[i];
        const low = daily.temperature_2m_min?.[i];
        const code = daily.weather_code?.[i] ?? 0;
        const precipProb = daily.precipitation_probability_max?.[i] ?? 0;
        const precip = daily.precipitation_sum?.[i] ?? 0;
        const windMax = daily.wind_speed_10m_max?.[i] ?? 0;

        const iconName = getWeatherIcon(code, true);
        const description = getWeatherDescription(code);

        const row = document.createElement('div');
        row.className = 'daily-row';
        row.style.animationDelay = `${i * 60}ms`;
        row.innerHTML = `
            <div class="daily-day">${formatDate(date, 'short')}</div>
            <div class="daily-icon">
                <img src="https://basmilius.github.io/weather-icons/production/fill/all/${iconName}.svg"
                     alt="${description}" width="36" height="36" loading="lazy"
                     onerror="this.style.display='none'" />
            </div>
            <div class="daily-desc">${description}</div>
            <div class="daily-precip">
                ${precipProb > 0 ? `<span class="precip-badge">${precipProb}%</span>` : ''}
            </div>
            <div class="daily-temps">
                <span class="temp-high">${formatTemp(high, unit)}</span>
                <div class="temp-bar">
                    <div class="temp-range" style="
                        left: ${tempBarPosition(low, daily.temperature_2m_min, daily.temperature_2m_max)}%;
                        width: ${tempBarWidth(low, high, daily.temperature_2m_min, daily.temperature_2m_max)}%;
                    "></div>
                </div>
                <span class="temp-low">${formatTemp(low, unit)}</span>
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * Update the 24-hour hourly forecast section
 * @param {Object} hourly - Open-Meteo hourly data object
 * @param {Object} units - Open-Meteo hourly_units object
 * @param {string} unit - 'celsius' or 'fahrenheit'
 */
export function updateHourlyForecast(hourly, units, unit = 'celsius') {
    const container = document.getElementById('hourly-container');
    if (!container || !hourly || !hourly.time) return;

    container.innerHTML = '';

    // Find the current hour index
    const now = new Date();
    let startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        if (new Date(hourly.time[i]) >= now) {
            startIdx = i;
            break;
        }
    }

    // Show next 24 hours
    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    for (let i = startIdx; i < endIdx; i++) {
        const time = hourly.time[i];
        const temp = hourly.temperature_2m?.[i];
        const code = hourly.weather_code?.[i] ?? 0;
        const isDay = hourly.is_day?.[i] === 1;
        const precipProb = hourly.precipitation_probability?.[i] ?? 0;

        const iconName = getWeatherIcon(code, isDay);
        const delay = (i - startIdx) * 40;

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.style.animationDelay = `${delay}ms`;
        card.innerHTML = `
            <div class="hourly-time">${formatHour(time)}</div>
            <img src="https://basmilius.github.io/weather-icons/production/fill/all/${iconName}.svg"
                 alt="${getWeatherDescription(code)}" class="hourly-icon" width="32" height="32"
                 loading="lazy" onerror="this.style.display='none'" />
            <div class="hourly-temp">${formatTemp(temp, unit)}</div>
            ${precipProb > 0 ? `<div class="hourly-precip">${precipProb}%</div>` : ''}
        `;
        container.appendChild(card);
    }
}

/* ─── Helpers for temperature bar visualization ─── */

function tempBarPosition(low, allMins, allMaxes) {
    if (!allMins || !allMaxes) return 0;
    const globalMin = Math.min(...allMins.filter(v => v !== null));
    const globalMax = Math.max(...allMaxes.filter(v => v !== null));
    const range = globalMax - globalMin || 1;
    return ((low - globalMin) / range) * 100;
}

function tempBarWidth(low, high, allMins, allMaxes) {
    if (!allMins || !allMaxes) return 50;
    const globalMin = Math.min(...allMins.filter(v => v !== null));
    const globalMax = Math.max(...allMaxes.filter(v => v !== null));
    const range = globalMax - globalMin || 1;
    return ((high - low) / range) * 100;
}
