import { REGIONS } from './config.js';
import { POKEMON_ROWS } from './data.js';

export const POKEMON = POKEMON_ROWS.map(([name, gen, types, family], index) => ({
  id: index + 1,
  name,
  gen,
  types,
  family
}));

export function getPokemon(id) {
  return POKEMON[id - 1];
}

export function getRegion(regionId) {
  return REGIONS.find((r) => r.id === regionId) || REGIONS[0];
}

export function poolForRegion(regionId) {
  const { from, to } = getRegion(regionId);
  return POKEMON.slice(from - 1, to);
}
