/**
 * Atmos Weather — Air Quality Display
 * Renders AQI data from Open-Meteo Air Quality API
 */

import { getAQIInfo, clamp } from './utils.js';

/**
 * Update the AQI section with air quality data
 * @param {Object} data - Open-Meteo air quality response
 */
export function updateAQI(data) {
    if (!data || !data.current) return;

    const current = data.current;
    const aqi = current.us_aqi;
    const info = getAQIInfo(aqi);

    // AQI score
    const scoreEl = document.getElementById('aqi-score');
    if (scoreEl) {
        scoreEl.textContent = aqi !== null && aqi !== undefined ? Math.round(aqi) : '--';
        scoreEl.style.color = info.color;
    }

    // AQI status label
    const statusEl = document.getElementById('aqi-status');
    if (statusEl) {
        statusEl.textContent = info.label;
        statusEl.style.color = info.color;
    }

    // Scale marker position (0-500 AQI mapped to 0-100%)
    const markerEl = document.getElementById('aqi-marker');
    if (markerEl) {
        const position = clamp((aqi / 500) * 100, 0, 100);
        markerEl.style.left = `${position}%`;
    }

    // Pollutant breakdown
    const pollutants = {
        'PM2.5': current.pm2_5,
        'PM10': current.pm10,
        'O₃': current.ozone,
        'NO₂': current.nitrogen_dioxide,
        'SO₂': current.sulphur_dioxide,
        'CO': current.carbon_monoxide
    };

    const gridEl = document.querySelector('.pollutants-grid');
    if (gridEl) {
        gridEl.innerHTML = Object.entries(pollutants)
            .filter(([, val]) => val !== null && val !== undefined)
            .map(([name, val]) => `
                <div class="pollutant">
                    <span class="label">${name}</span>
                    <span class="value">${typeof val === 'number' ? val.toFixed(1) : val}</span>
                    <span class="unit">μg/m³</span>
                </div>
            `).join('');
    }

    // Show the section
    const section = document.getElementById('aqi-section');
    if (section) section.classList.remove('hidden');
}
