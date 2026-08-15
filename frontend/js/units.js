/**
 * Atmos Weather — Unit Management Module
 * Manages Celsius and Fahrenheit preferences
 */

const UNIT_KEY = 'atmos_unit';

export function initUnits() {
    const saved = localStorage.getItem(UNIT_KEY) || 'celsius';
    setUnit(saved, false);
    
    const switchBtn = document.getElementById('unit-switch-btn');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            toggleUnits();
        });
    }
}

function setUnit(unit, triggerEvent = true) {
    localStorage.setItem(UNIT_KEY, unit);
    document.documentElement.setAttribute('data-unit', unit);
    
    const optC = document.getElementById('opt-c');
    const optF = document.getElementById('opt-f');
    const toggle = document.getElementById('unit-toggle');
    
    if (optC && optF) {
        if (unit === 'fahrenheit') {
            optC.classList.remove('selected');
            optF.classList.add('selected');
        } else {
            optC.classList.add('selected');
            optF.classList.remove('selected');
        }
    }
    
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
