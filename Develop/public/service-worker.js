// Files to cache
const FILES_TO_CACHE = [
  "/",
  "/icons/icon-200x200.png",
  "/icons/icon-500x500.png",
  "/index.html",
  "/index.js",
  "/styles.css",
];

const CACHE_NAME = "transaction-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

//Install service-worker
self.addEventListener("install", function (evt) {
  console.log("installing service worker");
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (evt) {
  console.log("Running activate of service worker");
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (evt) {
  console.log("service worker fetch request");
  // Intercept all /api calls and if successful copy info into cache
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                console.log("Cache success");
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }
  // If fetch is not an /api call then
  evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("fetch is not /api");
      return cache.match(evt.request).then((response) => {
        return response || fetch(evt.request);
      });
    })
  );
});
