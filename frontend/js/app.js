/**
 * Atmos Weather — Master Application Orchestrator
 * Connects real-time telemetry, AI intelligence engines, decision cards,
 * activity planners, multi-metric charts, and interactive canvas share cards.
 */

import { fetchWeather, fetchAQI, searchCities, reverseGeocode } from './api.js';
import { updateCurrentWeather, setWeatherBackground } from './weather.js';
import { updateDailyForecast, updateHourlyForecast } from './forecast.js';
import { initCharts, setChartMetric, updateChartsTheme, destroyCharts } from './charts.js';
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
import { initCompare, showCompare, addCityToCompare } from './compare.js';
import { initI18n, t } from './i18n.js';
import { initPWA } from './pwa.js';
import { showToast, retrieve, store, getWeatherCondition, getWeatherDescription } from './utils.js';

// Upgraded Intelligence Modules
import { calculateWeatherScore } from './intelligence/weatherScore.js';
import { evaluateAllActivities, evaluateSingleActivity, scoreHourlyActivity } from './intelligence/activityEngine.js';
import { analyzeRainIntelligence } from './intelligence/rainIntelligence.js';
import { analyzeWeatherTrends } from './intelligence/weatherTrends.js';
import { explainMeteorologicalMetric } from './intelligence/whyExplainer.js';
import { askAtmosAI } from './intelligence/atmosAI.js';
import { evaluateDecisionCardsClient } from './intelligence/decisionEngine.js';
import { evaluateCommuteClient } from './intelligence/commuteTravel.js';
import { openShareModal } from './shareCard.js';
import { generatePrintableReport } from './reportGenerator.js';

/* ─────────────────── State ─────────────────── */

const state = {
    currentCity: null,       // { name, country, lat, lon, admin1, timezone }
    weatherData: null,       // Full Open-Meteo response
    aqiData: null,           // Air quality response
    hourlyNormalized: [],    // Preprocessed 24h data
    currentMode: 'general',  // general, student, travel, fitness, agriculture, photo
    autoRefreshTimer: null,
    refreshInterval: 600000, // 10 minutes
    lastUpdated: null,
    isLoading: false,
    atmosScore: 84
};

// Global Exposure
window.atmosState = state;
window.atmosLoadWeather = loadWeather;
window.atmosExplain = openWhyExplainerModal;

/* ─────────────────── Initialization ─────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c🧠 Atmos AI Weather Decision Assistant', 'font-size:22px;font-weight:bold;color:#f59e0b');

    try {
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

        setupUIEventListeners();

        // Load initial city (saved last city or Pune/London fallback)
        const lastCity = retrieve('lastCity');
        if (lastCity && lastCity.lat && lastCity.lon) {
            await loadWeather(lastCity.lat, lastCity.lon, lastCity);
        } else {
            // Default load Pune (Maharashtra, India)
            await loadWeather(18.5204, 73.8567, { name: 'Pune', country: 'India', admin1: 'Maharashtra', lat: 18.5204, lon: 73.8567 });
            initGeolocation();
        }

        startAutoRefresh();
    } catch (e) {
        console.error('App initialization error:', e);
    }
});

/* ─────────────────── Event Listeners ─────────────────── */

