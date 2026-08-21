/**
 * Atmos Weather — Next-Gen Personal Weather Intelligence System
 * Orchestrates all weather modules, intelligence engines, and AI assistant.
 */

import { fetchWeather, fetchAQI, searchCities, reverseGeocode } from './api.js';
import { updateCurrentWeather, setWeatherBackground } from './weather.js';
import { updateDailyForecast, updateHourlyForecast } from './forecast.js';
import { initCharts, updateChartsTheme, destroyCharts } from './charts.js';
import { updateAQI } from './aqi.js';
import { updateUV } from './uv.js';
import { checkAlerts, renderAlerts } from './alerts.js';
import { initSearch } from './search.js';
import { getCurrentPosition, initGeolocation } from './geolocation.js';
import { initFavorites, addFavorite, removeFavorite, isFavorite, renderFavorites } from './favorites.js';
import { addToHistory, renderHistory } from './history.js';
import { initTheme, getTheme } from './theme.js';
import { initUnits, getUnit } from './units.js';
import { initVoice } from './voice.js';
import { initMap, updateMapCenter } from './map.js';
import { initCompare, showCompare } from './compare.js';
import { initI18n, t } from './i18n.js';
import { initPWA } from './pwa.js';
import { showToast, retrieve, store, getWeatherCondition } from './utils.js';

// Intelligence Engine Imports
import { calculateWeatherScore } from './intelligence/weatherScore.js';
import { scoreHourlyActivity, scoreCustomActivityClient, ACTIVITY_MAP } from './intelligence/activityEngine.js';
import { detectWeatherShiftsClient } from './intelligence/weatherShift.js';
import { evaluateDecisionCardsClient } from './intelligence/decisionEngine.js';
import { evaluateCommuteClient, generatePackingListClient } from './intelligence/commuteTravel.js';
import { evaluateStargazingClient, evaluatePhotographyClient } from './intelligence/astroPhoto.js';
import { askAtmosAI } from './intelligence/atmosAI.js';
import { saveForecastSnapshot, compareCachedForecast } from './intelligence/forecastMemory.js';

/* ─────────────────── State ─────────────────── */

const state = {
    currentCity: null,       // { name, country, lat, lon, admin1, timezone }
    weatherData: null,       // Full Open-Meteo response
    aqiData: null,           // Air quality response
    hourlyNormalized: [],    // Preprocessed 24h data
    currentScoreProfile: 'general',
    currentActivity: 'running',
    autoRefreshTimer: null,
    refreshInterval: 600000, // 10 minutes
    lastUpdated: null,
    isLoading: false
};

// Global Exposure for submodules
window.atmosState = state;
window.atmosLoadWeather = loadWeather;

/* ─────────────────── Init ─────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c🧠 Atmos Weather Intelligence System', 'font-size:22px;font-weight:bold;color:#f59e0b');

    try {
        // Initialize core modules
        initTheme();
        initUnits();
        initSearch();
        initFavorites();
        renderHistory();
        initVoice();
        initCompare();
        initPWA();
        initMap();
        await initI18n();

        // Setup intelligence event handlers
        setupIntelligenceUI();
        setupEventListeners();

        // Load initial city (or cached / geolocation / fallback)
        const lastCity = retrieve('lastCity');
        if (lastCity && lastCity.lat && lastCity.lon) {
            await loadWeather(lastCity.lat, lastCity.lon, lastCity);
        } else {
            // Default load London immediately so UI is 100% functional, then attempt geolocation
            await loadWeather(51.5074, -0.1278, { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 });
            initGeolocation();
        }

        startAutoRefresh();
    } catch (e) {
        console.error('App init error:', e);
    }
});

/* ─────────────────── Event Listeners ─────────────────── */

