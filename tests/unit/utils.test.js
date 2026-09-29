import { describe, expect, it } from 'vitest';
import { REGIONS } from '../../src/js/config.js';
import { POKEMON, getPokemon, poolForRegion } from '../../src/js/pokemon.js';
import {
  applyHit,
  applyMiss,
  buildQueue,
  buildRoundOptions,
  createPlayer,
  evaluateAchievements,
  formatPokemonNameForSpeech,
  getCongratulationsMessage,
  isNameMatch,
  resolveSettings,
  roundTimeMs,
  shuffleArray,
  winnerMessage
} from '../../src/js/utils.js';

const byName = (name) => POKEMON.find((p) => p.name === name);

describe('datos', () => {
  it('incluye los 1025 Pokémon con nombres únicos, Mew incluido', () => {
    expect(POKEMON).toHaveLength(1025);
    expect(new Set(POKEMON.map((p) => p.name)).size).toBe(1025);
    expect(getPokemon(151).name).toBe('MEW');
    expect(getPokemon(1025).name).toBe('PECHARUNT');
  });

  it('las regiones principales cubren todas las generaciones sin huecos', () => {
    const main = REGIONS.filter((r) => !['first300', 'all'].includes(r.id));
    main.forEach((region, i) => {
      if (i > 0) expect(region.from).toBe(main[i - 1].to + 1);
      expect(poolForRegion(region.id).every((p) => p.gen === i + 1)).toBe(true);
    });
    expect(poolForRegion('first300')).toHaveLength(300);
    expect(poolForRegion('kanto')).toHaveLength(151);
  });
});

describe('opciones de ronda', () => {
  it('shuffleArray conserva longitud y miembros', () => {
    const input = [1, 2, 3, 4, 5];
    expect([...shuffleArray(input)].sort()).toEqual(input);
  });

  it('incluye la respuesta correcta sin duplicados', () => {
    const pool = poolForRegion('kanto');
    const correct = byName('PIKACHU');
    const options = buildRoundOptions(pool, correct, 4, 0.5);
    expect(options).toHaveLength(4);
    expect(options).toContain('PIKACHU');
    expect(new Set(options).size).toBe(4);
  });

  it('en difícil los distractores son de la misma familia o tipo', () => {
    const pool = poolForRegion('kanto');
    const correct = byName('IVYSAUR');
    for (let i = 0; i < 20; i += 1) {
      const options = buildRoundOptions(pool, correct, 5, 1).filter((n) => n !== 'IVYSAUR');
      expect(options).toEqual(expect.arrayContaining(['BULBASAUR', 'VENUSAUR']));
      options.forEach((name) => {
        const p = byName(name);
        expect(p.family === correct.family || p.types.some((t) => correct.types.includes(t))).toBe(
          true
        );
      });
    }
  });

  it('no falla con pools pequeños', () => {
    const pool = poolForRegion('kanto').slice(0, 2);
    expect(buildRoundOptions(pool, pool[0], 5, 1)).toHaveLength(2);
  });
});

describe('cola de partida', () => {
  it('limita el número de rondas o usa todas', () => {
    const pool = poolForRegion('johto');
    expect(buildQueue({ pool, rounds: 10, mode: 'classic' })).toHaveLength(10);
    expect(buildQueue({ pool, rounds: 0, mode: 'classic' })).toHaveLength(100);
  });

  it('el repaso elige los más fallados', () => {
    const pool = poolForRegion('kanto');
    const misses = { 1: 5, 4: 3, 7: 1, 200: 9 };
    expect(buildQueue({ pool, rounds: 2, mode: 'review', misses }).sort()).toEqual([1, 4]);
    expect(buildQueue({ pool, rounds: 0, mode: 'review', misses })).toHaveLength(3);
    expect(buildQueue({ pool, rounds: 10, mode: 'review', misses: {} })).toEqual([]);
  });
});

