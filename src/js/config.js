export const APP_VERSION = '3.0.0';

export const STORAGE_KEYS = {
  HIGH_SCORE: 'pokemon_game_high_score_v3',
  GAME_STATE: 'pokemon_game_state_v3',
  SETTINGS: 'pokemon_game_settings_v3',
  ACHIEVEMENTS: 'pokemon_game_achievements_v3'
};

export const DIFFICULTY_PRESETS = {
  easy: { optionsPerQuestion: 3, roundTimeSec: 20, label: 'Facil' },
  normal: { optionsPerQuestion: 4, roundTimeSec: 15, label: 'Normal' },
  hard: { optionsPerQuestion: 5, roundTimeSec: 10, label: 'Dificil' }
};

export const GAME_CONFIG = {
  totalPokemon: 150,
  revealDelayMs: 1800,
  wrongShakeDurationMs: 350,
  minStreakDisplay: 2,
  soundVolume: 0.45,
  speechRate: 0.95,
  speechPitch: 1.1,
  bonusEveryStreak: 5,
  bonusScore: 1,
  api: {
    spriteUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/',
    cryUrl: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/'
  }
};

export const ACHIEVEMENTS = {
  STREAK_5: {
    id: 'streak_5',
    title: 'Racha Caliente',
    description: 'Consigue una racha de 5 aciertos seguidos.'
  },
  SCORE_50: {
    id: 'score_50',
    title: 'Entrenador Pro',
    description: 'Llega a 50 aciertos en una partida.'
  },
  PERFECT: {
    id: 'perfect_run',
    title: 'Maestro Pokemon',
    description: 'Completa la partida perfecta.'
  }
};