function setupUIEventListeners() {
    // Mode Ribbon Chips
    const modeChips = document.querySelectorAll('.mode-chip');
    modeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            modeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentMode = chip.dataset.mode || 'general';
            renderIntelligenceLayer();
        });
    });

    // Chart Tabs (Temp, Rain %, Humidity, Wind, Pressure)
    const chartTabs = document.querySelectorAll('.chart-tab');
    chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            chartTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            setChartMetric(tab.dataset.metric || 'temp');
        });
    });

    // Map Layer Chips
    const mapChips = document.querySelectorAll('.map-chip');
    mapChips.forEach(chip => {
        chip.addEventListener('click', () => {
            mapChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            showToast(`Map overlay switched to ${chip.textContent}`, 'info');
        });
    });

    // AI Assistant Modal Controls
    const openAIBtn = document.getElementById('open-ai-modal-btn');
    const closeAIBtn = document.getElementById('ai-modal-close');
    const aiModal = document.getElementById('ai-modal-overlay');
    const aiSubmitBtn = document.getElementById('ai-submit-btn');
    const aiInput = document.getElementById('ai-user-input');

    if (openAIBtn && aiModal) {
        openAIBtn.onclick = () => aiModal.classList.remove('hidden');
    }
    if (closeAIBtn && aiModal) {
        closeAIBtn.onclick = () => aiModal.classList.add('hidden');
    }
    if (aiSubmitBtn && aiInput) {
        aiSubmitBtn.onclick = () => {
            const q = aiInput.value.trim();
            if (q) {
                submitAIQuestion(q);
                aiInput.value = '';
            }
        };
        aiInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const q = aiInput.value.trim();
                if (q) {
                    submitAIQuestion(q);
                    aiInput.value = '';
                }
            }
        };
    }

    // AI Quick Prompts Chips
    document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.textContent.trim();
            if (aiInput) aiInput.value = promptText;
            submitAIQuestion(promptText);
        });
    });

    // "Explain My Weather" Button
    const explainWeatherBtn = document.getElementById('explain-weather-btn');
    if (explainWeatherBtn && aiModal) {
        explainWeatherBtn.onclick = () => {
            aiModal.classList.remove('hidden');
            const q = `Give me a full meteorological briefing and outdoor decision recommendation for ${state.currentCity?.name || 'today'}`;
            if (aiInput) aiInput.value = q;
            submitAIQuestion(q);
        };
    }

    // Share Weather Card Button
    const shareBtn = document.getElementById('share-card-btn');
    if (shareBtn) {
        shareBtn.onclick = () => openShareModal(state);
    }

    // Weather Report Generator Button (Feature 20)
    const reportBtn = document.getElementById('generate-report-btn');
    if (reportBtn) {
        reportBtn.onclick = () => generatePrintableReport(state);
    }

    // Student Mode Commute Evaluator (Feature 8)
    const studentEvalBtn = document.getElementById('student-eval-btn');
    if (studentEvalBtn) {
        studentEvalBtn.onclick = () => {
            const depHour = parseInt(document.getElementById('student-dep-time')?.value || '8');
            const retHour = parseInt(document.getElementById('student-ret-time')?.value || '17');
            const res = evaluateCommuteClient(state.hourlyNormalized, depHour, retHour);
            const container = document.getElementById('student-commute-results');
            if (container) {
                container.classList.remove('hidden');
                container.innerHTML = `
                    <div style="background: var(--color-surface-sunken); border: 1px solid var(--color-border); border-radius: var(--radius-bubble-sm); padding: 1rem; margin-top: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>🌅 Morning (${depHour}:00):</strong>
                            <span class="planner-badge ${res.morning.verdict.toLowerCase()}">${res.morning.verdict} (${res.morning.score}/100)</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--color-ink-secondary); margin-bottom: 0.75rem;">
                            • Temp: ${res.morning.temp}°C | Rain Risk: ${res.morning.rain}% | ${res.morning.hazards[0]}
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>🌇 Return (${retHour > 12 ? retHour - 12 : retHour}:00 PM):</strong>
                            <span class="planner-badge ${res.evening.verdict.toLowerCase()}">${res.evening.verdict} (${res.evening.score}/100)</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--color-ink-secondary);">
                            • Temp: ${res.evening.temp}°C | Rain Risk: ${res.evening.rain}% | ${res.evening.hazards[0]}
                        </div>
                    </div>
                `;
            }
        };
    }

    // Travel Weather Evaluator (Feature 9)
    const travelEvalBtn = document.getElementById('travel-eval-btn');
    if (travelEvalBtn) {
        travelEvalBtn.onclick = async () => {
            const fromCity = document.getElementById('travel-from-city')?.value.trim() || state.currentCity?.name || 'Pune';
            const toCity = document.getElementById('travel-to-city')?.value.trim();
            if (!toCity) {
                showToast('Please enter a destination city', 'info');
                return;
            }

            const container = document.getElementById('travel-eval-results');
            if (container) {
                container.classList.remove('hidden');
                container.innerHTML = `<div style="text-align:center; padding: 1rem; color: var(--color-ink-tertiary);">Analyzing travel telemetry between ${fromCity} and ${toCity}...</div>`;
                
                try {
                    const searchRes = await searchCities(toCity, 1);
                    if (searchRes?.results?.length > 0) {
                        const destLoc = searchRes.results[0];
                        const destWeather = await fetchWeather(destLoc.latitude, destLoc.longitude);
                        const destTemp = Math.round(destWeather?.current?.temperature_2m ?? 24);
                        const destRain = Math.round(destWeather?.current?.precipitation_probability ?? 0);
                        const destDesc = destWeather?.current ? getWeatherDescription(destWeather.current.weather_code) : 'Clear';
                        
                        const origTemp = Math.round(state.weatherData?.current?.temperature_2m ?? 26);
                        const origRain = Math.round(state.weatherData?.current?.precipitation_probability ?? 0);

                        const travelRisk = destRain > 50 || origRain > 50 ? 'HIGH' : destRain > 25 || origRain > 25 ? 'MODERATE' : 'LOW';
                        const riskColor = travelRisk === 'HIGH' ? '#ef4444' : travelRisk === 'MODERATE' ? '#f59e0b' : '#10b981';

                        container.innerHTML = `
                            <div style="background: var(--color-surface-sunken); border: 1px solid var(--color-border); border-radius: var(--radius-bubble-sm); padding: 1rem; margin-top: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                    <strong style="font-size: 0.95rem;">${fromCity} ➔ ${destLoc.name}</strong>
                                    <span class="station-pill" style="background: ${riskColor}; color: #fff;">Risk: ${travelRisk}</span>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
                                    <div style="background: var(--color-surface); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--color-border);">
                                        <strong>🛫 Origin (${fromCity}):</strong><br>
                                        ${origTemp}°C | Rain: ${origRain}%
                                    </div>
                                    <div style="background: var(--color-surface); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--color-border);">
                                        <strong>🛬 Destination (${destLoc.name}):</strong><br>
                                        ${destTemp}°C (${destDesc}) | Rain: ${destRain}%
                                    </div>
                                </div>
                                <div style="font-size: 0.75rem; color: var(--color-ink-tertiary); margin-top: 0.5rem; text-align: right;">
                                    * Departure vs Destination comparison based on live Open-Meteo telemetry.
                                </div>
                            </div>
                        `;
                    }
                } catch (e) {
                    container.innerHTML = `<div style="color: #ef4444; padding: 0.5rem;">Could not locate destination city.</div>`;
                }
            }
        };
    }

    // Connect mode chips to open specialized modals if clicked twice or requested
    document.querySelectorAll('.mode-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const mode = chip.dataset.mode;
            if (mode === 'student') {
                document.getElementById('student-modal-overlay')?.classList.remove('hidden');
            } else if (mode === 'travel') {
                document.getElementById('travel-modal-overlay')?.classList.remove('hidden');
            }
        });
    });

    // Sidebar Toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    // City Selection Event
    window.addEventListener('citySelected', (e) => {
        const city = e.detail;
        if (city && city.lat && city.lon) {
            loadWeather(city.lat, city.lon, city);
        }
    });

    // Favorite Button Handler
    const favBtn = document.getElementById('favorite-btn');
    if (favBtn) {
        favBtn.onclick = () => {
            if (!state.currentCity) return;
            const { lat, lon } = state.currentCity;
            if (isFavorite(lat, lon)) {
                removeFavorite(lat, lon);
                favBtn.classList.remove('active');
                showToast('Removed from favorites', 'info');
            } else {
                addFavorite(state.currentCity);
                favBtn.classList.add('active');
                showToast('Saved to favorites', 'success');
            }
            renderFavorites();
        };
    }
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

        const cityName = cityInfo.name || 'Pune';

        // Update State
        state.weatherData = weatherData;
        state.aqiData = aqiData;
        state.currentCity = {
            name: cityName,
            country: cityInfo.country || 'India',
            lat,
            lon,
            admin1: cityInfo.admin1 || '',
            timezone: weatherData.timezone || cityInfo.timezone || 'Asia/Kolkata'
        };
        state.lastUpdated = new Date();

        normalizeHourlyData();
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
            initCharts(weatherData.hourly, getTheme() === 'dark', aqiData);
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

        // Render All Upgraded Intelligence Layers
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
            temperature: h.temperature_2m?.[i] ?? 24,
            apparent_temp: h.apparent_temperature?.[i] ?? 24,
            precipitation_prob: h.precipitation_probability?.[i] ?? 0,
            precipitation: h.precipitation?.[i] ?? 0,
            rain: h.rain?.[i] ?? 0,
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
    updateAtmosScoreUI();
    updateBriefingUI();
    updateRainIntelligenceUI();
    updateActivityPlannerUI();
    updateDecisionCardsUI();
    updateHistoryDeltaUI();
}

