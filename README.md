# Adivina el Pokemon (Definitive Edition)

Juego web/PWA para adivinar los 150 Pokemon de Kanto.

## Novedades implementadas

- Arquitectura modular (`src/js/*`) con responsabilidades separadas.
- Dificultad configurable: facil, normal, dificil.
- Modo infantil "Lucas y Fede" (botones mas grandes, mas tiempo, mas pistas).
- Temporizador opcional por ronda.
- Sistema de pistas con tecla rapida `H`.
- Sistema de logros (racha, score alto, partida perfecta).
- Bonus por racha cada 5 aciertos.
- Compartir resultado (Web Share API o portapapeles).
- PWA reforzada con `offline.html`, cache shell + runtime y cache de assets Pokemon.
- Compatible con despliegue en subdominio o subruta (`./` en manifest + SW relativo).
- Calidad: ESLint, Prettier, Vitest (unit), Playwright (E2E), CI GitHub Actions.

## Estructura

- `index.html`: UI principal sin dependencias CDN criticas.
- `styles.css`: estilos responsive y accesibles.
- `src/js/`: logica modular.
- `service-worker.js`: offline y cache inteligente.
- `tests/unit`: pruebas unitarias.
- `tests/e2e`: pruebas end-to-end.
- `.github/workflows/ci.yml`: pipeline de calidad.

## Desarrollo local

```bash
npm install
npm run lint
npm run test
npm run test:e2e
```

Para abrir en local rapido:

```bash
python3 -m http.server 4173
# abrir http://127.0.0.1:4173
```

## Despliegue

### Opcion A: `pokemon.pacoforet.com`

Publica los archivos tal cual en la raiz del subdominio.

### Opcion B: `pacoforet.com/pokemon`

Publica los archivos dentro del directorio `/pokemon/`.
El proyecto usa rutas relativas y service worker con scope `./`, asi que funciona en subruta.

## Scripts

- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run test`
- `npm run test:e2e`
- `npm run check`
