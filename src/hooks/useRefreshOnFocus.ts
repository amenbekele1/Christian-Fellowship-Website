"use client";

import { useEffect, useRef } from "react";

/**
 * Triggers onRefresh whenever the tab/PWA becomes visible or regains focus.
 * Debounced so multiple rapid triggers (focus + visibilitychange firing in
 * quick succession) only fire once.
 */
export function useRefreshOnFocus(onRefresh: () => void | Promise<void>) {
  const refRef = useRef(onRefresh);
  refRef.current = onRefresh;

  useEffect(() => {
    let lastRun = 0;
    const COOLDOWN_MS = 2000;

    const fire = () => {
      if (Date.now() - lastRun < COOLDOWN_MS) return;
      lastRun = Date.now();
      refRef.current();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") fire();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", fire);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", fire);
    };
  }, []);
}