describe('puntuación', () => {
  it('da el bonus justo en el 5º acierto seguido', () => {
    const player = createPlayer('Lucas');
    const bonuses = Array.from({ length: 10 }, () => applyHit(player));
    expect(bonuses).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    expect(player.hits).toBe(10);
    expect(player.points).toBe(12);
    applyMiss(player);
    expect(player.streak).toBe(0);
    expect(player.bestStreak).toBe(10);
  });

  it('el mensaje final usa aciertos, no puntos', () => {
    expect(getCongratulationsMessage(20, 20)).toMatch(/Perfecto/);
    expect(getCongratulationsMessage(0, 0)).toMatch(/Primer paso/);
  });

  it('decide ganador o empate', () => {
    const a = { ...createPlayer('Lucas'), points: 5 };
    const b = { ...createPlayer('Fede'), points: 7 };
    expect(winnerMessage([a, b])).toBe('¡Gana Fede!');
    expect(winnerMessage([a, { ...b, points: 5 }])).toMatch(/Empate/);
  });
});

describe('modo escribir', () => {
  it('acepta pequeñas faltas y símbolos', () => {
    expect(isNameMatch('pikachu', 'PIKACHU')).toBe(true);
    expect(isNameMatch('pikachuu', 'PIKACHU')).toBe(true);
    expect(isNameMatch('charizrd', 'CHARIZARD')).toBe(true);
    expect(isNameMatch('farfetchd', 'FARFETCH’D')).toBe(true);
    expect(isNameMatch('mr mime', 'MR. MIME')).toBe(true);
    expect(isNameMatch('flabebe', 'FLABÉBÉ')).toBe(true);
    expect(isNameMatch('nidoran', 'NIDORAN♀')).toBe(true);
  });

  it('rechaza nombres distintos o vacíos', () => {
    expect(isNameMatch('raichu', 'PIKACHU')).toBe(false);
    expect(isNameMatch('mew', 'MEWTWO')).toBe(false);
    expect(isNameMatch('muk', 'MEW')).toBe(false);
    expect(isNameMatch('  ', 'MEW')).toBe(false);
  });

  it('prepara nombres para la voz', () => {
    expect(formatPokemonNameForSpeech('HO-OH')).toBe('HO OH');
    expect(formatPokemonNameForSpeech('NIDORAN♂')).toBe('NIDORAN macho');
  });
});

describe('ajustes', () => {
  it('rellena valores por defecto y descarta los inválidos', () => {
    const s = resolveSettings({
      difficulty: 'imposible',
      rounds: 7,
      region: 'marte',
      playerNames: ['  ', 'Ana']
    });
    expect(s.difficulty).toBe('normal');
    expect(s.rounds).toBe(20);
    expect(s.region).toBe('kanto');
    expect(s.playerNames).toEqual(['Lucas', 'Ana']);
  });

  it('da más tiempo al escribir', () => {
    expect(roundTimeMs('normal', 'write')).toBe(30000);
    expect(roundTimeMs('hard', 'classic')).toBe(10000);
  });
});

describe('logros', () => {
  const base = {
    streak: 0,
    hits: 0,
    failed: 0,
    completed: false,
    rounds: 20,
    skipped: 0,
    mode: 'classic',
    dex: new Set()
  };

  it('desbloquea racha y aciertos', () => {
    const { nextUnlocked, gained } = evaluateAchievements({ ...base, streak: 5, hits: 60 }, []);
    expect(nextUnlocked).toEqual(expect.arrayContaining(['streak_5', 'score_50']));
    expect(gained).toHaveLength(2);
  });

  it('la partida perfecta exige terminar 50+ rondas sin fallos ni saltos', () => {
    const perfect = { ...base, completed: true, rounds: 50, hits: 50, streak: 50 };
    expect(evaluateAchievements(perfect, []).nextUnlocked).toContain('perfect_run');
    expect(
      evaluateAchievements({ ...perfect, rounds: 20, hits: 20 }, []).nextUnlocked
    ).not.toContain('perfect_run');
    expect(evaluateAchievements({ ...perfect, completed: false }, []).nextUnlocked).not.toContain(
      'perfect_run'
    );
    expect(evaluateAchievements({ ...perfect, skipped: 1 }, []).nextUnlocked).not.toContain(
      'perfect_run'
    );
  });

  it('no repite logros ya conseguidos', () => {
    expect(evaluateAchievements({ ...base, streak: 5 }, ['streak_5']).gained).toHaveLength(0);
  });

  it('detecta la Pokédex de Kanto completa', () => {
    const dex = new Set(Array.from({ length: 151 }, (_, i) => i + 1));
    expect(evaluateAchievements({ ...base, dex }, []).nextUnlocked).toContain('kanto_dex');
  });
});
