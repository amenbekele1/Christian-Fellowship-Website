"use client";

import { ReactNode, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
}

const TRIGGER = 80;      // px pulled before refresh fires
const MAX_PULL = 120;    // visual cap

/**
 * Mobile pull-to-refresh wrapper. Only fires when the scroll position is at
 * the top, so it doesn't conflict with normal list scrolling. Desktop users
 * see no visual difference.
 */
export function PullToRefresh({ onRefresh, children }: Props) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const atTop = () =>
    (document.scrollingElement?.scrollTop ?? window.scrollY) <= 0;

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    if (!atTop()) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && atTop()) {
      // Rubber-band: halve the distance for a bit of resistance
      setPull(Math.min(delta * 0.5, MAX_PULL));
    } else if (delta < 0) {
      setPull(0);
    }
  };

  const onTouchEnd = async () => {
    if (pull >= TRIGGER && !refreshing) {
      setRefreshing(true);
      setPull(TRIGGER / 2);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
    startY.current = null;
  };

  const progress = Math.min(pull / TRIGGER, 1);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        style={{
          height: pull,
          overflow: "hidden",
          transition: pull === 0 ? "height 220ms ease-out" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: pull > 4 || refreshing ? 1 : 0,
        }}
      >
        <RefreshCw
          className={refreshing ? "animate-spin" : ""}
          style={{
            width: 22,
            height: 22,
            color: "#C9A84C",
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            transition: "transform 40ms linear",
          }}
        />
      </div>
      {children}
    </div>
  );
}
