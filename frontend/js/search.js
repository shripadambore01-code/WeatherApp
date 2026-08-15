import { searchCities } from './api.js';
import { debounce } from './utils.js';
import { addToHistory } from './history.js';

let currentResults = [];
let selectedIndex = -1;

export function initSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-dropdown');
    
    if (!input || !dropdown) return;

    const performSearch = async (query) => {
        if (!query || query.length < 2) {
            dropdown.innerHTML = '';
            dropdown.style.display = 'none';
            currentResults = [];
            return;
        }
        
        // Show loading state...
        const res = await searchCities(query);
        if (res && res.results) {
            currentResults = res.results;
            renderDropdown(currentResults, dropdown);
        }
    };

    const debouncedSearch = debounce((e) => {
        performSearch(e.target.value.trim());
    }, 300);

    input.addEventListener('input', (e) => {
        selectedIndex = -1;
        debouncedSearch(e);
    });

    input.addEventListener('keydown', (e) => {
        if (!currentResults.length) return;
        
        const items = dropdown.querySelectorAll('.search-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
            highlightItem(items, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            highlightItem(items, selectedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
                selectCity(currentResults[selectedIndex]);
            } else if (currentResults.length > 0) {
                selectCity(currentResults[0]);
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function renderDropdown(results, dropdown) {
    dropdown.innerHTML = '';
    if (!results.length) {
        dropdown.style.display = 'none';
        return;
    }
    
    results.forEach((city, idx) => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <div class="city-name">${city.name}, ${city.country}</div>
            <div class="city-sub">${city.admin1 || ''} ${city.population ? `(Pop: ${city.population.toLocaleString()})` : ''}</div>
        `;
        item.addEventListener('click', () => selectCity(city));
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

function highlightItem(items, index) {
    items.forEach((item, idx) => {
        if (idx === index) item.classList.add('selected');
        else item.classList.remove('selected');
    });
}

function selectCity(city) {
    const dropdown = document.getElementById('search-dropdown');
    const input = document.getElementById('search-input');
    
    if (dropdown) dropdown.style.display = 'none';
    if (input) input.value = '';
    
    const cityData = {
        name: city.name,
        country: city.country || '',
        admin1: city.admin1 || '',
        lat: city.latitude,
        lon: city.longitude,
        timezone: city.timezone || ''
    };
    
    addToHistory(cityData);
    
    // Dispatch event to main app to load this city
    window.dispatchEvent(new CustomEvent('citySelected', { detail: cityData }));
}
