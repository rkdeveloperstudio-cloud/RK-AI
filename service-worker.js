
"use strict";

// ============================================
// RK AI MOBILE ASSISTANT - SERVICE WORKER
// ============================================

const CACHE_NAME = "rk-ai-mobile-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json"
];

// ============================================
// INSTALL
// Cache the basic application files.
// ============================================

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(APP_FILES);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );

});

// ============================================
// ACTIVATE
// Remove old application caches.
// ============================================

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {

                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );

            })
            .then(() => {
                return self.clients.claim();
            })
    );

});

// ============================================
// FETCH
// Serve cached application files when available.
// ============================================

self.addEventListener("fetch", event => {

    const request = event.request;

    // Only handle GET requests.
    if (request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(request.url);

    // Do not cache external resources or API requests.
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    // Never intercept WebSocket requests.
    if (request.headers.get("Upgrade") === "websocket") {
        return;
    }

    event.respondWith(

        caches.match(request)
            .then(cachedResponse => {

                // Return cached application file.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise request it from the server.
                return fetch(request);

            })
            .catch(() => {

                // Basic offline fallback.
                if (request.mode === "navigate") {
                    return caches.match("./index.html");
                }

                return new Response(
                    "You are currently offline.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain"
                        }
                    }
                );

            })

    );

});
