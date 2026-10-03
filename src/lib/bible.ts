/**
 * Bible text via API.Bible (https://api.bible), non-commercial Starter plan.
 *
 * Versions shown in the app come from two services:
 *   • API.Bible  — KJV (public domain; YouVersion's developer catalog has no KJV)
 *   • YouVersion Platform — NIV (id 111) and the New Amharic Standard Version
 *     (NASV, id 1260), licensed for our non-commercial app (env YOUVERSION_APP_KEY)
 * The Amharic 1962 is not offered by either, so it opens on Bible.com
 * (AMHARIC_VERSIONS / bibleComUrl in bible-books.ts).
 * Only the 66 books of the Protestant canon are offered.
 *
 * Fair-use rules we follow: cached text is refreshed within 30 days (we
 * revalidate weekly), at most a chapter/passage is fetched at once, the
 * copyright line is shown with every passage, and each display is
 * reported through FUMS (see components/bible/BibleText.tsx).
 *
 * Env: API_BIBLE_KEY (required). BIBLE_ID_KJV / BIBLE_ID_NIV
 * override the automatic lookup if it picks the wrong edition.
 */

const BASE = "https://rest.api.bible/v1";
const WEEK = 60 * 60 * 24 * 7;

export type VersionKey = "KJV" | "NIV" | "NASV";

interface VersionDef {
  key: VersionKey;
  label: string;
  name: string;
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
    key: "KJV", label: "KJV", name: "King James Version", apiLanguage: "eng",
    match: (b) => (has(b.abbreviation, "kjv") || has(b.abbreviationLocal, "kjv")) && !has(b.name, "apocrypha", "deutero"),
  },
];

const ALL_VERSIONS: VersionKey[] = ["KJV", "NIV", "NASV"];

export function isVersionKey(v: unknown): v is VersionKey {
  return ALL_VERSIONS.includes(v as VersionKey);
}

export { BOOKS, getBook, formatReference, passageId } from "./bible-books";
export type { PassageRange } from "./bible-books";
import { BOOKS } from "./bible-books";

const BOOK_IDS = new Set(BOOKS.map((b) => b.id));

/** Versions served by YouVersion Platform, by their YouVersion Bible id. */
const YOUVERSION_IDS: Partial<Record<VersionKey, number>> = { NIV: 111, NASV: 1260 };

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
  const yvId = YOUVERSION_IDS[version];
  if (yvId) return fetchYouVersion(yvId, id);
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

// ── YouVersion Platform ───────────────────────────────────────────

const YV_BASE = "https://api.youversion.com/v1";

