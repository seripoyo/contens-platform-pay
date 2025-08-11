/**
 * Service Worker - キャッシュ制御
 * バージョンを更新することで古いキャッシュを削除
 */

const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `net-salary-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/src/css/style.css',
  '/src/css/components.css',
  '/src/css/responsive.css',
  '/src/js/utils.js',
  '/src/js/calculator.js',
  '/src/js/imageGenerator.js',
  '/src/js/main.js',
  '/assets/images/Net_Salary.webp',
  '/assets/images/sample.webp',
  '/assets/images/message.webp',
  '/assets/images/x-logo.webp',
  '/assets/images/favicon.ico'
];

// インストール時のイベント
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  // 新しいService Workerをすぐにアクティベート
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// アクティベート時のイベント
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    // 古いキャッシュを削除
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // すぐに新しいService Workerを使用
      return self.clients.claim();
    })
  );
});

// フェッチ時のイベント
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあっても、常にネットワークから最新版を取得
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // レスポンスが正常な場合はキャッシュを更新
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
        });
        
        // ネットワーク優先、失敗時はキャッシュを使用
        return fetchPromise.catch(() => response);
      })
  );
});

// メッセージイベント（手動キャッシュクリア用）
self.addEventListener('message', event => {
  if (event.data.action === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[ServiceWorker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // クライアントに完了を通知
        event.ports[0].postMessage({ status: 'Cache cleared' });
      })
    );
  }
});