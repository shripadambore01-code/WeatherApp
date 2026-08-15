/**
 * Atmos Weather — City Comparison Module
 * Side-by-side comparison between the current city and a second city
 */

import { fetchWeather, fetchAQI, searchCities } from './api.js';
import { formatTemp, getAQIInfo, getWeatherDescription, getWeatherIcon } from './utils.js';
import { getUnit } from './units.js';

let city1Data = null;
let city2Data = null;

export function initCompare() {
    const compareBtn = document.getElementById('compare-btn');
    const compareSection = document.getElementById('compare-section');
    
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
}

export function showCompare() {
    const section = document.getElementById('compare-section');
    if (!section) return;
    
    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Set current active city as city 1
    if (window.atmosState && window.atmosState.weatherData && window.atmosState.currentCity) {
        city1Data = {
            city: window.atmosState.currentCity,
            weather: window.atmosState.weatherData,
            aqi: window.atmosState.aqiData
        };
    }
    
    renderCompare();
}

export function hideCompare() {
    const section = document.getElementById('compare-section');
    if (section) section.classList.add('hidden');
}

function renderCompare() {
    const container = document.getElementById('compare-container');
    if (!container) return;
    
    const unit = getUnit();
    
    container.innerHTML = `
        <div class="compare-card" id="compare-card-1">
            <h3 class="compare-card-title">${city1Data ? city1Data.city.name : 'Current Location'}</h3>
            ${city1Data ? renderCityStats(city1Data, unit) : '<p class="text-muted">No location loaded</p>'}
        </div>
        
        <div class="compare-card" id="compare-card-2">
            <div class="compare-search-box">
                <input type="text" id="compare-search-input" class="search-input" placeholder="Search city to compare..." autocomplete="off">
                <div id="compare-search-results" class="search-dropdown hidden"></div>
            </div>
            <div id="compare-card-2-content">
                ${city2Data ? renderCityStats(city2Data, unit) : '<p class="text-muted" style="margin-top: 1rem;">Search and select a second city to compare.</p>'}
            </div>
        </div>
    `;
    
    setupCompareSearch();
    highlightDifferences();
}

function renderCityStats(data, unit) {
    const cur = data.weather?.current;
    if (!cur) return '<p class="text-muted">Weather data unavailable</p>';
    
    const iconName = getWeatherIcon(cur.weather_code, cur.is_day === 1);
    const aqiVal = data.aqi?.current?.us_aqi;
    const aqiInfo = getAQIInfo(aqiVal);
    
    return `
        <div class="compare-stat-hero">
            <img src="https://basmilius.github.io/weather-icons/production/fill/all/${iconName}.svg" alt="Weather" width="48" height="48" />
            <div class="compare-temp">${formatTemp(cur.temperature_2m, unit)}</div>
        </div>
        <p class="compare-condition">${getWeatherDescription(cur.weather_code)}</p>
        
        <div class="compare-details-list">
            <div class="compare-row">
                <span>Feels like:</span>
                <strong>${formatTemp(cur.apparent_temperature, unit)}</strong>
            </div>
            <div class="compare-row">
                <span>Humidity:</span>
                <strong>${Math.round(cur.relative_humidity_2m || 0)}%</strong>
            </div>
            <div class="compare-row">
                <span>Wind:</span>
                <strong>${Math.round(cur.wind_speed_10m || 0)} km/h</strong>
            </div>
            <div class="compare-row">
                <span>Pressure:</span>
                <strong>${Math.round(cur.pressure_msl || cur.surface_pressure || 0)} hPa</strong>
            </div>
            <div class="compare-row">
                <span>Air Quality:</span>
                <strong style="color: ${aqiInfo.color}">${aqiVal !== undefined ? `${Math.round(aqiVal)} (${aqiInfo.label})` : 'N/A'}</strong>
            </div>
        </div>
    `;
}

function setupCompareSearch() {
    const input = document.getElementById('compare-search-input');
    const dropdown = document.getElementById('compare-search-results');
    if (!input || !dropdown) return;
    
    let timer = null;
    input.addEventListener('input', (e) => {
        clearTimeout(timer);
        const query = e.target.value.trim();
        if (query.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }
        
        timer = setTimeout(async () => {
            const res = await searchCities(query);
            if (res && res.results && res.results.length) {
                dropdown.innerHTML = res.results.map(c => `
                    <div class="search-item" data-lat="${c.latitude}" data-lon="${c.longitude}" data-name="${c.name}" data-country="${c.country || ''}">
                        <div class="city-name">${c.name}, ${c.country || ''}</div>
                        <div class="city-sub">${c.admin1 || ''}</div>
                    </div>
                `).join('');
                dropdown.classList.remove('hidden');
                
                dropdown.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const lat = parseFloat(item.dataset.lat);
                        const lon = parseFloat(item.dataset.lon);
                        const name = item.dataset.name;
                        const country = item.dataset.country;
                        dropdown.classList.add('hidden');
                        input.value = `${name}, ${country}`;
                        
                        const [wRes, aRes] = await Promise.allSettled([
                            fetchWeather(lat, lon),
                            fetchAQI(lat, lon)
                        ]);
                        
                        city2Data = {
                            city: { name, country, lat, lon },
                            weather: wRes.status === 'fulfilled' ? wRes.value : null,
                            aqi: aRes.status === 'fulfilled' ? aRes.value : null
                        };
                        
                        renderCompare();
                    });
                });
            } else {
                dropdown.classList.add('hidden');
            }
        }, 300);
    });
}

function highlightDifferences() {
    // Visual indicators can be dynamically styled
}
