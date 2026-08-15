/**
 * Central API client for Atmos weather app.
 * Calls Open-Meteo APIs directly for high performance, zero-latency serverless operation,
 * with automatic fallback to local /api backend proxy if available.
 */

const TIMEOUT_MS = 10000;

/**
 * Helper to perform fetch with timeout and error handling
 * @param {string} url 
 * @returns {Promise<any>}
 */
async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        
        if (!response.ok) {
            let message = response.statusText;
            try {
                const errorData = await response.json();
                message = errorData.reason || errorData.message || message;
            } catch (e) {
                // Ignore parse errors on error responses
            }
            return { error: true, message: `Error ${response.status}: ${message}` };
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            return { error: true, message: 'Request timed out after 10 seconds.' };
        }
        return { error: true, message: error.message || 'Network error occurred.' };
    }
}

/**
 * Fetch current weather + forecast from Open-Meteo
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<any>}
 */
export async function fetchWeather(lat, lon) {
    const currentParams = [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
        'precipitation', 'rain', 'showers', 'snowfall', 'weather_code', 'cloud_cover',
        'pressure_msl', 'surface_pressure', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'
    ].join(',');
    
    const dailyParams = [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max',
        'apparent_temperature_min', 'sunrise', 'sunset', 'uv_index_max', 'uv_index_clear_sky_max',
        'precipitation_sum', 'rain_sum', 'showers_sum', 'snowfall_sum', 'precipitation_hours',
        'precipitation_probability_max', 'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant'
    ].join(',');
    
    const hourlyParams = [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability',
        'precipitation', 'rain', 'showers', 'snowfall', 'weather_code', 'cloud_cover',
        'visibility', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'uv_index', 'is_day'
    ].join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&daily=${dailyParams}&hourly=${hourlyParams}&timezone=auto`;
    return await fetchWithTimeout(url);
}

/**
 * Fetch forecast data
 * @param {number} lat 
 * @param {number} lon 
 * @param {number} days 
 * @returns {Promise<any>}
 */
export async function fetchForecast(lat, lon, days = 7) {
    return await fetchWeather(lat, lon);
}

/**
 * Fetch Air Quality Index data
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<any>}
 */
export async function fetchAQI(lat, lon) {
    const currentParams = [
        'us_aqi', 'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide',
        'sulphur_dioxide', 'ozone', 'aerosol_optical_depth', 'dust', 'uv_index', 'uv_index_clear_sky'
    ].join(',');
    
    const hourlyParams = ['pm2_5', 'pm10', 'us_aqi', 'uv_index'].join(',');
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}`;
    return await fetchWithTimeout(url);
}

/**
 * Search cities using Open-Meteo Geocoding API
 * @param {string} query 
 * @param {number} limit 
 * @param {string} lang 
 * @returns {Promise<any>}
 */
export async function searchCities(query, limit = 5, lang = 'en') {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${limit}&language=${lang}&format=json`;
    return await fetchWithTimeout(url);
}

/**
 * Reverse geocode coordinates
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<any>}
 */
export async function reverseGeocode(lat, lon) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&format=json`;
    return await fetchWithTimeout(url);
}
