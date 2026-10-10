"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

/**
 * A tapped notification normally navigates the open app window itself (see
 * public/sw.js). When it can't, the service worker asks the page to go there.
 */
function NotificationNavigator() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "navigate" || typeof e.data.url !== "string") return;
      const url = new URL(e.data.url, window.location.origin);
      if (url.origin === window.location.origin) window.location.assign(url.href);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationNavigator />
      {children}
    </SessionProvider>
  );
}
