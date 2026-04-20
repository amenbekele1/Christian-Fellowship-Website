// WETCF Service Worker — handles push notifications

async function updateBadge() {
  try {
    const notifications = await self.registration.getNotifications();
    if (self.navigator.setAppBadge) {
      if (notifications.length > 0) {
        await self.navigator.setAppBadge(notifications.length);
      } else if (self.navigator.clearAppBadge) {
        await self.navigator.clearAppBadge();
      }
    }
  } catch (e) {
    // Badging API not supported — silently ignore
  }
}

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

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => updateBadge())
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    (async () => {
      await updateBadge();
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })()
  );
});

// When a notification is dismissed (swiped away), update the badge
self.addEventListener("notificationclose", function (event) {
  event.waitUntil(updateBadge());
});
