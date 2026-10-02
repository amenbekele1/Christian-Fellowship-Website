/**
 * In-memory cache for client-side JSON fetches. Lives for the life of the
 * open app, so a page that fetches on mount (library, profile, tasks…) can
 * show what it had last time instantly and refresh quietly in the
 * background, instead of a spinner on every visit.
 */
const cache = new Map<string, unknown>();

/** Last successful response for `url`, if any. */
export function peekCache<T>(url: string): T | undefined {
  return cache.get(url) as T | undefined;
}

/** GET `url` as JSON and remember the result. Throws on a non-2xx response. */
export async function fetchJsonCached<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

/** Store a response fetched some other way (e.g. when the caller needs the error body). */
export function rememberCache(url: string, data: unknown): void {
  cache.set(url, data);
}
