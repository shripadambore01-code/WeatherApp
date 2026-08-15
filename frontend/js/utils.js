/**
 * Atmos Weather — Shared Utilities & Inline Vector Weather Icons
 * Complete vector icon system and shared utility functions.
 */

export function clamp(val, min = 0, max = 100) {
    return Math.min(Math.max(val, min), max);
}

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function debounce(fn, wait = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

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

export function formatTemp(tempCelsius, unit = 'celsius') {
    if (tempCelsius === null || tempCelsius === undefined) return '--';
    const temp = unit === 'fahrenheit' ? (tempCelsius * 9 / 5) + 32 : tempCelsius;
    return `${Math.round(temp)}°`;
}

export function formatTempFull(tempCelsius, unit = 'celsius') {
    if (tempCelsius === null || tempCelsius === undefined) return '--';
    const temp = unit === 'fahrenheit' ? (tempCelsius * 9 / 5) + 32 : tempCelsius;
    const symbol = unit === 'fahrenheit' ? '°F' : '°C';
    return `${Math.round(temp)}${symbol}`;
}

export function formatWind(speed, unit = 'metric') {
    if (speed === null || speed === undefined) return '--';
    if (unit === 'imperial') {
        return `${Math.round(speed * 0.621371)} mph`;
    }
    return `${Math.round(speed)} km/h`;
}

export function getWindDirection(degrees) {
    if (degrees === null || degrees === undefined) return '--';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

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

export function formatHour(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const now = new Date();
    if (Math.abs(date - now) < 1800000) return 'Now';
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

export function timeAgo(date) {
    const now = new Date();
    const d = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function getAQIInfo(aqi) {
    if (aqi === null || aqi === undefined) return { label: 'N/A', color: '#888' };
    if (aqi <= 50) return { label: 'Good', color: '#10b981' };
    if (aqi <= 100) return { label: 'Moderate', color: '#f59e0b' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#f97316' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8b5cf6' };
    return { label: 'Hazardous', color: '#7c2d12' };
}

export function getUVInfo(uv) {
    if (uv === null || uv === undefined) return { label: 'N/A', color: '#888' };
    if (uv <= 2) return { label: 'Low', color: '#10b981' };
    if (uv <= 5) return { label: 'Moderate', color: '#f59e0b' };
    if (uv <= 7) return { label: 'High', color: '#f97316' };
    if (uv <= 10) return { label: 'Very High', color: '#ef4444' };
    return { label: 'Extreme', color: '#7c2d12' };
}

export function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Rime Fog',
        51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
        56: 'Freezing Drizzle', 57: 'Dense Freezing Drizzle',
        61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
        66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
        71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
        80: 'Light Showers', 81: 'Moderate Showers', 82: 'Heavy Showers',
        85: 'Light Snow Showers', 86: 'Heavy Snow Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
    };
    return descriptions[code] || 'Clear Sky';
}

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

export function getWeatherSvgIcon(code, isDay = true, size = 32) {
    const sunColor = '#f59e0b';
    const cloudColor = '#94a3b8';
    const cloudDark = '#64748b';
    const rainColor = '#0284c7';
    const snowColor = '#38bdf8';
    const lightningColor = '#eab308';
    const moonColor = '#818cf8';

    if (code === 0 || code === 1) {
        if (isDay) {
            return `
                <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                    <circle cx="32" cy="32" r="14" fill="${sunColor}" />
                    <path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.2 4.2M13.6 50.4l4.2-4.2M46.2 17.8l4.2-4.2" stroke="${sunColor}" stroke-width="4" stroke-linecap="round" />
                </svg>
            `;
        } else {
            return `
                <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                    <path d="M42 36a16 16 0 1 1-18-18 13 13 0 0 0 18 18z" fill="${moonColor}" />
                    <circle cx="46" cy="18" r="2" fill="#e2e8f0" />
                    <circle cx="52" cy="28" r="1.5" fill="#e2e8f0" />
                </svg>
            `;
        }
    }

    if (code === 2) {
        if (isDay) {
            return `
                <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                    <circle cx="24" cy="22" r="10" fill="${sunColor}" />
                    <path d="M24 6v4M10 22H6M34.8 11.2l-2.8 2.8M13.2 11.2l2.8 2.8" stroke="${sunColor}" stroke-width="3" stroke-linecap="round" />
                    <path d="M46 46H22a10 10 0 0 1-1.4-19.9 14 14 0 0 1 27.2-3.1A9 9 0 0 1 46 46z" fill="${cloudColor}" />
                </svg>
            `;
        } else {
            return `
                <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                    <path d="M34 26a11 11 0 1 1-12-12 9 9 0 0 0 12 12z" fill="${moonColor}" />
                    <path d="M48 48H24a10 10 0 0 1-1.4-19.9 14 14 0 0 1 27.2-3.1A9 9 0 0 1 48 48z" fill="${cloudColor}" />
                </svg>
            `;
        }
    }

    if (code === 3) {
        return `
            <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                <path d="M36 28h-14a8 8 0 0 1-1.1-15.9 11 11 0 0 1 21.4-2.5A7 7 0 0 1 36 28z" fill="${cloudDark}" opacity="0.6" />
                <path d="M48 48H20a11 11 0 0 1-1.5-21.9 15 15 0 0 1 29.2-3.4A10 10 0 0 1 48 48z" fill="${cloudColor}" />
            </svg>
        `;
    }

    if (code === 45 || code === 48) {
        return `
            <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                <path d="M44 34H20a9 9 0 0 1-1.2-17.9 13 13 0 0 1 25.3-2.9A8 8 0 0 1 44 34z" fill="${cloudColor}" />
                <line x1="14" y1="42" x2="50" y2="42" stroke="${cloudColor}" stroke-width="4" stroke-linecap="round" />
                <line x1="18" y1="50" x2="46" y2="50" stroke="${cloudColor}" stroke-width="4" stroke-linecap="round" />
            </svg>
        `;
    }

    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return `
            <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                <path d="M46 36H20a10 10 0 0 1-1.4-19.9 14 14 0 0 1 27.2-3.1A9 9 0 0 1 46 36z" fill="${cloudColor}" />
                <line x1="22" y1="44" x2="18" y2="54" stroke="${rainColor}" stroke-width="3.5" stroke-linecap="round" />
                <line x1="32" y1="44" x2="28" y2="54" stroke="${rainColor}" stroke-width="3.5" stroke-linecap="round" />
                <line x1="42" y1="44" x2="38" y2="54" stroke="${rainColor}" stroke-width="3.5" stroke-linecap="round" />
            </svg>
        `;
    }

    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        return `
            <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                <path d="M46 36H20a10 10 0 0 1-1.4-19.9 14 14 0 0 1 27.2-3.1A9 9 0 0 1 46 36z" fill="${cloudColor}" />
                <circle cx="20" cy="48" r="2.5" fill="${snowColor}" />
                <circle cx="32" cy="50" r="2.5" fill="${snowColor}" />
                <circle cx="44" cy="48" r="2.5" fill="${snowColor}" />
            </svg>
        `;
    }

    if (code >= 95) {
        return `
            <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
                <path d="M46 34H20a10 10 0 0 1-1.4-19.9 14 14 0 0 1 27.2-3.1A9 9 0 0 1 46 34z" fill="${cloudDark}" />
                <polygon points="32,36 24,48 31,48 27,58 40,44 33,44" fill="${lightningColor}" />
            </svg>
        `;
    }

    return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
            <circle cx="24" cy="22" r="10" fill="${sunColor}" />
            <path d="M46 46H22a10 10 0 0 1-1.4-19.9 14 14 0 0 1 27.2-3.1A9 9 0 0 1 46 46z" fill="${cloudColor}" />
        </svg>
    `;
}

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

export function store(key, value) {
    try {
        localStorage.setItem(`atmos_${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}

export function retrieve(key, fallback = null) {
    try {
        const item = localStorage.getItem(`atmos_${key}`);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

export function showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <span style="flex:1;">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
