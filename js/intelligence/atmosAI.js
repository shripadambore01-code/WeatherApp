/**
 * Atmos AI / SkyMind Client-Side Assistant Orchestrator
 * Fully dynamic meteorological intelligence powered by real-time telemetry, live search across all Indian cities & states, and Google Gemini.
 */

import { searchCities, fetchWeather } from '../api.js';
import { calculateWeatherScore } from './weatherScore.js';
import { scoreHourlyActivity, evaluateSingleActivity } from './activityEngine.js';
import { analyzeRainIntelligence } from './rainIntelligence.js';
import { explainMeteorologicalMetric } from './whyExplainer.js';
import { getWeatherDescription } from '../utils.js';

export async function askAtmosAI(question, currentCityName, currentData, hourlyData = [], dailyData = null, aqiData = null) {
    const q = question.toLowerCase().trim();

    // 1. Detect target location in query (any Indian city, district, state or international city)
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
                targetCity = loc.name.includes(loc.country || '') ? loc.name : `${loc.name}, ${loc.country || 'India'}`;
                const weatherRes = await fetchWeather(loc.latitude, loc.longitude);
                if (weatherRes && weatherRes.current && weatherRes.daily) {
                    targetCurrent = weatherRes.current;
                    targetDaily = weatherRes.daily;
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

    const temp = targetCurrent?.temperature_2m ?? 24;
    const app_t = targetCurrent?.apparent_temperature ?? temp;
    const rain_p = targetCurrent?.precipitation_probability ?? 0;
    const wind = targetCurrent?.wind_speed_10m ?? 10;
    const uv = targetCurrent?.uv_index ?? 3.5;
    const aqi = aqiData?.current?.us_aqi ?? targetCurrent?.aqi ?? 35;

    // 2. Try Backend API if full-stack is running
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
    } catch (e) {}

    // 3. Educational "Why?" Explanations
    if (q.startsWith('why') || q.includes('why is') || q.includes('why does')) {
        let metricKey = 'general';
        if (q.includes('humidity') || q.includes('sweat') || q.includes('muggy')) metricKey = 'humidity';
        else if (q.includes('hotter') || q.includes('colder') || q.includes('feels like') || q.includes('feel')) metricKey = 'feels_like';
        else if (q.includes('pressure') || q.includes('barometer')) metricKey = 'pressure';
        else if (q.includes('uv') || q.includes('sun')) metricKey = 'uv';
        else if (q.includes('rain') || q.includes('precipitation')) metricKey = 'rain';
        else if (q.includes('aqi') || q.includes('air quality') || q.includes('pollution')) metricKey = 'aqi';

        const exp = explainMeteorologicalMetric(metricKey, targetCurrent, targetHourly, aqiData);
        return {
            question,
            city: targetCity,
            answer: `${exp.title}\n\n${exp.explanation}\n\n💡 Action: ${exp.action}`,
            tool_called: 'educational.why_explainer',
            confidence: 'High',
            verified_metrics: { metric: exp.keyFactor, location: targetCity }
        };
    }

    // 4. Scenario: College / Work Commute (e.g. "I have college from 8 AM to 5 PM. What should I carry?")
    if (q.includes('college') || q.includes('school') || q.includes('commute') || q.includes('office') || (q.includes('carry') && q.includes('what'))) {
        const rainInfo = analyzeRainIntelligence(targetHourly, targetCurrent);
        let carryItems = ['Water bottle'];
        if (rainInfo.hasRainRisk || rain_p >= 35) carryItems.push('Umbrella / Rain poncho');
        if (uv >= 6) carryItems.push('Sunglasses / Sunscreen');
        if (app_t > 30) carryItems.push('Light breathable clothing');
        else if (app_t < 18) carryItems.push('Light sweater or jacket');

        const answer = `🌤️ **Morning & Commute Outlook for ${targetCity}**:\n` +
            `• **Conditions**: ${Math.round(temp)}°C (${getWeatherDescription(targetCurrent?.weather_code || 0)})\n` +
            `• **🎒 Recommended to carry**: ${carryItems.join(', ')}\n` +
            `• **🌧️ Rain Risk**: ${rainInfo.nextRainWindow} (${rainInfo.peakProbability}% peak)\n` +
            `• **🚶 Best Outdoor Window**: ${rainInfo.bestOutdoorWindow}\n` +
            `• **Decision**: ${rainInfo.recommendation}`;

        return {
            question,
            city: targetCity,
            answer,
            tool_called: 'scenario_engine.commute_planner',
            confidence: 'High',
            verified_metrics: { location: targetCity, temperature: `${Math.round(temp)}°C`, rain_peak: `${rainInfo.peakProbability}%` }
        };
    }

    // 5. Apparel / Clothing ("What should I wear?")
    if (q.includes('wear') || q.includes('clothes') || q.includes('outfit') || q.includes('jacket')) {
        let apparel = '';
        if (app_t >= 28) {
            apparel = 'Wear lightweight, breathable cotton or linen fabrics. Keep sunglasses and sunscreen handy due to solar radiance.';
        } else if (app_t >= 20) {
            apparel = 'Comfortable casual wear (t-shirt, shirt, jeans). Thermal conditions are balanced.';
        } else if (app_t >= 14) {
            apparel = 'Wear a light jacket, hoodie, or long-sleeve layer. Mildly cool breezes are active.';
        } else {
            apparel = 'Wear a warm jacket, coat, or layered thermal clothing to protect against chilly temperatures.';
        }
        if (rain_p >= 35) apparel += ' Carry an umbrella or waterproof outerwear for rain protection.';

        return {
            question,
            city: targetCity,
            answer: `In ${targetCity} (feels like ${Math.round(app_t)}°C): ${apparel}`,
            tool_called: 'lifestyle.apparel_advisor',
            confidence: 'High',
            verified_metrics: { location: targetCity, feels_like: `${Math.round(app_t)}°C`, rain_risk: `${Math.round(rain_p)}%` }
        };
    }

    // 6. Briefing & Weekend Summaries
    if (q.includes('briefing') || q.includes('summary') || q.includes('morning') || q.includes('weekend')) {
        const sc = calculateWeatherScore(targetCurrent);
        const rainInfo = analyzeRainIntelligence(targetHourly, targetCurrent);
        const desc = getWeatherDescription(targetCurrent?.weather_code || 0);

        let answer = '';
        if (q.includes('weekend') && targetDaily && targetDaily.time) {
            const satCode = targetDaily.weather_code?.[1] || 0;
            const satMax = targetDaily.temperature_2m_max?.[1] || temp;
            const satRain = targetDaily.precipitation_probability_max?.[1] || 0;
            answer = `📅 **Weekend Outlook for ${targetCity}**:\n` +
                `Expect ${getWeatherDescription(satCode)} with highs around ${Math.round(satMax)}°C. Rain probability is ${Math.round(satRain)}%. Overall outdoor suitability is ${satRain < 35 ? 'Good' : 'Moderate'}.`;
        } else {
            answer = `🌅 **Atmos Meteorological Briefing for ${targetCity}**:\n` +
                `Today is ${Math.round(temp)}°C with ${desc} (Feels like ${Math.round(app_t)}°C). ` +
                `Rain probability is ${Math.round(rain_p)}% (${rainInfo.nextRainWindow}). ` +
                `Air Quality is AQI ${Math.round(aqi)}, and UV index is ${uv.toFixed(1)}. ` +
                `Atmos Score is ${sc.score}/100 (${sc.verdict}). ${sc.summary}`;
        }

        return {
            question,
            city: targetCity,
            answer,
            tool_called: 'briefing_generator.executive_brief',
            confidence: 'High',
            verified_metrics: { location: targetCity, temperature: `${Math.round(temp)}°C`, atmos_score: `${sc.score}/100` }
        };
    }

    // 7. Match Date Horizon in Target Forecast (Today, Tomorrow, Specific Dates, Past Dates)
    const dateResolution = resolveDateQuery(question, targetDaily);

    if (dateResolution) {
        if (dateResolution.isPast) {
            const todayCode = targetDaily?.weather_code ? targetDaily.weather_code[0] : 0;
            const todayDesc = getWeatherDescription(todayCode);
            const tomorrowCode = targetDaily?.weather_code ? targetDaily.weather_code[1] : 0;
            const tomorrowDesc = getWeatherDescription(tomorrowCode);
            const tomorrowRain = targetDaily?.precipitation_probability_max ? targetDaily.precipitation_probability_max[1] : 0;
            
            return {
                question,
                city: targetCity,
                answer: `${dateResolution.label} has already passed. For today in ${targetCity}, current conditions are ${Math.round(temp)}°C with ${todayDesc} and ${Math.round(rain_p)}% rain risk. Tomorrow (${targetDaily?.time?.[1] || 'Next Day'}), expect ${tomorrowDesc} with ${Math.round(tomorrowRain)}% rain probability.`,
                tool_called: 'daily_forecast.past_date_detector',
                confidence: 'High',
                verified_metrics: { location: targetCity, requested_date: dateResolution.label }
            };
        }

        if (dateResolution.matchedIndex !== null && targetDaily && targetDaily.time) {
            const idx = dateResolution.matchedIndex;
            const matchedDate = targetDaily.time[idx];
            const code = targetDaily.weather_code ? targetDaily.weather_code[idx] : 0;
            const desc = getWeatherDescription(code);
            const maxT = targetDaily.temperature_2m_max ? targetDaily.temperature_2m_max[idx] : temp;
            const minT = targetDaily.temperature_2m_min ? targetDaily.temperature_2m_min[idx] : temp - 4;
            const rainProb = targetDaily.precipitation_probability_max ? targetDaily.precipitation_probability_max[idx] : 0;

            let answer = '';
            if (q.includes('rain') || q.includes('umbrella') || q.includes('shower')) {
                if (rainProb >= 50) {
                    answer = `Yes, rain is expected in ${targetCity} on ${dateResolution.label} (${matchedDate}) with ${desc}. Rain probability is ${Math.round(rainProb)}% (High: ${Math.round(maxT)}°C, Low: ${Math.round(minT)}°C). Carrying an umbrella is advised.`;
                } else {
                    answer = `No significant rain is expected in ${targetCity} on ${dateResolution.label} (${matchedDate}). Conditions look dry with ${desc}, a rain probability of only ${Math.round(rainProb)}%, and highs reaching ${Math.round(maxT)}°C.`;
                }
            } else {
                answer = `Weather forecast for ${targetCity} on ${dateResolution.label} (${matchedDate}): Expect ${desc} with a high of ${Math.round(maxT)}°C and low of ${Math.round(minT)}°C. Rain probability is ${Math.round(rainProb)}%.`;
            }

            return {
                question,
                city: targetCity,
                answer,
                tool_called: 'daily_forecast.date_matched_search',
                confidence: 'High',
                verified_metrics: { location: targetCity, date: matchedDate, condition: desc }
            };
        }
    }

    // 8. Activities: Running, Cycling, Travel, Sports
    if (q.includes('run') || q.includes('cycling') || q.includes('sports') || q.includes('travel') || q.includes('walk') || q.includes('outdoor')) {
        let actKey = 'running';
        if (q.includes('cycl')) actKey = 'cycling';
        else if (q.includes('sport') || q.includes('cricket') || q.includes('football')) actKey = 'sports';
        else if (q.includes('travel')) actKey = 'travel';
        else if (q.includes('walk')) actKey = 'walking';

        const act = evaluateSingleActivity(targetHourly, targetCurrent, actKey);
        return {
            question,
            city: targetCity,
            answer: `${act.icon} **${act.name} in ${targetCity}**:\n• **Best Window**: ${act.bestTime}\n• **Suitability**: ${act.suitability} (Risk: ${act.riskLevel})\n• **Recommendation**: ${act.recommendation}`,
            tool_called: `activity_engine.${actKey}`,
            confidence: 'High',
            verified_metrics: { location: targetCity, best_window: act.bestTime }
        };
    }

    // 9. Current Rain / Umbrella
    if (q.includes('rain') || q.includes('umbrella')) {
        const rainInfo = analyzeRainIntelligence(targetHourly, targetCurrent);
        return {
            question,
            city: targetCity,
            answer: `🌧️ **Rain Outlook for ${targetCity}**:\n• **Current Probability**: ${rainInfo.currentProbability}%\n• **Next Rain**: ${rainInfo.nextRainWindow}\n• **Peak Risk**: ${rainInfo.peakProbability}%\n• **Decision**: ${rainInfo.recommendation}`,
            tool_called: 'rain_intelligence.evaluator',
            confidence: 'High',
            verified_metrics: { location: targetCity, rain_probability: `${rainInfo.currentProbability}%` }
        };
    }

    // 10. General Overview
    const sc = calculateWeatherScore(targetCurrent);
    return {
        question,
        city: targetCity,
        answer: `Currently in ${targetCity}, conditions are ${Math.round(temp)}°C (${getWeatherDescription(targetCurrent?.weather_code || 0)}) with a Weather Score of ${sc.score}/100 (${sc.verdict}). ${sc.summary}`,
        tool_called: 'weather_score.universal_profile',
        confidence: 'High',
        verified_metrics: { location: targetCity, temperature: `${Math.round(temp)}°C`, feels_like: `${Math.round(app_t)}°C` }
    };
}

