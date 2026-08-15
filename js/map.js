let map = null;
let marker = null;
let layerControl = null;

export function initMap() {
    if (!window.L) return;
    
    const container = document.getElementById('weather-map');
    if (!container) return;
    
    // Default to a global view if no location yet
    map = L.map('weather-map').setView([20, 0], 2);
    
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });
    baseLayer.addTo(map);
    
    // Example weather layers (using OpenWeatherMap for demonstration, requires API key in reality, 
    // but here we just set up the structure)
    // If you have a specific tile server, replace URLs
    const tempLayer = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY');
    const precipLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY');
    const cloudLayer = L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY');
    const windLayer = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY');
    
    const overlayMaps = {
        "Temperature": tempLayer,
        "Precipitation": precipLayer,
        "Clouds": cloudLayer,
        "Wind": windLayer
    };
    
    layerControl = L.control.layers({"Base": baseLayer}, overlayMaps).addTo(map);
    
    // Fix map rendering issues inside hidden containers
    setTimeout(() => { map.invalidateSize(); }, 500);
}

export function updateMapCenter(lat, lon, cityName = '', temp = '') {
    if (!map) return;
    
    map.setView([lat, lon], 10);
    
    if (marker) {
        marker.setLatLng([lat, lon]);
    } else {
        marker = L.marker([lat, lon]).addTo(map);
    }
    
    if (cityName || temp) {
        marker.bindPopup(`<b>${cityName}</b><br>${temp}`).openPopup();
    }
}

export function destroyMap() {
    if (map) {
        map.remove();
        map = null;
        marker = null;
        layerControl = null;
    }
}
