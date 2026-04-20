// WETCF Service Worker — handles push notifications

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "WETCF", body: event.data.text() }; }

  const title   = data.title || "WETCF";
  const options = {
    body:               data.body || "",
    icon:               "/icons/icon-192x192.png",
    badge:              "/icons/icon-96x96.png",
    data:               { url: data.url || "/dashboard" },
    vibrate:            [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
