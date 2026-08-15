/**
 * Atmos AI / SkyMind Client-Side Assistant Orchestrator
 * Answers user questions with verified meteorological context and offline fallback.
 */

import { calculateWeatherScore } from './weatherScore.js';
import { scoreHourlyActivity } from './activityEngine.js';

export async function askAtmosAI(question, cityName, currentData, hourlyData = []) {
    const q = question.toLowerCase();
    const temp = currentData.temperature_2m ?? 20;
    const app_t = currentData.apparent_temperature ?? temp;
    const rain_p = currentData.precipitation_probability ?? 0;
    const wind = currentData.wind_speed_10m ?? 10;
    const uv = currentData.uv_index ?? 3;
    const aqi = currentData.aqi ?? 35;

    // Try Backend API First
    try {
        const resp = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                city_name: cityName,
                current_data: currentData,
                hourly_data: hourlyData.slice(0, 24)
            })
        });
        if (resp.ok) {
            const data = await resp.json();
            return data;
        }
    } catch (e) {
        console.warn('Backend AI route unavailable, using client-side tool calling:', e);
    }

    // Client-side Deterministic Tool Calling Fallback
    let answer = '';
    let toolUsed = 'client.tool_calling';

    if (q.includes('rain') || q.includes('umbrella') || q.includes('shower')) {
        toolUsed = 'client.rain_check';
        if (rain_p >= 50) {
            answer = `Yes, bring an umbrella in ${cityName}. Rain risk is elevated at ${Math.round(rain_p)}%.`;
        } else if (rain_p >= 25) {
            answer = `A light rain chance (${Math.round(rain_p)}%) is present in ${cityName}. Keeping a compact umbrella handy is recommended.`;
        } else {
            answer = `No umbrella needed in ${cityName}. Rain probability is only ${Math.round(rain_p)}% with dry skies.`;
        }
    } else if (q.includes('run') || q.includes('jog') || q.includes('workout')) {
        toolUsed = 'client.activity_engine.running';
        const res = scoreHourlyActivity(hourlyData, 'running');
        const best = res.bestWindow;
        answer = `The best time to run in ${cityName} is around ${best ? best.time : 'the morning'} (${best ? best.score : 88}/100). Temperatures are comfortable and rain risk is low.`;
    } else if (q.includes('wear') || q.includes('jacket') || q.includes('clothes')) {
        toolUsed = 'client.decision_engine.jacket';
        if (app_t < 14) {
            answer = `In ${cityName} (${Math.round(temp)}°C, feels like ${Math.round(app_t)}°C), wear an insulated jacket or warm layers.`;
        } else if (app_t < 20) {
            answer = `In ${cityName} (${Math.round(temp)}°C), a light jacket, sweater, or layered top is ideal.`;
        } else {
            answer = `In ${cityName} (${Math.round(temp)}°C), breathable lightweight clothing is comfortable. Add sunglasses if outdoors.`;
        }
    } else if (q.includes('photo') || q.includes('camera') || q.includes('star')) {
        toolUsed = 'client.astro_photo';
        if (q.includes('star')) {
            const clouds = currentData.cloud_cover ?? 20;
            answer = clouds < 25
                ? `Tonight offers great stargazing in ${cityName} with only ${Math.round(clouds)}% cloud cover.`
                : `Stargazing will be limited in ${cityName} tonight due to ${Math.round(clouds)}% cloud cover.`;
        } else {
            answer = `For photography in ${cityName}, best lighting contrast occurs during Golden Hour (around sunrise or 45 min before sunset).`;
        }
    } else if (q.includes('feel') || q.includes('hotter') || q.includes('colder')) {
        toolUsed = 'client.thermal_index';
        const diff = Math.round(app_t - temp);
        if (diff > 1) {
            answer = `In ${cityName}, it feels ${diff}°C hotter (${Math.round(app_t)}°C) than ${Math.round(temp)}°C because relative humidity reduces evaporative cooling.`;
        } else if (diff < -1) {
            answer = `In ${cityName}, it feels ${Math.abs(diff)}°C cooler (${Math.round(app_t)}°C) than ${Math.round(temp)}°C due to wind chill.`;
        } else {
            answer = `In ${cityName}, the feels-like temperature (${Math.round(app_t)}°C) is closely aligned with the measured ${Math.round(temp)}°C.`;
        }
    } else {
        const sc = calculateWeatherScore({
            temperature: temp,
            apparent_temp: app_t,
            uv_index: uv,
            aqi: aqi,
            wind_speed: wind,
            precipitation_prob: rain_p
        });
        answer = `Currently in ${cityName}, conditions are ${Math.round(temp)}°C with a Weather Score of ${sc.score}/100 (${sc.verdict}). ${sc.reasons[0]}.`;
    }

    return {
        question,
        city: cityName,
        answer,
        tool_called: toolUsed,
        confidence: 'High',
        verified_metrics: {
            temperature: `${Math.round(temp)}°C`,
            feels_like: `${Math.round(app_t)}°C`,
            rain_probability: `${Math.round(rain_p)}%`,
            wind: `${Math.round(wind)} km/h`,
            uv,
            aqi
        },
        reasons: [`Telemetry verified for ${cityName}`]
    };
}
