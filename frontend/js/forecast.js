/**
 * Atmos Weather — Forecast Display
 * Renders daily and hourly forecast using inline Vector SVG icons for 100% reliability.
 */

import { formatTemp, formatDate, formatHour, getWeatherDescription, getWeatherSvgIcon } from './utils.js';

export function updateDailyForecast(daily, units, unit = 'celsius') {
    const container = document.getElementById('daily-container');
    if (!container || !daily || !daily.time) return;

    container.innerHTML = '';

    daily.time.forEach((date, i) => {
        const high = daily.temperature_2m_max?.[i];
        const low = daily.temperature_2m_min?.[i];
        const code = daily.weather_code?.[i] ?? 0;
        const description = getWeatherDescription(code);
        const svgIcon = getWeatherSvgIcon(code, true, 32);

        const row = document.createElement('div');
        row.className = 'daily-row';
        row.style.animationDelay = `${i * 50}ms`;
        row.innerHTML = `
            <div class="daily-day">${formatDate(date, 'short')}</div>
            <div class="daily-icon">${svgIcon}</div>
            <div class="daily-desc">${description}</div>
            <div class="daily-temps">
                <span class="temp-low">${formatTemp(low, unit)}</span>
                <div class="temp-bar">
                    <div class="temp-range" style="
                        left: ${tempBarPosition(low, daily.temperature_2m_min, daily.temperature_2m_max)}%;
                        width: ${tempBarWidth(low, high, daily.temperature_2m_min, daily.temperature_2m_max)}%;
                    "></div>
                </div>
                <span class="temp-high">${formatTemp(high, unit)}</span>
            </div>
        `;
        container.appendChild(row);
    });
}

export function updateHourlyForecast(hourly, units, unit = 'celsius') {
    const container = document.getElementById('hourly-container');
    if (!container || !hourly || !hourly.time) return;

    container.innerHTML = '';

    const now = new Date();
    let startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        if (new Date(hourly.time[i]) >= now) {
            startIdx = i;
            break;
        }
    }

    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    for (let i = startIdx; i < endIdx; i++) {
        const time = hourly.time[i];
        const temp = hourly.temperature_2m?.[i];
        const code = hourly.weather_code?.[i] ?? 0;
        const isDay = hourly.is_day?.[i] === 1;
        const precipProb = hourly.precipitation_probability?.[i] ?? 0;
        const svgIcon = getWeatherSvgIcon(code, isDay, 28);
        const delay = (i - startIdx) * 30;

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.style.animationDelay = `${delay}ms`;
        card.innerHTML = `
            <div class="hourly-time">${formatHour(time)}</div>
            <div class="hourly-icon">${svgIcon}</div>
            <div class="hourly-temp">${formatTemp(temp, unit)}</div>
            ${precipProb > 0 ? `<div class="hourly-precip">${precipProb}%</div>` : ''}
        `;
        container.appendChild(card);
    }
}

function tempBarPosition(low, allMins, allMaxes) {
    if (!allMins || !allMaxes) return 0;
    const globalMin = Math.min(...allMins.filter(v => v !== null));
    const globalMax = Math.max(...allMaxes.filter(v => v !== null));
    const range = globalMax - globalMin || 1;
    return Math.max(0, Math.min(90, ((low - globalMin) / range) * 100));
}

function tempBarWidth(low, high, allMins, allMaxes) {
    if (!allMins || !allMaxes) return 50;
    const globalMin = Math.min(...allMins.filter(v => v !== null));
    const globalMax = Math.max(...allMaxes.filter(v => v !== null));
    const range = globalMax - globalMin || 1;
    return Math.max(15, Math.min(100, ((high - low) / range) * 100));
}
