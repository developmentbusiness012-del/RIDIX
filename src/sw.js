import { precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { createHandlerBoundToURL } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

const denylist = [/^\/api/];
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), { denylist }));

self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());

// ---------- Notifications push ----------
self.addEventListener("push", (event) => {
  let data = { title: "RIDIX", body: "Vous avez une nouvelle notification." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* payload non-JSON, on garde les valeurs par défaut */
  }

  const options = {
    body: data.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});
