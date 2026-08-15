import { updateChartsTheme } from './charts.js';

const THEME_KEY = 'atmos_theme';

export function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    let initial = 'light';
    
    if (saved) {
        initial = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initial = 'dark';
    }
    
    setTheme(initial, false);
    
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
    
    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme, animate = true) {
    if (animate) document.documentElement.classList.add('theme-transitioning');
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update meta tag for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#121212' : '#ffffff');
    }
    
    updateChartsTheme(theme === 'dark');
    
    if (animate) {
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 300);
    }
}

export function toggleTheme() {
    const current = getTheme();
    setTheme(current === 'light' ? 'dark' : 'light');
}

export function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}
