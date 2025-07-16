// キャッシュの名前を定義
const CACHE_NAME = 'terop-ticker-cache-v1';

// キャッシュするファイルのリスト
const urlsToCache = [
  '/', // ルートURL (index.html)
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// 1. Service Workerのインストール処理
self.addEventListener('install', (event) => {
  // installイベントが完了するまで待機
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // 指定されたファイルをすべてキャッシュに追加
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. リクエストへの応答 (キャッシュの利用)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // caches.match()でリクエストに一致するキャッシュがあるか確認
    caches.match(event.request)
      .then((response) => {
        // キャッシュがあれば、それを返す
        if (response) {
          return response;
        }
        // キャッシュがなければ、通常通りネットワークから取得
        return fetch(event.request);
      })
  );
});