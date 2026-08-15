const LANG_KEY = 'atmos_lang';
let currentDict = {};

export async function initI18n() {
    const saved = localStorage.getItem(LANG_KEY);
    const browserLang = navigator.language.split('-')[0];
    const supported = ['en', 'es', 'fr', 'de', 'hi', 'ja'];
    
    let initial = 'en';
    if (saved && supported.includes(saved)) {
        initial = saved;
    } else if (supported.includes(browserLang)) {
        initial = browserLang;
    }
    
    const select = document.getElementById('language-select');
    if (select) {
        select.value = initial;
        select.addEventListener('change', (e) => setLanguage(e.target.value));
    }
    
    await setLanguage(initial);
}

export async function setLanguage(lang) {
    try {
        const res = await fetch(`/locales/${lang}.json`);
        if (!res.ok) throw new Error('Locale not found');
        
        currentDict = await res.json();
        localStorage.setItem(LANG_KEY, lang);
        document.documentElement.lang = lang;
        
        updateDOM();
    } catch (err) {
        console.error('Failed to load language', err);
    }
}

function updateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        }
    });
}

export function t(key) {
    return key.split('.').reduce((obj, k) => (obj || {})[k], currentDict) || key;
}

export function getLanguage() {
    return document.documentElement.lang || 'en';
}