function setupEventListeners() {
    // City selected
    window.addEventListener('citySelected', (e) => {
        const city = e.detail;
        if (city && city.lat !== undefined && city.lon !== undefined) {
            loadWeather(city.lat, city.lon, city);
            addToHistory(city);
            renderHistory();
        }
    });

    // Geolocation result
    window.addEventListener('locationDetected', async (e) => {
        const { lat, lon } = e.detail;
        try {
            const result = await reverseGeocode(lat, lon);
            if (result && result.results && result.results.length > 0) {
                const city = result.results[0];
                const cityData = {
                    name: city.name,
                    country: city.country || '',
                    lat: city.latitude,
                    lon: city.longitude,
                    admin1: city.admin1 || '',
                    timezone: city.timezone || ''
                };
                loadWeather(lat, lon, cityData);
            } else {
                loadWeather(lat, lon, { name: 'My Location', country: '', lat, lon });
            }
        } catch {
            loadWeather(lat, lon, { name: 'My Location', country: '', lat, lon });
        }
    });

    // Unit toggle
    const unitSwitch = document.getElementById('unit-switch-btn');
    if (unitSwitch) {
        unitSwitch.addEventListener('click', () => {
            const cur = getUnit();
            const next = cur === 'celsius' ? 'fahrenheit' : 'celsius';
            store('unit', next);
            document.getElementById('opt-c')?.classList.toggle('selected', next === 'celsius');
            document.getElementById('opt-f')?.classList.toggle('selected', next === 'fahrenheit');
            window.dispatchEvent(new CustomEvent('unitchange'));
        });
    }

    window.addEventListener('unitchange', () => {
        if (state.weatherData) {
            const unit = getUnit();
            updateCurrentWeather(state.weatherData, state.currentCity, unit);
            if (state.weatherData.daily) updateDailyForecast(state.weatherData.daily, state.weatherData.daily_units, unit);
            if (state.weatherData.hourly) updateHourlyForecast(state.weatherData.hourly, state.weatherData.hourly_units, unit);
            renderIntelligenceLayer();
        }
    });

    // Theme change
    window.addEventListener('themechange', (e) => {
        updateChartsTheme(e.detail.theme === 'dark');
    });

    // Sidebar
    document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    // Favorite toggle
    document.getElementById('favorite-btn')?.addEventListener('click', () => {
        if (!state.currentCity) return;
        if (isFavorite(state.currentCity.lat, state.currentCity.lon)) {
            removeFavorite(state.currentCity.lat, state.currentCity.lon);
            document.getElementById('favorite-btn')?.classList.remove('active');
            showToast(`${state.currentCity.name} removed from favorites`, 'info');
        } else {
            addFavorite(state.currentCity);
            document.getElementById('favorite-btn')?.classList.add('active');
            showToast(`${state.currentCity.name} saved to favorites`, 'success');
        }
        renderFavorites();
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        if (state.currentCity) {
            loadWeather(state.currentCity.lat, state.currentCity.lon, state.currentCity);
            showToast('Intelligence telemetry updated', 'success');
        }
    });

    // Shortcut: / to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            const search = document.getElementById('search-input');
            if (document.activeElement?.tagName === 'INPUT') return;
            e.preventDefault();
            search?.focus();
        }
    });
}

/* ─────────────────── Intelligence UI Setup ─────────────────── */

