import { STORAGE_KEYS } from './config.js';
import { resolveSettings } from './utils.js';

function getParsed(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function setParsed(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_error) {
    return false;
  }
}

export const Storage = {
  getHighScore() {
    const score = Number(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || 0);
    return Number.isNaN(score) ? 0 : score;
  },

  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      try {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(score));
        return true;
      } catch (_error) {
        return false;
      }
    }
    return false;
  },

  getSettings() {
    return resolveSettings(getParsed(STORAGE_KEYS.SETTINGS, {}));
  },

  saveSettings(settings) {
    return setParsed(STORAGE_KEYS.SETTINGS, settings);
  },

  loadGameState() {
    return getParsed(STORAGE_KEYS.GAME_STATE, null);
  },

  saveGameState(gameState) {
    return setParsed(STORAGE_KEYS.GAME_STATE, {
      shuffledPokemon: gameState.shuffledPokemon,
      currentPokemonIndex: gameState.currentPokemonIndex,
      score: gameState.score,
      failed: gameState.failed,
      streak: gameState.streak,
      unlockedAchievements: gameState.unlockedAchievements,
      hintsAvailable: gameState.hintsAvailable
    });
  },

  clearGameState() {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    } catch (_error) {
      return false;
    }
    return true;
  },

  getAchievements() {
    return getParsed(STORAGE_KEYS.ACHIEVEMENTS, []);
  },

  saveAchievements(items) {
    return setParsed(STORAGE_KEYS.ACHIEVEMENTS, items);
  }
};
