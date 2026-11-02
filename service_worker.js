const CACHE_NAME = "todo-app-v1";

const APP_SHELL = [
    "./",
    "./index.php",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./offline.html",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(APP_SHELL);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function(event) {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).then(function(response) {
                if (response.ok) {
                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(request, responseCopy);
                    });
                }

                return response;
            }).catch(async function() {
                const cachedPage = await caches.match(request);

                if (cachedPage) {
                    return cachedPage;
                }

                const cachedIndex = await caches.match("./index.php");

                if (cachedIndex) {
                    return cachedIndex;
                }

                return caches.match("./offline.html");
            })
        );

        return;
    }

    event.respondWith(
        caches.match(request).then(function(cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then(function(response) {
                if (response.ok) {
                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(request, responseCopy);
                    });
                }

                return response;
            });
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clients) {
            for (const client of clients) {
                if ('focus' in client) {
                    return client.focus();
                }
            }

            return self.clients.openWindow('./index.php');
        })
    );
});