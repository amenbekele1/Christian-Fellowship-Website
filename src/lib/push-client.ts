const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

/** Set when the member turns notifications off — we must not quietly re-subscribe them. */
const OPT_OUT_KEY = "push-opted-out";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  const buffer  = new ArrayBuffer(raw.length);
  const view    = new DataView(buffer);
  for (let i = 0; i < raw.length; i++) {
    view.setUint8(i, raw.charCodeAt(i));
  }
  return buffer;
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Register the service worker and return its registration. */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

/**
 * The registration once its worker is *active*. Subscribing before that
 * fails — which is what broke the first-visit prompt: the worker was still
 * installing when the member tapped "Allow".
 */
async function readyRegistration(timeoutMs = 15000): Promise<ServiceWorkerRegistration | null> {
  await registerSW();
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), timeoutMs)),
  ]);
}

async function saveSubscription(sub: PushSubscription): Promise<boolean> {
  try {
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Get this device's subscription, creating it if needed, and make sure our server has it. */
async function ensureSubscribed(): Promise<PushSubscription | null> {
  const reg = await readyRegistration();
  if (!reg) return null;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
    }));
  return (await saveSubscription(sub)) ? sub : null;
}

/**
 * Turn notifications on (from a button tap). Asks for permission FIRST —
 * Safari only shows the prompt when it is requested directly from the tap.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  try {
    localStorage.removeItem(OPT_OUT_KEY);
    return await ensureSubscribed();
  } catch (err) {
    console.error("Push subscribe failed:", err);
    return null;
  }
}

/**
 * Called on every app load: if notifications are allowed and the member
 * hasn't turned them off, re-create/re-send the subscription. Browsers
 * rotate or drop subscriptions and our server deletes expired ones — this
 * keeps "on" actually on.
 */
export async function syncPushSubscription(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  if (localStorage.getItem(OPT_OUT_KEY)) return false;
  try {
    return Boolean(await ensureSubscribed());
  } catch {
    return false;
  }
}

/** Unsubscribe and remove from server. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    localStorage.setItem(OPT_OUT_KEY, "1");
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    await fetch(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
    return sub.unsubscribe();
  } catch {
    return false;
  }
}

/** Returns the current notification permission state. */
export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/** Returns true if the browser currently has an active push subscription. */
export async function isSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