export function extractLocationFromQuery(query, fallbackCity) {
    const q = query.trim();
    const prepMatch = q.match(/(?:in|at|for|of|near)\s+([a-zA-Z\s]+?)(?:\?|\s+on\s+|\s+at\s+|\s+tomorrow|\s+today|\s+this|\s+next|\s*$)/i);
    if (prepMatch && prepMatch[1]) {
        const candidate = prepMatch[1].trim();
        const ignore = [
            'the morning', 'the evening', 'the afternoon', 'the night', 'tomorrow', 'today',
            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
            'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
            'celsius', 'fahrenheit', 'outdoor', 'indoor', 'the weekend', 'the week', 'the day'
        ];
        if (!ignore.includes(candidate.toLowerCase()) && candidate.length >= 2) {
            return candidate;
        }
    }

    const words = q.replace(/[?,.!]/g, '').split(/\s+/);
    const stopWords = [
        'will', 'it', 'rain', 'is', 'there', 'any', 'weather', 'forecast', 'temperature', 'temp',
        'today', 'tomorrow', 'tonight', 'on', 'at', 'in', 'for', 'the', 'what', 'how', 'should',
        'i', 'wear', 'run', 'best', 'time', 'to', 'can', 'go', 'umbrella', 'jacket', 'good', 'bad',
        'college', 'commute', 'carry', 'travel', 'cycling', 'why', 'feels', 'hotter', 'colder', 'humidity'
    ];

    for (const w of words) {
        if (!stopWords.includes(w.toLowerCase()) && w.length >= 3 && !/^\d+$/.test(w)) {
            return w;
        }
    }

    return null;
}

