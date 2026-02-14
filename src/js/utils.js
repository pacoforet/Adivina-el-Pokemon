import { ACHIEVEMENTS, DIFFICULTY_PRESETS } from './config.js';

export function shuffleArray(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function uniqueRandomFromPool(pool, count, exclude = new Set()) {
  const available = pool.filter((item) => !exclude.has(item));
  const mixed = shuffleArray(available);
  return mixed.slice(0, count);
}

export function formatPokemonNameForSpeech(name) {
  return name
    .replace('♀', ' hembra')
    .replace('♂', ' macho')
    .replace('.', '')
    .replace("'", '');
}

export function getCongratulationsMessage(score, total) {
  const percentage = (score / total) * 100;
  if (percentage === 100) return 'Perfecto. Lucas y Fede te nombran Maestro Pokemon.';
  if (percentage >= 90) return 'Increible partida. Casi perfecto.';
  if (percentage >= 75) return 'Excelente trabajo, nivel alto.';
  if (percentage >= 50) return 'Muy bien. La proxima pasas de nivel seguro.';
  if (percentage >= 25) return 'Buen intento. Sigue entrenando.';
  return 'Primer paso completado. A seguir jugando.';
}

export function resolveSettings(raw = {}) {
  const difficulty = DIFFICULTY_PRESETS[raw.difficulty] ? raw.difficulty : 'normal';
  return {
    difficulty,
    kidMode: Boolean(raw.kidMode),
    timerEnabled: raw.timerEnabled !== false,
    muted: Boolean(raw.muted)
  };
}

export function optionsPerQuestion(settings) {
  const base = DIFFICULTY_PRESETS[settings.difficulty].optionsPerQuestion;
  return settings.kidMode ? Math.min(base, 3) : base;
}

export function roundTime(settings) {
  const base = DIFFICULTY_PRESETS[settings.difficulty].roundTimeSec;
  return settings.kidMode ? base + 5 : base;
}

export function buildRoundOptions(allPokemon, correctPokemon, optionCount) {
  const wrongNames = uniqueRandomFromPool(
    allPokemon.map((p) => p.name),
    optionCount - 1,
    new Set([correctPokemon.name])
  );
  return shuffleArray([correctPokemon.name, ...wrongNames]);
}

export function evaluateAchievements(state, unlocked) {
  const next = new Set(unlocked);
  const gained = [];

  if (state.streak >= 5 && !next.has(ACHIEVEMENTS.STREAK_5.id)) {
    next.add(ACHIEVEMENTS.STREAK_5.id);
    gained.push(ACHIEVEMENTS.STREAK_5);
  }
  if (state.score >= 50 && !next.has(ACHIEVEMENTS.SCORE_50.id)) {
    next.add(ACHIEVEMENTS.SCORE_50.id);
    gained.push(ACHIEVEMENTS.SCORE_50);
  }
  if (
    state.currentPokemonIndex >= state.shuffledPokemon.length &&
    state.failed === 0 &&
    !next.has(ACHIEVEMENTS.PERFECT.id)
  ) {
    next.add(ACHIEVEMENTS.PERFECT.id);
    gained.push(ACHIEVEMENTS.PERFECT);
  }

  return { nextUnlocked: [...next], gained };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