function updateAtmosScoreUI() {
    if (!state.weatherData?.current) return;
    const cur = state.weatherData.current;
    const telemetry = {
        temperature: cur.temperature_2m,
        apparent_temp: cur.apparent_temperature,
        humidity: cur.relative_humidity_2m,
        precipitation_prob: cur.precipitation_probability || 0,
        rain: cur.rain || 0,
        wind_speed: cur.wind_speed_10m,
        wind_gust: cur.wind_gusts_10m,
        uv_index: state.weatherData.daily?.uv_index_max?.[0] || 3.5,
        aqi: state.aqiData?.current?.us_aqi || 35
    };

    const res = calculateWeatherScore(telemetry, state.currentMode);
    state.atmosScore = res.score;

    const scoreVal = document.getElementById('score-value');
    const verdictEl = document.getElementById('score-verdict');
    const explanationEl = document.getElementById('score-explanation');

    if (scoreVal) scoreVal.textContent = res.score;
    if (verdictEl) {
        verdictEl.textContent = res.verdict;
        verdictEl.style.color = res.score >= 75 ? '#10b981' : res.score >= 50 ? '#f59e0b' : '#ef4444';
        verdictEl.style.background = res.score >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    }
    if (explanationEl) explanationEl.textContent = res.summary;

    // Sub-scores
    if (res.subscores) {
        const subTemp = document.getElementById('sub-temp');
        const subRain = document.getElementById('sub-rain');
        const subWind = document.getElementById('sub-wind');
        const subAqi = document.getElementById('sub-aqi');
        const subUv = document.getElementById('sub-uv');
        const subOutdoor = document.getElementById('sub-outdoor');

        if (subTemp) subTemp.textContent = `${res.subscores.temperature}/100`;
        if (subRain) subRain.textContent = `${res.subscores.rain}/100`;
        if (subWind) subWind.textContent = `${res.subscores.wind}/100`;
        if (subAqi) subAqi.textContent = `${res.subscores.aqi}/100`;
        if (subUv) subUv.textContent = `${res.subscores.uv}/100`;
        if (subOutdoor) subOutdoor.textContent = `${res.subscores.outdoor}/100`;
    }
}

