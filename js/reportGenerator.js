/**
 * Atmos Weather — Printable Weather Report Generator (Feature 20)
 * Generates an academic-grade, printable/downloadable meteorological decision report
 * formatted for A4 printing and PDF export.
 */

import { formatTemp, getWeatherDescription } from './utils.js';
import { getUnit } from './units.js';

export function generatePrintableReport(state) {
    const cityName = state?.currentCity?.name || 'Pune, India';
    const country = state?.currentCity?.country || 'India';
    const temp = Math.round(state?.weatherData?.current?.temperature_2m ?? 26);
    const feelsLike = Math.round(state?.weatherData?.current?.apparent_temperature ?? temp);
    const desc = state?.weatherData?.current ? getWeatherDescription(state.weatherData.current.weather_code) : 'Clear';
    const humidity = state?.weatherData?.current?.relative_humidity_2m ?? 55;
    const wind = state?.weatherData?.current?.wind_speed_10m ?? 12;
    const pressure = state?.weatherData?.current?.pressure_msl ?? 1013;
    const aqi = state?.aqiData?.current?.us_aqi ?? 35;
    const uv = (state?.weatherData?.daily?.uv_index_max?.[0] ?? 4.0).toFixed(1);
    const score = state?.atmosScore ?? 84;
    const unit = getUnit();
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const dailyRows = (state?.weatherData?.daily?.time || []).slice(0, 7).map((t, idx) => {
        const dObj = new Date(t);
        const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const maxT = Math.round(state.weatherData.daily.temperature_2m_max[idx]);
        const minT = Math.round(state.weatherData.daily.temperature_2m_min[idx]);
        const rainP = Math.round(state.weatherData.daily.precipitation_probability_max[idx]);
        const cDesc = getWeatherDescription(state.weatherData.daily.weather_code[idx]);
        return `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${dayLabel}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${cDesc}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${minT}° – ${maxT}°</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${rainP > 40 ? '#0284c7' : '#64748b'}; font-weight: 700;">${rainP}%</td>
            </tr>
        `;
    }).join('');

    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Atmos Weather Decision Report — ${cityName}</title>
            <style>
                @page { size: A4; margin: 20mm; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    color: #0f172a;
                    background: #ffffff;
                    margin: 0;
                    padding: 24px;
                    line-height: 1.5;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .brand {
                    font-size: 24px;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                }
                .brand-sub {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                }
                .box-title {
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #475569;
                    margin-bottom: 8px;
                }
                .score-num {
                    font-size: 42px;
                    font-weight: 900;
                    color: #059669;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                th {
                    background: #f1f5f9;
                    text-align: left;
                    padding: 8px 12px;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #475569;
                    border-bottom: 1px solid #cbd5e1;
                }
                .footer {
                    margin-top: 32px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                    font-size: 11px;
                    color: #94a3b8;
                    display: flex;
                    justify-content: space-between;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                <button onclick="window.print()" style="background: #0f172a; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">🖨️ Print / Save as PDF</button>
            </div>

            <div class="report-header">
                <div>
                    <div class="brand">ATMOS WEATHER INTELLIGENCE</div>
                    <div class="brand-sub">Meteorological Decision Support Report</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 16px; font-weight: 800;">${cityName}, ${country}</div>
                    <div style="font-size: 12px; color: #64748b;">Generated: ${dateStr} at ${timeStr}</div>
                </div>
            </div>

            <div class="grid-2">
                <div class="box">
                    <div class="box-title">Current Atmospheric Telemetry</div>
                    <div style="font-size: 32px; font-weight: 900; margin-bottom: 4px;">${temp}°C <span style="font-size: 16px; font-weight: 600; color: #64748b;">(Feels ${feelsLike}°C)</span></div>
                    <div style="font-size: 14px; font-weight: 700; color: #0284c7; margin-bottom: 12px;">${desc}</div>
                    <div style="font-size: 12px; color: #334155; line-height: 1.6;">
                        • Relative Humidity: <strong>${humidity}%</strong><br>
                        • Wind Speed: <strong>${wind} km/h</strong><br>
                        • Barometric Pressure: <strong>${pressure} hPa</strong><br>
                        • Air Quality: <strong>AQI ${aqi}</strong> | Solar UV: <strong>${uv}</strong>
                    </div>
                </div>

                <div class="box">
                    <div class="box-title">Atmos Decision Score & Suitability</div>
                    <div class="score-num">${score} <span style="font-size: 18px; color: #64748b;">/ 100</span></div>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 4px 0 8px 0;">Classification: Favorable Outdoor Equilibrium</div>
                    <p style="font-size: 12px; color: #475569; margin: 0;">Atmospheric conditions are balanced for daily commutes, outdoor activity, and travel without significant severe weather disruption.</p>
                </div>
            </div>

            <div class="box" style="margin-bottom: 24px;">
                <div class="box-title">7-Day Meteorological Outlook & Rain Horizon</div>
                <table>
                    <thead>
                        <tr>
                            <th>Horizon</th>
                            <th>Condition</th>
                            <th style="text-align: center;">Temp (Min / Max)</th>
                            <th style="text-align: center;">Precipitation Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dailyRows}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <span>Atmos Weather Decision Platform • Open-Meteo Telemetry</span>
                <span>Computer Engineering Minor Project • Confidential Meteorological Log</span>
            </div>
        </body>
        </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.open();
        printWin.document.write(reportHTML);
        printWin.document.close();
    }
}
