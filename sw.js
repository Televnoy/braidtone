const CACHE_NAME = 'braid-tone-v1';
const ASSETS_TO_CACHE = [
  '/braidtone/',
  '/braidtone/index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Используем map, чтобы даже если один файл не загрузится, остальные попробовали
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return fetch(url, { mode: 'no-cors' }).then(response => {
            return cache.put(url, response);
          }).catch(err => console.error('Ошибка кэширования:', url, err));
        })
      );
    })
  );
  self.skipWaiting(); // Принудительная активация
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем из кэша, если есть, иначе идем в сеть
      return response || fetch(event.request).catch(() => {
        // Если сети нет и в кэше пусто (например, для новой страницы)
        if (event.request.mode === 'navigate') {
          return caches.match('/braidtone/index.html');
        }
      });
    })
  );
});
