/**
 * Atmos Weather — Client-Side Stargazing & Photography Engine
 */

export function evaluateStargazingClient(hourlyData) {
    const night = (hourlyData || []).filter(h => h.is_day === 0);
    const pool = night.length ? night : (hourlyData || []).slice(-6);

    const scores = pool.map(h => {
        const clouds = h.cloud_cover ?? 20;
        const rain_p = h.precipitation_prob ?? 0;
        const aqi = h.aqi ?? 30;
        const s = Math.max(0, Math.min(100, Math.round(100 - (clouds * 0.9) - (rain_p * 0.8) - (aqi * 0.1))));
        return { time: h.time, score: s, clouds: Math.round(clouds) };
    });

    const best = scores.length ? scores.reduce((max, h) => h.score > max.score ? h : max, scores[0]) : { time: '10:30 PM', score: 75, clouds: 15 };
    const avg = scores.length ? Math.round(scores.reduce((sum, h) => sum + h.score, 0) / scores.length) : 75;

    return {
        score: avg,
        verdict: avg >= 80 ? 'Excellent' : avg >= 65 ? 'Good' : avg >= 45 ? 'Fair' : 'Poor',
        bestWindow: best.time,
        bestScore: best.score,
        clouds: best.clouds,
        reason: best.clouds <= 20 ? 'Clear dark skies with high atmospheric transparency' : 'Scattered cloud cover present'
    };
}

export function evaluatePhotographyClient(currentData, dailyData) {
    const cloud = currentData.cloud_cover ?? 20;
    const rain_p = currentData.precipitation_probability ?? 0;

    let skyScore = 78;
    let note = 'Clear skies with direct light contrast.';
    if (cloud >= 25 && cloud <= 65) {
        skyScore = 92;
        note = 'Dynamic cloud layer delivers rich light scattering and vibrant dawn/dusk colors.';
    } else if (cloud > 65) {
        skyScore = 60;
        note = 'Overcast cloud blanket provides natural soft-box diffusion.';
    }

    const sunriseScore = Math.min(100, Math.max(20, skyScore + (rain_p < 10 ? 5 : -20)));
    const sunsetScore = Math.min(100, Math.max(20, skyScore + (rain_p < 15 ? 3 : -25)));

    return {
        overall: Math.round((sunriseScore + sunsetScore) / 2),
        sunriseScore,
        sunsetScore,
        note,
        goldenHour: 'Sunrise & 45 min before Sunset'
    };
}
