const APP_CACHE = 'pokemon-app-v3';
const RUNTIME_CACHE = 'pokemon-runtime-v3';
const POKE_ASSET_CACHE = 'pokemon-assets-v3';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './src/js/main.js',
  './src/js/config.js',
  './src/js/data.js',
  './src/js/state.js',
  './src/js/storage.js',
  './src/js/audio.js',
  './src/js/ui.js',
  './src/js/game.js',
  './src/js/utils.js',
  './manifest.json',
  './icon.svg',
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_CACHE, RUNTIME_CACHE, POKE_ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isPokemonAsset(url) {
  return (
    url.hostname.includes('raw.githubusercontent.com') &&
    (url.pathname.includes('/sprites/') || url.pathname.includes('/cries/'))
  );
}

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (isPokemonAsset(requestUrl)) {
    event.respondWith(
      caches.open(POKE_ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(event.request);
        if (hit) return hit;
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch (_error) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          const runtime = await caches.open(RUNTIME_CACHE);
          runtime.put(event.request, response.clone());
          return response;
        } catch (_error) {
          return caches.match('./offline.html');
        }
      })
    );
  }
});
