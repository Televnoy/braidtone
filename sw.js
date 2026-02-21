const CACHE_NAME = 'braid-tone-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'
];

// Добавляем иконки программно, чтобы не загромождать список
const ICONS = [
  './icon-180.png', './icon-152.png', './icon-16.png', 
  './icon-192.png', './icon-192-maskable.png', './icon-512.png'
];

const ALL_ASSETS = [...ASSETS_TO_CACHE, ...ICONS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Кэширование всех ресурсов...');
      // Используем Promise.allSettled чтобы 404 по одной иконке не ломал всё приложение
      return Promise.allSettled(
        ALL_ASSETS.map(url => 
          fetch(url).then(response => {
            if (response.ok) return cache.put(url, response);
            throw new Error(`Failed to fetch ${url}`);
          }).catch(err => console.warn('Ошибка кэширования ресурса:', url))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Игнорируем не-GET запросы и расширения
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 1. Возвращаем из кэша, если есть
      if (cached) return cached;

      // 2. Если нет в кэше, идем в сеть
      return fetch(event.request).then((response) => {
        // Кэшируем на лету только валидные ответы
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // 3. Если сети нет и это запрос навигации (страница), возвращаем корень
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