function setupIntelligenceUI() {
    // 1. Weather Score Profile Chips
    const profileWrap = document.getElementById('score-profiles');
    if (profileWrap) {
        profileWrap.querySelectorAll('.profile-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                profileWrap.querySelectorAll('.profile-chip').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.currentScoreProfile = btn.dataset.profile;
                updateWeatherScoreUI();
            });
        });
    }

    // 2. Best Time Activity Chips
    const actWrap = document.getElementById('activity-chips');
    if (actWrap) {
        actWrap.querySelectorAll('.activity-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                actWrap.querySelectorAll('.activity-pill').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.currentActivity = btn.dataset.act;
                updateBestTimeUI();
            });
        });
    }

    // 3. "What Should I Do?" Action Button
    document.getElementById('what-should-i-do-btn')?.addEventListener('click', () => {
        openRecommendationModal();
    });

    // 4. Atmos AI Modal Triggers
    document.getElementById('open-ai-modal-btn')?.addEventListener('click', () => {
        document.getElementById('ai-modal-overlay')?.classList.remove('hidden');
    });
    document.getElementById('ai-modal-close')?.addEventListener('click', () => {
        document.getElementById('ai-modal-overlay')?.classList.add('hidden');
    });

    // AI Quick Prompts
    document.querySelectorAll('.ai-prompt-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById('ai-user-input');
            if (input) {
                input.value = btn.textContent;
                submitAIQuestion(btn.textContent);
            }
        });
    });

    // AI Submit
    document.getElementById('ai-submit-btn')?.addEventListener('click', () => {
        const input = document.getElementById('ai-user-input');
        if (input && input.value.trim()) {
            submitAIQuestion(input.value.trim());
            input.value = '';
        }
    });
    document.getElementById('ai-user-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = document.getElementById('ai-user-input');
            if (input && input.value.trim()) {
                submitAIQuestion(input.value.trim());
                input.value = '';
            }
        }
    });

    // 5. Custom Activity Builder Modal
    document.getElementById('custom-activity-modal-btn')?.addEventListener('click', () => {
        document.getElementById('custom-activity-modal-overlay')?.classList.remove('hidden');
    });
    document.getElementById('calculate-custom-act-btn')?.addEventListener('click', () => {
        const name = document.getElementById('custom-act-name')?.value || 'Custom Activity';
        const wRain = parseInt(document.getElementById('custom-weight-rain')?.value || '5');
        const wTemp = parseInt(document.getElementById('custom-weight-temp')?.value || '4');
        const wWind = parseInt(document.getElementById('custom-weight-wind')?.value || '3');
        const wAqi = parseInt(document.getElementById('custom-weight-aqi')?.value || '3');

        const res = scoreCustomActivityClient(state.hourlyNormalized, name, {
            rain: wRain, temperature: wTemp, wind: wWind, aqi: wAqi, uv: 3
        });

        const resultEl = document.getElementById('custom-act-result');
        if (resultEl && res.bestWindow) {
            resultEl.innerHTML = `
                <div class="window-card best-win" style="margin-top: 1rem;">
                    <div class="window-badge best">BEST TIME FOR ${name.toUpperCase()}</div>
                    <div class="window-time">${res.bestWindow.time}</div>
                    <div class="window-score">${res.bestWindow.score}/100 · ${res.bestWindow.verdict}</div>
                </div>
            `;
        }
    });

    // 6. Commute Modal
    document.getElementById('open-commute-modal-btn')?.addEventListener('click', () => {
        const commuteRes = evaluateCommuteClient(state.hourlyNormalized, 8, 18, 'transit');
        const body = document.getElementById('commute-modal-body');
        if (body) {
            body.innerHTML = `
                <div class="duo-grid" style="margin-bottom: 1rem;">
                    <div class="window-card ${commuteRes.morning.score >= 70 ? 'best-win' : 'avoid-win'}">
                        <div class="window-badge">${commuteRes.morning.label} (08:00 AM)</div>
                        <div class="window-time">${commuteRes.morning.score}/100 · ${commuteRes.morning.verdict}</div>
                        <p style="font-size:0.8rem; margin-top:0.4rem;">${commuteRes.morning.hazards.join(', ')}</p>
                    </div>
                    <div class="window-card ${commuteRes.evening.score >= 70 ? 'best-win' : 'avoid-win'}">
                        <div class="window-badge">${commuteRes.evening.label} (06:00 PM)</div>
                        <div class="window-time">${commuteRes.evening.score}/100 · ${commuteRes.evening.verdict}</div>
                        <p style="font-size:0.8rem; margin-top:0.4rem;">${commuteRes.evening.hazards.join(', ')}</p>
                    </div>
                </div>
            `;
        }
        document.getElementById('commute-modal-overlay')?.classList.remove('hidden');
    });

    // 7. Smart Packing Modal
    document.getElementById('open-packing-modal-btn')?.addEventListener('click', () => {
        if (!state.weatherData?.daily) return;
        const packRes = generatePackingListClient(state.weatherData.daily, 'balanced');
        const body = document.getElementById('packing-modal-body');
        if (body) {
            body.innerHTML = `
                <p style="font-size: 0.85rem; color: var(--color-ink-secondary); margin-bottom: 1rem;">
                    Forecast Range: <strong>${packRes.range}</strong> · Max Rain Risk: <strong>${packRes.rain}</strong>
                </p>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${packRes.items.map(item => `
                        <div class="pollutant" style="padding: 0.75rem 1rem;">
                            <div>
                                <div style="font-weight: 800; font-size: 0.9rem; color: var(--color-ink);">${item.item}</div>
                                <div style="font-size: 0.75rem; color: var(--color-ink-tertiary);">${item.reason}</div>
                            </div>
                            <span class="station-pill">${item.category}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        document.getElementById('packing-modal-overlay')?.classList.remove('hidden');
    });
}

