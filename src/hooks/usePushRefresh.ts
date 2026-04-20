"use client";

import { useEffect, useRef } from "react";

/**
 * Listens for refresh messages from the service worker and invokes onRefresh
 * when the message's topic matches. Pass "*" to match every topic.
 *
 * Server sends these via sendRefreshPush(topic) which fires a silent web push
 * that the service worker broadcasts to open clients via postMessage.
 */
export function usePushRefresh(
  topics: string | string[],
  onRefresh: () => void | Promise<void>
) {
  const refRef = useRef(onRefresh);
  refRef.current = onRefresh;

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const list = Array.isArray(topics) ? topics : [topics];
    const matchAny = list.includes("*");

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type !== "refresh") return;
      if (matchAny || list.includes(data.topic)) {
        refRef.current();
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(topics) ? topics.join(",") : topics]);
}