async function yv<T>(path: string): Promise<T> {
  const key = process.env.YOUVERSION_APP_KEY;
  if (!key) throw new BibleNotConfigured("YOUVERSION_APP_KEY is not set");
  const res = await fetch(`${YV_BASE}${path}`, {
    headers: { "X-YVP-App-Key": key },
    next: { revalidate: WEEK },
  });
  if (!res.ok) throw new Error(`YouVersion ${res.status} for ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");

/**
 * YouVersion HTML → the "[n]"-marked plain text the app renders.
 * Each <div> is a paragraph/poetry line; a line without its own verse
 * marker continues the previous one (so it is not mistaken for a heading).
 */
export function youVersionHtmlToText(html: string): string {
  const lines: string[] = [];
  for (const block of html.split(/<\/div>/)) {
    let t = block
      .replace(/<span class="yv-vlbl">[^<]*<\/span>/g, "")
      .replace(/<span class="yv-v" v="(\d+)(?:-\d+)?"><\/span>/g, " [$1] ")
      .replace(/<[^>]+>/g, "");
    t = decodeEntities(t).replace(/\s+/g, " ").trim();
    if (!t) continue;
    if (/^\[\d+\]/.test(t) || lines.length === 0) lines.push(t);
    else lines[lines.length - 1] += " " + t;
  }
  return lines.join("\n");
}

/** Keep only verses lo..hi from "[n]"-marked text. */
function sliceVerses(text: string, lo: number, hi: number): string {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const parts = line.split(/(?=\[\d+\])/);
    const kept = parts.filter((p) => {
      const m = p.match(/^\[(\d+)\]/);
      return m ? Number(m[1]) >= lo && Number(m[1]) <= hi : false;
    });
    if (kept.length) out.push(kept.join("").trim());
  }
  return out.join("\n");
}

const copyrightCache = new Map<number, string>();
async function yvCopyright(bibleId: number): Promise<string> {
  if (!copyrightCache.has(bibleId)) {
    const b = await yv<{ copyright?: string | null; title?: string }>(`/bibles/${bibleId}`);
    copyrightCache.set(bibleId, (b.copyright ?? b.title ?? "").trim());
  }
  return copyrightCache.get(bibleId)!;
}

/** Neighbouring chapters in the Protestant canon, for previous/next buttons. */
function chapterNav(bookId: string, chapter: number) {
  const i = BOOKS.findIndex((b) => b.id === bookId);
  const prev =
    chapter > 1 ? { book: bookId, ch: chapter - 1 } : i > 0 ? { book: BOOKS[i - 1].id, ch: BOOKS[i - 1].chapters } : null;
  const next =
    chapter < (BOOKS[i]?.chapters ?? 0) ? { book: bookId, ch: chapter + 1 } : BOOKS[i + 1] ? { book: BOOKS[i + 1].id, ch: 1 } : null;
  const nav = (n: { book: string; ch: number } | null) => (n ? { id: `${n.book}.${n.ch}`, number: String(n.ch) } : null);
  return { previous: nav(prev), next: nav(next) };
}

/**
 * Fetch from YouVersion. Whole chapters are fetched (and cached) and verse
 * ranges are cut out locally, which also handles passages that cross a
 * chapter boundary (YouVersion's passage endpoint does not).
 */
async function fetchYouVersion(bibleId: number, id: string): Promise<ScriptureText> {
  const m = id.match(/^([1-3A-Z]{3})\.(\d+)(?:\.(\d+))?(?:-[1-3A-Z]{3}\.(\d+)(?:\.(\d+))?)?$/)!;
  const [, book, c1s, v1s, c2s, v2s] = m;
  const c1 = Number(c1s);
  const c2 = c2s ? Number(c2s) : c1;
  const v1 = v1s ? Number(v1s) : null;
  const v2 = v2s ? Number(v2s) : v1;

  const chapters = await Promise.all(
    Array.from({ length: c2 - c1 + 1 }, (_, k) => c1 + k).map((ch) =>
      yv<{ content: string; reference: string }>(`/bibles/${bibleId}/passages/${book}.${ch}?format=html`)
    )
  );

  const parts = chapters.map((res, k) => {
    const ch = c1 + k;
    let text = youVersionHtmlToText(res.content);
    if (v1 !== null) {
      const lo = ch === c1 ? v1 : 1;
      const hi = ch === c2 ? (v2 ?? 999) : 999;
      text = sliceVerses(text, lo, hi);
    }
    // A chapter heading line between chapters of a multi-chapter passage.
    return c2 > c1 ? `${res.reference}\n${text}` : text;
  });

  // Localized book name from the chapter reference, e.g. "ዮሐንስ 3" -> "ዮሐንስ".
  const bookName = chapters[0].reference.replace(/\s*\d+$/, "");
  const reference =
    v1 === null
      ? c2 > c1 ? `${bookName} ${c1}–${c2}` : chapters[0].reference
      : c2 > c1
        ? `${bookName} ${c1}:${v1}–${c2}:${v2}`
        : v2 && v2 !== v1 ? `${bookName} ${c1}:${v1}–${v2}` : `${bookName} ${c1}:${v1}`;

  return {
    reference,
    content: parts.join("\n"),
    copyright: await yvCopyright(bibleId),
    fumsToken: null,
    ...chapterNav(book, c1),
  };
}

