/**
 * Atmos Weather — Client-Side Activity Engine
 * Evaluates best and avoid windows for 16+ activities & custom slider builder.
 */

export const ACTIVITY_MAP = {
    running: { name: 'Running', icon: '🏃', ideal: 14, min: 10, max: 20, maxRain: 15, maxWind: 22 },
    walking: { name: 'Walking', icon: '🚶', ideal: 20, min: 14, max: 25, maxRain: 25, maxWind: 30 },
    cycling: { name: 'Cycling', icon: '🚴', ideal: 18, min: 12, max: 24, maxRain: 15, maxWind: 20 },
    workout: { name: 'Workout', icon: '💪', ideal: 16, min: 12, max: 22, maxRain: 10, maxWind: 25 },
    photography: { name: 'Photography', icon: '📷', ideal: 19, min: 8, max: 28, maxRain: 20, maxWind: 35 },
    picnic: { name: 'Picnic', icon: '🧺', ideal: 22, min: 18, max: 26, maxRain: 10, maxWind: 18 },
    travel: { name: 'Travel', icon: '✈️', ideal: 21, min: 12, max: 28, maxRain: 30, maxWind: 35 },
    shopping: { name: 'Shopping', icon: '🛍️', ideal: 21, min: 5, max: 35, maxRain: 50, maxWind: 45 },
    driving: { name: 'Driving', icon: '🚗', ideal: 20, min: -10, max: 40, maxRain: 35, maxWind: 40 },
    sports: { name: 'Sports', icon: '⚽', ideal: 18, min: 14, max: 24, maxRain: 15, maxWind: 22 },
    hiking: { name: 'Hiking', icon: '🥾', ideal: 17, min: 10, max: 24, maxRain: 15, maxWind: 28 },
    beach: { name: 'Beach', icon: '🏖️', ideal: 28, min: 24, max: 34, maxRain: 10, maxWind: 22 },
    gardening: { name: 'Gardening', icon: '🌱', ideal: 19, min: 14, max: 25, maxRain: 20, maxWind: 25 },
    stargazing: { name: 'Stargazing', icon: '✨', ideal: 15, min: -5, max: 25, maxRain: 5, maxWind: 20 },
    commuting: { name: 'Commuting', icon: '🚆', ideal: 20, min: 0, max: 35, maxRain: 30, maxWind: 35 },
    study_outdoors: { name: 'Study Outdoors', icon: '📚', ideal: 21, min: 18, max: 25, maxRain: 5, maxWind: 15 }
};

export function scoreHourlyActivity(hourlyData, activityKey = 'running') {
    const prof = ACTIVITY_MAP[activityKey] || ACTIVITY_MAP.walking;
    
    const results = (hourlyData || []).map(h => {
        const temp = h.temperature ?? 20;
        const app_t = h.apparent_temp ?? temp;
        const rain_p = h.precipitation_prob ?? 0;
        const wind = h.wind_speed ?? 10;
        const uv = h.uv_index ?? 2;
        const aqi = h.aqi ?? 30;
        const isDay = h.is_day === 1;

        if (activityKey === 'stargazing' && isDay) {
            return { time: h.time, score: 0, verdict: 'Daylight', reasons: ['Requires nighttime'] };
        }

        let score = 100;
        const pos = [];
        const neg = [];

        // Temp
        const tDiff = Math.abs(app_t - prof.ideal);
        if (tDiff <= 3) {
            score += 5;
            pos.push(`Optimal temp (${Math.round(app_t)}°)`);
        } else {
            score -= Math.min(40, Math.pow(tDiff, 1.3) * 2.2);
            if (app_t > prof.max) neg.push(`Too warm (${Math.round(app_t)}°)`);
            if (app_t < prof.min) neg.push(`Too cool (${Math.round(app_t)}°)`);
        }

        // Rain
        if (rain_p > prof.maxRain) {
            score -= Math.min(50, ((rain_p - prof.maxRain) / 50) * 45);
            neg.push(`Rain risk ${Math.round(rain_p)}%`);
        } else if (rain_p <= 10) {
            pos.push('Low rain risk');
        }

        // Wind
        if (wind > prof.maxWind) {
            score -= Math.min(30, ((wind - prof.maxWind) / 25) * 30);
            neg.push(`Windy (${Math.round(wind)} km/h)`);
        }

        // AQI
        if (aqi > 70) score -= 15;

        const finalScore = Math.max(0, Math.min(100, Math.round(score)));
        const verdict = finalScore >= 85 ? 'Excellent' : finalScore >= 70 ? 'Good' : finalScore >= 50 ? 'Moderate' : 'Poor';

        return {
            time: h.time,
            score: finalScore,
            verdict,
            pos,
            neg
        };
    });

    const best = results.length ? results.reduce((max, h) => h.score > max.score ? h : max, results[0]) : null;
    const avoid = results.length ? results.reduce((min, h) => h.score < min.score ? h : min, results[0]) : null;

    return {
        activityKey,
        name: prof.name,
        icon: prof.icon,
        hourly: results,
        bestWindow: best,
        avoidWindow: avoid
    };
}

export function scoreCustomActivityClient(hourlyData, activityName, weights, prefTemp = 20) {
    const wT = Math.max(1, Math.min(5, weights.temperature || 3));
    const wR = Math.max(1, Math.min(5, weights.rain || 5));
    const wW = Math.max(1, Math.min(5, weights.wind || 3));
    const wA = Math.max(1, Math.min(5, weights.aqi || 3));
    const wU = Math.max(1, Math.min(5, weights.uv || 3));
    const totalW = wT + wR + wW + wA + wU;

    const results = (hourlyData || []).map(h => {
        const temp = h.temperature ?? 20;
        const rain_p = h.precipitation_prob ?? 0;
        const wind = h.wind_speed ?? 10;
        const aqi = h.aqi ?? 30;
        const uv = h.uv_index ?? 2;

        const tSub = Math.max(0, 100 - (Math.abs(temp - prefTemp) * 6));
        const rSub = Math.max(0, 100 - (rain_p * 1.5));
        const wSub = Math.max(0, 100 - (Math.max(0, wind - 15) * 3.5));
        const aSub = Math.max(0, 100 - (Math.max(0, aqi - 40) * 0.75));
        const uSub = Math.max(0, 100 - (Math.max(0, uv - 4) * 12));

        const weighted = ((tSub * wT) + (rSub * wR) + (wSub * wW) + (aSub * wA) + (uSub * wU)) / totalW;
        const finalS = Math.max(0, Math.min(100, Math.round(weighted)));

        return {
            time: h.time,
            score: finalS,
            verdict: finalS >= 85 ? 'Excellent' : finalS >= 70 ? 'Good' : finalS >= 50 ? 'Moderate' : 'Poor'
        };
    });

    const best = results.length ? results.reduce((max, h) => h.score > max.score ? h : max, results[0]) : null;
    const avoid = results.length ? results.reduce((min, h) => h.score < min.score ? h : min, results[0]) : null;

    return {
        activityName,
        hourly: results,
        bestWindow: best,
        avoidWindow: avoid
    };
}
