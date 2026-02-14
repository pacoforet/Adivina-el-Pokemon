import { describe, expect, it } from 'vitest';
import {
  buildRoundOptions,
  evaluateAchievements,
  optionsPerQuestion,
  roundTime,
  shuffleArray
} from '../../src/js/utils.js';

const pool = [
  { id: 1, name: 'PIKACHU' },
  { id: 2, name: 'BULBASAUR' },
  { id: 3, name: 'MEW' },
  { id: 4, name: 'EEVEE' },
  { id: 5, name: 'MEWTWO' }
];

describe('utils', () => {
  it('shuffleArray conserva longitud y miembros', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffleArray(input);
    expect(output).toHaveLength(input.length);
    expect([...output].sort()).toEqual([...input].sort());
  });

  it('buildRoundOptions incluye respuesta correcta y sin duplicados', () => {
    const correct = pool[0];
    const options = buildRoundOptions(pool, correct, 4);
    expect(options).toHaveLength(4);
    expect(options).toContain(correct.name);
    expect(new Set(options).size).toBe(4);
  });

  it('resuelve dificultad y modo kid', () => {
    expect(optionsPerQuestion({ difficulty: 'hard', kidMode: true })).toBe(3);
    expect(optionsPerQuestion({ difficulty: 'hard', kidMode: false })).toBe(5);
    expect(roundTime({ difficulty: 'easy', kidMode: true })).toBe(25);
  });

  it('desbloquea logros segun estado', () => {
    const state = {
      streak: 5,
      score: 60,
      failed: 0,
      currentPokemonIndex: 5,
      shuffledPokemon: [1, 2, 3, 4, 5]
    };
    const { nextUnlocked, gained } = evaluateAchievements(state, []);
    expect(nextUnlocked).toContain('streak_5');
    expect(nextUnlocked).toContain('score_50');
    expect(gained.length).toBe(2);
  });
});
