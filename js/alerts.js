/**
 * Atmos Weather — Weather Alerts / Signal Detection
 * Analyzes weather data for dangerous conditions and renders alerts
 */

import { getAQIInfo } from './utils.js';

/**
 * Check current weather data for alert-worthy conditions
 * @param {Object} weatherData - Full Open-Meteo weather response
 * @param {Object} aqiData - Open-Meteo air quality response
 * @returns {Array<Object>} Array of alert objects
 */
export function checkAlerts(weatherData, aqiData) {
    const alerts = [];
    if (!weatherData || !weatherData.current) return alerts;

    const current = weatherData.current;
    const daily = weatherData.daily;

    // High wind (> 40 km/h)
    const windSpeed = current.wind_speed_10m || 0;
    const windGusts = current.wind_gusts_10m || 0;
    if (windSpeed > 40 || windGusts > 60) {
        alerts.push({
            type: 'wind',
            severity: windGusts > 80 ? 'danger' : 'warning',
            title: windGusts > 80 ? 'Severe Wind Warning' : 'High Wind Advisory',
            message: `Wind speeds of ${Math.round(windSpeed)} km/h with gusts up to ${Math.round(windGusts)} km/h.`,
            icon: '💨'
        });
    }

    // Extreme heat (> 40°C)
    const temp = current.temperature_2m || 0;
    if (temp > 40) {
        alerts.push({
            type: 'heat',
            severity: 'danger',
            title: 'Extreme Heat Warning',
            message: `Temperature of ${Math.round(temp)}°C. Stay hydrated and avoid prolonged sun exposure.`,
            icon: '🔥'
        });
    } else if (temp > 35) {
        alerts.push({
            type: 'heat',
            severity: 'warning',
            title: 'Heat Advisory',
            message: `Temperature of ${Math.round(temp)}°C. Take precautions against heat stress.`,
            icon: '☀️'
        });
    }

    // Extreme cold (< -10°C)
    if (temp < -10) {
        alerts.push({
            type: 'cold',
            severity: temp < -25 ? 'danger' : 'warning',
            title: temp < -25 ? 'Extreme Cold Warning' : 'Cold Advisory',
            message: `Temperature of ${Math.round(temp)}°C. Risk of frostbite and hypothermia.`,
            icon: '🥶'
        });
    }

    // Heat index risk (humidity > 85% AND temp > 30°C)
    const humidity = current.relative_humidity_2m || 0;
    if (humidity > 85 && temp > 30) {
        alerts.push({
            type: 'heat-index',
            severity: 'warning',
            title: 'Heat Index Warning',
            message: `High humidity (${Math.round(humidity)}%) combined with ${Math.round(temp)}°C creates dangerous heat index.`,
            icon: '🌡️'
        });
    }

    // Poor AQI (> 150)
    if (aqiData && aqiData.current) {
        const aqi = aqiData.current.us_aqi || 0;
        if (aqi > 150) {
            const aqiInfo = getAQIInfo(aqi);
            alerts.push({
                type: 'aqi',
                severity: aqi > 200 ? 'danger' : 'warning',
                title: `${aqiInfo.label} Air Quality`,
                message: `US AQI is ${Math.round(aqi)}. ${aqi > 200 ? 'Everyone should reduce outdoor exertion.' : 'Sensitive groups should limit outdoor activity.'}`,
                icon: '😷'
            });
        }
    }

    // High UV (from daily data)
    if (daily && daily.uv_index_max) {
        const uv = daily.uv_index_max[0] || 0;
        if (uv > 8) {
            alerts.push({
                type: 'uv',
                severity: uv > 11 ? 'danger' : 'warning',
                title: uv > 11 ? 'Extreme UV Alert' : 'Very High UV Advisory',
                message: `UV Index of ${Math.round(uv)}. ${uv > 11 ? 'Avoid outdoor exposure.' : 'Wear SPF 50+, hat, and sunglasses.'}`,
                icon: '☀️'
            });
        }
    }

    // Heavy precipitation (> 20mm daily)
    if (daily && daily.precipitation_sum) {
        const precip = daily.precipitation_sum[0] || 0;
        if (precip > 20) {
            alerts.push({
                type: 'precipitation',
                severity: precip > 50 ? 'danger' : 'warning',
                title: precip > 50 ? 'Heavy Rainfall Warning' : 'Rainfall Advisory',
                message: `Expected ${precip.toFixed(1)}mm of precipitation today.`,
                icon: '🌧️'
            });
        }
    }

    // Thunderstorm
    const weatherCode = current.weather_code || 0;
    if (weatherCode >= 95) {
        alerts.push({
            type: 'thunderstorm',
            severity: weatherCode >= 96 ? 'danger' : 'warning',
            title: weatherCode >= 96 ? 'Severe Thunderstorm Warning' : 'Thunderstorm Advisory',
            message: weatherCode >= 96 ? 'Thunderstorm with hail expected. Seek shelter.' : 'Thunderstorm activity detected. Stay indoors.',
            icon: '⛈️'
        });
    }

    return alerts;
}

/**
 * Render alert banners in the alerts section
 * @param {Array<Object>} alerts - Array of alert objects
 */
export function renderAlerts(alerts) {
    const section = document.getElementById('alerts-section');
    if (!section) return;

    if (!alerts || alerts.length === 0) {
        section.classList.add('hidden');
        section.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    section.innerHTML = alerts.map(alert => `
        <div class="alert-banner ${alert.severity}">
            <div class="alert-content">
                <span class="alert-icon">${alert.icon}</span>
                <div class="alert-text">
                    <strong>${alert.title}</strong>
                    <p>${alert.message}</p>
                </div>
            </div>
        </div>
    `).join('');
}
