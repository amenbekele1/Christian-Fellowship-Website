"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Don't show if already installed (running in standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed in last 7 days
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);

    if (ios) {
      setShow(true);
    }

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (android) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl p-4 shadow-xl flex items-start gap-3"
      style={{ background: "#1C0F07", border: "1px solid rgba(201,168,76,0.3)" }}
    >
      <img src="/icons/icon-72x72.png" alt="WETCF" className="w-12 h-12 rounded-xl shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm" style={{ color: "#FAF7F0" }}>
          Install WETCF App
        </p>
        {isIOS ? (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#C4A882" }}>
            Tap <strong style={{ color: "#C9A84C" }}>Share</strong> then{" "}
            <strong style={{ color: "#C9A84C" }}>"Add to Home Screen"</strong> to install.
          </p>
        ) : (
          <p className="text-xs mt-0.5" style={{ color: "#C4A882" }}>
            Add to your home screen for the full app experience.
          </p>
        )}
        {isAndroid && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "#C9A84C", color: "#1C0F07" }}
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}
      </div>

      <button onClick={handleDismiss} className="shrink-0 p-1" style={{ color: "#7A5C3E" }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
