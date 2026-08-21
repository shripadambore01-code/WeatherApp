/**
 * Central API client for Atmos weather app.
 * Calls Open-Meteo APIs directly for high performance, zero-latency serverless operation,
 * with comprehensive Indian States & Union Territories centroid resolution.
 */

const TIMEOUT_MS = 10000;

// Comprehensive 28 Indian States + 8 Union Territories Centroid Dictionary
export const INDIAN_STATES = {
    // 28 Indian States
    'andhra pradesh': { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata' },
    'arunachal pradesh': { name: 'Itanagar', state: 'Arunachal Pradesh', country: 'India', latitude: 27.0844, longitude: 93.6053, timezone: 'Asia/Kolkata' },
    'assam': { name: 'Guwahati', state: 'Assam', country: 'India', latitude: 26.1445, longitude: 91.7362, timezone: 'Asia/Kolkata' },
    'bihar': { name: 'Patna', state: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376, timezone: 'Asia/Kolkata' },
    'chhattisgarh': { name: 'Raipur', state: 'Chhattisgarh', country: 'India', latitude: 21.2514, longitude: 81.6296, timezone: 'Asia/Kolkata' },
    'goa': { name: 'Panaji', state: 'Goa', country: 'India', latitude: 15.4909, longitude: 73.8278, timezone: 'Asia/Kolkata' },
    'gujarat': { name: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
    'haryana': { name: 'Gurugram', state: 'Haryana', country: 'India', latitude: 28.4595, longitude: 77.0266, timezone: 'Asia/Kolkata' },
    'himachal pradesh': { name: 'Shimla', state: 'Himachal Pradesh', country: 'India', latitude: 31.1048, longitude: 77.1734, timezone: 'Asia/Kolkata' },
    'jharkhand': { name: 'Ranchi', state: 'Jharkhand', country: 'India', latitude: 23.3441, longitude: 85.3096, timezone: 'Asia/Kolkata' },
    'karnataka': { name: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
    'kerala': { name: 'Thiruvananthapuram', state: 'Kerala', country: 'India', latitude: 8.5241, longitude: 76.9366, timezone: 'Asia/Kolkata' },
    'madhya pradesh': { name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', latitude: 23.2599, longitude: 77.4126, timezone: 'Asia/Kolkata' },
    'maharashtra': { name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
    'manipur': { name: 'Imphal', state: 'Manipur', country: 'India', latitude: 24.8170, longitude: 93.9368, timezone: 'Asia/Kolkata' },
    'meghalaya': { name: 'Shillong', state: 'Meghalaya', country: 'India', latitude: 25.5788, longitude: 91.8933, timezone: 'Asia/Kolkata' },
    'mizoram': { name: 'Aizawl', state: 'Mizoram', country: 'India', latitude: 23.7271, longitude: 92.7176, timezone: 'Asia/Kolkata' },
    'nagaland': { name: 'Kohima', state: 'Nagaland', country: 'India', latitude: 25.6751, longitude: 94.1086, timezone: 'Asia/Kolkata' },
    'odisha': { name: 'Bhubaneswar', state: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245, timezone: 'Asia/Kolkata' },
    'orissa': { name: 'Bhubaneswar', state: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245, timezone: 'Asia/Kolkata' },
    'punjab': { name: 'Chandigarh', state: 'Punjab', country: 'India', latitude: 30.7333, longitude: 76.7794, timezone: 'Asia/Kolkata' },
    'rajasthan': { name: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' },
    'sikkim': { name: 'Gangtok', state: 'Sikkim', country: 'India', latitude: 27.3389, longitude: 88.6065, timezone: 'Asia/Kolkata' },
    'tamil nadu': { name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
    'tamilnadu': { name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
    'telangana': { name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata' },
    'tripura': { name: 'Agartala', state: 'Tripura', country: 'India', latitude: 23.8315, longitude: 91.2868, timezone: 'Asia/Kolkata' },
    'uttar pradesh': { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
    'uttarakhand': { name: 'Dehradun', state: 'Uttarakhand', country: 'India', latitude: 30.3165, longitude: 78.0322, timezone: 'Asia/Kolkata' },
    'west bengal': { name: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },

    // Union Territories
    'delhi': { name: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
    'new delhi': { name: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
    'jammu and kashmir': { name: 'Srinagar', state: 'Jammu & Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, timezone: 'Asia/Kolkata' },
    'jammu & kashmir': { name: 'Srinagar', state: 'Jammu & Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, timezone: 'Asia/Kolkata' },
    'j&k': { name: 'Srinagar', state: 'Jammu & Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, timezone: 'Asia/Kolkata' },
    'ladakh': { name: 'Leh', state: 'Ladakh', country: 'India', latitude: 34.1526, longitude: 77.5771, timezone: 'Asia/Kolkata' },
    'chandigarh': { name: 'Chandigarh', state: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794, timezone: 'Asia/Kolkata' },
    'puducherry': { name: 'Puducherry', state: 'Puducherry', country: 'India', latitude: 11.9416, longitude: 79.8083, timezone: 'Asia/Kolkata' },
    'pondicherry': { name: 'Puducherry', state: 'Puducherry', country: 'India', latitude: 11.9416, longitude: 79.8083, timezone: 'Asia/Kolkata' },
    'andaman and nicobar': { name: 'Port Blair', state: 'Andaman & Nicobar', country: 'India', latitude: 11.6234, longitude: 92.7265, timezone: 'Asia/Kolkata' },
    'lakshadweep': { name: 'Kavaratti', state: 'Lakshadweep', country: 'India', latitude: 10.5667, longitude: 72.6417, timezone: 'Asia/Kolkata' },
    'alandi': { name: 'Alandi', state: 'Maharashtra', country: 'India', latitude: 18.6774, longitude: 73.8967, timezone: 'Asia/Kolkata' },
    'pune': { name: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' }
};

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
            } catch (e) {}
            return { error: true, message: `Error ${response.status}: ${message}` };
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            return { error: true, message: 'Request timed out.' };
        }
        return { error: true, message: error.message || 'Network error occurred.' };
    }
}

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

export async function fetchForecast(lat, lon, days = 7) {
    return await fetchWeather(lat, lon);
}

export async function fetchAQI(lat, lon) {
    const currentParams = [
        'us_aqi', 'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide',
        'sulphur_dioxide', 'ozone', 'aerosol_optical_depth', 'dust', 'uv_index', 'uv_index_clear_sky'
    ].join(',');
    
    const hourlyParams = ['pm2_5', 'pm10', 'us_aqi', 'uv_index'].join(',');
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}`;
    return await fetchWithTimeout(url);
}

export async function searchCities(query, limit = 5, lang = 'en') {
    const clean = query.toLowerCase().trim();

    // 1. Direct Indian State lookup
    if (INDIAN_STATES[clean]) {
        const s = INDIAN_STATES[clean];
        return {
            results: [{
                name: `${s.state} (${s.name})`,
                country: 'India',
                admin1: s.state,
                latitude: s.latitude,
                longitude: s.longitude,
                timezone: s.timezone
            }]
        };
    }

    // 2. Partial Indian State lookup
    for (const [key, s] of Object.entries(INDIAN_STATES)) {
        if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
            return {
                results: [{
                    name: `${s.state} (${s.name})`,
                    country: 'India',
                    admin1: s.state,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    timezone: s.timezone
                }]
            };
        }
    }

    // 3. Fallback to Open-Meteo Geocoding
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${limit}&language=${lang}&format=json`;
    const res = await fetchWithTimeout(url);

    if (res && res.results && res.results.length > 0) {
        return res;
    }

    // 4. Substring Indian State match if Open-Meteo returns nothing
    for (const [key, s] of Object.entries(INDIAN_STATES)) {
        if (clean.includes(key) || key.includes(clean)) {
            return {
                results: [{
                    name: `${s.state} (${s.name})`,
                    country: 'India',
                    admin1: s.state,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    timezone: s.timezone
                }]
            };
        }
    }

    return res || { results: [] };
}

export async function reverseGeocode(lat, lon) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&format=json`;
    return await fetchWithTimeout(url);
}