function updateBriefingUI() {
    const cur = state.weatherData?.current;
    if (!cur) return;

    const temp = Math.round(cur.temperature_2m);
    const rainP = Math.round(cur.precipitation_probability || 0);
    const wind = Math.round(cur.wind_speed_10m || 10);
    const desc = getWeatherDescription(cur.weather_code);
    const uvVal = (state.weatherData.daily?.uv_index_max?.[0] || 3.5).toFixed(1);
    const cityName = state.currentCity?.name || 'Pune';

    const briefTextEl = document.getElementById('ai-briefing-text');
    const bTemp = document.getElementById('brief-temp');
    const bRain = document.getElementById('brief-rain');
    const bWind = document.getElementById('brief-wind');
    const bRec = document.getElementById('brief-rec');

    const summary = `Today in ${cityName} will experience ${desc.toLowerCase()} with temperatures around ${temp}°C (feels like ${Math.round(cur.apparent_temperature)}°C). Rain probability is ${rainP}%, with gentle ${wind} km/h winds and UV radiance peaking near ${uvVal}.`;
    if (briefTextEl) briefTextEl.textContent = summary;

    if (bTemp) bTemp.textContent = `${temp}°C (${temp > 28 ? 'Warm' : temp < 16 ? 'Cool' : 'Comfortable'})`;
    if (bRain) bRain.textContent = `${rainP}% (${rainP >= 40 ? 'Umbrella Advised' : 'Low Risk'})`;
    if (bWind) bWind.textContent = `${wind} km/h (${wind > 20 ? 'Breezy' : 'Gentle'})`;
    if (bRec) bRec.textContent = rainP >= 40 ? 'Carry rain gear' : 'Favorable for commute';
}

function updateRainIntelligenceUI() {
    const rainInfo = analyzeRainIntelligence(state.hourlyNormalized, state.weatherData?.current || {});

    const nextWin = document.getElementById('rain-next-window');
    const durEst = document.getElementById('rain-duration-est');
    const peakProb = document.getElementById('rain-peak-prob');
    const peakTime = document.getElementById('rain-peak-time');
    const bestWin = document.getElementById('rain-best-window');
    const intensityTag = document.getElementById('rain-intensity-tag');
    const umbrellaText = document.getElementById('rain-umbrella-text');

    if (nextWin) nextWin.textContent = rainInfo.nextRainWindow;
    if (durEst) durEst.textContent = `Duration: ${rainInfo.estimatedDuration}`;
    if (peakProb) peakProb.textContent = `${rainInfo.peakProbability}%`;
    if (peakTime) peakTime.textContent = rainInfo.peakTime ? `Peak: ${rainInfo.peakTime}` : 'Dry Forecast';
    if (bestWin) bestWin.textContent = rainInfo.bestOutdoorWindow;
    if (intensityTag) intensityTag.textContent = rainInfo.intensity;
    if (umbrellaText) umbrellaText.textContent = rainInfo.recommendation;
}

