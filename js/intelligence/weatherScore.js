/**
 * Atmos Weather — Client-Side Weather Score 2.0
 * Evaluates universal comfort score (0-100) and profile calibrations.
 */

export function calculateWeatherScore(telemetry, profile = 'general') {
    const temp = telemetry.temperature ?? 20;
    const app_t = telemetry.apparent_temp ?? temp;
    const hum = telemetry.humidity ?? 50;
    const rain_p = telemetry.precipitation_prob ?? 0;
    const rain_mm = telemetry.precipitation_amount ?? 0;
    const wind = telemetry.wind_speed ?? 10;
    const gust = telemetry.wind_gust ?? (wind * 1.3);
    const uv = telemetry.uv_index ?? 3;
    const aqi = telemetry.aqi ?? 35;
    const clouds = telemetry.cloud_cover ?? 20;

    let score = 100;
    const reasons = [];

    // 1. Thermal Comfort Penalty (18-24°C ideal)
    if (app_t < 18) {
        const delta = 18 - app_t;
        score -= Math.min(40, Math.pow(delta, 1.3) * 1.5);
        if (delta > 8) reasons.push(`Chilly conditions (${Math.round(app_t)}°C)`);
    } else if (app_t > 24) {
        const delta = app_t - 24;
        score -= Math.min(45, Math.pow(delta, 1.35) * 1.8);
        if (delta > 6) reasons.push(`Warm/hot heat index (${Math.round(app_t)}°C feels-like)`);
    }

    // 2. Humidity Penalty
    if (hum > 65) {
        score -= Math.min(20, ((hum - 65) / 35) * 20);
        if (hum > 80) reasons.push(`Muggy humidity (${Math.round(hum)}%)`);
    }

    // 3. Precipitation Penalty
    if (rain_p > 15) score -= (rain_p / 100) * 35;
    if (rain_mm > 0.5) score -= Math.min(25, rain_mm * 8);
    if (rain_p > 40 || rain_mm > 1.0) reasons.push(`High precipitation risk (${Math.round(rain_p)}%)`);

    // 4. Wind Penalty
    if (wind > 20) score -= Math.min(25, ((wind - 20) / 40) * 25);
    if (gust > 35) score -= Math.min(20, ((gust - 35) / 45) * 20);
    if (wind > 30) reasons.push(`Active winds (${Math.round(wind)} km/h)`);

    // 5. AQI Penalty
    if (aqi > 50) {
        score -= Math.min(35, ((aqi - 50) / 250) * 35);
        if (aqi > 100) reasons.push(`Elevated AQI pollutant levels (${Math.round(aqi)})`);
    }

    // 6. UV Penalty
    if (uv > 6) {
        score -= Math.min(18, (uv - 6) * 3);
        if (uv >= 8) reasons.push(`Intense UV radiation (${Math.round(uv)})`);
    }

    // Profile Modifiers
    const prof = (profile || 'general').toLowerCase();
    if (prof === 'running') {
        if (app_t > 21) score -= Math.min(20, (app_t - 21) * 2.5);
        else if (app_t >= 8 && app_t <= 16) score += 10;
    } else if (prof === 'cycling') {
        if (wind > 18) score -= Math.min(25, (wind - 18) * 1.8);
    } else if (prof === 'beach') {
        if (app_t < 22) score -= Math.min(40, (22 - app_t) * 3.5);
        else if (app_t >= 25 && clouds < 40) score += 15;
    } else if (prof === 'stargazing') {
        score = 100 - (clouds * 0.85) - (rain_p * 0.5) - (aqi * 0.15);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    let verdict = 'Good';
    if (finalScore >= 85) verdict = 'Excellent';
    else if (finalScore >= 70) verdict = 'Good';
    else if (finalScore >= 50) verdict = 'Moderate';
    else if (finalScore >= 30) verdict = 'Poor';
    else verdict = 'Hazardous';

    if (!reasons.length) reasons.push('Optimal thermal balance & calm atmospheric conditions');

    return {
        score: finalScore,
        verdict,
        profile: prof,
        reasons
    };
}
