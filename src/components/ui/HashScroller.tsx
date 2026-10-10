"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to #section links (e.g. a notification opening
 * /dashboard/profile#feedback) even when that section only appears after
 * the page has loaded its data. Retries briefly, then gives up.
 */
export function HashScroller() {
  const pathname = usePathname();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        clearInterval(timer);
      } else if (++tries > 30) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname]);
  return null;
}