function resolveDateQuery(query, dailyData) {
    const q = query.toLowerCase();

    if (q.includes('tomorrow') || q.includes('next day')) {
        return { matchedIndex: 1, label: 'Tomorrow', isPast: false };
    }
    if (q.includes('today') || q.includes('now')) {
        return { matchedIndex: 0, label: 'Today', isPast: false };
    }
    if (q.includes('day after tomorrow')) {
        return { matchedIndex: 2, label: 'Day after tomorrow', isPast: false };
    }

    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (dailyData && dailyData.time) {
        for (const d of days) {
            if (q.includes(d)) {
                for (let i = 0; i < dailyData.time.length; i++) {
                    const dayName = new Date(dailyData.time[i]).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    if (dayName === d) {
                        return { matchedIndex: i, label: `${d.charAt(0).toUpperCase() + d.slice(1)}`, isPast: false };
                    }
                }
            }
        }
    }

    let targetDay = null;
    let targetMonth = null;

    const datePattern = q.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)/i) || q.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
    if (datePattern) {
        const p1 = datePattern[1];
        const p2 = datePattern[2];
        let dayStr = /^\d+$/.test(p1) ? p1 : p2;
        let monthStr = /^\d+$/.test(p1) ? p2 : p1;

        const mIdx = months.indexOf(monthStr.toLowerCase()) !== -1
            ? months.indexOf(monthStr.toLowerCase())
            : shortMonths.indexOf(monthStr.toLowerCase());

        if (mIdx !== -1 && !isNaN(parseInt(dayStr))) {
            targetDay = parseInt(dayStr);
            targetMonth = mIdx;
        }
    }

    if (dailyData && dailyData.time && dailyData.time.length > 0) {
        const todayIso = dailyData.time[0];
        const todayObj = new Date(todayIso);
        const todayDay = todayObj.getDate();
        const todayMonth = todayObj.getMonth();

        if (targetDay !== null && targetMonth !== null) {
            const queryMonthName = months[targetMonth];
            const dateLabel = `${targetDay} ${queryMonthName.charAt(0).toUpperCase() + queryMonthName.slice(1)}`;

            for (let i = 0; i < dailyData.time.length; i++) {
                const fObj = new Date(dailyData.time[i]);
                if (fObj.getDate() === targetDay && fObj.getMonth() === targetMonth) {
                    return { matchedIndex: i, label: dateLabel, isPast: false };
                }
            }

            if (targetMonth < todayMonth || (targetMonth === todayMonth && targetDay < todayDay)) {
                return { matchedIndex: null, label: dateLabel, isPast: true };
            }

            return { matchedIndex: dailyData.time.length - 1, label: dateLabel, isPast: false };
        }
    }

    return null;
}
