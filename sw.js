// Service worker: позволяет приложению открываться даже без интернета.
// Сначала пробует сеть (чтобы сразу видеть свежие изменения), если нет сети — берёт из кэша.
const CACHE = 'masterskaya-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
