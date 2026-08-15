/**
 * Atmos Weather — Client-Side Commute & Travel/Packing Engine
 */

export function evaluateCommuteClient(hourlyData, depHour = 8, retHour = 18, mode = 'transit') {
    const depData = (hourlyData && hourlyData[Math.min(depHour, hourlyData.length - 1)]) || {};
    const retData = (hourlyData && hourlyData[Math.min(retHour, hourlyData.length - 1)]) || {};

    function scoreLeg(h, label) {
        const temp = h.temperature ?? 20;
        const rain_p = h.precipitation_prob ?? 0;
        let score = 100;
        const hazards = [];

        if (mode === 'walking') {
            if (rain_p > 20) { score -= (rain_p * 0.6); hazards.push(`Rain risk ${Math.round(rain_p)}%`); }
        } else if (mode === 'cycling') {
            if (rain_p > 15) { score -= (rain_p * 0.7); hazards.push('Slick roads'); }
        }

        const finalS = Math.max(15, Math.min(100, Math.round(score)));
        const verdict = finalS >= 85 ? 'Excellent' : finalS >= 70 ? 'Good' : finalS <= 55 ? 'Risky' : 'Moderate';

        return {
            label,
            score: finalS,
            verdict,
            temp: Math.round(temp),
            rain: Math.round(rain_p),
            hazards: hazards.length ? hazards : ['Smooth commute expected']
        };
    }

    return {
        mode,
        morning: scoreLeg(depData, 'Morning Departure'),
        evening: scoreLeg(retData, 'Evening Return')
    };
}

export function generatePackingListClient(dailyData, mode = 'balanced') {
    const minT = dailyData.temperature_2m_min ? Math.min(...dailyData.temperature_2m_min) : 14;
    const maxT = dailyData.temperature_2m_max ? Math.max(...dailyData.temperature_2m_max) : 22;
    const maxRain = dailyData.precipitation_probability_max ? Math.max(...dailyData.precipitation_probability_max) : 10;
    const maxUv = dailyData.uv_index_max ? Math.max(...dailyData.uv_index_max) : 3;

    const items = [];

    if (maxRain >= 30) {
        items.push({ item: 'Compact Umbrella', category: 'Rain Protection', reason: `Rain probability reaches ${Math.round(maxRain)}%.` });
    }
    if (minT < 12) {
        items.push({ item: 'Warm Insulated Jacket', category: 'Outerwear', reason: `Lows dip to ${Math.round(minT)}°C.` });
    } else if (minT < 17) {
        items.push({ item: 'Light Cardigan / Sweater', category: 'Outerwear', reason: `Cool mornings around ${Math.round(minT)}°C.` });
    }
    if (maxT > 25) {
        items.push({ item: 'Breathable Cotton / Linen Tops', category: 'Clothing', reason: `Highs reach ${Math.round(maxT)}°C.` });
    }
    if (maxUv >= 6) {
        items.push({ item: 'Sunscreen (SPF 30+) & Sunglasses', category: 'Sun Protection', reason: `High UV index (${Math.round(maxUv)}) forecast.` });
    }
    items.push({ item: 'Comfortable Walking Shoes', category: 'Footwear', reason: 'Essential for day-to-day mobility.' });

    return {
        range: `${Math.round(minT)}°C – ${Math.round(maxT)}°C`,
        rain: `${Math.round(maxRain)}%`,
        items
    };
}