/* ─────────────────── Core Data Loading ─────────────────── */

async function loadWeather(lat, lon, cityInfo = {}) {
    if (state.isLoading) return;
    state.isLoading = true;

    try {
        const [weatherResponse, aqiResponse] = await Promise.allSettled([
            fetchWeather(lat, lon),
            fetchAQI(lat, lon)
        ]);

        const weatherData = weatherResponse.status === 'fulfilled' ? weatherResponse.value : null;
        const aqiData = aqiResponse.status === 'fulfilled' ? aqiResponse.value : null;

        if (!weatherData || weatherData.error) {
            showToast(weatherData?.message || 'Failed to fetch weather telemetry', 'error');
            state.isLoading = false;
            return;
        }

        // Cache previous snapshot & track What Changed
        const cityName = cityInfo.name || 'London';
        const prevSnapshot = saveForecastSnapshot(cityName, weatherData);
        if (prevSnapshot) {
            const comparison = compareCachedForecast(weatherData, prevSnapshot);
            const whatChangedEl = document.getElementById('what-changed-container');
            if (whatChangedEl && comparison.hasComparison) {
                whatChangedEl.classList.remove('hidden');
                whatChangedEl.innerHTML = `
                    <div style="display:flex; align-items:center; gap: 0.6rem;">
                        <span style="font-size:1.1rem;">🔄</span>
                        <div>
                            <div class="card-heading" style="font-size:0.75rem; color:var(--accent-sky-dark);">What Changed in Forecast?</div>
                            <div style="font-size:0.85rem; font-weight:700; color:var(--color-ink);">${comparison.summary}</div>
                        </div>
                    </div>
                    <button class="tactile-btn-icon" onclick="document.getElementById('what-changed-container').classList.add('hidden')" style="width:26px; height:26px;">&times;</button>
                `;
            }
        }

        // Update state
        state.weatherData = weatherData;
        state.aqiData = aqiData;
        state.currentCity = {
            name: cityName,
            country: cityInfo.country || '',
            lat,
            lon,
            admin1: cityInfo.admin1 || '',
            timezone: weatherData.timezone || cityInfo.timezone || ''
        };
        state.lastUpdated = new Date();

        // Normalize hourly data for intelligence processing
        normalizeHourlyData();

        // Save last city
        store('lastCity', state.currentCity);

        // Render UI
        const unit = getUnit();
        updateCurrentWeather(weatherData, state.currentCity, unit);

        if (weatherData.current) {
            const condition = getWeatherCondition(weatherData.current.weather_code, weatherData.current.is_day === 1);
            setWeatherBackground(condition);
        }

        if (weatherData.daily) updateDailyForecast(weatherData.daily, weatherData.daily_units, unit);
        if (weatherData.hourly) {
            updateHourlyForecast(weatherData.hourly, weatherData.hourly_units, unit);
            initCharts(weatherData.hourly, getTheme() === 'dark');
        }

        if (aqiData && !aqiData.error) updateAQI(aqiData);
        if (weatherData.daily && weatherData.daily.uv_index_max) updateUV(weatherData.daily.uv_index_max[0]);

        const alerts = checkAlerts(weatherData, aqiData);
        renderAlerts(alerts);

        updateMapCenter(lat, lon, state.currentCity.name);

        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.classList.toggle('active', isFavorite(lat, lon));
        }

        updateLastUpdated();
        document.title = `${state.currentCity.name} — Atmos Intelligence`;

        // Render All Intelligence Layers
        renderIntelligenceLayer();

    } catch (error) {
        console.error('Error loading weather intelligence:', error);
        showToast('Error loading meteorological intelligence.', 'error');
    } finally {
        state.isLoading = false;
    }
}

