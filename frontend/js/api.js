/**
 * Central API client for Atmos weather app.
 * Base URL is same-origin, served by FastAPI backend.
 * Uses AbortController for a 10s timeout on all requests.
 */

const BASE_URL = '';
const TIMEOUT_MS = 10000;

/**
 * Helper to perform fetch with timeout and error handling
 * @param {string} endpoint 
 * @returns {Promise<any>}
 */
async function fetchWithTimeout(endpoint) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal });
        clearTimeout(id);
        
        if (!response.ok) {
            let message = response.statusText;
            try {
                const errorData = await response.json();
                message = errorData.message || message;
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
 * Fetch current weather
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<any>}
 */
export async function fetchWeather(lat, lon) {
    return await fetchWithTimeout(`/api/weather?lat=${lat}&lon=${lon}`);
}

/**
 * Fetch forecast data
 * @param {number} lat 
 * @param {number} lon 
 * @param {number} days 
 * @returns {Promise<any>}
 */
export async function fetchForecast(lat, lon, days = 7) {
    return await fetchWithTimeout(`/api/forecast?lat=${lat}&lon=${lon}&days=${days}`);
}

/**
 * Fetch Air Quality Index data
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<any>}
 */
export async function fetchAQI(lat, lon) {
    return await fetchWithTimeout(`/api/aqi?lat=${lat}&lon=${lon}`);
}

/**
 * Search cities
 * @param {string} query 
 * @param {number} limit 
 * @param {string} lang 
 * @returns {Promise<any>}
 */
export async function searchCities(query, limit = 5, lang = 'en') {
    return await fetchWithTimeout(`/api/geocode?q=${encodeURIComponent(query)}&limit=${limit}&lang=${lang}`);
}

/**
 * Reverse geocode coordinates
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<any>}
 */
export async function reverseGeocode(lat, lon) {
    return await fetchWithTimeout(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
}
