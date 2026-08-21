/**
 * Atmos Weather — UV Index Display
 * Renders live UV index with dynamic SVG dial arc, risk category, and protection advice.
 */

import { getUVInfo, clamp } from './utils.js';

/**
 * Update the UV index section with real-time solar UV telemetry
 * @param {number} uvIndex - Maximum UV index value
 */
export function updateUV(uvIndex) {
    const section = document.getElementById('uv-section');
    if (!section) return;

    const val = typeof uvIndex === 'number' ? uvIndex : 4.0;
    const info = getUVInfo(val);

    // 1. UV Numerical Score
    const scoreEl = document.getElementById('uv-value') || document.getElementById('uv-score');
    if (scoreEl) {
        scoreEl.textContent = val.toFixed(1);
    }

    // 2. UV Status Badge / Label
    const labelEl = document.getElementById('uv-label') || document.getElementById('uv-status');
    if (labelEl) {
        labelEl.textContent = info.label.toUpperCase();
        labelEl.style.color = info.color;
    }

    // 3. SVG Dial Arc fill calculation
    // Full arc from (15, 60) to (105, 60) with radius 45 has perimeter = π * 45 ≈ 141.37
    const arcFill = document.getElementById('uv-gauge-fill') || document.getElementById('uv-path');
    if (arcFill) {
        const arcLength = 141.37;
        const maxUV = 12;
        const ratio = clamp(val / maxUV, 0.05, 1);
        const dashOffset = arcLength * (1 - ratio);

        arcFill.setAttribute('d', 'M 15 60 A 45 45 0 0 1 105 60');
        arcFill.setAttribute('stroke-dasharray', arcLength.toFixed(2));
        arcFill.setAttribute('stroke-dashoffset', dashOffset.toFixed(2));
        arcFill.setAttribute('stroke', info.color);
    }

    section.classList.remove('hidden');
}
