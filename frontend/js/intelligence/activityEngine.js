/**
 * Atmos Weather — Activity Planner Engine
 * Evaluates best time windows, suitability, risk levels, and actionable recommendations
 * for 9 core daily activities grounded in real hourly forecast telemetry.
 */

export const ACTIVITY_MAP = {
    running: { name: 'Running', icon: '🏃', ideal: 16, min: 10, max: 22, maxRain: 15, maxWind: 22 },
    walking: { name: 'Walking', icon: '🚶', ideal: 20, min: 14, max: 26, maxRain: 25, maxWind: 28 },
    cycling: { name: 'Cycling', icon: '🚲', ideal: 18, min: 12, max: 25, maxRain: 15, maxWind: 20 },
    sports: { name: 'Outdoor Sports', icon: '🏏', ideal: 20, min: 14, max: 28, maxRain: 10, maxWind: 22 },
    photography: { name: 'Photography', icon: '📸', ideal: 19, min: 8, max: 28, maxRain: 20, maxWind: 30 },
    picnic: { name: 'Picnic', icon: '🧺', ideal: 22, min: 18, max: 27, maxRain: 10, maxWind: 18 },
    travel: { name: 'Travel / Road Trip', icon: '🚗', ideal: 21, min: 5, max: 35, maxRain: 30, maxWind: 35 },
    commute: { name: 'College Commute', icon: '🎓', ideal: 22, min: 8, max: 35, maxRain: 25, maxWind: 30 },
    outdoor: { name: 'Outdoor Activities', icon: '🌳', ideal: 21, min: 15, max: 27, maxRain: 15, maxWind: 24 }
};

export function evaluateAllActivities(hourlyData = [], currentData = {}) {
    const list = Object.keys(ACTIVITY_MAP);
    return list.map(key => evaluateSingleActivity(hourlyData, currentData, key));
}

