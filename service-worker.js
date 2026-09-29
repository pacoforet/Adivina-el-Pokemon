const VERSION = 'v4';
const APP_CACHE = `pokemon-app-${VERSION}`;
const POKE_ASSET_CACHE = 'pokemon-assets-v4';
const MAX_ASSET_ENTRIES = 400;
const NETWORK_TIMEOUT_MS = 3500;

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './src/js/main.js',
  './src/js/config.js',
  './src/js/data.js',
  './src/js/pokemon.js',
  './src/js/storage.js',
  './src/js/audio.js',
  './src/js/ui.js',
  './src/js/game.js',
  './src/js/utils.js',
  './manifest.json',
  './icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './lucas-fede-pokemon.webp',
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_CACHE, POKE_ASSET_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isPokemonAsset(url) {
  return (
    url.hostname === 'raw.githubusercontent.com' &&
    (url.pathname.includes('/sprites/') || url.pathname.includes('/cries/'))
  );
}

async function trimCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_ASSET_ENTRIES;
  for (let i = 0; i < excess; i += 1) await cache.delete(keys[i]);
}

async function pokemonAsset(request) {
  const cache = await caches.open(POKE_ASSET_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  // Solo guardamos respuestas CORS correctas: las opacas ocupan mucha cuota y los errores envenenarían la caché.
  if (response.ok) {
    await cache.put(request, response.clone());
    trimCache(cache);
  }
  return response;
}

async function appRequest(event) {
  const { request } = event;
  const cache = await caches.open(APP_CACHE);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  event.waitUntil(network.catch(() => {}));

  const cached = await cache.match(request, { ignoreSearch: true });
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS));

  try {
    const response = await (cached ? Promise.race([network, timeout]) : network);
    return response || cached;
  } catch {
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('./offline.html');
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isPokemonAsset(url)) {
    event.respondWith(pokemonAsset(event.request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(appRequest(event));
  }
});
