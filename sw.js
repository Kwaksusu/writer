// 집필기 오프라인 캐시. 원고(txt)는 여기 들어오지 않는다: 편집기 파일만 저장한다.
// 인터넷이 되면 항상 최신 편집기를 받고, 안 되면 저장해 둔 편집기로 연다.
const CACHE = 'writer-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-nib-192.png', './icon-nib-512.png', './icon-nib-maskable-512.png', './favicon-nib.png', './apple-touch-icon-nib.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
      ]);
      if (net && net.ok) cache.put(req, net.clone());
      return net;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || (await cache.match('./'));
      throw err;
    }
  })());
});
