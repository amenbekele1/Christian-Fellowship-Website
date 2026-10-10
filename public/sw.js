// WECF Service Worker — handles push notifications

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

async function broadcastRefresh(topic) {
  const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((w) => {
    try { w.postMessage({ type: "refresh", topic }); } catch {}
  });
}

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "WECF", body: event.data.text() }; }

  // Silent refresh — broadcast to open clients, do not show a notification
  if (data.type === "refresh") {
    event.waitUntil(broadcastRefresh(data.topic || "*"));
    return;
  }

  const title   = data.title || "WECF";
  const options = {
    body:               data.body || "",
    icon:               "/icons/icon-192x192.png",
    // Android status-bar icon: white silhouette on transparent. A full-colour
    // icon here shows up as a plain white square.
    badge:              "/icons/badge-96x96.png",
    data:               { url: data.url || "/dashboard" },
    vibrate:            [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => updateBadge())
      // Also nudge open clients to refetch the relevant topic
      .then(() => broadcastRefresh(data.topic || "notifications"))
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  // Absolute URL of the thing this notification is about.
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    (async () => {
      await updateBadge();
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        try { await client.focus(); } catch (e) {}
        try {
          await client.navigate(target);
          return;
        } catch (e) {
          // Window not controlled by this worker — ask the page to go there itself.
          client.postMessage({ type: "navigate", url: target });
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })()
  );
});

// Browsers renew push subscriptions from time to time. Send the new one to
// our server straight away, or notifications silently stop arriving.
self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    (async () => {
      let sub = event.newSubscription;
      if (!sub && event.oldSubscription && event.oldSubscription.options) {
        sub = await self.registration.pushManager.subscribe(event.oldSubscription.options);
      }
      if (!sub) return;
      await fetch("/api/push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    })()
  );
});

// When a notification is dismissed (swiped away), update the badge
self.addEventListener("notificationclose", function (event) {
  event.waitUntil(updateBadge());
});
