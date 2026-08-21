/**
 * Atmos Weather — Multi-Location Comparison System
 * Enables side-by-side comparison across 2–4 cities comparing Atmos Score, Temp, Rain, AQI, and UV.
 */

import { fetchWeather, fetchAQI, searchCities } from './api.js';
import { formatTemp, getAQIInfo, getWeatherDescription, getWeatherSvgIcon } from './utils.js';
import { calculateWeatherScore } from './intelligence/weatherScore.js';
import { getUnit } from './units.js';

let comparedCities = []; // Array of { city, weather, aqi, score }

export function initCompare() {
    const compareBtn = document.getElementById('compare-btn');
    const compareSection = document.getElementById('compare-section');
    const closeBtn = document.getElementById('compare-close-btn');

    if (compareBtn && compareSection) {
        compareBtn.addEventListener('click', () => {
            const isHidden = compareSection.classList.contains('hidden');
            if (isHidden) {
                showCompare();
            } else {
                hideCompare();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', hideCompare);
    }
}

export async function showCompare() {
    const section = document.getElementById('compare-section');
    if (!section) return;

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth' });

    // Initialize with active city + 1 default Indian metro if empty
    if (comparedCities.length === 0 && window.atmosState?.weatherData && window.atmosState?.currentCity) {
        comparedCities.push({
            city: window.atmosState.currentCity,
            weather: window.atmosState.weatherData,
            aqi: window.atmosState.aqiData,
            score: calculateWeatherScore(window.atmosState.weatherData.current)
        });

        // Add a second comparison city (Mumbai or Delhi)
        const secondCityName = window.atmosState.currentCity.name.toLowerCase().includes('mumbai') ? 'Delhi' : 'Mumbai';
        await addCityToCompare(secondCityName);
    }

    renderCompare();
}

export function hideCompare() {
    const section = document.getElementById('compare-section');
    if (section) section.classList.add('hidden');
}

export async function addCityToCompare(cityName) {
    if (comparedCities.length >= 4) return;

    try {
        const searchRes = await searchCities(cityName, 1);
        if (searchRes?.results?.length > 0) {
            const loc = searchRes.results[0];
            const [w, a] = await Promise.all([
                fetchWeather(loc.latitude, loc.longitude),
                fetchAQI(loc.latitude, loc.longitude)
            ]);

            if (w && w.current) {
                comparedCities.push({
                    city: { name: loc.name, country: loc.country || 'India', lat: loc.latitude, lon: loc.longitude },
                    weather: w,
                    aqi: a,
                    score: calculateWeatherScore(w.current)
                });
                renderCompare();
            }
        }
    } catch (e) {
        console.warn('Error adding compare city:', e);
    }
}

export function removeComparedCity(index) {
    if (comparedCities.length <= 1) return;
    comparedCities.splice(index, 1);
    renderCompare();
}

function renderCompare() {
    const container = document.getElementById('compare-grid-cards');
    if (!container) return;

    const unit = getUnit();

    container.innerHTML = comparedCities.map((item, idx) => {
        const cur = item.weather?.current;
        const temp = cur?.temperature_2m ?? 25;
        const feels = cur?.apparent_temperature ?? temp;
        const rainP = Math.round(cur?.precipitation_probability ?? 0);
        const aqiVal = item.aqi?.current?.us_aqi ?? 35;
        const uvVal = item.weather?.daily?.uv_index_max?.[0] ?? 4.0;
        const score = item.score?.score ?? 80;
        const isDay = cur?.is_day === 1;

        return `
            <div class="compare-city-pod">
                <div class="compare-pod-header">
                    <div>
                        <h4 class="compare-city-title">${item.city.name}</h4>
                        <div class="compare-city-sub">${item.city.country}</div>
                    </div>
                    ${comparedCities.length > 1 ? `<button class="compare-remove-btn" onclick="window.atmosRemoveCompare(${idx})">&times;</button>` : ''}
                </div>

                <div class="compare-score-badge" style="background: ${score >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${score >= 75 ? '#10b981' : '#f59e0b'};">
                    <span>Atmos Score: <strong>${score}/100</strong> (${item.score?.verdict || 'Good'})</span>
                </div>

                <div class="compare-hero-flex">
                    <div style="width:48px; height:48px;">
                        ${getWeatherSvgIcon(cur?.weather_code ?? 0, isDay, 48)}
                    </div>
                    <div class="compare-temp-num">${formatTemp(temp, unit)}</div>
                </div>
                <div class="compare-cond-text">${getWeatherDescription(cur?.weather_code ?? 0)}</div>

                <div class="compare-metric-rows">
                    <div class="comp-row"><span>Feels Like:</span> <strong>${formatTemp(feels, unit)}</strong></div>
                    <div class="comp-row"><span>Rain Risk:</span> <strong>${rainP}%</strong></div>
                    <div class="comp-row"><span>Air Quality:</span> <strong style="color:${aqiVal > 100 ? '#ef4444' : '#10b981'};">AQI ${Math.round(aqiVal)}</strong></div>
                    <div class="comp-row"><span>UV Index:</span> <strong>${uvVal.toFixed(1)}</strong></div>
                    <div class="comp-row"><span>Wind:</span> <strong>${Math.round(cur?.wind_speed_10m ?? 10)} km/h</strong></div>
                </div>
            </div>
        `;
    }).join('');

    setupCompareSearch();
}

function setupCompareSearch() {
    const input = document.getElementById('compare-add-input');
    const addBtn = document.getElementById('compare-add-btn');

    if (input && addBtn) {
        addBtn.onclick = () => {
            const val = input.value.trim();
            if (val) {
                addCityToCompare(val);
                input.value = '';
            }
        };
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) {
                    addCityToCompare(val);
                    input.value = '';
                }
            }
        };
    }
}

window.atmosRemoveCompare = removeComparedCity;
window.atmosAddCompare = addCityToCompare;
