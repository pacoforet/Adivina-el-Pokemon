# Adivina el Pokémon — Lucas & Fede Edition

Juego web/PWA para adivinar los **1025 Pokémon** (generaciones 1 a 9) con estética retro arcade.
Funciona sin instalar nada, se puede añadir a la pantalla de inicio del móvil y recuerda lo que ya
has visto para jugar sin conexión.

## Cómo se juega

- **Región**: Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar, Paldea, los primeros 300 o todas.
- **Modos**:
  - **Silueta**: elige el nombre correcto viendo la sombra.
  - **Grito**: escucha el grito y adivina (botón para repetirlo).
  - **Escribir**: escribe el nombre; se perdonan pequeñas faltas y acentos.
  - **Repaso**: vuelve a jugar con los Pokémon que más has fallado.
- **Rondas**: 10, 20, 50 o todas las de la región.
- **Dificultad**: más opciones y menos tiempo. En Difícil las opciones incorrectas son de la misma
  familia evolutiva o del mismo tipo.
- **1 o 2 jugadores**: por turnos en el mismo dispositivo; gana quien tenga más puntos.
- Cada acierto suma 1 punto y cada racha de 5 da 1 punto extra. Al fallar o acabarse el tiempo se
  muestra la respuesta correcta con su número y sus tipos.
- **Pokédex**: guarda los Pokémon que has acertado alguna vez, por región, junto con los logros.
- Se puede salir a mitad de partida y continuarla después. Hay un récord por cada combinación de
  región, rondas, modo y dificultad.
- Atajos de teclado: `1`–`5` para elegir opción y `Esc` para salir.

## Estructura

- `index.html`, `styles.css`: interfaz.
- `src/js/`
  - `main.js`: arranque y eventos.
  - `game.js`: controlador de la partida (fases de ronda, temporizador, errores de red).
  - `ui.js`: todo lo que toca el DOM.
  - `utils.js`: lógica pura y testeada (opciones, puntuación, logros, comparación de nombres).
  - `storage.js`: `localStorage` protegido frente a errores.
  - `audio.js`: efectos, gritos y voz.
  - `pokemon.js`, `config.js`: datos derivados y configuración.
  - `data.js`: **generado** con `npm run data` desde los CSV de PokeAPI (nombre, generación, tipos y
    familia evolutiva). No se edita a mano.
- `service-worker.js`: la app se sirve primero desde la red (así las actualizaciones llegan siempre)
  con copia en caché para offline; imágenes y gritos van a una caché limitada.
- `tests/unit` (Vitest) y `tests/e2e` (Playwright, escritorio y móvil, con la red simulada).
- `.github/workflows/ci.yml`: lint, formato, tests unitarios y E2E en cada push y PR.

## Desarrollo local

```bash
npm install
npm run check      # lint + formato + tests unitarios
npm run test:e2e   # tests end-to-end
python3 -m http.server 4173   # y abrir http://127.0.0.1:4173
```

Si Playwright no encuentra su navegador, usa uno ya instalado con
`PW_CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e`.

Al publicar cambios en la app, sube `VERSION` en `service-worker.js` para limpiar cachés antiguas.

## Despliegue

Son archivos estáticos: se publican tal cual. Usa rutas relativas y el service worker tiene scope
`./`, así que funciona tanto en la raíz de un dominio como en una subruta (`/pokemon/`).

Imágenes y gritos: [PokeAPI](https://github.com/PokeAPI). Pokémon es marca de Nintendo, Game Freak
y The Pokémon Company; este es un proyecto personal sin ánimo de lucro.
