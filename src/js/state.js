import { GAME_CONFIG } from './config.js';
import { POKEMON_NAMES } from './data.js';

export function createBasePokemonData() {
  return POKEMON_NAMES.slice(0, GAME_CONFIG.totalPokemon).map((name, index) => ({
    id: index + 1,
    name
  }));
}

export function createInitialState() {
  return {
    pokemonData: createBasePokemonData(),
    shuffledPokemon: [],
    currentPokemonIndex: 0,
    score: 0,
    failed: 0,
    streak: 0,
    answeredCurrentRound: false,
    highScore: 0,
    unlockedAchievements: [],
    timer: {
      remainingSec: 0,
      totalSec: 0,
      intervalId: null
    }
  };
}
