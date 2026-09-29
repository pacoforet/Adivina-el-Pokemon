import {
  ACHIEVEMENTS,
  DEFAULT_SETTINGS,
  DIFFICULTY_PRESETS,
  GAME_CONFIG,
  MODES,
  REGIONS,
  ROUND_CHOICES
} from './config.js';

export function shuffleArray(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatPokemonNameForSpeech(name) {
  return name
    .replace('♀', ' hembra')
    .replace('♂', ' macho')
    .replace(/[.'’:]/g, '')
    .replace(/-/g, ' ');
}

export function normalizeName(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace('♀', 'f')
    .replace('♂', 'm')
    .replace(/[^a-z0-9]/g, '');
}

export function levenshtein(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length];
}

export function isNameMatch(input, name) {
  const guess = normalizeName(input);
  if (!guess) return false;
  const targets = [normalizeName(name), normalizeName(name.replace(/[♀♂]/g, ''))];
  return targets.some((target) => {
    const tolerance = target.length >= 9 ? 2 : target.length >= 5 ? 1 : 0;
    return levenshtein(guess, target) <= tolerance;
  });
}

export function getCongratulationsMessage(hits, total) {
  const percentage = total > 0 ? (hits / total) * 100 : 0;
  if (percentage >= 100) return 'Perfecto. Lucas y Fede te nombran Maestro Pokémon.';
  if (percentage >= 90) return 'Increíble partida. Casi perfecto.';
  if (percentage >= 75) return 'Excelente trabajo, nivel alto.';
  if (percentage >= 50) return 'Muy bien. La próxima pasas de nivel seguro.';
  if (percentage >= 25) return 'Buen intento. Sigue entrenando.';
  return 'Primer paso completado. A seguir jugando.';
}

function cleanName(value, fallback) {
  const text = typeof value === 'string' ? value.trim().slice(0, 12) : '';
  return text || fallback;
}

export function resolveSettings(raw = {}) {
  const base = DEFAULT_SETTINGS;
  const names = Array.isArray(raw.playerNames) ? raw.playerNames : [];
  return {
    difficulty: DIFFICULTY_PRESETS[raw.difficulty] ? raw.difficulty : base.difficulty,
    timerEnabled: raw.timerEnabled !== false,
    muted: Boolean(raw.muted),
    region: REGIONS.some((r) => r.id === raw.region) ? raw.region : base.region,
    rounds: ROUND_CHOICES.includes(raw.rounds) ? raw.rounds : base.rounds,
    mode: MODES[raw.mode] ? raw.mode : base.mode,
    playerCount: raw.playerCount === 2 ? 2 : 1,
    playerNames: base.playerNames.map((fallback, i) => cleanName(names[i], fallback))
  };
}

export function optionsPerQuestion(difficulty) {
  return DIFFICULTY_PRESETS[difficulty].optionsPerQuestion;
}

export function roundTimeMs(difficulty, mode) {
  return DIFFICULTY_PRESETS[difficulty].roundTimeSec * MODES[mode].timeFactor * 1000;
}

function sharesType(a, b) {
  return a.types.some((t) => b.types.includes(t));
}

export function buildRoundOptions(pool, correct, optionCount, similarShare = 0) {
  const others = pool.filter((p) => p.name !== correct.name);
  const wanted = Math.min(optionCount - 1, others.length);
  const similarCount = Math.round(wanted * similarShare);

  const family = shuffleArray(others.filter((p) => p.family === correct.family));
  const sameType = shuffleArray(
    others.filter((p) => p.family !== correct.family && sharesType(p, correct))
  );
  const picked = [...family, ...sameType].slice(0, similarCount);

  const rest = shuffleArray(others.filter((p) => !picked.includes(p)));
  const distractors = [...picked, ...rest].slice(0, wanted);
  return shuffleArray([correct.name, ...distractors.map((p) => p.name)]);
}

export function buildQueue({ pool, rounds, mode, misses = {} }) {
  if (mode === 'review') {
    const missed = pool.filter((p) => misses[p.id] > 0).sort((a, b) => misses[b.id] - misses[a.id]);
    const chosen = rounds > 0 ? missed.slice(0, rounds) : missed;
    return shuffleArray(chosen).map((p) => p.id);
  }
  const shuffled = shuffleArray(pool);
  return (rounds > 0 ? shuffled.slice(0, rounds) : shuffled).map((p) => p.id);
}

export function createPlayer(name) {
  return { name, hits: 0, points: 0, failed: 0, streak: 0, bestStreak: 0 };
}

export function applyHit(player) {
  player.hits += 1;
  player.points += 1;
  player.streak += 1;
  player.bestStreak = Math.max(player.bestStreak, player.streak);
  if (player.streak % GAME_CONFIG.bonusEveryStreak === 0) {
    player.points += GAME_CONFIG.bonusScore;
    return GAME_CONFIG.bonusScore;
  }
  return 0;
}

export function applyMiss(player) {
  player.failed += 1;
  player.streak = 0;
}

export function highScoreKey({ region, rounds, mode, difficulty }) {
  return `${region}|${rounds}|${mode}|${difficulty}`;
}

const KANTO_IDS = Array.from({ length: 151 }, (_, i) => i + 1);

export function evaluateAchievements(ctx, unlocked) {
  const next = new Set(unlocked);
  const gained = [];
  const checks = [
    [ACHIEVEMENTS.STREAK_5, ctx.streak >= 5],
    [ACHIEVEMENTS.STREAK_20, ctx.streak >= 20],
    [ACHIEVEMENTS.SCORE_50, ctx.hits >= 50],
    [
      ACHIEVEMENTS.PERFECT,
      ctx.completed &&
        ctx.rounds >= GAME_CONFIG.perfectMinRounds &&
        ctx.failed === 0 &&
        ctx.skipped === 0 &&
        ctx.hits === ctx.rounds
    ],
    [ACHIEVEMENTS.EAR, ctx.mode === 'cry' && ctx.hits >= 10],
    [ACHIEVEMENTS.SPELLER, ctx.mode === 'write' && ctx.hits >= 10],
    [ACHIEVEMENTS.KANTO_DEX, KANTO_IDS.every((id) => ctx.dex.has(id))],
    [ACHIEVEMENTS.FULL_DEX, ctx.dex.size >= 1025]
  ];

  checks.forEach(([achievement, reached]) => {
    if (reached && !next.has(achievement.id)) {
      next.add(achievement.id);
      gained.push(achievement);
    }
  });

  return { nextUnlocked: [...next], gained };
}

export function winnerMessage(players) {
  const [a, b] = players;
  if (a.points === b.points) return `¡Empate a ${a.points} puntos!`;
  return `¡Gana ${a.points > b.points ? a.name : b.name}!`;
}
