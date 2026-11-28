// Service worker — благодаря ему приложение работает БЕЗ ИНТЕРНЕТА.
// 1) При установке и каждом обновлении сразу скачивает ВСЕ файлы приложения в память телефона.
// 2) Когда интернет есть — берёт свежие файлы с сайта (и обновляет копию в памяти).
// 3) Когда интернета нет или он очень медленный — берёт файлы из памяти.
const CACHE = 'masterskaya-v57';
const NETWORK_TIMEOUT_MS = 4000; // дольше не ждём сеть — берём из памяти

// ВСЕ файлы приложения. Добавил новый файл (картинку, звук, скрипт) — допиши его сюда!
const FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'studio.js',
  'manifest.json',
  'version.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'vendor/three.module.min.js',
  'vendor/addons/controls/OrbitControls.js',
  'vendor/addons/environments/RoomEnvironment.js',
  'quiz/data.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' — берём с сайта свежие файлы, а не старые копии браузера
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))
        // Картинки викторины (флаги, гербы) — список берём из quiz/data.json
        .then(() => c.match('quiz/data.json')).then(r => r.json())
        .then(d => c.addAll(d.items.flatMap(i => [i.flag, i.arms]).filter(Boolean).map(f => new Request(f, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('masterskaya-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// В памяти каждый файл хранится ОДИН раз — адрес без «?v=…» и «?t=…» в конце.
// Иначе каждая проверка обновлений (version.json?t=…) копилась бы отдельно и занимала место.
const cacheKey = req => { const u = new URL(req.url); return u.origin + u.pathname; };
async function fromCache(req) {
  const hit = await caches.match(cacheKey(req));
  if (hit) return hit;
  if (req.mode === 'navigate') return caches.match('index.html'); // открыли приложение — отдаём главную страницу
  return undefined;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      // Пробуем сеть, но не дольше NETWORK_TIMEOUT_MS
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, fail) => setTimeout(() => fail(new Error('timeout')), NETWORK_TIMEOUT_MS)),
      ]);
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(cacheKey(req), copy));
      }
      return res;
    } catch (err) {
      const cached = await fromCache(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
