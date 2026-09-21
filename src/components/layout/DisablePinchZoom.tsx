"use client";

import { useEffect } from "react";

/**
 * Blocks pinch-to-zoom gestures via touch events.
 * The viewport meta tag (user-scalable=no) is ignored by iOS 10+ and recent
 * Android Chrome as an accessibility override, so we intercept the gestures
 * at the JS level instead.
 */
export function DisablePinchZoom() {
  useEffect(() => {
    // Block multi-finger touchmove (both iOS and Android)
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };

    // Block Safari gesture events (iOS-specific pinch API)
    const preventGesture = (e: Event) => e.preventDefault();

    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  return null;
}
