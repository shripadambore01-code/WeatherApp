/**
 * Atmos Weather — UV Index Display
 * Renders UV index with semicircular gauge and protection recommendations
 */

import { getUVInfo, clamp } from './utils.js';

/**
 * Update the UV index section
 * @param {number} uvIndex - UV index value (from daily.uv_index_max)
 */
export function updateUV(uvIndex) {
    const section = document.getElementById('uv-section');
    if (!section) return;

    const info = getUVInfo(uvIndex);

    // UV score
    const scoreEl = document.getElementById('uv-score');
    if (scoreEl) {
        scoreEl.textContent = uvIndex !== null && uvIndex !== undefined ? Math.round(uvIndex) : '--';
        scoreEl.style.color = info.color;
    }

    // UV status label
    const statusEl = document.getElementById('uv-status');
    if (statusEl) {
        statusEl.textContent = info.label;
        statusEl.style.color = info.color;
    }

    // SVG gauge arc — update stroke-dashoffset
    // Total arc length ≈ 125.66 (π * 40)
    const pathEl = document.getElementById('uv-path');
    if (pathEl) {
        const arcLength = 125.66;
        const maxUV = 12;
        const ratio = clamp(uvIndex / maxUV, 0, 1);
        const dashOffset = arcLength * (1 - ratio);
        pathEl.setAttribute('stroke-dasharray', arcLength.toString());
        pathEl.setAttribute('stroke-dashoffset', dashOffset.toString());
        pathEl.setAttribute('stroke', info.color);
    }

    // Protection recommendation
    const protectionEl = section.querySelector('.text-center.text-sm');
    if (protectionEl) {
        protectionEl.textContent = info.protection;
    }

    section.classList.remove('hidden');
}
