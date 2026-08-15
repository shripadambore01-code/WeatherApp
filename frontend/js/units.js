/**
 * Atmos Weather — Unit Management Module
 * Manages Celsius and Fahrenheit preferences
 */

const UNIT_KEY = 'atmos_unit';

export function initUnits() {
    const saved = localStorage.getItem(UNIT_KEY) || 'celsius';
    setUnit(saved, false);
    
    const toggle = document.getElementById('unit-toggle');
    if (toggle) {
        toggle.checked = saved === 'fahrenheit';
        toggle.addEventListener('change', (e) => {
            setUnit(e.target.checked ? 'fahrenheit' : 'celsius', true);
        });
    }
}

function setUnit(unit, triggerEvent = true) {
    localStorage.setItem(UNIT_KEY, unit);
    document.documentElement.setAttribute('data-unit', unit);
    
    const toggle = document.getElementById('unit-toggle');
    if (toggle) {
        toggle.checked = unit === 'fahrenheit';
    }

    if (triggerEvent) {
        window.dispatchEvent(new CustomEvent('unitchange', { detail: { unit } }));
    }
}

export function toggleUnits() {
    const current = getUnit();
    const next = current === 'celsius' ? 'fahrenheit' : 'celsius';
    setUnit(next, true);
}

export function getUnit() {
    return localStorage.getItem(UNIT_KEY) || 'celsius';
}
