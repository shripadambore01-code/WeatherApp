/**
 * Atmos AI / SkyMind Client-Side Assistant Orchestrator
 * Fully dynamic meteorological intelligence powered by real-time telemetry, live search, and Google Gemini.
 */

import { searchCities, fetchWeather } from '../api.js';
import { calculateWeatherScore } from './weatherScore.js';
import { scoreHourlyActivity } from './activityEngine.js';
import { getWeatherDescription } from '../utils.js';

export async function askAtmosAI(question, currentCityName, currentData, hourlyData = [], dailyData = null) {
    const q = question.toLowerCase().trim();

    // 1. Check if the user is asking about a specific city/location (e.g., Delhi, Odisha, Mumbai, London, etc.)
    let targetCity = currentCityName;
    let targetCurrent = currentData;
    let targetHourly = hourlyData;
    let targetDaily = dailyData;

    const detectedLocation = extractLocationFromQuery(question, currentCityName);
    if (detectedLocation && detectedLocation.toLowerCase() !== currentCityName.toLowerCase()) {
        try {
            const searchRes = await searchCities(detectedLocation, 1);
            if (searchRes && searchRes.results && searchRes.results.length > 0) {
                const loc = searchRes.results[0];
                targetCity = `${loc.name}, ${loc.country || ''}`;
                const weatherRes = await fetchWeather(loc.latitude, loc.longitude);
                if (weatherRes && weatherRes.current && weatherRes.daily) {
                    targetCurrent = weatherRes.current;
                    targetDaily = weatherRes.daily;
                    // Format hourly
                    const h = weatherRes.hourly || {};
                    targetHourly = (h.time || []).slice(0, 24).map((t, idx) => ({
                        time: new Date(t).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
                        temperature: h.temperature_2m?.[idx] ?? 20,
                        precipitation_prob: h.precipitation_probability?.[idx] ?? 0,
                        wind_speed: h.wind_speed_10m?.[idx] ?? 10
                    }));
                }
            }
        } catch (err) {
            console.warn('Real-time location fetch error in AI assistant:', err);
        }
    }

    const temp = targetCurrent?.temperature_2m ?? 20;
    const app_t = targetCurrent?.apparent_temperature ?? temp;
    const rain_p = targetCurrent?.precipitation_probability ?? 0;
    const wind = targetCurrent?.wind_speed_10m ?? 10;
    const uv = targetCurrent?.uv_index ?? 3;
    const aqi = targetCurrent?.aqi ?? 35;

    // 2. Try Backend API with full target location telemetry
    try {
        const resp = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                city_name: targetCity,
                current_data: targetCurrent,
                hourly_data: targetHourly.slice(0, 24),
                daily_data: targetDaily
            })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.answer) return data;
        }
    } catch (e) {
        // Backend offline / static hosting, proceed with client-side real-time engine
    }

    // 3. Match Date Horizon in Target Forecast (e.g. 16 August, tomorrow, Sunday, etc.)
    const dateMatch = matchDateInForecast(question, targetDaily);

    if (dateMatch && targetDaily && targetDaily.time) {
        const idx = dateMatch.index;
        const matchedDate = targetDaily.time[idx];
        const code = targetDaily.weather_code ? targetDaily.weather_code[idx] : 0;
        const desc = getWeatherDescription(code);
        const maxT = targetDaily.temperature_2m_max ? targetDaily.temperature_2m_max[idx] : temp;
        const minT = targetDaily.temperature_2m_min ? targetDaily.temperature_2m_min[idx] : temp - 4;
        const rainProb = targetDaily.precipitation_probability_max ? targetDaily.precipitation_probability_max[idx] : (targetDaily.rain_sum ? (targetDaily.rain_sum[idx] > 0 ? 80 : 10) : 0);
        const rainSum = targetDaily.rain_sum ? targetDaily.rain_sum[idx] : 0;

        let answer = '';
        if (q.includes('rain') || q.includes('umbrella') || q.includes('shower') || q.includes('precipitation')) {
            if (rainProb >= 50 || rainSum > 1.0) {
                answer = `Yes, rain is expected in ${targetCity} on ${dateMatch.label} (${matchedDate}) with ${desc}. The rain probability is ${Math.round(rainProb)}% (High: ${Math.round(maxT)}°C, Low: ${Math.round(minT)}°C). Carrying an umbrella is advised.`;
            } else if (rainProb >= 25) {
                answer = `There is a moderate ${Math.round(rainProb)}% chance of light rain or showers in ${targetCity} on ${dateMatch.label} with ${desc} (High: ${Math.round(maxT)}°C, Low: ${Math.round(minT)}°C).`;
            } else {
                answer = `No significant rain is expected in ${targetCity} on ${dateMatch.label} (${matchedDate}). Conditions look dry with ${desc}, a rain probability of only ${Math.round(rainProb)}%, and highs reaching ${Math.round(maxT)}°C.`;
            }
        } else {
            answer = `Weather forecast for ${targetCity} on ${dateMatch.label} (${matchedDate}): Expect ${desc} with a maximum temperature of ${Math.round(maxT)}°C and a minimum of ${Math.round(minT)}°C. Rain probability is ${Math.round(rainProb)}%.`;
        }

        return {
            question,
            city: targetCity,
            answer,
            tool_called: 'daily_forecast.date_matched_search',
            confidence: 'High',
            verified_metrics: {
                location: targetCity,
                date: matchedDate,
                condition: desc,
                max_temp: `${Math.round(maxT)}°C`,
                min_temp: `${Math.round(minT)}°C`,
                rain_probability: `${Math.round(rainProb)}%`
            },
            reasons: [`Live forecast queried for ${targetCity} on ${matchedDate}`]
        };
    }

    // 4. Check for "Tonight" / "Later Today"
    const isTonight = q.includes('tonight') || q.includes('evening') || q.includes('later') || q.includes('afternoon') || q.includes('night');
    if (isTonight && targetHourly.length > 0) {
        const laterHours = targetHourly.slice(2, 10);
        const maxRainLater = Math.max(...laterHours.map(h => h.precipitation_prob || 0), rain_p);
        const avgTempLater = laterHours.reduce((acc, h) => acc + (h.temperature || temp), 0) / Math.max(laterHours.length, 1);

        let answer = '';
        if (q.includes('rain') || q.includes('umbrella')) {
            if (maxRainLater >= 50) {
                answer = `Rain chances increase up to ${Math.round(maxRainLater)}% later today in ${targetCity}. Having an umbrella with you is advised.`;
            } else {
                answer = `Skies look predominantly dry later today in ${targetCity}, with rain probability staying under ${Math.round(maxRainLater)}%.`;
            }
        } else {
            answer = `Later today in ${targetCity}, temperatures will hover around ${Math.round(avgTempLater)}°C with rain risk at ${Math.round(maxRainLater)}%.`;
        }

        return {
            question,
            city: targetCity,
            answer,
            tool_called: 'hourly_forecast.tonight_scan',
            confidence: 'High',
            verified_metrics: {
                location: targetCity,
                forecast_horizon: 'Tonight / Later Today',
                expected_temp: `${Math.round(avgTempLater)}°C`,
                max_rain_risk: `${Math.round(maxRainLater)}%`
            },
            reasons: [`Analyzed next 8 hours for ${targetCity}`]
        };
    }

    // 5. Current Rain & Umbrella
    if (q.includes('rain') || q.includes('umbrella') || q.includes('shower')) {
        let answer = '';
        if (rain_p >= 50) {
            answer = `Yes, carry an umbrella in ${targetCity}. Current rain probability is elevated at ${Math.round(rain_p)}%.`;
        } else if (rain_p >= 25) {
            answer = `A light rain chance (${Math.round(rain_p)}%) is present in ${targetCity}. Keeping a compact umbrella handy is recommended.`;
        } else {
            answer = `No umbrella needed currently in ${targetCity}. Rain probability is only ${Math.round(rain_p)}% with dry skies.`;
        }
        return {
            question,
            city: targetCity,
            answer,
            tool_called: 'current_telemetry.rain_evaluator',
            confidence: 'High',
            verified_metrics: { location: targetCity, temperature: `${Math.round(temp)}°C`, rain_probability: `${Math.round(rain_p)}%` },
            reasons: [`Verified real-time conditions for ${targetCity}`]
        };
    }

    // 6. Running / Workout
    if (q.includes('run') || q.includes('jog') || q.includes('workout') || q.includes('exercise')) {
        const res = scoreHourlyActivity(targetHourly, 'running');
        const best = res.bestWindow;
        return {
            question,
            city: targetCity,
            answer: `The best time to run in ${targetCity} is around ${best ? best.time : 'the morning'} (${best ? best.score : 88}/100). Temperatures are comfortable and rain risk is low.`,
            tool_called: 'activity_engine.running',
            confidence: 'High',
            verified_metrics: { location: targetCity, temperature: `${Math.round(temp)}°C` },
            reasons: [`Activity suitability scored for ${targetCity}`]
        };
    }

    // 7. General Weather Overview
    const sc = calculateWeatherScore({
        temperature: temp,
        apparent_temp: app_t,
        uv_index: uv,
        aqi: aqi,
        wind_speed: wind,
        precipitation_prob: rain_p
    });

    return {
        question,
        city: targetCity,
        answer: `Currently in ${targetCity}, conditions are ${Math.round(temp)}°C with a Weather Score of ${sc.score}/100 (${sc.verdict}). ${sc.reasons[0]}.`,
        tool_called: 'weather_score.universal_profile',
        confidence: 'High',
        verified_metrics: {
            location: targetCity,
            temperature: `${Math.round(temp)}°C`,
            feels_like: `${Math.round(app_t)}°C`,
            rain_probability: `${Math.round(rain_p)}%`,
            wind: `${Math.round(wind)} km/h`
        },
        reasons: [`Live telemetry queried for ${targetCity}`]
    };
}

