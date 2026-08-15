/**
 * Atmos Weather — Local Weather Memory & Forecast Delta Tracker
 */

export function saveForecastSnapshot(cityName, forecastData) {
    try {
        const key = `atmos_snap_${cityName.toLowerCase().replace(/\s+/g, '_')}`;
        const previous = localStorage.getItem(key);
        localStorage.setItem(key, JSON.stringify({
            timestamp: Date.now(),
            data: forecastData
        }));
        return previous ? JSON.parse(previous) : null;
    } catch (e) {
        console.warn('Could not cache forecast snapshot:', e);
        return null;
    }
}

export function compareCachedForecast(currentForecast, cachedForecast) {
    if (!cachedForecast || !cachedForecast.data || !cachedForecast.data.current) {
        return {
            hasComparison: false,
            message: 'First observation recorded for this city. Future updates will track changes.'
        };
    }

    const cur = currentForecast.current || {};
    const old = cachedForecast.data.current || {};

    const curTemp = cur.temperature_2m ?? 20;
    const oldTemp = old.temperature_2m ?? 20;
    const tempDelta = Math.round((curTemp - oldTemp) * 10) / 10;

    const curRain = cur.precipitation ?? 0;
    const oldRain = old.precipitation ?? 0;
    const rainDelta = Math.round((curRain - oldRain) * 10) / 10;

    const curWind = cur.wind_speed_10m ?? 10;
    const oldWind = old.wind_speed_10m ?? 10;
    const windDelta = Math.round((curWind - oldWind) * 10) / 10;

    const notes = [];
    if (Math.abs(tempDelta) >= 1) {
        notes.push(`Temperature is ${Math.abs(tempDelta)}°C ${tempDelta > 0 ? 'warmer' : 'cooler'}`);
    }
    if (Math.abs(rainDelta) >= 0.5) {
        notes.push(`Rain expectation shifted by ${rainDelta > 0 ? '+' : ''}${rainDelta} mm`);
    }
    if (Math.abs(windDelta) >= 4) {
        notes.push(`Winds shifted by ${windDelta > 0 ? '+' : ''}${windDelta} km/h`);
    }

    return {
        hasComparison: true,
        summary: notes.length ? notes.join(' · ') : 'Atmospheric conditions remain consistent with previous model update.',
        deltas: {
            temp: `${tempDelta > 0 ? '+' : ''}${tempDelta}°C`,
            rain: `${rainDelta > 0 ? '+' : ''}${rainDelta} mm`,
            wind: `${windDelta > 0 ? '+' : ''}${windDelta} km/h`
        }
    };
}