/* ─────────────────── Intelligence Layer Rendering ─────────────────── */

function normalizeHourlyData() {
    if (!state.weatherData?.hourly) return;
    const h = state.weatherData.hourly;
    const aqiHourly = state.aqiData?.hourly?.us_aqi || [];
    
    state.hourlyNormalized = (h.time || []).slice(0, 24).map((isoTime, i) => {
        const d = new Date(isoTime);
        const timeLabel = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
        return {
            time: timeLabel,
            temperature: h.temperature_2m?.[i] ?? 20,
            apparent_temp: h.apparent_temperature?.[i] ?? 20,
            precipitation_prob: h.precipitation_probability?.[i] ?? 0,
            wind_speed: h.wind_speed_10m?.[i] ?? 10,
            wind_gust: h.wind_gusts_10m?.[i] ?? 14,
            uv_index: h.uv_index?.[i] ?? 1,
            aqi: aqiHourly[i] ?? 35,
            cloud_cover: h.cloud_cover?.[i] ?? 20,
            is_day: h.is_day?.[i] ?? 1
        };
    });
}

function renderIntelligenceLayer() {
    updateWeatherScoreUI();
    updateBestTimeUI();
    updateDecisionCardsUI();
    updateWeatherShiftUI();
    updateBriefingUI();
    updateSpecializedModesUI();
}

function updateWeatherScoreUI() {
    if (!state.weatherData?.current) return;
    const cur = state.weatherData.current;
    const telemetry = {
        temperature: cur.temperature_2m,
        apparent_temp: cur.apparent_temperature,
        humidity: cur.relative_humidity_2m,
        precipitation_prob: cur.precipitation_probability || 0,
        wind_speed: cur.wind_speed_10m,
        wind_gust: cur.wind_gusts_10m,
        uv_index: state.weatherData.daily?.uv_index_max?.[0] || 3,
        aqi: state.aqiData?.current?.us_aqi || 35,
        cloud_cover: cur.cloud_cover
    };

    const res = calculateWeatherScore(telemetry, state.currentScoreProfile);
    
    const scoreNum = document.getElementById('weather-score-num');
    const verdictEl = document.getElementById('weather-score-verdict');
    const summaryEl = document.getElementById('weather-score-summary');
    const reasonsEl = document.getElementById('weather-score-reasons');

    if (scoreNum) scoreNum.textContent = res.score;
    if (verdictEl) verdictEl.textContent = res.verdict;
    if (summaryEl) summaryEl.textContent = res.profile.toUpperCase() + ' · ' + res.reasons[0];
    if (reasonsEl) {
        reasonsEl.innerHTML = res.reasons.map(r => `<div>• ${r}</div>`).join('');
    }
}

