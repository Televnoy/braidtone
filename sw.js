const CACHE_NAME = 'braid-tone-v3'; // Обновили версию для принудительного обновления у пользователей
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
  './icon-180.png',
  './icon-152.png',
  './icon-16.png',
  './icon-192.png',
  './icon-192-maskable.png',
  './icon-512.png'
];

// Установка: кэшируем ресурсы по одному, чтобы битая ссылка не ломала всё приложение
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Кэширование ресурсов...');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn(`Не удалось загрузить в кэш: ${url}`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Активация: очистка старых версий кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Удаление старого кэша:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Стратегия: Сначала кэш, если нет — сеть
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к расширениям браузера и не-GET запросы
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Кэшируем новые успешные запросы (например, шрифты или картинки, не вошедшие в список)
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Ошибка сети — здесь можно возвращать заглушку для картинок
      });
    })
  );
});
