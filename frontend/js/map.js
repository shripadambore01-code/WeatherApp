/**
 * Atmos Weather — Interactive Map Module
 * Leaflet.js integration for radar and location mapping with auto-initialization and responsive resizing.
 */

let map = null;
let marker = null;

export function initMap() {
    if (!window.L) return null;
    
    const container = document.getElementById('weather-map');
    if (!container) return null;
    
    if (map) {
        map.invalidateSize();
        return map;
    }

    try {
        // Initialize map
        map = L.map('weather-map', {
            zoomControl: true,
            attributionControl: false
        }).setView([18.5204, 73.8567], 10);
        
        // High performance dark/light styled tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);

        return map;
    } catch (e) {
        console.warn('Map initialization note:', e);
        return null;
    }
}

export function updateMapCenter(lat, lon, cityName = '', temp = '') {
    if (!window.L) return;
    
    const container = document.getElementById('weather-map');
    if (!container) return;

    if (!map) {
        initMap();
    }
    
    if (!map) return;

    try {
        map.setView([lat, lon], 11);
        
        if (marker) {
            marker.setLatLng([lat, lon]);
        } else {
            marker = L.marker([lat, lon]).addTo(map);
        }
        
        if (cityName) {
            marker.bindPopup(`<div style="font-family:Inter,sans-serif; font-size:13px; font-weight:700; color:#1e293b;">📍 ${cityName}</div>`).openPopup();
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);
    } catch (e) {
        console.warn('Map update error:', e);
    }
}

export function destroyMap() {
    if (map) {
        try {
            map.remove();
        } catch (e) {}
        map = null;
        marker = null;
    }
}
