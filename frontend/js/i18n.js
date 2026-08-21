/**
 * Atmos Weather — Multi-Language Internationalization (i18n)
 * Provides instant zero-latency client-side translation across 7 languages:
 * English (en), Hindi (hi), Marathi (mr), Spanish (es), French (fr), German (de), Japanese (ja).
 */

const LANG_KEY = 'atmos_lang';

export const DICTIONARIES = {
    en: {
        'app.name': 'Atmos',
        'app.tagline': 'AI-Powered Weather Decision Assistant',
        'search.placeholder': "Search city, or ask 'college commute', 'will it rain today', 'best time to run'...",
        'btn.ai': '✨ Ask Atmos AI',
        'btn.what_to_do': 'What Should I Do?',
        'btn.locate': 'Locate Current Position',
        'btn.custom_act': '+ Custom Builder',
        'btn.commute': '🚗 Commute Safety',
        'btn.packing': '🧳 Smart Packing',
        'btn.share': '📤 Share Weather',
        'btn.explain': 'Explain My Weather',
        'section.briefing': 'Atmos AI Briefing',
        'section.rain_intel': 'Rain Intelligence',
        'section.score': 'Atmos Weather Score',
        'section.best_time': "What Can I Do Today? (Activity Planner)",
        'section.decisions': 'Smart Decision Cards',
        'section.hourly': '24-Hour Weather Timeline',
        'section.daily': '7-Day Meteorological Outlook',
        'section.temperature': 'Weather Trends & Multi-Metric Spectrum',
        'section.sensors': 'Atmospheric Sensors & Diagnostics',
        'section.aqi': 'Air Quality Index',
        'section.uv': 'Ultraviolet Radiance',
        'section.map': 'Interactive Weather Radar Map',
        'label.best_window': 'BEST TIME TODAY',
        'label.avoid_window': 'AVOID WINDOW',
        'label.suitability': 'Activity Suitability Rating',
        'mode.student': '🎓 Student Mode',
        'mode.travel': '🚗 Travel Mode',
        'mode.fitness': '🏃 Fitness Mode',
        'mode.agriculture': '🌾 Agriculture Mode',
        'mode.photo': '📸 Outdoor & Photo',
        'act.running': 'Running',
        'act.walking': 'Walking',
        'act.cycling': 'Cycling',
        'act.sports': 'Outdoor Sports',
        'act.workout': 'Workout',
        'act.photo': 'Photography',
        'act.picnic': 'Picnic',
        'act.travel': 'Travel',
        'act.commute': 'College Commute',
        'act.study': 'Outdoor Study',
        'sensor.humidity': 'Relative Humidity',
        'sensor.wind': 'Wind & Gusts',
        'sensor.pressure': 'Surface Pressure',
        'sensor.sun': 'Sunrise & Sunset',
        'sensor.visibility': 'Visibility Range',
        'sensor.dew': 'Dew Point & Saturation'
    },
    hi: {
        'app.name': 'एटमॉस',
        'app.tagline': 'एआई मौसम निर्णय सहायक',
        'search.placeholder': "शहर खोजें, या पूछें 'कॉलेज यात्रा', 'क्या आज बारिश होगी', 'दौड़ने का समय'...",
        'btn.ai': '✨ एटमॉस एआई से पूछें',
        'btn.what_to_do': 'मुझे क्या करना चाहिए?',
        'btn.locate': 'वर्तमान स्थान खोजें',
        'btn.custom_act': '+ कस्टम बिल्डर',
        'btn.commute': '🚗 यात्रा सुरक्षा',
        'btn.packing': '🧳 स्मार्ट पैकिंग',
        'btn.share': '📤 मौसम शेयर करें',
        'btn.explain': 'मौसम का विश्लेषण समझें',
        'section.briefing': 'एटमॉस एआई ब्रीफिंग',
        'section.rain_intel': 'वर्षा इंटेलिजेंस',
        'section.score': 'एटमॉस वेदर स्कोर',
        'section.best_time': 'आज मैं क्या कर सकता हूँ? (गतिविधि योजनाकार)',
        'section.decisions': 'स्मार्ट निर्णय कार्ड',
        'section.hourly': '24-घंटे की मौसम समयरेखा',
        'section.daily': '7-दिवसीय मौसम आउटलुक',
        'section.temperature': 'मौसम रुझान और चार्ट',
        'section.sensors': 'वायुमंडलीय सेंसर और विश्लेषण',
        'section.aqi': 'वायु गुणवत्ता सूचकांक (AQI)',
        'section.uv': 'पराबैंगनी (UV) सूचकांक',
        'section.map': 'इंटरएक्टिव वेदर रडार मैप',
        'label.best_window': 'आज का सर्वश्रेष्ठ समय',
        'label.avoid_window': 'बचने का समय',
        'label.suitability': 'गतिविधि उपयुक्तता रेटिंग',
        'mode.student': '🎓 छात्र मोड',
        'mode.travel': '🚗 यात्रा मोड',
        'mode.fitness': '🏃 फिटनेस मोड',
        'mode.agriculture': '🌾 कृषि मोड',
        'mode.photo': '📸 फोटोग्राफी मोड',
        'act.running': 'दौड़ना',
        'act.walking': 'टहलना',
        'act.cycling': 'साइकिल चलाना',
        'act.sports': 'मैदानी खेल',
        'act.workout': 'व्यायाम',
        'act.photo': 'फोटोग्राफी',
        'act.picnic': 'पिकनिक',
        'act.travel': 'यात्रा',
        'act.commute': 'कॉलेज यात्रा',
        'act.study': 'बाहरी अध्ययन',
        'sensor.humidity': 'सापेक्ष आर्द्रता',
        'sensor.wind': 'हवा और झोंके',
        'sensor.pressure': 'वायुमंडलीय दबाव',
        'sensor.sun': 'सूर्योदय और सूर्यास्त',
        'sensor.visibility': 'दृश्यता सीमा',
        'sensor.dew': 'ओस बिंदु'
    },
    mr: {
        'app.name': 'एटमॉस',
        'app.tagline': 'एआय हवामान निर्णय सहाय्यक',
        'search.placeholder': "शहर शोधा, किंवा विचारा 'कॉलेज प्रवास', 'आज पाऊस पडेल का', 'धावण्याची वेळ'...",
        'btn.ai': '✨ एटमॉस एआय ला विचारा',
        'btn.what_to_do': 'मी काय करावे?',
        'btn.locate': 'सध्याचे स्थान शोधा',
        'btn.custom_act': '+ सानुकूल बिल्डर',
        'btn.commute': '🚗 प्रवास सुरक्षा',
        'btn.packing': '🧳 स्मार्ट पॅकिंग',
        'btn.share': '📤 हवामान शेअर करा',
        'btn.explain': 'हवामानाचे विश्लेषण स्पष्ट करा',
        'section.briefing': 'एटमॉस एआय ब्रीफिंग',
        'section.rain_intel': 'पाऊस इंटेलिजेंस',
        'section.score': 'एटमॉस हवामान स्कोअर',
        'section.best_time': 'आज मी काय करू शकतो? (क्रियाकलाप नियोजक)',
        'section.decisions': 'स्मार्ट निर्णय कार्ड',
        'section.hourly': '24-तासांची हवामान टाइमलाइन',
        'section.daily': '7-दिवसांचा हवामान अंदाज',
        'section.temperature': 'हवामान ट्रेंड आणि चार्ट',
        'section.sensors': 'हवामान सेन्सर्स आणि विश्लेषण',
        'section.aqi': 'हवा गुणवत्ता निर्देशांक (AQI)',
        'section.uv': 'अतिनील (UV) किरणोत्सर्ग',
        'section.map': 'परस्परसंवादी हवामान रडार नकाशा',
        'label.best_window': 'आजची सर्वोत्तम वेळ',
        'label.avoid_window': 'टाळण्याची वेळ',
        'label.suitability': 'क्रियाकलाप योग्यता रेटिंग',
        'mode.student': '🎓 विद्यार्थी मोड',
        'mode.travel': '🚗 प्रवास मोड',
        'mode.fitness': '🏃 फिटनेस मोड',
        'mode.agriculture': '🌾 शेती मोड',
        'mode.photo': '📸 फोटोग्राफी मोड',
        'act.running': 'धावणे',
        'act.walking': 'चालणे',
        'act.cycling': 'सायकल चालवणे',
        'act.sports': 'मैदानी खेळ',
        'act.workout': 'व्यायाम',
        'act.photo': 'छायाचित्रण',
        'act.picnic': 'पिकनिक',
        'act.travel': 'प्रवास',
        'act.commute': 'कॉलेज प्रवास',
        'act.study': 'अभ्यास',
        'sensor.humidity': 'सापेक्ष आर्द्रता',
        'sensor.wind': 'वारा आणि झोके',
        'sensor.pressure': 'हवेचा दाब',
        'sensor.sun': 'सूर्योदय आणि सूर्यास्त',
        'sensor.visibility': 'दृश्यमानता',
        'sensor.dew': 'दव बिंदू'
    },
    es: {
        'app.name': 'Atmos',
        'app.tagline': 'Asistente de Decisión Meteorológica con IA',
        'search.placeholder': "Buscar ciudad o preguntar '¿lloverá hoy?', 'viaje a la universidad'...",
        'btn.ai': '✨ Preguntar a Atmos AI',
        'btn.what_to_do': '¿Qué debo hacer?',
        'btn.locate': 'Ubicación actual',
        'btn.custom_act': '+ Creador personalizado',
        'btn.commute': '🚗 Seguridad de viaje',
        'btn.packing': '🧳 Equipaje inteligente',
        'btn.share': '📤 Compartir clima',
        'btn.explain': 'Explicar mi clima',
        'section.briefing': 'Resumen de Atmos AI',
        'section.rain_intel': 'Inteligencia de Lluvia',
        'section.score': 'Puntuación Atmosférica',
        'section.best_time': '¿Qué puedo hacer hoy? (Planificador)',
        'section.decisions': 'Tarjetas de Decisión Inteligente',
        'section.hourly': 'Línea de tiempo de 24 horas',
        'section.daily': 'Pronóstico meteorológico de 7 días',
        'section.temperature': 'Tendencias meteorológicas',
        'section.sensors': 'Sensores atmosféricos',
        'section.aqi': 'Índice de Calidad del Aire (AQI)',
        'section.uv': 'Radiación Ultravioleta',
        'section.map': 'Mapa de Radar Meteorológico',
        'label.best_window': 'MEJOR HORA HOY',
        'label.avoid_window': 'HORA A EVITAR',
        'label.suitability': 'Calificación de idoneidad',
        'mode.student': '🎓 Modo Estudiante',
        'mode.travel': '🚗 Modo Viaje',
        'mode.fitness': '🏃 Modo Fitness',
        'mode.agriculture': '🌾 Modo Agricultura',
        'mode.photo': '📸 Fotografía y Aire Libre',
        'act.running': 'Correr',
        'act.walking': 'Caminar',
        'act.cycling': 'Ciclismo',
        'act.sports': 'Deportes al aire libre',
        'act.workout': 'Entrenamiento',
        'act.photo': 'Fotografía',
        'act.picnic': 'Picnic',
        'act.travel': 'Viajar',
        'act.commute': 'Viaje a la universidad',
        'act.study': 'Estudio al aire libre',
        'sensor.humidity': 'Humedad relativa',
        'sensor.wind': 'Viento y ráfagas',
        'sensor.pressure': 'Presión superficial',
        'sensor.sun': 'Amanecer y atardecer',
        'sensor.visibility': 'Visibilidad',
        'sensor.dew': 'Punto de rocío'
    }
};

let currentLanguage = 'en';

export async function initI18n() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && (DICTIONARIES[saved] || saved === 'hi' || saved === 'mr' || saved === 'es')) {
        currentLanguage = saved;
    } else {
        const browserLang = navigator.language.slice(0, 2);
        if (DICTIONARIES[browserLang]) currentLanguage = browserLang;
    }

    const select = document.getElementById('language-select');
    if (select) {
        select.value = currentLanguage;
        select.addEventListener('change', (e) => setLanguage(e.target.value));
    }

    applyTranslations();
}

export function setLanguage(lang) {
    if (!DICTIONARIES[lang]) return;
    currentLanguage = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations();
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

export function t(key) {
    return DICTIONARIES[currentLanguage]?.[key] || DICTIONARIES['en']?.[key] || key;
}

export function getLanguage() {
    return currentLanguage;
}

export function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        }
    });
}
