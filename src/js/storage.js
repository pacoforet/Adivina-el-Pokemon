import { STORAGE_KEYS } from './config.js';
import { resolveSettings } from './utils.js';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Almacenamiento no disponible (modo privado); no hay nada que borrar.
  }
}

function isValidSession(session) {
  return (
    session &&
    Array.isArray(session.queue) &&
    session.queue.length > 0 &&
    session.queue.every((id) => Number.isInteger(id) && id >= 1 && id <= 1025) &&
    Number.isInteger(session.index) &&
    session.index >= 0 &&
    session.index < session.queue.length &&
    Array.isArray(session.players) &&
    session.players.length >= 1 &&
    session.players.length <= 2 &&
    session.config
  );
}

export const Storage = {
  getHighScores() {
    const scores = read(STORAGE_KEYS.HIGH_SCORES, null);
    if (scores) return scores;
    const legacy = Number(read(STORAGE_KEYS.LEGACY_HIGH_SCORE, 0));
    return legacy > 0 ? { 'kanto|0|classic|normal': legacy } : {};
  },

  getHighScore(key) {
    return Number(this.getHighScores()[key]) || 0;
  },

  setHighScore(key, score) {
    const scores = this.getHighScores();
    if (score <= (scores[key] || 0)) return false;
    return write(STORAGE_KEYS.HIGH_SCORES, { ...scores, [key]: score });
  },

  getSettings() {
    return resolveSettings(read(STORAGE_KEYS.SETTINGS, {}));
  },

  saveSettings(settings) {
    return write(STORAGE_KEYS.SETTINGS, settings);
  },

  loadGameState() {
    const session = read(STORAGE_KEYS.GAME_STATE, null);
    return isValidSession(session) ? session : null;
  },

  saveGameState(session) {
    return write(STORAGE_KEYS.GAME_STATE, session);
  },

  clearGameState() {
    remove(STORAGE_KEYS.GAME_STATE);
    remove(STORAGE_KEYS.LEGACY_GAME_STATE);
  },

  getAchievements() {
    const items = read(STORAGE_KEYS.ACHIEVEMENTS, []);
    return Array.isArray(items) ? items : [];
  },

  saveAchievements(items) {
    return write(STORAGE_KEYS.ACHIEVEMENTS, items);
  },

  getPokedex() {
    const ids = read(STORAGE_KEYS.POKEDEX, []);
    return new Set(Array.isArray(ids) ? ids : []);
  },

  savePokedex(set) {
    return write(STORAGE_KEYS.POKEDEX, [...set]);
  },

  getMisses() {
    const misses = read(STORAGE_KEYS.MISSES, {});
    return misses && typeof misses === 'object' ? misses : {};
  },

  saveMisses(misses) {
    return write(STORAGE_KEYS.MISSES, misses);
  }
};
