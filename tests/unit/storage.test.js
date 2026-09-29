import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../src/js/config.js';
import { Storage } from '../../src/js/storage.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k)
  };
}

describe('Storage', () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
  });

  it('migra el récord antiguo a Kanto clásico', () => {
    localStorage.setItem(STORAGE_KEYS.LEGACY_HIGH_SCORE, '87');
    expect(Storage.getHighScore('kanto|0|classic|normal')).toBe(87);
  });

  it('guarda récords por modalidad y solo si mejoran', () => {
    expect(Storage.setHighScore('kanto|20|classic|hard', 10)).toBe(true);
    expect(Storage.setHighScore('kanto|20|classic|hard', 8)).toBe(false);
    expect(Storage.getHighScore('kanto|20|classic|hard')).toBe(10);
    expect(Storage.getHighScore('johto|20|classic|hard')).toBe(0);
  });

  it('descarta partidas guardadas corruptas o terminadas', () => {
    const session = { config: {}, queue: [1, 2], index: 1, players: [{}], skipped: 0 };
    Storage.saveGameState(session);
    expect(Storage.loadGameState()).toEqual(session);
    Storage.saveGameState({ ...session, index: 2 });
    expect(Storage.loadGameState()).toBeNull();
    Storage.saveGameState({ ...session, queue: [0, 9999] });
    expect(Storage.loadGameState()).toBeNull();
  });

  it('funciona aunque localStorage lance errores', () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      }
    };
    expect(Storage.getHighScore('x')).toBe(0);
    expect(Storage.setHighScore('x', 5)).toBe(false);
    expect(Storage.getPokedex().size).toBe(0);
    expect(() => Storage.clearGameState()).not.toThrow();
  });
});
