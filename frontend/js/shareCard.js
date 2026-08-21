/**
 * Atmos Weather — Canvas Weather Share Card Generator
 * Generates an ultra high-resolution, branded shareable weather card
 * with download and clipboard copy capabilities.
 */

import { showToast } from './utils.js';

export async function generateWeatherShareCard(state) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const cityName = state?.currentCity?.name || 'Pune, India';
    const temp = Math.round(state?.weatherData?.current?.temperature_2m ?? 26);
    const feelsLike = Math.round(state?.weatherData?.current?.apparent_temperature ?? temp);
    const condition = state?.weatherData?.current?.weather_code !== undefined ? getConditionText(state.weatherData.current.weather_code) : 'Clear Skies';
    const rainProb = Math.round(state?.weatherData?.current?.precipitation_probability ?? 0);
    const aqi = Math.round(state?.aqiData?.current?.us_aqi ?? 38);
    const uv = (state?.weatherData?.daily?.uv_index_max?.[0] ?? 4.2).toFixed(1);
    const atmosScore = state?.atmosScore ?? 84;

    // 1. Background Gradient (Atmospheric Deep Navy to Slate)
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.5, '#1e293b');
    bgGradient.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // 2. Ambient Accent Glows
    const glow = ctx.createRadialGradient(250, 250, 50, 250, 250, 450);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1080);

    const glow2 = ctx.createRadialGradient(850, 750, 50, 850, 750, 450);
    glow2.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    glow2.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, 1080, 1080);

    // 3. Card Outer Frame (Frosted Hallmark Bubble)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    roundRect(ctx, 60, 60, 960, 960, 48);
    ctx.stroke();
    ctx.restore();

    // 4. Header Brand Pill
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(120, 128, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('Atmos Weather Intelligence', 155, 140);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText('Personal Weather Decision Platform', 155, 175);

    // 5. City & Date
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Playfair Display, serif';
    ctx.fillText(cityName, 100, 280);

    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillText(dateStr, 100, 325);

    // 6. Huge Hero Temp & Condition
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 150px Playfair Display, serif';
    ctx.fillText(`${temp}°`, 100, 485);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.fillText(condition, 460, 415);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillText(`Feels like ${feelsLike}°C  •  Dry & Comfortable`, 460, 465);

    // 7. Grid of 4 Key Intelligence Metrics
    const metrics = [
        { label: 'Atmos Score', val: `${atmosScore} / 100`, sub: 'Outdoor Suitability', color: '#10b981' },
        { label: 'Rain Probability', val: `${rainProb}%`, sub: rainProb >= 40 ? 'Umbrella Advised' : 'No Umbrella Needed', color: '#38bdf8' },
        { label: 'Air Quality (AQI)', val: `${aqi}`, sub: aqi <= 50 ? 'Good' : 'Moderate', color: '#10b981' },
        { label: 'UV Index', val: `${uv}`, sub: 'Moderate Radiance', color: '#f59e0b' }
    ];

    const startX = 100;
    const startY = 560;
    const boxW = 420;
    const boxH = 170;
    const gap = 40;

    metrics.forEach((m, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const x = startX + col * (boxW + gap);
        const y = startY + row * (boxH + gap);

        // Box background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, boxW, boxH, 28);
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 22px Inter, sans-serif';
        ctx.fillText(m.label, x + 28, y + 46);

        // Value
        ctx.fillStyle = m.color;
        ctx.font = 'bold 44px Inter, sans-serif';
        ctx.fillText(m.val, x + 28, y + 104);

        // Subtext
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 20px Inter, sans-serif';
        ctx.fillText(m.sub, x + 28, y + 142);
    });

    // 8. Footer URL
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText('weather-app-nine-ivory-44.vercel.app', 100, 970);

    return canvas;
}

export async function openShareModal(state) {
    const modal = document.getElementById('share-modal-overlay');
    const container = document.getElementById('share-card-preview');
    if (!modal || !container) return;

    container.innerHTML = '<div style="color:var(--color-ink-muted); padding:2rem; text-align:center;">Generating HD Weather Card...</div>';
    modal.classList.remove('hidden');

    try {
        const canvas = await generateWeatherShareCard(state);
        container.innerHTML = '';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.borderRadius = '16px';
        canvas.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
        container.appendChild(canvas);

        const downloadBtn = document.getElementById('share-download-btn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = `Atmos-Weather-${state?.currentCity?.name || 'Forecast'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('Weather card downloaded!', 'success');
            };
        }

        const copyBtn = document.getElementById('share-copy-btn');
        if (copyBtn) {
            copyBtn.onclick = async () => {
                try {
                    canvas.toBlob(async (blob) => {
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        showToast('Weather card copied to clipboard!', 'success');
                    });
                } catch (err) {
                    showToast('Direct copy unsupported; please use Download.', 'info');
                }
            };
        }
    } catch (err) {
        container.innerHTML = '<div style="color:red;">Error generating share card.</div>';
    }
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function getConditionText(code) {
    const map = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy Skies', 51: 'Light Drizzle', 61: 'Slight Rain', 63: 'Moderate Rain',
        65: 'Heavy Rain', 80: 'Rain Showers', 95: 'Thunderstorms'
    };
    return map[code] || 'Variable Clouds';
}