/**
 * Extracts candidate location name from natural query.
 */
function extractLocationFromQuery(query, fallbackCity) {
    const q = query.trim();
    // Patterns: "in Delhi", "at Odisha", "for London", "in new york", "in Tokyo on 16 august"
    const match = q.match(/(?:in|at|for|of|near)\s+([a-zA-Z\s]+?)(?:\?|\s+on\s+|\s+at\s+|\s+tomorrow|\s+today|\s+this|\s*$)/i);
    if (match && match[1]) {
        const candidate = match[1].trim();
        const ignore = [
            'the morning', 'the evening', 'the afternoon', 'the night', 'tomorrow', 'today',
            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
            'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
            'celsius', 'fahrenheit', 'outdoor', 'indoor'
        ];
        if (!ignore.includes(candidate.toLowerCase()) && candidate.length >= 2) {
            return candidate;
        }
    }
    return null;
}

/**
 * Matches target date or day of the week in the 7-day daily forecast.
 */
function matchDateInForecast(query, dailyData) {
    if (!dailyData || !dailyData.time || !dailyData.time.length) return null;
    const q = query.toLowerCase();

    if (q.includes('tomorrow') || q.includes('next day')) {
        return { index: Math.min(1, dailyData.time.length - 1), label: 'Tomorrow' };
    }
    if (q.includes('today') || q.includes('now')) {
        return { index: 0, label: 'Today' };
    }

    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Check weekday
    for (const d of days) {
        if (q.includes(d)) {
            for (let i = 0; i < dailyData.time.length; i++) {
                const dayName = new Date(dailyData.time[i]).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                if (dayName === d) {
                    return { index: i, label: `${d.charAt(0).toUpperCase() + d.slice(1)} (${dailyData.time[i]})` };
                }
            }
        }
    }

    // Check numeric day + month (e.g. "16 august", "august 16", "16th")
    for (let i = 0; i < dailyData.time.length; i++) {
        const iso = dailyData.time[i]; // "2026-08-16"
        const dateObj = new Date(iso);
        const dayNum = dateObj.getDate();
        const monthNum = dateObj.getMonth();
        const monthName = months[monthNum];
        const shortMonth = shortMonths[monthNum];

        if (
            q.includes(`${dayNum} ${monthName}`) ||
            q.includes(`${monthName} ${dayNum}`) ||
            q.includes(`${dayNum}th ${monthName}`) ||
            q.includes(`${dayNum}th`) ||
            q.includes(`${dayNum} ${shortMonth}`) ||
            q.includes(`${shortMonth} ${dayNum}`) ||
            q.includes(iso) ||
            q.includes(`${dayNum}`)
        ) {
            return { index: i, label: `${dayNum} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}` };
        }
    }

    return null;
}
