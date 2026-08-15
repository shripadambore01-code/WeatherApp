/**
 * Atmos Weather — Geolocation Module
 * Handles browser geolocation for auto-detecting user's location
 */

import { showToast } from './utils.js';

/**
 * Gets user's current geographical position
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
export function getCurrentPosition() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'warning');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => {
                console.warn('Geolocation error:', err.message);
                const messages = {
                    1: 'Location access denied. Please enable location permissions.',
                    2: 'Location unavailable. Please try again.',
                    3: 'Location request timed out. Please try again.'
                };
                showToast(messages[err.code] || 'Could not get your location.', 'warning');
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    });
}

/**
 * Initialize geolocation — setup locate button and auto-detect on first load
 */
export async function initGeolocation() {
    // Setup locate button
    const btn = document.getElementById('locate-btn');
    if (btn) {
        btn.addEventListener('click', async () => {
            btn.classList.add('loading');
            const pos = await getCurrentPosition();
            btn.classList.remove('loading');

            if (pos) {
                window.dispatchEvent(new CustomEvent('locationDetected', { detail: pos }));
            }
        });
    }

    // Auto-detect on first load
    const pos = await getCurrentPosition();
    if (pos) {
        window.dispatchEvent(new CustomEvent('locationDetected', { detail: pos }));
    }
}
