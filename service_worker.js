self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
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