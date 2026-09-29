// Genera src/js/data.js a partir de los CSV públicos de PokeAPI.
// Uso: node scripts/build-pokemon-data.mjs
import { writeFile } from 'node:fs/promises';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const ENGLISH = 9;
const MAX_ID = 1025;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function load(name) {
  const res = await fetch(`${BASE}/${name}.csv`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

const [species, names, types] = await Promise.all([
  load('pokemon_species'),
  load('pokemon_species_names'),
  load('pokemon_types')
]);

const nameById = new Map(
  names
    .filter((n) => Number(n.local_language_id) === ENGLISH)
    .map((n) => [Number(n.pokemon_species_id), n.name])
);

const typesById = new Map();
types
  .filter((t) => Number(t.pokemon_id) <= MAX_ID)
  .sort((a, b) => Number(a.slot) - Number(b.slot))
  .forEach((t) => {
    const id = Number(t.pokemon_id);
    typesById.set(id, [...(typesById.get(id) || []), Number(t.type_id) - 1]);
  });

const rows = species
  .map((s) => ({
    id: Number(s.id),
    gen: Number(s.generation_id),
    family: Number(s.evolution_chain_id)
  }))
  .filter((s) => s.id <= MAX_ID)
  .sort((a, b) => a.id - b.id);

rows.forEach((s, index) => {
  if (s.id !== index + 1) throw new Error(`Hueco en la numeración: ${s.id}`);
  if (!nameById.has(s.id)) throw new Error(`Sin nombre: ${s.id}`);
  if (!typesById.has(s.id)) throw new Error(`Sin tipos: ${s.id}`);
});

const lines = rows.map((s) => {
  const name = JSON.stringify(nameById.get(s.id).toUpperCase());
  return `  [${name}, ${s.gen}, [${typesById.get(s.id).join(', ')}], ${s.family}]`;
});

const output = `// Generado por scripts/build-pokemon-data.mjs. No editar a mano.
// Cada entrada: [nombre, generación, índices de TYPES, cadena evolutiva]. El id es la posición + 1.
export const POKEMON_ROWS = [
${lines.join(',\n')}
];
`;

await writeFile(new URL('../src/js/data.js', import.meta.url), output);
console.warn(`data.js generado con ${rows.length} Pokémon`);
