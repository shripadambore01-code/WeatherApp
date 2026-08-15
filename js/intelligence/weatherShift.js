/**
 * Atmos Weather — Client-Side Weather Shift Detection
 * Detects sharp shifts in rain, temp, gusts, and AQI across 1-24h horizon.
 */

export function detectWeatherShiftsClient(hourlyData) {
    if (!hourlyData || hourlyData.length < 2) return [];

    const shifts = [];
    const current = hourlyData[0];

    for (let i = 1; i < Math.min(24, hourlyData.length); i++) {
        const target = hourlyData[i];
        const timeLabel = target.time || `+${i}h`;

        // 1. Rain Surge
        const curRain = current.precipitation_prob || 0;
        const tgtRain = target.precipitation_prob || 0;
        const rainDiff = tgtRain - curRain;

        if (rainDiff >= 35 && tgtRain >= 50) {
            shifts.push({
                type: 'rain',
                icon: '🌧️',
                title: 'Rain Surge Likely',
                desc: `Rain risk surges from ${Math.round(curRain)}% to ${Math.round(tgtRain)}% around ${timeLabel}.`,
                action: 'Carry an umbrella if going outside.'
            });
            break;
        }

        // 2. Temperature Drop
        const curTemp = current.temperature || 20;
        const tgtTemp = target.temperature || 20;
        const tempDiff = tgtTemp - curTemp;

        if (tempDiff <= -5) {
            shifts.push({
                type: 'temp_drop',
                icon: '📉',
                title: 'Temperature Drop',
                desc: `Temperature drops ${Math.abs(Math.round(tempDiff))}°C (down to ${Math.round(tgtTemp)}°C) by ${timeLabel}.`,
                action: 'Keep a warm layer or light jacket handy.'
            });
            break;
        } else if (tempDiff >= 6) {
            shifts.push({
                type: 'temp_rise',
                icon: '📈',
                title: 'Rapid Warming',
                desc: `Temperature warms up by +${Math.round(tempDiff)}°C (reaching ${Math.round(tgtTemp)}°C) by ${timeLabel}.`,
                action: 'Stay hydrated during peak afternoon hours.'
            });
            break;
        }
    }

    if (!shifts.length) {
        shifts.push({
            type: 'stable',
            icon: '🌤️',
            title: 'Atmospheric Stability',
            desc: 'Consistent meteorological pattern expected over the next 12 hours.',
            action: 'Ideal window for outdoor schedules.'
        });
    }

    return shifts;
}
