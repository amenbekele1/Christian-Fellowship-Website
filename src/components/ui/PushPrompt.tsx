"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { subscribeToPush, getPermissionState, isSubscribed, registerSW, pushSupported, syncPushSubscription } from "@/lib/push-client";
import { toast } from "@/components/ui/toaster";

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Register service worker silently on every load
    registerSW();

    const init = async () => {
      // No push here (e.g. iPhone Safari outside the installed app) — don't offer it.
      if (!pushSupported()) return;

      const permission = getPermissionState();
      if (permission === "denied") return;      // Can't ask again
      if (permission === "granted") {
        // Already allowed: keep this device registered with our server
        // (browsers rotate subscriptions; expired ones get removed).
        syncPushSubscription();
        return;
      }

      // Don't re-show if dismissed recently
      const dismissed = localStorage.getItem("push-prompt-dismissed");
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

      // Don't show if already subscribed
      if (await isSubscribed()) return;

      // Show after a short delay so the dashboard has settled
      setTimeout(() => setShow(true), 4000);
    };

    init();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    const sub = await subscribeToPush();
    setLoading(false);
    if (sub) {
      setShow(false);
      toast.success("Notifications are on");
      return;
    }
    if (getPermissionState() === "denied") {
      toast.error("Notifications are blocked. You can allow them in your phone's settings for this app.");
      handleDismiss();
    } else {
      toast.error("Couldn't turn notifications on just now. Please try again, or use Profile → Push Notifications.");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-prompt-dismissed", String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl p-4 shadow-xl flex items-start gap-3 animate-fade-up"
      style={{ background: "#1C0F07", border: "1px solid rgba(201,168,76,0.3)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(201,168,76,0.15)" }}
      >
        <Bell className="w-5 h-5" style={{ color: "#C9A84C" }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm" style={{ color: "#FAF7F0" }}>
          Stay in the loop
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#C4A882" }}>
          Get notified about new announcements and upcoming events from the fellowship.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAllow}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60"
            style={{ background: "#C9A84C", color: "#1C0F07" }}
          >
            {loading ? "Enabling…" : "Allow notifications"}
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: "#9A7B5C" }}
          >
            Not now
          </button>
        </div>
      </div>

      <button onClick={handleDismiss} className="shrink-0 p-1" style={{ color: "#7A5C3E" }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