function updateActivityPlannerUI() {
    const container = document.getElementById('planner-cards-container');
    if (!container) return;

    const activities = evaluateAllActivities(state.hourlyNormalized, state.weatherData?.current || {});

    // Sort by mode priority if mode selected
    if (state.currentMode === 'student') {
        activities.sort((a, b) => (a.key === 'commute' || a.key === 'study') ? -1 : 1);
    } else if (state.currentMode === 'fitness') {
        activities.sort((a, b) => (a.key === 'running' || a.key === 'cycling' || a.key === 'sports') ? -1 : 1);
    } else if (state.currentMode === 'travel') {
        activities.sort((a, b) => (a.key === 'travel' || a.key === 'picnic') ? -1 : 1);
    }

    container.innerHTML = activities.slice(0, 6).map(act => {
        const badgeClass = act.suitability.toLowerCase();
        return `
            <div class="planner-card">
                <div class="planner-top">
                    <div class="planner-title">${act.icon} ${act.name}</div>
                    <span class="planner-badge ${badgeClass}">${act.suitability}</span>
                </div>
                <div class="planner-time">⏰ ${act.bestTime}</div>
                <div class="planner-rec">${act.recommendation}</div>
            </div>
        `;
    }).join('');
}

function updateDecisionCardsUI() {
    if (!state.weatherData?.current) return;
    const cards = evaluateDecisionCardsClient(state.weatherData.current, state.hourlyNormalized);
    const container = document.getElementById('decision-cards-container');
    if (container) {
        container.innerHTML = cards.map(c => `
            <div class="decision-card">
                <div class="decision-top-row">
                    <span style="font-size: 1.25rem;">${c.icon}</span>
                    <span class="decision-verdict" style="background: ${c.color}; color:#fff;">${c.verdict}</span>
                </div>
                <div class="decision-question">${c.question}</div>
                <div class="decision-reason">${c.reason}</div>
            </div>
        `).join('');
    }
}

function updateHistoryDeltaUI() {
    const badge = document.getElementById('history-delta-badge');
    if (!badge || !state.weatherData?.daily) return;

    const tMax = state.weatherData.daily.temperature_2m_max || [];
    if (tMax.length >= 2) {
        const delta = Math.round(tMax[0] - tMax[1]);
        if (delta > 0) badge.textContent = `📈 +${delta}°C warmer than yesterday`;
        else if (delta < 0) badge.textContent = `📉 ${Math.abs(delta)}°C cooler than yesterday`;
        else badge.textContent = `📊 Consistent with yesterday`;
    }
}

/* ─────────────────── "Why is this happening?" Modal ─────────────────── */

function openWhyExplainerModal(metricKey) {
    const modal = document.getElementById('why-modal-overlay');
    const title = document.getElementById('why-modal-title');
    const body = document.getElementById('why-modal-body');
    const action = document.getElementById('why-modal-action');

    if (!modal || !body) return;

    const explanation = explainMeteorologicalMetric(
        metricKey,
        state.weatherData?.current || {},
        state.hourlyNormalized,
        state.aqiData
    );

    if (title) title.innerHTML = `<span>💡</span> <span>${explanation.title}</span>`;
    body.textContent = explanation.explanation;
    if (action) {
        action.innerHTML = `<span>🎯 Recommendation:</span> <strong>${explanation.action}</strong>`;
    }

    modal.classList.remove('hidden');
}

/* ─────────────────── AI Question Handler ─────────────────── */

async function submitAIQuestion(question) {
    const historyEl = document.getElementById('ai-chat-history');
    if (!historyEl || !state.weatherData?.current) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg ai-user';
    userMsg.textContent = question;
    historyEl.appendChild(userMsg);

    // Loading bot message
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg ai-bot';
    botMsg.innerHTML = `<em>Analyzing verified meteorological telemetry for ${state.currentCity?.name}...</em>`;
    historyEl.appendChild(botMsg);
    historyEl.scrollTop = historyEl.scrollHeight;

    const response = await askAtmosAI(
        question,
        state.currentCity?.name || 'Pune',
        state.weatherData.current,
        state.hourlyNormalized,
        state.weatherData.daily,
        state.aqiData
    );

    botMsg.innerHTML = `
        <div style="white-space: pre-line;">${response.answer}</div>
        <div style="font-size: 0.72rem; color: var(--color-ink-tertiary); margin-top: 0.5rem;">
            Verified Tool: <code>${response.tool_called}</code> · Confidence: ${response.confidence || 'High'}
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
        }
    }, state.refreshInterval);
}

function stopAutoRefresh() {
    if (state.autoRefreshTimer) {
        clearInterval(state.autoRefreshTimer);
        state.autoRefreshTimer = null;
    }
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
