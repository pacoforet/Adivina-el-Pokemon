export const STORAGE_KEYS = {
  LEGACY_HIGH_SCORE: 'pokemon_game_high_score_v3',
  LEGACY_GAME_STATE: 'pokemon_game_state_v3',
  HIGH_SCORES: 'pokemon_game_high_scores_v4',
  GAME_STATE: 'pokemon_game_state_v4',
  SETTINGS: 'pokemon_game_settings_v3',
  ACHIEVEMENTS: 'pokemon_game_achievements_v3',
  POKEDEX: 'pokemon_game_pokedex_v1',
  MISSES: 'pokemon_game_misses_v1'
};

export const DIFFICULTY_PRESETS = {
  easy: { optionsPerQuestion: 3, roundTimeSec: 20, similarShare: 0, label: 'Fácil' },
  normal: { optionsPerQuestion: 4, roundTimeSec: 15, similarShare: 0.5, label: 'Normal' },
  hard: { optionsPerQuestion: 5, roundTimeSec: 10, similarShare: 1, label: 'Difícil' }
};

export const REGIONS = [
  { id: 'kanto', label: 'Kanto', from: 1, to: 151 },
  { id: 'johto', label: 'Johto', from: 152, to: 251 },
  { id: 'hoenn', label: 'Hoenn', from: 252, to: 386 },
  { id: 'sinnoh', label: 'Sinnoh', from: 387, to: 493 },
  { id: 'teselia', label: 'Teselia', from: 494, to: 649 },
  { id: 'kalos', label: 'Kalos', from: 650, to: 721 },
  { id: 'alola', label: 'Alola', from: 722, to: 809 },
  { id: 'galar', label: 'Galar', from: 810, to: 905 },
  { id: 'paldea', label: 'Paldea', from: 906, to: 1025 },
  { id: 'first300', label: 'Primeros 300', from: 1, to: 300 },
  { id: 'all', label: 'Todas', from: 1, to: 1025 }
];

export const ROUND_CHOICES = [10, 20, 50, 0];

export const MODES = {
  classic: { label: 'Silueta', timeFactor: 1 },
  cry: { label: 'Grito', timeFactor: 1.3 },
  write: { label: 'Escribir', timeFactor: 2 },
  review: { label: 'Repaso', timeFactor: 1 }
};

export const TYPES = [
  { name: 'Normal', color: '#8a8c8a' },
  { name: 'Lucha', color: '#d86e00' },
  { name: 'Volador', color: '#5b93cc' },
  { name: 'Veneno', color: '#9141cb' },
  { name: 'Tierra', color: '#915121' },
  { name: 'Roca', color: '#8c865f' },
  { name: 'Bicho', color: '#7b8a12' },
  { name: 'Fantasma', color: '#704170' },
  { name: 'Acero', color: '#4f8aa0' },
  { name: 'Fuego', color: '#e62829' },
  { name: 'Agua', color: '#2980ef' },
  { name: 'Planta', color: '#3a9425' },
  { name: 'Eléctrico', color: '#b08c00' },
  { name: 'Psíquico', color: '#e0336b' },
  { name: 'Hielo', color: '#1ea7c9' },
  { name: 'Dragón', color: '#5060e1' },
  { name: 'Siniestro', color: '#624d4e' },
  { name: 'Hada', color: '#d24fd2' }
];

export const PLAYER_COLORS = ['#e3350d', '#2a75bb'];

export const DEFAULT_SETTINGS = {
  difficulty: 'normal',
  timerEnabled: true,
  muted: false,
  region: 'kanto',
  rounds: 20,
  mode: 'classic',
  playerCount: 1,
  playerNames: ['Lucas', 'Fede']
};

export const GAME_CONFIG = {
  revealDelayMs: 1800,
  missedRevealDelayMs: 2200,
  wrongShakeDurationMs: 350,
  imageRetryDelayMs: 900,
  imageRetries: 2,
  soundVolume: 0.45,
  speechRate: 0.95,
  speechPitch: 1.1,
  bonusEveryStreak: 5,
  bonusScore: 1,
  perfectMinRounds: 50,
  api: {
    artworkUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
    cryUrl: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/'
  }
};

export const ACHIEVEMENTS = {
  STREAK_5: {
    id: 'streak_5',
    title: 'Racha Caliente',
    description: 'Consigue 5 aciertos seguidos.'
  },
  STREAK_20: { id: 'streak_20', title: 'Imparable', description: 'Consigue 20 aciertos seguidos.' },
  SCORE_50: {
    id: 'score_50',
    title: 'Entrenador Pro',
    description: 'Llega a 50 aciertos en una partida.'
  },
  PERFECT: {
    id: 'perfect_run',
    title: 'Maestro Pokémon',
    description: 'Termina sin fallos una partida de 50 rondas o más.'
  },
  EAR: {
    id: 'ear',
    title: 'Oído Fino',
    description: 'Acierta 10 Pokémon por su grito en una partida.'
  },
  SPELLER: {
    id: 'speller',
    title: 'Buena Letra',
    description: 'Escribe bien 10 nombres en una partida.'
  },
  KANTO_DEX: {
    id: 'kanto_dex',
    title: 'Pokédex de Kanto',
    description: 'Acierta alguna vez los 151 de Kanto.'
  },
  FULL_DEX: {
    id: 'full_dex',
    title: 'Pokédex Nacional',
    description: 'Acierta alguna vez los 1025 Pokémon.'
  }
};
