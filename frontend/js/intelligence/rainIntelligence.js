/**
 * Atmos Weather — Rain Intelligence Engine
 * Computes estimated rain windows, probability peaks, intensity classification,
 * dry outdoor windows, and explicit umbrella recommendations from real hourly forecast data.
 */

import { clamp } from '../utils.js';

export function analyzeRainIntelligence(hourlyData = [], currentData = {}) {
    if (!hourlyData || hourlyData.length === 0) {
        return {
            hasRainRisk: false,
            currentProbability: Math.round(currentData.precipitation_probability || 0),
            nextRainWindow: 'No rain expected in next 24h',
            nextRainTime: null,
            estimatedDuration: '0 min',
            intensity: 'Dry',
            peakProbability: 0,
            bestOutdoorWindow: 'All day',
            recommendation: 'Skies look clear and dry. No umbrella needed today.',
            isEstimate: true
        };
    }

    const next24 = hourlyData.slice(0, 24);
    const rainThreshold = 25; // 25% minimum probability to consider as rain risk

    let nextRainIndex = -1;
    let peakProb = 0;
    let peakIndex = -1;
    let maxHourlyRainMm = 0;

    for (let i = 0; i < next24.length; i++) {
        const prob = next24[i].precipitation_prob || next24[i].precipitation_probability || 0;
        const rainMm = next24[i].rain || next24[i].precipitation || 0;
        
        if (prob > peakProb) {
            peakProb = prob;
            peakIndex = i;
        }
        if (rainMm > maxHourlyRainMm) {
            maxHourlyRainMm = rainMm;
        }
        if (prob >= rainThreshold && nextRainIndex === -1) {
            nextRainIndex = i;
        }
    }

    const currentProb = Math.round(currentData.precipitation_probability || (next24[0]?.precipitation_prob ?? 0));
    const hasRainRisk = peakProb >= rainThreshold || currentProb >= rainThreshold;

    // Intensity Rating based on maximum expected precipitation volume
    let intensity = 'Dry';
    if (maxHourlyRainMm > 7.5 || peakProb >= 85) intensity = 'Heavy Downpour';
    else if (maxHourlyRainMm > 2.5 || peakProb >= 60) intensity = 'Moderate Rain';
    else if (maxHourlyRainMm > 0.5 || peakProb >= 35) intensity = 'Light Drizzle / Showers';
    else if (peakProb >= 20) intensity = 'Passing Mist / Chance of Showers';

    // Estimate Rain Window & Duration
    let nextRainWindow = 'No rain expected in next 24h';
    let nextRainTime = null;
    let durationMinutes = 0;

    if (nextRainIndex !== -1) {
        nextRainTime = next24[nextRainIndex].time;
        // Count consecutive rainy hours to estimate duration
        let consecutiveHours = 0;
        for (let i = nextRainIndex; i < next24.length; i++) {
            const p = next24[i].precipitation_prob || next24[i].precipitation_probability || 0;
            if (p >= rainThreshold) consecutiveHours++;
            else break;
        }
        durationMinutes = consecutiveHours * 45; // ~45 min per rainy block estimate
        nextRainWindow = nextRainIndex === 0 ? 'Currently / Within next hour' : `Around ${nextRainTime}`;
    }

    // Determine Best Dry Outdoor Window
    let bestStart = -1;
    let bestEnd = -1;
    let currentDryRun = 0;
    let maxDryRun = 0;
    let tempStart = -1;

    for (let i = 0; i < next24.length; i++) {
        const p = next24[i].precipitation_prob || next24[i].precipitation_probability || 0;
        if (p < rainThreshold) {
            if (currentDryRun === 0) tempStart = i;
            currentDryRun++;
            if (currentDryRun > maxDryRun) {
                maxDryRun = currentDryRun;
                bestStart = tempStart;
                bestEnd = i;
            }
        } else {
            currentDryRun = 0;
        }
    }

    let bestOutdoorWindow = 'All day';
    if (bestStart !== -1 && maxDryRun < 24) {
        const startTime = next24[bestStart]?.time || 'Morning';
        const endTime = next24[bestEnd]?.time || 'Evening';
        bestOutdoorWindow = `${startTime} – ${endTime}`;
    }

    // Recommendation Decision
    let recommendation = '';
    if (currentProb >= 50) {
        recommendation = 'Carry an umbrella now. Active rain is occurring or highly probable.';
    } else if (nextRainIndex !== -1 && nextRainIndex <= 6) {
        recommendation = `Carry an umbrella if going out after ${nextRainTime}. Rain probability reaches ${Math.round(peakProb)}%.`;
    } else if (peakProb >= 40) {
        recommendation = `Keep a compact umbrella in your bag for later (${next24[peakIndex]?.time || 'Evening'}).`;
    } else {
        recommendation = 'Dry skies anticipated. No umbrella needed for typical outdoor commute.';
    }

    return {
        hasRainRisk,
        currentProbability: currentProb,
        nextRainWindow,
        nextRainTime,
        estimatedDuration: durationMinutes > 0 ? `~${durationMinutes} mins (est.)` : '0 min',
        intensity,
        peakProbability: Math.round(peakProb),
        peakTime: peakIndex !== -1 ? next24[peakIndex].time : null,
        bestOutdoorWindow,
        recommendation,
        isEstimate: true
    };
}
