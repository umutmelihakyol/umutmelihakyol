/* Günlüğüm Service Worker — cache v12: gelişmiş arama, yıllık istatistikler ve gelişmiş puanlama. */
'use strict';

const CACHE_PREFIX = 'gunlugum-pwa-';
const CACHE_VERSION = 'v12';
const APP_CACHE = `${CACHE_PREFIX}app-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${CACHE_VERSION}`;
const APP_ROOT = new URL('./', self.registration.scope);
const OFFLINE_URL = new URL('offline/', APP_ROOT).href;

const CORE_FILES = [
  '', 'offline/', 'manifest.webmanifest',
  'assets/css/style.css', 'assets/css/modern.css', 'assets/css/stats.css', 'assets/css/search.css', 'assets/css/cards.css', 'assets/css/card-hover-glow.css', 'assets/css/media-extras.css', 'assets/css/technopat.css', 'assets/css/intro-loader.css', 'assets/css/pwa.css', 'assets/css/anime-detail.css',
  'assets/icons/gunlugum-180.png', 'assets/icons/gunlugum-192.png', 'assets/icons/gunlugum-512.png', 'assets/icons/gunlugum-maskable-512.png',
  'scripts/theme.js', 'scripts/config.js', 'scripts/categories.js', 'scripts/app.js', 'scripts/stats.js', 'scripts/search.js', 'scripts/technopat.js', 'scripts/intro-loader.js', 'scripts/pwa.js', 'scripts/anime-detail.js', 'scripts/media-extras.js',
  'data/games.json', 'data/movies.json', 'data/series.json', 'data/anime.json', 'data/technopat.json',
  'oyun/', 'oyun/maliyet/', 'film/', 'dizi/', 'anime/', 'istatistik/', 'ara/',
  'technopat/incelemeler/', 'technopat/rehberler/'
];

// Üçüncü taraf kapak görselleri Cache API'de opaque hata yanıtları olarak saklanmasın.
// Bunları tarayıcı doğrudan yükler; aynı origin görselleri aşağıda önbelleğe alınmaya devam eder.

async function cacheIfOkay(cache, request, response) {
  if (!response || !(response.ok || response.type === 'opaque') || response.status === 206) return;
  try { await cache.put(request, response.clone()); } catch (_) {}
}

async function findCached(cache, request) {
  // Önce tam URL/sürüm eşleşmesi; query'siz kopya yalnızca çevrimdışı yedek olarak kullanılır.
  return (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true })) || null;
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
        // Dosya bulunmaması/bağlantı problemi kurulumun tamamını durdurmasın.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== APP_CACHE && name !== IMAGE_CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, { offlinePage = false } = {}) {
  const cache = await caches.open(APP_CACHE);
  try {
    // CSS, JS, manifest, HTML ve JSON için HTTP önbelleğini de yeniden doğrula.
    const response = await fetch(request, { cache: 'no-cache' });
    if (response && response.ok) {
      await cacheIfOkay(cache, request, response);
      return response;
    }
    const cached = await findCached(cache, request);
    if (cached) return cached;
    return response;
  } catch (_) {
    const cached = await findCached(cache, request);
    if (cached) return cached;
    if (offlinePage) {
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
      const home = await cache.match(new URL('', APP_ROOT).href, { ignoreSearch: true });
      if (home) return home;
    }
    return new Response('Günlüğüm çevrimdışı. Bu dosya önbelleğe alınmadıysa internet bağlantısı gerekir.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

function imageWithCacheFirst(request, event, cacheName) {
  const cachePromise = caches.open(cacheName);
  const cachedPromise = cachePromise.then((cache) => cache.match(request));
  const refreshPromise = cachePromise
    .then((cache) => fetch(request, { cache: 'no-cache' }).then(async (response) => {
      await cacheIfOkay(cache, request, response);
      return response;
    }))
    .catch(() => null);

  // waitUntil çağrısı event süresi dolmadan, senkron olarak yapılır.
  event.waitUntil(refreshPromise.then(() => undefined));
  // Önbellekteki görsel varsa hızlıca döndür; yoksa ağ yanıtını bekle.
  return cachedPromise.then((cached) => {
    if (cached) return cached;
    return refreshPromise.then((response) => response || new Response('', {
      status: 504,
      statusText: 'Image unavailable'
    }));
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestURL = new URL(request.url);
  // Harici kapak görsellerini Service Worker üzerinden geçirme.
  // Opaque yanıtlar hata durumunu saklayamadığından bozuk CDN yanıtları önbelleğe alınabiliyordu.
  if (requestURL.origin !== self.location.origin) return;

  const rootPath = new URL(self.registration.scope).pathname;
  if (!requestURL.pathname.startsWith(rootPath)) return;
  const relativePath = requestURL.pathname.slice(rootPath.length);

  // Yönetim panelini Service Worker önbelleğiyle sunma.
  if (relativePath === 'admin' || relativePath.startsWith('admin/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, { offlinePage: true }));
    return;
  }

  // JSON her zaman ağdan doğrulanır; yalnızca ağ yoksa kayıtlı kopyaya dönülür.
  if (relativePath.startsWith('data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Bu kural eski CSS/JS'in cache-first gibi kalmasına izin vermez.
  if (['script', 'style', 'font'].includes(request.destination) || relativePath === 'manifest.webmanifest') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Yerel görsellerde cache-first + arka planda yenileme performansı korur.
  if (request.destination === 'image') {
    event.respondWith(imageWithCacheFirst(request, event, IMAGE_CACHE));
  }
});
