import { GAME_CONFIG } from './config.js';
import { formatPokemonNameForSpeech } from './utils.js';

export function createAudioSystem(getSettings) {
  let context = null;
  let currentCry = null;

  function canPlay() {
    return !getSettings().muted;
  }

  function playTone(freq, type, duration) {
    if (!context || !canPlay()) return;
    if (context.state === 'suspended') context.resume();

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(GAME_CONFIG.soundVolume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  }

  function speakName(name) {
    if (!('speechSynthesis' in window) || !canPlay()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Es ${formatPokemonNameForSpeech(name)}`);
    utterance.lang = 'es-ES';
    utterance.rate = GAME_CONFIG.speechRate;
    utterance.pitch = GAME_CONFIG.speechPitch;
    window.speechSynthesis.speak(utterance);
  }

  function stopCry() {
    if (!currentCry) return;
    currentCry.onended = null;
    currentCry.onerror = null;
    currentCry.pause();
    currentCry = null;
  }

  return {
    canPlayCries: (() => {
      try {
        return new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';
      } catch {
        return false;
      }
    })(),

    init() {
      if (context) return;
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        context = null;
      }
    },

    playCorrect() {
      playTone(590, 'sine', 0.09);
      setTimeout(() => playTone(800, 'sine', 0.2), 120);
    },

    playWrong() {
      playTone(140, 'sawtooth', 0.22);
    },

    playCry(id, { onError, onEnded } = {}) {
      stopCry();
      if (!canPlay() || !this.canPlayCries) {
        onError?.();
        return;
      }
      const cry = new Audio();
      cry.crossOrigin = 'anonymous';
      cry.volume = GAME_CONFIG.soundVolume;
      cry.onerror = () => onError?.();
      cry.onended = () => onEnded?.();
      cry.src = `${GAME_CONFIG.api.cryUrl}${id}.ogg`;
      currentCry = cry;
      cry.play().catch(() => {});
    },

    announce(id, name) {
      let spoken = false;
      const speak = () => {
        if (spoken) return;
        spoken = true;
        speakName(name);
      };
      this.playCry(id, { onError: speak, onEnded: speak });
      setTimeout(speak, 1500);
    },

    stop() {
      stopCry();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };
}
