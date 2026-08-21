/**
 * Atmos Weather — Weather Score 2.0 Engine
 * 
 * Audited 6-Factor Composite Scoring Formula:
 * ─────────────────────────────────────────────────────────────────────────────
 * • Temperature Sub-score (Weight: 25%): 
 *   Ideal: 18–24°C. Penalized non-linearly for extreme heat (feels-like > 25°C) or freezing cold (< 15°C).
 * • Rain Sub-score (Weight: 25%):
 *   100 - (precipitation_probability * 0.8 + rain_mm * 15).
 * • Wind Sub-score (Weight: 15%):
 *   Ideal: < 15 km/h. Penalized progressively for winds > 20 km/h or gusts > 35 km/h.
 * • AQI Sub-score (Weight: 15%):
 *   100 - ((AQI - 20) / 280 * 100). Favorable below 50, strictly penalized above 100.
 * • UV Sub-score (Weight: 10%):
 *   Ideal: UV < 5. Scaled down when UV index exceeds 6.
 * • Outdoor Suitability (Weight: 10%):
 *   Combines cloud cover, thermal comfort, and dry ground conditions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { clamp } from '../utils.js';

export function calculateWeatherScore(telemetry = {}, profile = 'general') {
    const temp = telemetry.temperature ?? telemetry.temperature_2m ?? 24;
    const app_t = telemetry.apparent_temp ?? telemetry.apparent_temperature ?? temp;
    const hum = telemetry.humidity ?? telemetry.relative_humidity_2m ?? 55;
    const rain_p = telemetry.precipitation_prob ?? telemetry.precipitation_probability ?? 0;
    const rain_mm = telemetry.precipitation_amount ?? telemetry.rain ?? 0;
    const wind = telemetry.wind_speed ?? telemetry.wind_speed_10m ?? 10;
    const gust = telemetry.wind_gust ?? telemetry.wind_gusts_10m ?? (wind * 1.3);
    const uv = telemetry.uv_index ?? 3.5;
    const aqi = telemetry.aqi ?? 35;
    const clouds = telemetry.cloud_cover ?? 25;

    // 1. Temperature Subscore (0-100)
    let tempSub = 100;
    if (app_t < 18) {
        const delta = 18 - app_t;
        tempSub -= Math.min(65, Math.pow(delta, 1.25) * 2.8);
    } else if (app_t > 24) {
        const delta = app_t - 24;
        tempSub -= Math.min(70, Math.pow(delta, 1.3) * 3.2);
    }
    tempSub = clamp(Math.round(tempSub), 10, 100);

    // 2. Rain Subscore (0-100)
    let rainSub = 100 - (rain_p * 0.75) - (rain_mm * 12);
    rainSub = clamp(Math.round(rainSub), 5, 100);

    // 3. Wind Subscore (0-100)
    let windSub = 100;
    if (wind > 15) windSub -= ((wind - 15) / 35) * 45;
    if (gust > 30) windSub -= ((gust - 30) / 40) * 35;
    windSub = clamp(Math.round(windSub), 15, 100);

    // 4. AQI Subscore (0-100)
    let aqiSub = 100;
    if (aqi > 30) aqiSub -= ((aqi - 30) / 220) * 85;
    aqiSub = clamp(Math.round(aqiSub), 10, 100);

    // 5. UV Subscore (0-100)
    let uvSub = 100;
    if (uv > 5) uvSub -= (uv - 5) * 12;
    uvSub = clamp(Math.round(uvSub), 15, 100);

    // 6. Outdoor Suitability Subscore (0-100)
    let outdoorSub = (tempSub * 0.35) + (rainSub * 0.4) + (windSub * 0.15) + (aqiSub * 0.1);
    outdoorSub = clamp(Math.round(outdoorSub), 10, 100);

    // Composite Weighted Score
    let composite = (tempSub * 0.25) + (rainSub * 0.25) + (windSub * 0.15) + (aqiSub * 0.15) + (uvSub * 0.10) + (outdoorSub * 0.10);

    // Profile Tuning
    const prof = (profile || 'general').toLowerCase();
    if (prof === 'running' || prof === 'fitness') {
        if (app_t > 22) composite -= (app_t - 22) * 2;
        if (rain_p > 30) composite -= 15;
    } else if (prof === 'student' || prof === 'commute') {
        if (rain_p > 35) composite -= 20;
    } else if (prof === 'travel') {
        if (rain_p > 40 || wind > 25) composite -= 18;
    } else if (prof === 'agriculture') {
        // Rain is often positive for crops unless excessive
        if (rain_mm > 0.5 && rain_mm < 25) composite += 10;
        if (temp > 38) composite -= 25;
    }

    const finalScore = clamp(Math.round(composite), 5, 99);

    let verdict = 'Good';
    if (finalScore >= 85) verdict = 'Excellent';
    else if (finalScore >= 70) verdict = 'Good';
    else if (finalScore >= 50) verdict = 'Moderate';
    else if (finalScore >= 35) verdict = 'Challenging';
    else verdict = 'Hazardous';

    const reasons = [];
    if (rain_p >= 40) reasons.push(`Rain risk is elevated at ${Math.round(rain_p)}%`);
    if (app_t > 30) reasons.push(`Warm thermal sensation (${Math.round(app_t)}°C feels-like)`);
    if (app_t < 15) reasons.push(`Chilly conditions (${Math.round(app_t)}°C feels-like)`);
    if (aqi > 100) reasons.push(`Air quality is poor (AQI ${Math.round(aqi)})`);
    if (wind > 25) reasons.push(`Breezy winds up to ${Math.round(wind)} km/h`);
    if (!reasons.length) reasons.push("Balanced thermal index, dry skies & favorable atmospheric conditions");

    const summary = finalScore >= 75
        ? "Today's atmospheric conditions are highly favorable for outdoor activities, commuting, and sports."
        : finalScore >= 50
        ? "Moderate conditions today. Check rain and UV windows before heading out for extended periods."
        : "Challenging weather conditions. Plan indoor activities and take precautions.";

    return {
        score: finalScore,
        verdict,
        profile: prof,
        subscores: {
            temperature: tempSub,
            rain: rainSub,
            wind: windSub,
            aqi: aqiSub,
            uv: uvSub,
            outdoor: outdoorSub
        },
        reasons,
        summary
    };
}
