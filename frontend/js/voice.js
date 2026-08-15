import { getLanguage } from './i18n.js';
import { showToast } from './utils.js';

let recognition = null;
let isListening = false;

export function initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('voice-btn');
    
    if (!SpeechRecognition) {
        if (btn) btn.style.display = 'none';
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    if (btn) {
        btn.addEventListener('click', () => {
            if (isListening) stopListening();
            else startListening();
        });
    }
    
    recognition.onstart = () => {
        isListening = true;
        if (btn) btn.classList.add('pulse-anim');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('search-input');
        if (input) {
            input.value = transcript;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        stopListening();
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        showToast('Voice search failed. Please try again.', 'warning');
        stopListening();
    };
    
    recognition.onend = () => {
        stopListening();
    };
}

export function startListening() {
    if (!recognition) return;
    try {
        recognition.lang = getLanguage() || 'en-US';
        recognition.start();
    } catch (e) {
        console.error(e);
    }
}

export function stopListening() {
    if (!recognition) return;
    isListening = false;
    const btn = document.getElementById('voice-btn');
    if (btn) btn.classList.remove('pulse-anim');
    recognition.stop();
}
