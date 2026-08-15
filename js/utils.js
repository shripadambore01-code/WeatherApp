/**
 * Atmos Weather — Shared Utilities
 * Common helper functions used across all modules
 */

/**
 * Debounce function — delays execution until after wait ms of inactivity
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * Throttle function — limits execution to once per interval
 * @param {Function} fn - Function to throttle
 * @param {number} interval - Minimum ms between calls
 * @returns {Function} Throttled function
 */
export function throttle(fn, interval = 200) {
    let lastTime = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn.apply(this, args);
        }
    };
}

/**
 * Format temperature based on current unit preference
 * @param {number} tempCelsius - Temperature in Celsius
 * @param {string} unit - 'celsius' or 'fahrenheit'
 * @returns {string} Formatted temperature string
 */
export function formatTemp(tempCelsius, unit = 'celsius') {
    if (tempCelsius === null || tempCelsius === undefined) return '--';
    const temp = unit === 'fahrenheit' ? (tempCelsius * 9 / 5) + 32 : tempCelsius;
    return `${Math.round(temp)}°`;
}

/**
 * Format temperature with unit symbol
 * @param {number} tempCelsius - Temperature in Celsius
 * @param {string} unit - 'celsius' or 'fahrenheit'
 * @returns {string} Formatted temperature with unit
 */
export function formatTempFull(tempCelsius, unit = 'celsius') {
    if (tempCelsius === null || tempCelsius === undefined) return '--';
    const temp = unit === 'fahrenheit' ? (tempCelsius * 9 / 5) + 32 : tempCelsius;
    const symbol = unit === 'fahrenheit' ? '°F' : '°C';
    return `${Math.round(temp)}${symbol}`;
}

/**
 * Format wind speed
 * @param {number} speed - Wind speed in km/h
 * @param {string} unit - 'metric' or 'imperial'
 * @returns {string} Formatted wind speed
 */
export function formatWind(speed, unit = 'metric') {
    if (speed === null || speed === undefined) return '--';
    if (unit === 'imperial') {
        return `${Math.round(speed * 0.621371)} mph`;
    }
    return `${Math.round(speed)} km/h`;
}

/**
 * Get wind direction label from degrees
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Cardinal direction (N, NE, E, etc.)
 */
export function getWindDirection(degrees) {
    if (degrees === null || degrees === undefined) return '--';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Format time from ISO string to locale time
 * @param {string} isoString - ISO date string
 * @param {string} timezone - Timezone string (e.g., 'America/New_York')
 * @returns {string} Formatted time string
 */
export function formatTime(isoString, timezone) {
    if (!isoString) return '--';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone || undefined,
            hour12: true
        });
    } catch {
        return '--';
    }
}

/**
 * Format date from ISO string
 * @param {string} isoString - ISO date string
 * @param {string} format - 'short', 'long', or 'day'
 * @returns {string} Formatted date string
 */
