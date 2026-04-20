"use client";

import { useEffect } from "react";

/**
 * Clears the PWA app icon badge whenever the dashboard is opened or
 * regains focus. Paired with the service worker which sets the badge
 * count based on active notifications.
 */
export function BadgeClearer() {
  useEffect(() => {
    const clear = async () => {
      try {
        // @ts-expect-error — Badging API is not yet in TS lib.dom
        if (navigator.clearAppBadge) await navigator.clearAppBadge();

        // Also close any lingering notifications so count stays accurate
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration("/sw.js");
          const notifications = (await reg?.getNotifications()) ?? [];
          notifications.forEach((n) => n.close());
        }
      } catch {
        // Unsupported — silently ignore
      }
    };

    clear();

    const onVisible = () => {
      if (document.visibilityState === "visible") clear();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", clear);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", clear);
    };
  }, []);

  return null;
}
