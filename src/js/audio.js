import { GAME_CONFIG } from './config.js';
import { formatPokemonNameForSpeech } from './utils.js';

export function createAudioSystem(getSettings) {
  const audio = {
    context: null,

    init() {
      if (this.context) return;
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_error) {
        this.context = null;
      }
    },

    canPlay() {
      return !getSettings().muted;
    },

    playTone(freq, type, duration) {
      if (!this.context || !this.canPlay()) return;
      if (this.context.state === 'suspended') this.context.resume();

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      gainNode.gain.setValueAtTime(GAME_CONFIG.soundVolume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    },

    playCorrect() {
      this.playTone(590, 'sine', 0.09);
      setTimeout(() => this.playTone(800, 'sine', 0.2), 120);
    },

    playWrong() {
      this.playTone(140, 'sawtooth', 0.22);
    },

    playPokemonCry(id) {
      if (!this.canPlay()) return;
      const cry = new Audio(`${GAME_CONFIG.api.cryUrl}${id}.ogg`);
      cry.volume = GAME_CONFIG.soundVolume;
      cry.play().catch(() => {});
    },

    speakPokemonName(name, kidMode) {
      if (!('speechSynthesis' in window) || !this.canPlay()) return;
      const utterance = new SpeechSynthesisUtterance(`Es ${formatPokemonNameForSpeech(name)}`);
      utterance.lang = 'es-ES';
      utterance.rate = kidMode ? 0.85 : GAME_CONFIG.speechRate;
      utterance.pitch = GAME_CONFIG.speechPitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  return audio;
}
