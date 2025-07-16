// キャッシュの名前を定義
const CACHE_NAME = 'terop-ticker-cache-v3'; // ★バージョンを更新

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
  );// sw.js
  const CACHE_NAME = 'rss-ticker-cache-v1';
  const urlsToCache = [
      './',
      './index.html',
      // 他のアセット...
  ];
  
  self.addEventListener('install', (event) => {
      event.waitUntil(
          caches.open(CACHE_NAME)
              .then((cache) => {
                  console.log('Opened cache');
                  return cache.addAll(urlsToCache);
              })
      );
  });
  
  self.addEventListener('fetch', (event) => {
      event.respondWith(
          caches.match(event.request)
              .then((response) => {
                  if (response) {
                      return response;
                  }
                  return fetch(event.request).then(
                      (response) => {
                          if (!response || response.status !== 200 || response.type !== 'basic') {
                              return response;
                          }
                          const responseToCache = response.clone();
                          caches.open(CACHE_NAME)
                              .then((cache) => {
                                  cache.put(event.request, responseToCache);
                              });
                          return response;
                      }
                  );
              })
      );
  });
  
  // バックグラウンド同期イベント (定期的なRSS更新)
  self.addEventListener('sync', (event) => {
      if (event.tag === 'feed-update') {
          event.waitUntil(updateFeeds());
      }
  });
  
  // 定期的なフィード更新処理
  async function updateFeeds() {
      // ここにRSSフィードを取得して更新するロジックを実装
      // 例:
      // 1. 保存されたRSSフィードのURLを取得
      // 2. 各URLからフィードを取得
      // 3. 取得したフィードをlocalStorageなどに保存
      // 4. 必要であれば、クライアントに更新を通知 (例: postMessage)
  
      // ※ index.html との連携部分 (例: フィードURLの取得や更新データの保存場所) は、
      //   現在のコードに合わせて適切に実装する必要があります。
      console.log('バックグラウンドでフィードを更新しました。');
  }
  
  // 定期的な同期を登録 (例: 1時間に1回)
  self.addEventListener('activate', (event) => {
      event.waitUntil(
          Promise.all([
              self.registration.periodicSync.register('feed-update', {
                  minInterval: 60 * 60 * 1000, // 1時間 (ミリ秒)
              }),
              caches.keys().then(function(cacheNames) {
                  return Promise.all(
                      cacheNames.map(function(cacheName) {
                          if (CACHE_NAME !== cacheName) {
                              return caches.delete(cacheName);
                          }
                      })
                  );
              })
          ])
      );
  });
  
});

// 3. Service Workerの有効化と古いキャッシュの削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    // 現在のキャッシュ名をすべて取得
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // ホワイトリストに含まれていない古いキャッシュを削除
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
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