function updateBestTimeUI() {
    if (!state.hourlyNormalized.length) return;
    const res = scoreHourlyActivity(state.hourlyNormalized, state.currentActivity);

    const bestTime = document.getElementById('best-time-slot');
    const bestScore = document.getElementById('best-time-score');
    const bestReasons = document.getElementById('best-time-reasons');

    const avoidTime = document.getElementById('avoid-time-slot');
    const avoidScore = document.getElementById('avoid-time-score');
    const avoidReasons = document.getElementById('avoid-time-reasons');

    if (res.bestWindow) {
        if (bestTime) bestTime.textContent = res.bestWindow.time;
        if (bestScore) bestScore.textContent = `${res.bestWindow.score}/100 · ${res.bestWindow.verdict}`;
        if (bestReasons) bestReasons.innerHTML = (res.bestWindow.pos || ['Optimal atmospheric balance']).map(r => `<li>${r}</li>`).join('');
    }

    if (res.avoidWindow) {
        if (avoidTime) avoidTime.textContent = res.avoidWindow.time;
        if (avoidScore) avoidScore.textContent = `${res.avoidWindow.score}/100 · ${res.avoidWindow.verdict}`;
        if (avoidReasons) avoidReasons.innerHTML = (res.avoidWindow.neg || ['Sub-optimal time for this activity']).map(r => `<li>${r}</li>`).join('');
    }

    // Render 24h Suitability Curve Bars
    const barsContainer = document.getElementById('activity-hourly-bars');
    if (barsContainer) {
        barsContainer.innerHTML = res.hourly.map((h, i) => `
            <div class="act-bar-col" title="${h.time}: ${h.score}/100 (${h.verdict})">
                <div class="act-bar-fill" style="height: ${h.score}%; background: ${h.score >= 80 ? 'var(--accent-mint)' : h.score >= 60 ? 'var(--accent-amber)' : 'var(--accent-coral)'};"></div>
                ${i % 3 === 0 ? `<span class="act-bar-label">${h.time.replace(':00', '')}</span>` : ''}
            </div>
        `).join('');
    }
}

function updateDecisionCardsUI() {
    if (!state.weatherData?.current) return;
    const cards = evaluateDecisionCardsClient(state.weatherData.current, state.hourlyNormalized);
    const container = document.getElementById('decision-cards-grid');
    if (container) {
        container.innerHTML = cards.map(c => `
            <div class="decision-card">
                <div class="decision-top-row">
                    <span style="font-size: 1.25rem;">${c.icon}</span>
                    <span class="decision-verdict" style="background: ${c.color};">${c.verdict}</span>
                </div>
                <div class="decision-question">${c.question}</div>
                <div class="decision-reason">${c.reason}</div>
            </div>
        `).join('');
    }
}

