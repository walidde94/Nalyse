const CACHE_NAME = 'nalyse-v1-cache';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/vite.svg',
                '/manifest.json'
            ]);
        })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    // Claim any clients immediately
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignore API requests for caching, let them passthrough or fail as network
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((networkResponse) => {
                // Return network response immediately without caching unless we want to cache all
                return networkResponse;
            }).catch(() => {
                // If it's a page navigation, return the root index.html to avoid the offline dinosaur
                if (event.request.mode === 'navigate') {
                    return caches.match(OFFLINE_URL);
                }
            });
        })
    );
});

// Push notification handling
self.addEventListener('push', (event) => {
    let data = { title: 'Nalyse Intelligence', body: 'New notification received.', icon: '/vite.svg' };
    if (event.data) {
        data = event.data.json();
    }

    const options = {
        body: data.body,
        icon: data.icon || '/vite.svg',
        badge: '/vite.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            { action: 'explore', title: 'View Analysis', icon: '/vite.svg' },
            { action: 'close', title: 'Close', icon: '/vite.svg' },
        ]
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
