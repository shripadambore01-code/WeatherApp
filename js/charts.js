/**
 * Atmos Weather — Charts Module
 * ApexCharts integration for thermal rhythm and precipitation trends.
 */

let tempChart = null;

/**
 * Initialize weather trend charts with auto-retry
 * @param {Object} hourlyData - Open-Meteo hourly data object
 * @param {boolean} isDark - Whether dark theme is active
 */
export function initCharts(hourlyData, isDark = false) {
    if (!hourlyData || !hourlyData.time) return;

    if (typeof ApexCharts === 'undefined') {
        setTimeout(() => initCharts(hourlyData, isDark), 300);
        return;
    }

    const tempContainer = document.getElementById('temp-chart');
    if (!tempContainer) return;

    destroyCharts();

    // Get next 24-36 hours of hourly forecast
    const now = new Date();
    let startIdx = 0;
    for (let i = 0; i < hourlyData.time.length; i++) {
        if (new Date(hourlyData.time[i]) >= now) {
            startIdx = i;
            break;
        }
    }
    const endIdx = Math.min(startIdx + 24, hourlyData.time.length);

    const times = hourlyData.time.slice(startIdx, endIdx);
    const temps = (hourlyData.temperature_2m || []).slice(startIdx, endIdx);
    const precip = (hourlyData.precipitation_probability || []).slice(startIdx, endIdx);

    const labels = times.map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    });

    const colors = getChartColors(isDark);

    try {
        tempChart = new ApexCharts(tempContainer, {
            chart: {
                type: 'area',
                height: 240,
                fontFamily: 'Inter, sans-serif',
                toolbar: { show: false },
                zoom: { enabled: false },
                background: 'transparent',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 600
                }
            },
            series: [
                {
                    name: 'Temperature',
                    data: temps.map(t => Math.round(t))
                },
                {
                    name: 'Precipitation %',
                    data: precip.map(p => Math.round(p))
                }
            ],
            xaxis: {
                categories: labels,
                labels: {
                    style: { colors: colors.text, fontSize: '11px', fontWeight: 600 },
                    rotate: 0,
                    hideOverlappingLabels: true
                },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: [
                {
                    title: { text: 'Temp (°C)', style: { color: colors.text, fontSize: '11px', fontWeight: 600 } },
                    labels: { style: { colors: colors.text }, formatter: v => `${Math.round(v)}°` }
                },
                {
                    opposite: true,
                    title: { text: 'Rain %', style: { color: colors.text, fontSize: '11px', fontWeight: 600 } },
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
                    opacityFrom: 0.35,
                    opacityTo: 0.05,
                    stops: [0, 100]
                },
                opacity: [1, 0.2]
            },
            stroke: {
                curve: 'smooth',
                width: [3, 2],
                dashArray: [0, 3]
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
                style: { fontSize: '12px', fontFamily: 'Inter' },
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
                fontFamily: 'Inter',
                fontWeight: 600
            },
            dataLabels: { enabled: false },
            markers: { size: 0, hover: { size: 4 } }
        });

        tempChart.render();
    } catch (e) {
        console.warn('Chart render error:', e);
    }
}

/**
 * Update chart colors when theme changes
 * @param {boolean} isDark - Whether dark theme is active
 */
export function updateChartsTheme(isDark) {
    const colors = getChartColors(isDark);
    if (tempChart) {
        try {
            tempChart.updateOptions({
                chart: { foreColor: colors.text },
                grid: { borderColor: colors.grid },
                tooltip: { theme: isDark ? 'dark' : 'light' },
                xaxis: { labels: { style: { colors: colors.text } } },
                legend: { labels: { colors: colors.text } }
            });
        } catch (e) {}
    }
}

/**
 * Destroy charts (cleanup)
 */
export function destroyCharts() {
    if (tempChart) {
        try {
            tempChart.destroy();
        } catch (e) {}
        tempChart = null;
    }
}

function getChartColors(isDark) {
    return {
        text: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        accent: isDark ? '#f59e0b' : '#d97706',
        secondary: isDark ? '#38bdf8' : '#0284c7'
    };
}
