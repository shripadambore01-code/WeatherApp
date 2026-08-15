/**
 * Atmos Weather — Charts Module
 * ApexCharts integration for temperature and humidity trends
 */

let tempChart = null;
let humidityChart = null;

/**
 * Initialize weather trend charts
 * @param {Object} hourlyData - Open-Meteo hourly data object
 * @param {boolean} isDark - Whether dark theme is active
 */
export function initCharts(hourlyData, isDark = false) {
    if (!hourlyData || !hourlyData.time || typeof ApexCharts === 'undefined') return;

    destroyCharts();

    // Get next 48 hours of data
    const now = new Date();
    let startIdx = 0;
    for (let i = 0; i < hourlyData.time.length; i++) {
        if (new Date(hourlyData.time[i]) >= now) {
            startIdx = i;
            break;
        }
    }
    const endIdx = Math.min(startIdx + 48, hourlyData.time.length);

    const times = hourlyData.time.slice(startIdx, endIdx);
    const temps = (hourlyData.temperature_2m || []).slice(startIdx, endIdx);
    const humidity = (hourlyData.relative_humidity_2m || []).slice(startIdx, endIdx);
    const precip = (hourlyData.precipitation_probability || []).slice(startIdx, endIdx);

    const labels = times.map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    });

    const colors = getChartColors(isDark);

    // Temperature chart
    const tempContainer = document.getElementById('temp-chart');
    if (tempContainer) {
        tempChart = new ApexCharts(tempContainer, {
            chart: {
                type: 'area',
                height: 260,
                fontFamily: 'Inter, sans-serif',
                toolbar: { show: false },
                zoom: { enabled: false },
                background: 'transparent',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            series: [
                {
                    name: 'Temperature',
                    data: temps.map(t => Math.round(t))
                },
                {
                    name: 'Precipitation %',
                    data: precip
                }
            ],
            xaxis: {
                categories: labels,
                labels: {
                    style: { colors: colors.text, fontSize: '11px' },
                    rotate: -45,
                    rotateAlways: false,
                    hideOverlappingLabels: true,
                    showDuplicates: false,
                    trim: true
                },
                tickAmount: 12,
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: [
                {
                    title: { text: 'Temperature (°C)', style: { color: colors.text, fontSize: '12px' } },
                    labels: { style: { colors: colors.text }, formatter: v => `${Math.round(v)}°` }
                },
                {
                    opposite: true,
                    title: { text: 'Precipitation %', style: { color: colors.text, fontSize: '12px' } },
                    labels: { style: { colors: colors.text }, formatter: v => `${Math.round(v)}%` },
                    max: 100,
                    min: 0
                }
            ],
            colors: [colors.accent, colors.secondary],
            fill: {
                type: ['gradient', 'solid'],
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.05,
                    stops: [0, 100]
                },
                opacity: [1, 0.3]
            },
            stroke: {
                curve: 'smooth',
                width: [3, 2],
                dashArray: [0, 4]
            },
            grid: {
                borderColor: colors.grid,
                strokeDashArray: 4,
                xaxis: { lines: { show: false } },
                padding: { left: 10, right: 10 }
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                shared: true,
                intersect: false,
                style: { fontSize: '13px', fontFamily: 'Inter' },
                y: {
                    formatter: (val, { seriesIndex }) =>
                        seriesIndex === 0 ? `${val}°C` : `${val}%`
                }
            },
            legend: {
                labels: { colors: colors.text },
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '12px',
                fontFamily: 'Inter'
            },
            dataLabels: { enabled: false },
            markers: { size: 0, hover: { size: 5 } }
        });
        tempChart.render();
    }
}

/**
 * Update chart colors when theme changes
 * @param {boolean} isDark - Whether dark theme is active
 */
export function updateChartsTheme(isDark) {
    const colors = getChartColors(isDark);

    [tempChart, humidityChart].forEach(chart => {
        if (chart) {
            chart.updateOptions({
                chart: { foreColor: colors.text },
                grid: { borderColor: colors.grid },
                tooltip: { theme: isDark ? 'dark' : 'light' },
                xaxis: { labels: { style: { colors: colors.text } } },
                legend: { labels: { colors: colors.text } }
            });
        }
    });
}

/**
 * Destroy all charts (cleanup)
 */
export function destroyCharts() {
    if (tempChart) {
        tempChart.destroy();
        tempChart = null;
    }
    if (humidityChart) {
        humidityChart.destroy();
        humidityChart = null;
    }
}

/**
 * Get chart colors based on theme
 * @param {boolean} isDark
 * @returns {Object} Color set
 */
function getChartColors(isDark) {
    return {
        text: isDark ? '#b0bec5' : '#546e7a',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        accent: isDark ? '#4fc3f7' : '#0288d1',
        secondary: isDark ? '#90caf9' : '#64b5f6'
    };
}
