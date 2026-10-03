import { waitUntil } from "@vercel/functions";

/**
 * Run work (push notifications, emails) after the response has been sent.
 *
 * On Vercel the function is frozen as soon as it responds, so a plain
 * un-awaited promise stalls until the next request wakes the instance —
 * notifications arrived late or not at all. waitUntil keeps the function
 * alive until the work settles. Errors are logged, never thrown.
 */
export function background(work: Promise<unknown>, label = "background task"): void {
  const safe = work.catch((err) => console.error(`${label} failed:`, err?.message ?? err));
  try {
    waitUntil(safe);
  } catch {
    // Outside a Vercel request context (e.g. local scripts) — just let it run.
  }
}