export function formatDate(isoString, format = 'short') {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    switch (format) {
        case 'day':
            return date.toLocaleDateString([], { weekday: 'short' });
        case 'long':
            return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        case 'short':
        default:
            return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
}

/**
 * Format hour from ISO string
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted hour (e.g., "3 PM", "Now")
 */
export function formatHour(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const now = new Date();
    if (Math.abs(date - now) < 1800000) return 'Now';
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

/**
 * Get relative time string
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time (e.g., "5 min ago")
 */
export function timeAgo(date) {
    const now = new Date();
    const d = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((now - d) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Get AQI label and color from US AQI value
 * @param {number} aqi - US AQI value
 * @returns {{ label: string, color: string, level: string }}
 */
export function getAQIInfo(aqi) {
    if (aqi === null || aqi === undefined) return { label: 'N/A', color: '#888', level: 'unknown' };
    if (aqi <= 50) return { label: 'Good', color: '#22c55e', level: 'good' };
    if (aqi <= 100) return { label: 'Moderate', color: '#eab308', level: 'moderate' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#f97316', level: 'usg' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444', level: 'unhealthy' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#a855f7', level: 'very-unhealthy' };
    return { label: 'Hazardous', color: '#7c2d12', level: 'hazardous' };
}

/**
 * Get UV Index label and protection recommendation
 * @param {number} uv - UV index value
 * @returns {{ label: string, color: string, protection: string }}
 */
export function getUVInfo(uv) {
    if (uv === null || uv === undefined) return { label: 'N/A', color: '#888', protection: '' };
    if (uv <= 2) return { label: 'Low', color: '#22c55e', protection: 'No protection needed. Enjoy the outdoors!' };
    if (uv <= 5) return { label: 'Moderate', color: '#eab308', protection: 'Wear sunscreen SPF 30+. Seek shade during midday.' };
    if (uv <= 7) return { label: 'High', color: '#f97316', protection: 'Wear SPF 50+, hat, and sunglasses. Reduce sun exposure 10am-4pm.' };
    if (uv <= 10) return { label: 'Very High', color: '#ef4444', protection: 'Avoid sun 10am-4pm. Wear protective clothing, SPF 50+.' };
    return { label: 'Extreme', color: '#7c2d12', protection: 'Stay indoors if possible. Maximum sun protection required.' };
}

/**
 * Get WMO weather description
 * @param {number} code - WMO weather code
 * @returns {string} Human readable description
 */
export function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Rime Fog',
        51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
        56: 'Light Freezing Drizzle', 57: 'Dense Freezing Drizzle',
        61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
        66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
        71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
        80: 'Light Showers', 81: 'Moderate Showers', 82: 'Heavy Showers',
        85: 'Light Snow Showers', 86: 'Heavy Snow Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
    };
    return descriptions[code] || 'Unknown';
}

/**
 * Get weather icon filename based on WMO code and day/night
 * @param {number} code - WMO weather code
 * @param {boolean} isDay - Whether it's daytime
 * @returns {string} Icon filename (without extension)
 */
export function getWeatherIcon(code, isDay = true) {
    const dayNight = isDay ? 'day' : 'night';
    const iconMap = {
        0: `clear-${dayNight}`,
        1: `partly-cloudy-${dayNight}`,
        2: `partly-cloudy-${dayNight}`,
        3: `overcast-${dayNight}`,
        45: `fog-${dayNight}`,
        48: `fog-${dayNight}`,
        51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
        56: 'sleet', 57: 'sleet',
        61: 'rain', 63: 'rain', 65: 'rain',
        66: 'sleet', 67: 'sleet',
        71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
        80: 'rain', 81: 'rain', 82: 'rain',
        85: 'snow', 86: 'snow',
        95: 'thunderstorms',
        96: 'thunderstorms-rain',
        99: 'thunderstorms-rain'
    };
    return iconMap[code] || `partly-cloudy-${dayNight}`;
}

/**
 * Get weather condition category for background styling
 * @param {number} code - WMO weather code
 * @param {boolean} isDay - Whether it's daytime
 * @returns {string} Weather condition category
 */
export function getWeatherCondition(code, isDay = true) {
    if (!isDay) {
        if (code >= 95) return 'thunderstorm-night';
        if (code >= 61 || (code >= 51 && code <= 57)) return 'rain-night';
        if (code >= 71 && code <= 77) return 'snow-night';
        if (code === 3) return 'clouds-night';
        return 'clear-night';
    }
    if (code >= 95) return 'thunderstorm';
    if (code >= 80) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 61 && code <= 67) return 'rain';
    if (code >= 51 && code <= 57) return 'rain';
    if (code >= 45 && code <= 48) return 'fog';
    if (code === 3) return 'clouds-day';
    if (code >= 1 && code <= 2) return 'partly-cloudy';
    return 'clear-day';
}

/**
 * Store value in localStorage with JSON serialization
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function store(key, value) {
    try {
        localStorage.setItem(`atmos_${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}

/**
 * Retrieve value from localStorage
 * @param {string} key - Storage key
 * @param {*} fallback - Default value if not found
 * @returns {*} Stored value or fallback
 */
export function retrieve(key, fallback = null) {
    try {
        const item = localStorage.getItem(`atmos_${key}`);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in ms
 */
export function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <span class="toast__icon">${getToastIcon(type)}</span>
        <span class="toast__message">${message}</span>
        <button class="toast__close" aria-label="Close">&times;</button>
    `;
    toast.querySelector('.toast__close').addEventListener('click', () => {
        toast.classList.add('toast--exit');
        setTimeout(() => toast.remove(), 300);
    });
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--enter'));
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast--exit');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = {
        info: '&#8505;&#65039;',
        success: '&#9989;',
        warning: '&#9888;&#65039;',
        error: '&#10060;'
    };
    return icons[type] || icons.info;
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Clamp a number between min and max
 * @param {number} val - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Clamped value
 */
export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}
