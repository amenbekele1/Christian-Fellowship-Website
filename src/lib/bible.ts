/**
 * Bible text via API.Bible (https://api.bible), non-commercial Starter plan.
 *
 * Versions: KJV (public domain) and NIV in English; Amharic 1962 and the
 * New Amharic Standard Version (NASV). The three copyrighted ones are the
 * plan's three licensed translations. Only the 66 books of the Protestant
 * canon are offered.
 *
 * Fair-use rules we follow: cached text is refreshed within 30 days (we
 * revalidate weekly), at most a chapter/passage is fetched at once, the
 * copyright line is shown with every passage, and each display is
 * reported through FUMS (see components/bible/BibleText.tsx).
 *
 * Env: API_BIBLE_KEY (required). BIBLE_ID_KJV / _NIV / _AM1962 / _NASV
 * override the automatic lookup if it picks the wrong edition.
 */

const BASE = "https://rest.api.bible/v1";
const WEEK = 60 * 60 * 24 * 7;

export type VersionKey = "KJV" | "NIV" | "AM1962" | "NASV";

interface VersionDef {
  key: VersionKey;
  label: string;
  name: string;
  lang: "en" | "am";
  apiLanguage: string;
  /** Picks this version out of the /bibles list when no env override is set. */
  match: (b: ApiBible) => boolean;
}

interface ApiBible {
  id: string;
  abbreviation: string;
  abbreviationLocal: string;
  name: string;
  nameLocal: string;
  language: { id: string };
}

const has = (s: string | undefined, ...needles: string[]) =>
  needles.some((n) => (s ?? "").toLowerCase().includes(n.toLowerCase()));

export const VERSIONS: VersionDef[] = [
  {
    key: "KJV", label: "KJV", name: "King James Version", lang: "en", apiLanguage: "eng",
    match: (b) => (has(b.abbreviation, "kjv") || has(b.abbreviationLocal, "kjv")) && !has(b.name, "apocrypha", "deutero"),
  },
  {
    key: "NIV", label: "NIV", name: "New International Version", lang: "en", apiLanguage: "eng",
    match: (b) => b.id === "78a9f6124f344018-01" || has(b.abbreviation, "niv") || has(b.abbreviationLocal, "niv"),
  },
  {
    key: "AM1962", label: "1962", name: "Amharic 1962 (አማርኛ 1954)", lang: "am", apiLanguage: "amh",
    match: (b) => has(b.name, "1962", "1954") || has(b.nameLocal, "1954", "1962") || has(b.abbreviation, "1962"),
  },
  {
    key: "NASV", label: "NASV", name: "New Amharic Standard Version (አዲሱ መደበኛ ትርጒም)", lang: "am", apiLanguage: "amh",
    match: (b) => has(b.abbreviation, "nasv") || has(b.abbreviationLocal, "nasv") || has(b.name, "new amharic standard"),
  },
];

export function isVersionKey(v: unknown): v is VersionKey {
  return VERSIONS.some((x) => x.key === v);
}

export { BOOKS, getBook, formatReference, passageId } from "./bible-books";
export type { PassageRange } from "./bible-books";
import { BOOKS } from "./bible-books";

const BOOK_IDS = new Set(BOOKS.map((b) => b.id));

/** Validate a passage/chapter id before it is sent to the API. */
export function isSafeScriptureId(id: string): boolean {
  const m = id.match(/^([1-3A-Z]{3})\.\d{1,3}(\.\d{1,3})?(-([1-3A-Z]{3})\.\d{1,3}(\.\d{1,3})?)?$/);
  return Boolean(m && BOOK_IDS.has(m[1]) && (!m[4] || m[4] === m[1]));
}

// ── API access ────────────────────────────────────────────────────

export class BibleNotConfigured extends Error {}

async function api<T>(path: string): Promise<T> {
  const key = process.env.API_BIBLE_KEY;
  if (!key) throw new BibleNotConfigured("API_BIBLE_KEY is not set");
  const res = await fetch(`${BASE}${path}`, {
    headers: { "api-key": key },
    next: { revalidate: WEEK },
  });
  if (!res.ok) throw new Error(`API.Bible ${res.status} for ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

/** Map each version to the Bible id available to our key. */
export async function resolveBibleIds(): Promise<Partial<Record<VersionKey, string>>> {
  const out: Partial<Record<VersionKey, string>> = {};
  const needLookup: VersionDef[] = [];
  for (const v of VERSIONS) {
    const fromEnv = process.env[`BIBLE_ID_${v.key}`];
    if (fromEnv) out[v.key] = fromEnv;
    else needLookup.push(v);
  }
  if (needLookup.length) {
    const { data } = await api<{ data: ApiBible[] }>("/bibles");
    for (const v of needLookup) {
      const hit = data.find((b) => b.language?.id === v.apiLanguage && v.match(b));
      if (hit) out[v.key] = hit.id;
    }
  }
  return out;
}

export interface ScriptureText {
  reference: string;
  /** Plain text with "[n]" verse markers, newline-separated paragraphs. */
  content: string;
  copyright: string;
  fumsToken: string | null;
  previous?: { id: string; number: string } | null;
  next?: { id: string; number: string } | null;
}

const TEXT_PARAMS =
  "content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false" +
  "&include-verse-numbers=true&include-verse-spans=false&fums-version=3";

async function fetchScripture(version: VersionKey, kind: "passages" | "chapters", id: string): Promise<ScriptureText> {
  if (!isSafeScriptureId(id)) throw new Error("Invalid reference");
  const ids = await resolveBibleIds();
  const bibleId = ids[version];
  if (!bibleId) throw new Error(`${version} is not available for this API key`);
  const res = await api<{
    data: { reference: string; content: string; copyright: string; previous?: any; next?: any };
    meta?: { fumsToken?: string };
  }>(`/bibles/${bibleId}/${kind}/${id}?${TEXT_PARAMS}`);
  const nav = (n: any) => (n && BOOK_IDS.has(n.bookId) ? { id: n.id, number: n.number } : null);
  return {
    reference: res.data.reference,
    content: res.data.content,
    copyright: res.data.copyright,
    fumsToken: res.meta?.fumsToken ?? null,
    previous: nav(res.data.previous),
    next: nav(res.data.next),
  };
}

export const getPassage = (version: VersionKey, id: string) => fetchScripture(version, "passages", id);
export const getChapter = (version: VersionKey, id: string) => fetchScripture(version, "chapters", id);

/** Book names in a version's own language, limited to the Protestant canon. */
export async function getBookNames(version: VersionKey): Promise<Record<string, string>> {
  const ids = await resolveBibleIds();
  const bibleId = ids[version];
  if (!bibleId) return {};
  const { data } = await api<{ data: { id: string; name: string }[] }>(`/bibles/${bibleId}/books`);
  return Object.fromEntries(data.filter((b) => BOOK_IDS.has(b.id)).map((b) => [b.id, b.name]));
}
