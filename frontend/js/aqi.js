/**
 * Atmos Weather — Air Quality Display
 * Renders live AQI data, scale needle position, and individual pollutant concentrations.
 */

import { getAQIInfo, clamp } from './utils.js';

/**
 * Update the AQI section with real-time air quality telemetry
 * @param {Object} data - Open-Meteo air quality response
 */
export function updateAQI(data) {
    if (!data || !data.current) return;

    const current = data.current;
    const aqi = current.us_aqi ?? current.european_aqi ?? 35;
    const info = getAQIInfo(aqi);

    // 1. AQI Numerical Score
    const scoreEl = document.getElementById('aqi-value') || document.getElementById('aqi-score');
    if (scoreEl) {
        scoreEl.textContent = aqi !== null && aqi !== undefined ? Math.round(aqi) : '--';
        scoreEl.style.color = info.color;
    }

    // 2. AQI Status Label / Badge
    const labelEl = document.getElementById('aqi-label') || document.getElementById('aqi-status');
    if (labelEl) {
        labelEl.textContent = info.label;
        labelEl.style.background = info.color;
        labelEl.style.color = '#ffffff';
    }

    // 3. AQI Scale Needle Position (0-500 mapped to 0-100%)
    const needleEl = document.getElementById('aqi-needle') || document.getElementById('aqi-marker');
    if (needleEl) {
        const percent = clamp((aqi / 300) * 100, 4, 96);
        needleEl.style.left = `${percent}%`;
    }

    // 4. Pollutants Individual Pods
    const pm25El = document.getElementById('pm25-val');
    const pm10El = document.getElementById('pm10-val');
    const o3El = document.getElementById('o3-val');
    const no2El = document.getElementById('no2-val');

    if (pm25El && current.pm2_5 !== undefined) {
        pm25El.textContent = `${typeof current.pm2_5 === 'number' ? Math.round(current.pm2_5) : current.pm2_5} µg/m³`;
    }
    if (pm10El && current.pm10 !== undefined) {
        pm10El.textContent = `${typeof current.pm10 === 'number' ? Math.round(current.pm10) : current.pm10} µg/m³`;
    }
    if (o3El && current.ozone !== undefined) {
        o3El.textContent = `${typeof current.ozone === 'number' ? Math.round(current.ozone) : current.ozone} µg/m³`;
    }
    if (no2El && current.nitrogen_dioxide !== undefined) {
        no2El.textContent = `${typeof current.nitrogen_dioxide === 'number' ? Math.round(current.nitrogen_dioxide) : current.nitrogen_dioxide} µg/m³`;
    }

    // Fallback: update pollutants list grid if dynamic
    const pollutantsGrid = document.querySelector('.pollutants-grid');
    if (pollutantsGrid) {
        const pollutants = {
            'PM2.5': current.pm2_5,
            'PM10': current.pm10,
            'O₃': current.ozone,
            'NO₂': current.nitrogen_dioxide,
            'SO₂': current.sulphur_dioxide,
            'CO': current.carbon_monoxide
        };
        pollutantsGrid.innerHTML = Object.entries(pollutants)
            .filter(([, val]) => val !== null && val !== undefined)
            .map(([name, val]) => `
                <div class="pollutant">
                    <span class="label">${name}</span>
                    <span class="value">${typeof val === 'number' ? val.toFixed(1) : val}</span>
                    <span class="unit">µg/m³</span>
                </div>
            `).join('');
    }

    const section = document.getElementById('aqi-section');
    if (section) section.classList.remove('hidden');
}
