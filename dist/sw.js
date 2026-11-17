const CACHE = 'tiktok-reply-pwa-v6';
const ASSETS = ['index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'];
const assetUrl = path => new URL(path, self.registration.scope).href;
const root = new URL(self.registration.scope);
const homeUrl = assetUrl('index.html');
const assetUrls = new Set(ASSETS.map(assetUrl));
let cachePromise;
const openCache = () => {
  if (!cachePromise) cachePromise = caches.open(CACHE).catch(error => { cachePromise = null; throw error; });
  return cachePromise;
};
self.addEventListener('install', event => {
  event.waitUntil(openCache().then(async cache => {
    await cache.addAll([...assetUrls].map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('tiktok-reply-pwa-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  const isHome = event.request.mode === 'navigate' && (url.pathname === root.pathname || url.href.split(/[?#]/)[0] === homeUrl);
  const key = isHome ? homeUrl : url.origin + url.pathname;
  if (!isHome && !assetUrls.has(key)) return;
  // Static shell only: never cache sign-in pages, APIs or third-party requests.
  event.respondWith(openCache().then(cache => cache.match(key)).catch(() => null).then(cached => cached || fetch(event.request)));
});
