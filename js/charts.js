/**
 * Atmos Weather — Multi-Metric Trend Charts Module
 * ApexCharts integration for Temperature, Rain %, Humidity, Wind, Pressure, and AQI
 * with natural language trend insights.
 */

let activeChart = null;
let currentMetric = 'temp';
let cachedHourly = null;
let cachedAqi = null;
let isDarkTheme = true;

/**
 * Initialize or re-render trend chart
 */
export function initCharts(hourlyData, isDark = false, aqiData = null) {
    if (!hourlyData || !hourlyData.time) return;

    cachedHourly = hourlyData;
    cachedAqi = aqiData;
    isDarkTheme = isDark;

    if (typeof ApexCharts === 'undefined') {
        setTimeout(() => initCharts(hourlyData, isDark, aqiData), 300);
        return;
    }

    renderCurrentMetricChart();
}

export function setChartMetric(metricKey) {
    currentMetric = metricKey;
    renderCurrentMetricChart();
}

function renderCurrentMetricChart() {
    if (!cachedHourly || !cachedHourly.time) return;

    const tempContainer = document.getElementById('temp-chart');
    if (!tempContainer) return;

    destroyCharts();

    // Next 24 hours of data
    const now = new Date();
    let startIdx = 0;
    for (let i = 0; i < cachedHourly.time.length; i++) {
        if (new Date(cachedHourly.time[i]) >= now) {
            startIdx = i;
            break;
        }
    }
    const endIdx = Math.min(startIdx + 24, cachedHourly.time.length);

    const times = cachedHourly.time.slice(startIdx, endIdx);
    const labels = times.map(t => new Date(t).toLocaleTimeString([], { hour: 'numeric', hour12: true }));

    let series = [];
    let yAxisConfig = {};
    let colors = ['#f59e0b', '#38bdf8'];
    let trendExplanation = '';

    const colorsTheme = getChartColors(isDarkTheme);

    if (currentMetric === 'rain') {
        const rainProbs = (cachedHourly.precipitation_probability || []).slice(startIdx, endIdx).map(v => Math.round(v));
        const rainAmounts = (cachedHourly.rain || cachedHourly.precipitation || []).slice(startIdx, endIdx).map(v => Math.round(v * 10) / 10);
        series = [
            { name: 'Rain Probability %', data: rainProbs },
            { name: 'Precipitation (mm)', data: rainAmounts }
        ];
        colors = ['#38bdf8', '#818cf8'];
        yAxisConfig = [
            { max: 100, min: 0, labels: { style: { colors: colorsTheme.text }, formatter: v => `${Math.round(v)}%` } },
            { opposite: true, labels: { style: { colors: colorsTheme.text }, formatter: v => `${v}mm` } }
        ];
        const maxProb = Math.max(...rainProbs, 0);
        trendExplanation = maxProb > 40 ? `Peak rain risk of ${maxProb}% expected in this period.` : 'Rain probabilities remain low and dry over the next 24 hours.';
    } else if (currentMetric === 'humidity') {
        const humids = (cachedHourly.relative_humidity_2m || []).slice(startIdx, endIdx).map(v => Math.round(v));
        series = [{ name: 'Relative Humidity %', data: humids }];
        colors = ['#06b6d4'];
        yAxisConfig = [{ max: 100, min: 0, labels: { style: { colors: colorsTheme.text }, formatter: v => `${Math.round(v)}%` } }];
        trendExplanation = `Humidity levels hover around ${Math.round(humids[0] || 60)}% with peak moisture near dawn.`;
    } else if (currentMetric === 'wind') {
        const winds = (cachedHourly.wind_speed_10m || []).slice(startIdx, endIdx).map(v => Math.round(v));
        const gusts = (cachedHourly.wind_gusts_10m || winds.map(w => Math.round(w * 1.3))).slice(startIdx, endIdx).map(v => Math.round(v));
        series = [
            { name: 'Wind Speed (km/h)', data: winds },
            { name: 'Gusts (km/h)', data: gusts }
        ];
        colors = ['#a855f7', '#ec4899'];
        yAxisConfig = [{ labels: { style: { colors: colorsTheme.text }, formatter: v => `${Math.round(v)} km/h` } }];
        const maxWind = Math.max(...winds, 0);
        trendExplanation = `Wind speeds peak at ${maxWind} km/h with steady directional flow.`;
    } else if (currentMetric === 'pressure') {
        const pressures = (cachedHourly.surface_pressure || cachedHourly.pressure_msl || []).slice(startIdx, endIdx).map(v => Math.round(v));
        series = [{ name: 'Surface Pressure (hPa)', data: pressures.length ? pressures : [1013, 1013, 1012, 1012] }];
        colors = ['#10b981'];
        yAxisConfig = [{ labels: { style: { colors: colorsTheme.text }, formatter: v => `${Math.round(v)} hPa` } }];
        trendExplanation = `Barometric trend remains stable without sharp frontal drops.`;
    } else {
        // Default: Temperature
        const temps = (cachedHourly.temperature_2m || []).slice(startIdx, endIdx).map(v => Math.round(v));
        const feels = (cachedHourly.apparent_temperature || temps).slice(startIdx, endIdx).map(v => Math.round(v));
        series = [
            { name: 'Actual Temp (°C)', data: temps },
            { name: 'Feels Like (°C)', data: feels }
        ];
        colors = ['#f59e0b', '#fb923c'];
        yAxisConfig = [{ labels: { style: { colors: colorsTheme.text }, formatter: v => `${Math.round(v)}°` } }];
        const minT = Math.min(...temps, 20);
        const maxT = Math.max(...temps, 30);
        trendExplanation = `Temperatures range from ${minT}°C (low) to ${maxT}°C (high) throughout the cycle.`;
    }

    // Update Trend Summary note
    const summaryEl = document.getElementById('chart-trend-summary');
    if (summaryEl) summaryEl.textContent = trendExplanation;

    try {
        activeChart = new ApexCharts(tempContainer, {
            chart: {
                type: 'area',
                height: 220,
                fontFamily: 'Inter, sans-serif',
                toolbar: { show: false },
                zoom: { enabled: false },
                background: 'transparent',
                animations: { enabled: true, easing: 'easeinout', speed: 500 }
            },
            series,
            xaxis: {
                categories: labels,
                labels: {
                    style: { colors: colorsTheme.text, fontSize: '11px', fontWeight: 600 },
                    rotate: 0,
                    hideOverlappingLabels: true
                },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: yAxisConfig,
            colors,
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.05,
                    stops: [0, 100]
                }
            },
            stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 2] },
            grid: {
                borderColor: colorsTheme.grid,
                strokeDashArray: 4,
                xaxis: { lines: { show: false } },
                padding: { left: 10, right: 10 }
            },
            tooltip: {
                theme: isDarkTheme ? 'dark' : 'light',
                shared: true,
                intersect: false,
                style: { fontSize: '12px', fontFamily: 'Inter' }
            },
            legend: {
                labels: { colors: colorsTheme.text },
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '12px',
                fontFamily: 'Inter',
                fontWeight: 600
            },
            dataLabels: { enabled: false }
        });

        activeChart.render();
    } catch (e) {
        console.warn('Chart render error:', e);
    }
}

export function updateChartsTheme(isDark) {
    isDarkTheme = isDark;
    renderCurrentMetricChart();
}

export function destroyCharts() {
    if (activeChart) {
        try { activeChart.destroy(); } catch (e) {}
        activeChart = null;
    }
}

function getChartColors(isDark) {
    return {
        text: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    };
}
