/* Günlüğüm Service Worker: çevrimdışı kabuk, önbellek ve görsel desteği. */
'use strict';

const CACHE_PREFIX = 'gunlugum-pwa-';
const CACHE_VERSION = 'v1';
const APP_CACHE = `${CACHE_PREFIX}app-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${CACHE_VERSION}`;
const APP_ROOT = new URL('./', self.registration.scope);
const OFFLINE_URL = new URL('offline.html', APP_ROOT).href;

// Önbelleğe alınması yararlı olan çekirdek dosyalar. İsteğe bağlı dosyalar
// yoksa kurulum başarısız olmaz; depo sürümleri farklı olabilir.
const CORE_FILES = [
  'index.html', 'offline.html', 'manifest.webmanifest',
  'assets/css/style.css', 'assets/css/technopat.css', 'assets/css/intro-loader.css', 'assets/css/pwa.css',
  'assets/icons/gunlugum-180.png', 'assets/icons/gunlugum-192.png', 'assets/icons/gunlugum-512.png', 'assets/icons/gunlugum-maskable-512.png',
  'scripts/theme.js', 'scripts/config.js', 'scripts/categories.js', 'scripts/app.js', 'scripts/technopat.js', 'scripts/intro-loader.js', 'scripts/pwa.js',
  'data/games.json', 'data/movies.json', 'data/series.json', 'data/anime.json', 'data/technopat.json',
  'oyun/index.html', 'oyun/maliyet/index.html', 'film/index.html', 'dizi/index.html', 'anime/index.html',
  'technopat/incelemeler/index.html', 'technopat/rehberler/index.html'
];

const IMAGE_HOSTS = new Set(['image.tmdb.org', 'media.rawg.io', 's4.anilist.co']);

async function cacheIfOkay(cache, request, response) {
  if (!response || !(response.ok || response.type === 'opaque')) return;
  try { await cache.put(request, response.clone()); } catch (_) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.allSettled(CORE_FILES.map(async (path) => {
      const requestURL = new URL(path, APP_ROOT);
      try {
        const response = await fetch(requestURL.href, { cache: 'reload' });
        await cacheIfOkay(cache, requestURL.href, response);
      } catch (_) {
        // Ağ veya isteğe bağlı dosya hatası PWA kurulumunu durdurmasın.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && ![APP_CACHE, IMAGE_CACHE].includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cacheIfOkay(cache, request, response);
    return response;
  } catch (_) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    const home = await cache.match(new URL('index.html', APP_ROOT).href, { ignoreSearch: true });
    if (home) return home;
    return new Response('Günlüğüm çevrimdışı. Daha önce açılmamış bu sayfaya ulaşmak için internet bağlantısı gerekiyor.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const refresh = fetch(request).then(async (response) => {
    if (response && response.ok) await cacheIfOkay(cache, request, response);
    return response;
  }).catch(() => null);
  return cached || await refresh || new Response('', { status: 504, statusText: 'Offline' });
}

async function remoteImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response && (response.ok || response.type === 'opaque')) await cacheIfOkay(cache, request, response);
    return response;
  }).catch(() => null);
  return cached || await refresh || new Response('', { status: 504, statusText: 'Image unavailable' });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestURL = new URL(request.url);
  if (requestURL.origin !== self.location.origin) {
    if (request.destination === 'image' && IMAGE_HOSTS.has(requestURL.hostname)) {
      event.respondWith(remoteImage(request));
    }
    return;
  }

  const rootPath = new URL(self.registration.scope).pathname;
  if (!requestURL.pathname.startsWith(rootPath)) return;
  const relativePath = requestURL.pathname.slice(rootPath.length);

  // Yönetim panelini önbelleğe alma veya çevrimdışı fallback ile sunma.
  if (relativePath === 'admin' || relativePath.startsWith('admin/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (relativePath.startsWith('data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (['script', 'style', 'font', 'image'].includes(request.destination) || relativePath === 'manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
