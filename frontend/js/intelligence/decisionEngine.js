/**
 * Atmos Weather — Client-Side Decision Cards Engine
 * Evaluates day-to-day decisions (umbrella, run, cycling, jacket, beach, photo).
 */

export function evaluateDecisionCardsClient(currentData, hourlyData = []) {
    const temp = currentData.temperature_2m ?? 20;
    const app_t = currentData.apparent_temperature ?? temp;
    const rain_p = currentData.precipitation_probability ?? 0;
    const wind = currentData.wind_speed_10m ?? 10;
    const uv = currentData.uv_index ?? 3;
    const aqi = currentData.aqi ?? 35;
    const cloud = currentData.cloud_cover ?? 20;

    const max12hRain = hourlyData.length ? Math.max(...hourlyData.slice(0, 12).map(h => h.precipitation_prob || 0)) : rain_p;
    const min12hTemp = hourlyData.length ? Math.min(...hourlyData.slice(0, 12).map(h => h.temperature || temp)) : temp;

    const decisions = [];

    // 1. Umbrella
    if (max12hRain >= 50) {
        decisions.push({ id: 'umbrella', question: 'Should I carry an umbrella?', icon: '☂️', verdict: 'YES', color: '#ef4444', reason: `High rain risk (${Math.round(max12hRain)}%) forecast.` });
    } else if (max12hRain >= 25) {
        decisions.push({ id: 'umbrella', question: 'Should I carry an umbrella?', icon: '☂️', verdict: 'MAYBE', color: '#f59e0b', reason: `Moderate rain risk (${Math.round(max12hRain)}%); pack a compact umbrella.` });
    } else {
        decisions.push({ id: 'umbrella', question: 'Should I carry an umbrella?', icon: '☂️', verdict: 'NO', color: '#10b981', reason: 'Dry skies with negligible precipitation risk.' });
    }

    // 2. Jacket
    if (app_t < 15 || min12hTemp < 14) {
        decisions.push({ id: 'jacket', question: 'Should I take a jacket?', icon: '🧥', verdict: 'YES', color: '#0284c7', reason: `Lows reach ${Math.round(min12hTemp)}°C. An extra layer is recommended.` });
    } else if (app_t <= 19) {
        decisions.push({ id: 'jacket', question: 'Should I take a jacket?', icon: '🧥', verdict: 'MAYBE', color: '#f59e0b', reason: 'Comfortable in the sun, but cool in shade or evening breeze.' });
    } else {
        decisions.push({ id: 'jacket', question: 'Should I take a jacket?', icon: '🧥', verdict: 'NO', color: '#10b981', reason: `Warm thermal profile (${Math.round(app_t)}°C feels-like). Single layer is great.` });
    }

    // 3. Outdoor Run
    if (max12hRain < 25 && app_t >= 10 && app_t <= 22 && aqi <= 65) {
        decisions.push({ id: 'run', question: 'Should I run outside?', icon: '🏃', verdict: 'YES', color: '#10b981', reason: `Crisp running temp (${Math.round(app_t)}°C) and clean air.` });
    } else if (max12hRain >= 55 || app_t > 30) {
        decisions.push({ id: 'run', question: 'Should I run outside?', icon: '🏃', verdict: 'NO', color: '#ef4444', reason: 'High heat index or rain makes treadmill preferable.' });
    } else {
        decisions.push({ id: 'run', question: 'Should I run outside?', icon: '🏃', verdict: 'MAYBE', color: '#f59e0b', reason: 'Schedule run during cooler morning/evening hours.' });
    }

    // 4. Cycling
    if (wind < 20 && max12hRain < 20) {
        decisions.push({ id: 'cycling', question: 'Is today good for cycling?', icon: '🚴', verdict: 'YES', color: '#10b981', reason: `Calm winds (${Math.round(wind)} km/h) & dry road pavement.` });
    } else if (wind >= 30 || max12hRain >= 40) {
        decisions.push({ id: 'cycling', question: 'Is today good for cycling?', icon: '🚴', verdict: 'NO', color: '#ef4444', reason: 'Strong headwinds or wet roads reduce cycling traction.' });
    } else {
        decisions.push({ id: 'cycling', question: 'Is today good for cycling?', icon: '🚴', verdict: 'MAYBE', color: '#f59e0b', reason: 'Moderate breeze present; pick sheltered bike paths.' });
    }

    // 5. Beach
    if (temp >= 24 && cloud <= 40 && max12hRain < 15) {
        decisions.push({ id: 'beach', question: 'Should I go to the beach?', icon: '🏖️', verdict: 'YES', color: '#10b981', reason: `Sunny skies (${Math.round(cloud)}% clouds), warm air (${Math.round(temp)}°C).` });
    } else if (temp < 20 || max12hRain >= 35) {
        decisions.push({ id: 'beach', question: 'Should I go to the beach?', icon: '🏖️', verdict: 'NO', color: '#ef4444', reason: 'Too cool or overcast for optimal beach/swimming enjoyment.' });
    } else {
        decisions.push({ id: 'beach', question: 'Should I go to the beach?', icon: '🏖️', verdict: 'MAYBE', color: '#f59e0b', reason: 'Decent conditions; check water temp and UV protection.' });
    }

    // 6. Photography
    if (cloud >= 20 && cloud <= 60 && max12hRain < 20) {
        decisions.push({ id: 'photo', question: 'Is today good for photography?', icon: '📷', verdict: 'YES', color: '#10b981', reason: 'Rich dynamic cloud depth and pleasant natural lighting diffusion.' });
    } else {
        decisions.push({ id: 'photo', question: 'Is today good for photography?', icon: '📷', verdict: 'MAYBE', color: '#f59e0b', reason: 'Best captures around Golden Hour (sunrise/sunset).' });
    }

    return decisions;
}
