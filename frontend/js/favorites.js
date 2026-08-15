const FAV_KEY = 'atmos_favorites';
const MAX_FAV = 10;

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch {
        return [];
    }
}

function saveFavorites(favs) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

export function initFavorites() {
    renderFavorites();
    
    // Setup favorite toggle button in hero
    const favBtn = document.getElementById('favorite-btn');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            const currentCity = window.__CURRENT_CITY__; // Assuming main sets this globally or via event
            if (!currentCity) return;
            
            if (isFavorite(currentCity.lat, currentCity.lon)) {
                removeFavorite(currentCity.lat, currentCity.lon);
                favBtn.classList.remove('is-favorite');
            } else {
                addFavorite(currentCity);
                favBtn.classList.add('is-favorite');
            }
        });
    }
}

export function isFavorite(lat, lon) {
    const favs = getFavorites();
    return favs.some(f => Math.abs(f.lat - lat) < 0.01 && Math.abs(f.lon - lon) < 0.01);
}

export function addFavorite(city) {
    let favs = getFavorites();
    if (isFavorite(city.lat, city.lon)) return;
    
    favs.push({
        name: city.name,
        country: city.country,
        admin1: city.admin1,
        lat: city.lat,
        lon: city.lon
    });
    
    if (favs.length > MAX_FAV) favs.shift(); // Remove oldest
    
    saveFavorites(favs);
    renderFavorites();
}

export function removeFavorite(lat, lon) {
    let favs = getFavorites();
    favs = favs.filter(f => !(Math.abs(f.lat - lat) < 0.01 && Math.abs(f.lon - lon) < 0.01));
    saveFavorites(favs);
    renderFavorites();
}

export function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;
    
    const favs = getFavorites();
    container.innerHTML = '';
    
    if (!favs.length) {
        container.innerHTML = '<p class="empty-state">No favorite cities added.</p>';
        return;
    }
    
    favs.forEach(fav => {
        const chip = document.createElement('div');
        chip.className = 'favorite-chip';
        
        const label = document.createElement('span');
        label.textContent = `${fav.name}, ${fav.country}`;
        label.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('citySelected', { detail: fav }));
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '&times;';
        removeBtn.className = 'remove-fav-btn';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(fav.lat, fav.lon);
            const favBtn = document.getElementById('favorite-btn');
            if (favBtn && window.__CURRENT_CITY__ && isFavorite(window.__CURRENT_CITY__.lat, window.__CURRENT_CITY__.lon) === false) {
                favBtn.classList.remove('is-favorite');
            }
        });
        
        chip.appendChild(label);
        chip.appendChild(removeBtn);
        container.appendChild(chip);
    });
}
