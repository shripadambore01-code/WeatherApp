const HIST_KEY = 'atmos_history';
const MAX_HIST = 20;

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HIST_KEY)) || [];
    } catch {
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem(HIST_KEY, JSON.stringify(history));
}

export function initHistory() {
    renderHistory();
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => clearHistory());
    }
}

export function addToHistory(city) {
    let hist = getHistory();
    
    // Remove if already exists to move to top
    hist = hist.filter(h => !(Math.abs(h.lat - city.lat) < 0.01 && Math.abs(h.lon - city.lon) < 0.01));
    
    hist.unshift({
        name: city.name,
        country: city.country,
        admin1: city.admin1,
        lat: city.lat,
        lon: city.lon,
        timestamp: Date.now()
    });
    
    if (hist.length > MAX_HIST) {
        hist.pop();
    }
    
    saveHistory(hist);
    renderHistory();
}

export function clearHistory() {
    localStorage.removeItem(HIST_KEY);
    renderHistory();
}

export function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    
    const hist = getHistory();
    container.innerHTML = '';
    
    if (!hist.length) {
        container.innerHTML = '<p class="empty-state">No search history.</p>';
        return;
    }
    
    hist.forEach(item => {
        const el = document.createElement('div');
        el.className = 'history-item';
        
        const date = new Date(item.timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        el.innerHTML = `
            <div class="hist-name">${item.name}, ${item.country}</div>
            <div class="hist-time">${date}</div>
        `;
        
        el.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('citySelected', { detail: item }));
        });
        
        container.appendChild(el);
    });
}
