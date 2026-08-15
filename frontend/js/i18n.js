/**
 * Atmos Weather — Multi-Language Internationalization (i18n)
 * Provides instant zero-latency client-side translation across 6 languages:
 * English (en), Hindi (hi), Spanish (es), French (fr), German (de), Japanese (ja).
 */

const LANG_KEY = 'atmos_lang';

export const DICTIONARIES = {
    en: {
        'app.name': 'Atmos',
        'app.tagline': 'Personal Weather Intelligence',
        'search.placeholder': "Search city, or ask 'best time to run', 'compare Paris and London'...",
        'btn.ai': '✨ Ask Atmos AI',
        'btn.what_to_do': 'What Should I Do?',
        'btn.locate': 'Locate Current Position',
        'btn.custom_act': '+ Custom Builder',
        'btn.commute': '🚗 Commute Safety',
        'btn.packing': '🧳 Smart Packing',
        'section.score': 'Universal Comfort Score 2.0',
        'section.best_time': 'Best Time Today & Activity Engine',
        'section.decisions': 'Smart Decision Cards',
        'section.hourly': '24-Hour Hourly Progression',
        'section.daily': '7-Day Meteorological Outlook',
        'section.temperature': 'Thermal Rhythm & Humidity Spectrum',
        'section.sensors': 'Atmospheric Sensors & Diagnostics',
        'section.aqi': 'Air Quality Index',
        'section.uv': 'Ultraviolet Radiance',
        'section.specialized': 'Specialized Intelligence Modes',
        'section.stargazing': 'Stargazing Clarity',
        'section.photo': 'Golden & Blue Hour Photography',
        'label.best_window': 'BEST TIME TODAY',
        'label.avoid_window': 'AVOID WINDOW',
        'label.suitability': '24-Hour Activity Suitability Curve',
        'profile.general': 'General',
        'profile.running': 'Running',
        'profile.cycling': 'Cycling',
        'profile.beach': 'Beach',
        'profile.photo': 'Photo',
        'profile.stargazing': 'Stargazing',
        'act.running': 'Running',
        'act.walking': 'Walking',
        'act.cycling': 'Cycling',
        'act.workout': 'Workout',
        'act.photo': 'Photo',
        'act.picnic': 'Picnic',
        'act.beach': 'Beach',
        'act.hiking': 'Hiking',
        'act.stargazing': 'Stargazing',
        'act.study': 'Outdoor Study',
        'act.commute': 'Commuting',
        'sensor.humidity': 'Relative Humidity',
        'sensor.wind': 'Wind & Gusts',
        'sensor.pressure': 'Surface Pressure',
        'sensor.sun': 'Sunrise & Sunset',
        'sensor.visibility': 'Visibility Range',
        'sensor.dew': 'Dew Point & Saturation'
    },
    hi: {
        'app.name': 'एटमॉस',
        'app.tagline': 'पर्सनल मौसम इंटेलिजेंस',
        'search.placeholder': "शहर खोजें, या पूछें 'दौड़ने का सबसे अच्छा समय', 'मौसम कैसा रहेगा'...",
        'btn.ai': '✨ एटमॉस एआई से पूछें',
        'btn.what_to_do': 'मुझे क्या करना चाहिए?',
        'btn.locate': 'वर्तमान स्थान खोजें',
        'btn.custom_act': '+ कस्टम बिल्डर',
        'btn.commute': '🚗 यात्रा सुरक्षा',
        'btn.packing': '🧳 स्मार्ट पैकिंग',
        'section.score': 'यूनिवर्सल वेदर स्कोर 2.0',
        'section.best_time': 'आज का सर्वश्रेष्ठ समय और गतिविधि इंजन',
        'section.decisions': 'स्मार्ट निर्णय कार्ड',
        'section.hourly': '24-घंटे का प्रति घंटा पूर्वानुमान',
        'section.daily': '7-दिवसीय मौसम आउटलुक',
        'section.temperature': 'तापमान और आर्द्रता ग्राफ',
        'section.sensors': 'वायुमंडलीय सेंसर और विश्लेषण',
        'section.aqi': 'वायु गुणवत्ता सूचकांक (AQI)',
        'section.uv': 'पराबैंगनी (UV) सूचकांक',
        'section.specialized': 'विशेषज्ञ इंटेलिजेंस मोड',
        'section.stargazing': 'तारे देखने की स्पष्टता',
        'section.photo': 'गोल्डन और ब्लू ऑवर फोटोग्राफी',
        'label.best_window': 'आज का सर्वश्रेष्ठ समय',
        'label.avoid_window': 'बचने का समय',
        'label.suitability': '24-घंटे गतिविधि उपयुक्तता वक्र',
        'profile.general': 'सामान्य',
        'profile.running': 'दौड़ना',
        'profile.cycling': 'साइकिल चलाना',
        'profile.beach': 'समुद्र तट',
        'profile.photo': 'फोटो',
        'profile.stargazing': 'तारे देखना',
        'act.running': 'दौड़ना',
        'act.walking': 'टहलना',
        'act.cycling': 'साइकिल',
        'act.workout': 'व्यायाम',
        'act.photo': 'फोटोग्राफी',
        'act.picnic': 'पिकनिक',
        'act.beach': 'समुद्र तट',
        'act.hiking': 'हाइकिंग',
        'act.stargazing': 'तारे देखना',
        'act.study': 'बाहरी अध्ययन',
        'act.commute': 'यात्रा',
        'sensor.humidity': 'सापेक्ष आर्द्रता',
        'sensor.wind': 'हवा और झोंके',
        'sensor.pressure': 'वायुमंडलीय दबाव',
        'sensor.sun': 'सूर्योदय और सूर्यास्त',
        'sensor.visibility': 'दृश्यता सीमा',
        'sensor.dew': 'ओस बिंदु'
    },
    es: {
        'app.name': 'Atmos',
        'app.tagline': 'Inteligencia Meteorológica Personal',
        'search.placeholder': "Buscar ciudad, o preguntar 'mejor hora para correr'...",
        'btn.ai': '✨ Preguntar a Atmos AI',
        'btn.what_to_do': '¿Qué debo hacer?',
        'btn.locate': 'Ubicación Actual',
        'btn.custom_act': '+ Creador Personalizado',
        'btn.commute': '🚗 Seguridad de Viaje',
        'btn.packing': '🧳 Equipaje Inteligente',
        'section.score': 'Puntuación de Confort Universal 2.0',
        'section.best_time': 'Mejor Momento Hoy y Actividades',
        'section.decisions': 'Tarjetas de Decisión Inteligente',
        'section.hourly': 'Progresión Horaria de 24 Horas',
        'section.daily': 'Pronóstico Meteorológico de 7 Días',
        'section.temperature': 'Ritmo Térmico y Espectro de Humedad',
        'section.sensors': 'Sensores Atmosféricos y Diagnóstico',
        'section.aqi': 'Índice de Calidad del Aire',
        'section.uv': 'Índice de Radiación UV',
        'section.specialized': 'Modos de Inteligencia Especializados',
        'section.stargazing': 'Claridad para Observar Estrellas',
        'section.photo': 'Fotografía Hora Dorada y Azul',
        'label.best_window': 'MEJOR HORA HOY',
        'label.avoid_window': 'HORA A EVITAR',
        'label.suitability': 'Curva de Idoneidad de Actividad (24h)',
        'profile.general': 'General',
        'profile.running': 'Correr',
        'profile.cycling': 'Ciclismo',
        'profile.beach': 'Playa',
        'profile.photo': 'Foto',
        'profile.stargazing': 'Astronomía',
        'act.running': 'Correr',
        'act.walking': 'Caminar',
        'act.cycling': 'Ciclismo',
        'act.workout': 'Entrenamiento',
        'act.photo': 'Fotografía',
        'act.picnic': 'Pícnic',
        'act.beach': 'Playa',
        'act.hiking': 'Senderismo',
        'act.stargazing': 'Astronomía',
        'act.study': 'Estudio Exterior',
        'act.commute': 'Viaje Diario',
        'sensor.humidity': 'Humedad Relativa',
        'sensor.wind': 'Viento y Ráfagas',
        'sensor.pressure': 'Presión Superficial',
        'sensor.sun': 'Amanecer y Atardecer',
        'sensor.visibility': 'Rango de Visibilidad',
        'sensor.dew': 'Punto de Rocío'
    },
    fr: {
        'app.name': 'Atmos',
        'app.tagline': 'Intelligence Météorologique Personnelle',
        'search.placeholder': "Rechercher une ville, ou demander 'meilleure heure pour courir'...",
        'btn.ai': '✨ Demander à Atmos AI',
        'btn.what_to_do': 'Que dois-je faire ?',
        'btn.locate': 'Position Actuelle',
        'btn.custom_act': '+ Créateur Personnalisé',
        'btn.commute': '🚗 Sécurité Trajet',
        'btn.packing': '🧳 Valise Intelligente',
        'section.score': 'Score de Confort Universel 2.0',
        'section.best_time': 'Meilleur Moment Aujourd’hui & Activités',
        'section.decisions': 'Cartes de Décision Intelligente',
        'section.hourly': 'Progression Heure par Heure (24h)',
        'section.daily': 'Perspectives Météo sur 7 Jours',
        'section.temperature': 'Rythme Thermique & Spectre d’Humidité',
        'section.sensors': 'Capteurs et Diagnostics Atmosphériques',
        'section.aqi': 'Indice de Qualité de l’Air (AQI)',
        'section.uv': 'Rayonnement Ultraviolet (UV)',
        'section.specialized': 'Modes d’Intelligence Spécialisés',
        'section.stargazing': 'Clarté pour l’Astronomie',
        'section.photo': 'Photographie Heure Dorée & Bleue',
        'label.best_window': 'MEILLEUR CRÉNEAU DU JOUR',
        'label.avoid_window': 'CRÉNEAU À ÉVITER',
        'label.suitability': 'Courbe d’Aptitude d’Activité (24h)',
        'profile.general': 'Général',
        'profile.running': 'Course',
        'profile.cycling': 'Vélo',
        'profile.beach': 'Plage',
        'profile.photo': 'Photo',
        'profile.stargazing': 'Astronomie',
        'act.running': 'Course',
        'act.walking': 'Marche',
        'act.cycling': 'Cyclisme',
        'act.workout': 'Entraînement',
        'act.photo': 'Photo',
        'act.picnic': 'Pique-nique',
        'act.beach': 'Plage',
        'act.hiking': 'Randonnée',
        'act.stargazing': 'Étoiles',
        'act.study': 'Étude Dehors',
        'act.commute': 'Trajet',
        'sensor.humidity': 'Humidité Relative',
        'sensor.wind': 'Vent & Rafales',
        'sensor.pressure': 'Pression Atmosphérique',
        'sensor.sun': 'Lever & Coucher de Soleil',
        'sensor.visibility': 'Visibilité',
        'sensor.dew': 'Point de Rosée'
    },
    de: {
        'app.name': 'Atmos',
        'app.tagline': 'Persönliche Wetter-Intelligenz',
        'search.placeholder': "Stadt suchen oder 'beste Zeit zum Laufen' fragen...",
        'btn.ai': '✨ Atmos AI fragen',
        'btn.what_to_do': 'Was soll ich tun?',
        'btn.locate': 'Standort orten',
        'btn.custom_act': '+ Eigene Aktivität',
        'btn.commute': '🚗 Pendler-Sicherheit',
        'btn.packing': '🧳 Intelligentes Packen',
        'section.score': 'Universal-Komfortwert 2.0',
        'section.best_time': 'Beste Zeit heute & Aktivitäts-Engine',
        'section.decisions': 'Smarte Entscheidungs-Karten',
        'section.hourly': '24-Stunden Stündlicher Verlauf',
        'section.daily': '7-Tage Wetter-Ausblick',
        'section.temperature': 'Temperaturkurve & Luftfeuchtigkeit',
        'section.sensors': 'Atmosphärische Sensoren & Diagnose',
        'section.aqi': 'Luftqualitätsindex (AQI)',
        'section.uv': 'UV-Strahlung',
        'section.specialized': 'Spezialisierte Intelligenz-Modi',
        'section.stargazing': 'Sternenbeobachtung',
        'section.photo': 'Goldene & Blaue Stunde Foto',
        'label.best_window': 'BESTE ZEIT HEUTE',
        'label.avoid_window': 'ZEITFENSTER VERMEIDEN',
        'label.suitability': '24h Aktivitäts-Eignungskurve',
        'profile.general': 'Allgemein',
        'profile.running': 'Laufen',
        'profile.cycling': 'Radfahren',
        'profile.beach': 'Strand',
        'profile.photo': 'Foto',
        'profile.stargazing': 'Sterne',
        'act.running': 'Laufen',
        'act.walking': 'Spazieren',
        'act.cycling': 'Radfahren',
        'act.workout': 'Workout',
        'act.photo': 'Fotografie',
        'act.picnic': 'Picknick',
        'act.beach': 'Strand',
        'act.hiking': 'Wandern',
        'act.stargazing': 'Sterne',
        'act.study': 'Lernen im Freien',
        'act.commute': 'Pendeln',
        'sensor.humidity': 'Relative Luftfeuchtigkeit',
        'sensor.wind': 'Wind & Böen',
        'sensor.pressure': 'Luftdruck',
        'sensor.sun': 'Sonnenauf- & Untergang',
        'sensor.visibility': 'Sichtweite',
        'sensor.dew': 'Taupunkt'
    },
    ja: {
        'app.name': 'Atmos',
        'app.tagline': 'パーソナル気象インテリジェンス',
        'search.placeholder': "都市を検索、または「ランニングに最適な時間」と質問...",
        'btn.ai': '✨ Atmos AIに質問',
        'btn.what_to_do': 'どう行動すべき？',
        'btn.locate': '現在地を取得',
        'btn.custom_act': '+ カスタム作成',
        'btn.commute': '🚗 通勤・移動の安全性',
        'btn.packing': '🧳 スマート持ち物リスト',
        'section.score': 'ユニバーサル気象スコア 2.0',
        'section.best_time': '本日の最適時間帯とアクティビティ',
        'section.decisions': 'スマート意思決定カード',
        'section.hourly': '24時間 毎時推移',
        'section.daily': '7日間 気象見通し',
        'section.temperature': '気温リズム＆湿度スペクトラム',
        'section.sensors': '大気センサーと詳細診断',
        'section.aqi': '空気質指数 (AQI)',
        'section.uv': '紫外線指数 (UV)',
        'section.specialized': '専門インテリジェンスモード',
        'section.stargazing': '天体観測・星空の透明度',
        'section.photo': 'マジックアワー撮影条件',
        'label.best_window': '本日最もおすすめの時間',
        'label.avoid_window': '避けるべき時間',
        'label.suitability': '24時間アクティビティ適合度曲線',
        'profile.general': '総合',
        'profile.running': 'ランニング',
        'profile.cycling': 'サイクリング',
        'profile.beach': 'ビーチ',
        'profile.photo': '写真撮影',
        'profile.stargazing': '星空観測',
        'act.running': 'ランニング',
        'act.walking': 'ウォーキング',
        'act.cycling': 'サイクリング',
        'act.workout': '筋トレ',
        'act.photo': '写真撮影',
        'act.picnic': 'ピクニック',
        'act.beach': 'ビーチ',
        'act.hiking': 'ハイキング',
        'act.stargazing': '星空観測',
        'act.study': '屋外学習',
        'act.commute': '通勤・移動',
        'sensor.humidity': '相対湿度',
        'sensor.wind': '風速と突風',
        'sensor.pressure': '気圧',
        'sensor.sun': '日の出・日の入り',
        'sensor.visibility': '視程',
        'sensor.dew': '露点温度'
    }
};

let currentLang = 'en';

export async function initI18n() {
    const saved = localStorage.getItem(LANG_KEY);
    const browserLang = navigator.language.split('-')[0];
    const supported = Object.keys(DICTIONARIES);

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

    setLanguage(initial);
}

export function setLanguage(lang) {
    currentLang = DICTIONARIES[lang] ? lang : 'en';
    localStorage.setItem(LANG_KEY, currentLang);
    document.documentElement.lang = currentLang;

    updateDOM();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
}

function updateDOM() {
    const dict = DICTIONARIES[currentLang] || DICTIONARIES.en;
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = dict[key] || DICTIONARIES.en[key];
        if (translated) {
            if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        }
    });
}

export function t(key) {
    const dict = DICTIONARIES[currentLang] || DICTIONARIES.en;
    return dict[key] || DICTIONARIES.en[key] || key;
}

export function getLanguage() {
    return currentLang;
}