function updateWeatherShiftUI() {
    const shifts = detectWeatherShiftsClient(state.hourlyNormalized);
    const container = document.getElementById('shift-banner-container');
    if (!container || !shifts.length) return;

    const primaryShift = shifts[0];
    if (primaryShift.type === 'stable') {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="weather-shift-banner">
            <div style="display:flex; align-items:center; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">${primaryShift.icon}</span>
                <div>
                    <strong style="font-size: 0.85rem; color: var(--color-ink);">${primaryShift.title}</strong>
                    <div style="font-size: 0.8rem; color: var(--color-ink-secondary);">${primaryShift.desc}</div>
                </div>
            </div>
            <span class="station-pill" style="background:#ffffff;">${primaryShift.action}</span>
        </div>
    `;
}

function updateBriefingUI() {
    const cur = state.weatherData?.current;
    if (!cur) return;
    const temp = Math.round(cur.temperature_2m);
    const isMorning = new Date().getHours() < 14;

    const titleEl = document.getElementById('brief-headline');
    const summaryEl = document.getElementById('brief-summary');
    const tagEl = document.getElementById('brief-tag');

    if (titleEl) titleEl.textContent = `${state.currentCity.name} — ${temp}°C`;
    if (tagEl) tagEl.textContent = isMorning ? 'Morning Brief' : 'Tonight Outlook';
    if (summaryEl) {
        summaryEl.textContent = isMorning
            ? `Mild atmospheric start to the day in ${state.currentCity.name}. Weather score is high for morning outdoor activities.`
            : `Evening cooling trend underway across ${state.currentCity.name} with steady atmospheric conditions.`;
    }
}

function updateSpecializedModesUI() {
    // Stargazing
    const starRes = evaluateStargazingClient(state.hourlyNormalized);
    const starScore = document.getElementById('star-score-badge');
    const starWindow = document.getElementById('star-window-txt');
    const starReason = document.getElementById('star-reason-txt');
    if (starScore) starScore.textContent = `${starRes.score}/100`;
    if (starWindow) starWindow.textContent = `Best: ${starRes.bestWindow}`;
    if (starReason) starReason.textContent = starRes.reason;

    // Photography
    if (state.weatherData?.current) {
        const photoRes = evaluatePhotographyClient(state.weatherData.current, state.weatherData.daily);
        const photoScore = document.getElementById('photo-score-badge');
        const photoNote = document.getElementById('photo-note-txt');
        if (photoScore) photoScore.textContent = `${photoRes.overall}/100`;
        if (photoNote) photoNote.textContent = photoRes.note;
    }
}

function openRecommendationModal() {
    const modal = document.getElementById('recommendation-modal-overlay');
    const content = document.getElementById('recommendation-modal-content');
    if (!modal || !content || !state.hourlyNormalized.length) return;

    const actKeys = ['walking', 'running', 'cycling', 'photography', 'picnic', 'beach', 'stargazing'];
    const scored = actKeys.map(k => scoreHourlyActivity(state.hourlyNormalized, k));

    const good = scored.filter(s => s.bestWindow && s.bestWindow.score >= 75);
    const avoid = scored.filter(s => s.avoidWindow && s.avoidWindow.score < 55);

    content.innerHTML = `
        <div style="margin-bottom: 1.25rem;">
            <div class="card-heading" style="color: var(--accent-mint); margin-bottom: 0.5rem;">✓ RECOMMENDED OPPORTUNITIES</div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${good.map(g => `
                    <div class="pollutant" style="padding: 0.6rem 0.9rem;">
                        <span style="font-weight: 700; color: var(--color-ink);">${g.icon} ${g.name}</span>
                        <span class="station-pill" style="background: var(--accent-mint-light); color: #047857;">Best at ${g.bestWindow.time} (${g.bestWindow.score}/100)</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div>
            <div class="card-heading" style="color: var(--accent-coral); margin-bottom: 0.5rem;">✕ NOT IDEAL FOR</div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${avoid.map(a => `
                    <div class="pollutant" style="padding: 0.6rem 0.9rem;">
                        <span style="font-weight: 700; color: var(--color-ink);">${a.icon} ${a.name}</span>
                        <span class="station-pill" style="background: var(--accent-coral-light); color: #9f1239;">Low score at ${a.avoidWindow.time} (${a.avoidWindow.score}/100)</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

async function submitAIQuestion(question) {
    const historyEl = document.getElementById('ai-chat-history');
    if (!historyEl || !state.weatherData?.current) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg ai-user';
    userMsg.textContent = question;
    historyEl.appendChild(userMsg);

    // Append Loading Indicator
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg ai-bot';
    botMsg.innerHTML = `<em>Analyzing weather telemetry...</em>`;
    historyEl.appendChild(botMsg);
    historyEl.scrollTop = historyEl.scrollHeight;

    const response = await askAtmosAI(question, state.currentCity.name, state.weatherData.current, state.hourlyNormalized, state.weatherData.daily);
    botMsg.innerHTML = `
        <div>${response.answer}</div>
        <div style="font-size: 0.7rem; color: var(--color-ink-tertiary); margin-top: 0.4rem;">
            Verified tool: ${response.tool_called} · Confidence: ${response.confidence}
        </div>
    `;
    historyEl.scrollTop = historyEl.scrollHeight;
}

/* ─────────────────── Auto Refresh & Utilities ─────────────────── */

function startAutoRefresh() {
    stopAutoRefresh();
    state.autoRefreshTimer = setInterval(() => {
        if (state.currentCity && !document.hidden) {
            loadWeather(state.currentCity.lat, state.currentCity.lon, state.currentCity);
            updateRefreshIndicator();
        }
    }, state.refreshInterval);
    updateRefreshIndicator();
}

function stopAutoRefresh() {
    if (state.autoRefreshTimer) {
        clearInterval(state.autoRefreshTimer);
        state.autoRefreshTimer = null;
    }
}

function updateRefreshIndicator() {
    const indicator = document.getElementById('refresh-indicator');
    if (!indicator || !state.lastUpdated) return;
    const elapsed = Date.now() - state.lastUpdated.getTime();
    const remaining = Math.max(0, state.refreshInterval - elapsed);
    const minutes = Math.ceil(remaining / 60000);
    indicator.textContent = `Auto-refresh in ${minutes}m`;
}

function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && state.lastUpdated) {
        el.textContent = `Updated ${state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
}