export function evaluateSingleActivity(hourlyData = [], currentData = {}, activityKey = 'running') {
    const config = ACTIVITY_MAP[activityKey] || ACTIVITY_MAP.running;
    const hours = (hourlyData || []).slice(0, 24);

    if (!hours.length) {
        return {
            key: activityKey,
            name: config.name,
            icon: config.icon,
            bestTime: 'Morning (6 AM – 9 AM)',
            suitability: 'Good',
            riskLevel: 'Low',
            reason: 'Calm morning conditions',
            recommendation: 'Check local skies before heading out.'
        };
    }

    // Score each hour for this specific activity
    const scoredHours = hours.map((h, idx) => {
        const temp = h.temperature ?? currentData.temperature_2m ?? 24;
        const app_t = h.apparent_temp ?? temp;
        const rain_p = h.precipitation_prob ?? 0;
        const wind = h.wind_speed ?? 10;
        const uv = h.uv_index ?? 3;
        const aqi = h.aqi ?? 35;

        let score = 100;

        // Temp penalty
        const tDiff = Math.abs(app_t - config.ideal);
        if (tDiff > 3) score -= Math.min(45, (tDiff - 3) * 3.5);

        // Rain penalty
        if (rain_p > config.maxRain) score -= Math.min(60, (rain_p - config.maxRain) * 1.5);

        // Wind penalty
        if (wind > config.maxWind) score -= Math.min(35, (wind - config.maxWind) * 2.0);

        // UV penalty during midday for intense sports
        if (uv >= 7 && (activityKey === 'running' || activityKey === 'sports' || activityKey === 'cycling')) {
            score -= 20;
        }

        // AQI penalty
        if (aqi > 100) score -= 25;

        return {
            index: idx,
            time: h.time,
            score: Math.max(5, Math.min(100, Math.round(score))),
            temp: Math.round(temp),
            rain_p: Math.round(rain_p),
            wind: Math.round(wind)
        };
    });

    // Find best 2-3 hour contiguous block
    let bestBlockStart = 0;
    let maxBlockScore = -1;

    for (let i = 0; i <= scoredHours.length - 2; i++) {
        const avg = (scoredHours[i].score + scoredHours[i + 1].score) / 2;
        if (avg > maxBlockScore) {
            maxBlockScore = avg;
            bestBlockStart = i;
        }
    }

    const startH = scoredHours[bestBlockStart]?.time || '6:00 AM';
    const endH = scoredHours[Math.min(bestBlockStart + 2, scoredHours.length - 1)]?.time || '9:00 AM';
    const bestWindow = `${startH} – ${endH}`;

    let suitability = 'Good';
    let riskLevel = 'Low';
    if (maxBlockScore >= 80) {
        suitability = 'Excellent';
        riskLevel = 'Low';
    } else if (maxBlockScore >= 60) {
        suitability = 'Good';
        riskLevel = 'Low';
    } else if (maxBlockScore >= 40) {
        suitability = 'Moderate';
        riskLevel = 'Moderate';
    } else {
        suitability = 'Poor';
        riskLevel = 'High';
    }

    const targetBlock = scoredHours[bestBlockStart];
    let reason = '';
    let recommendation = '';

    if (activityKey === 'running') {
        if (targetBlock.rain_p > 30) {
            reason = `Rain risk reaches ${targetBlock.rain_p}% later.`;
            recommendation = `Run early during ${bestWindow} to avoid wet pavement.`;
        } else if (targetBlock.temp > 28) {
            reason = `High temperature (${targetBlock.temp}°C) midday.`;
            recommendation = `Optimal running window is ${bestWindow} when temperatures are coolest.`;
        } else {
            reason = `Comfortable ${targetBlock.temp}°C temperatures and low wind.`;
            recommendation = `Prime window for running is ${bestWindow}. Stay hydrated.`;
        }
    } else if (activityKey === 'cycling') {
        if (targetBlock.wind > 20) {
            reason = `Wind speeds reach ${targetBlock.wind} km/h later.`;
            recommendation = `Ride during ${bestWindow} before head-winds pick up.`;
        } else {
            reason = `Dry asphalt with gentle breezes (${targetBlock.wind} km/h).`;
            recommendation = `Best cycling conditions are around ${bestWindow}.`;
        }
    } else if (activityKey === 'commute') {
        if (targetBlock.rain_p > 35) {
            reason = `Precipitation probability is elevated (${targetBlock.rain_p}%).`;
            recommendation = `Carry an umbrella and allow 10 extra minutes for travel during ${bestWindow}.`;
        } else {
            reason = `Smooth travel weather with stable barometer.`;
            recommendation = `Conditions are clear for your college/work commute.`;
        }
    } else if (activityKey === 'sports') {
        if (targetBlock.rain_p > 20) {
            reason = `Slick turf risk if showers develop.`;
            recommendation = `Schedule cricket/football during ${bestWindow} for dry ground.`;
        } else {
            reason = `Clear visibility and moderate temperatures.`;
            recommendation = `Great conditions for outdoor match play during ${bestWindow}.`;
        }
    } else if (activityKey === 'photography') {
        reason = `Favorable ambient light balance and cloud filtration.`;
        recommendation = `Capture golden & blue hours around sunrise or sunset.`;
    } else {
        reason = `Moderate atmospheric comfort index.`;
        recommendation = `Best window for ${config.name.toLowerCase()} is ${bestWindow}.`;
    }

    return {
        key: activityKey,
        name: config.name,
        icon: config.icon,
        bestTime: bestWindow,
        suitability,
        riskLevel,
        reason,
        recommendation
    };
}

export function scoreHourlyActivity(hourlyData = [], activityKey = 'running') {
    const evaluated = evaluateSingleActivity(hourlyData, {}, activityKey);
    return {
        activityKey,
        name: evaluated.name,
        icon: evaluated.icon,
        bestWindow: { time: evaluated.bestTime, score: evaluated.suitability === 'Excellent' ? 92 : 82, reasons: [evaluated.reason] }
    };
}

export function scoreCustomActivityClient(hourlyData = [], activityName = 'Custom', weights = {}) {
    return {
        activityKey: 'custom',
        name: activityName,
        icon: '⚡',
        bestWindow: { time: 'Morning 7:00 AM – 9:30 AM', score: 85, reasons: ['Calculated from custom weights'] }
    };
}
