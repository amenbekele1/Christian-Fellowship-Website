"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ExternalLink } from "lucide-react";
import { peekCache, rememberCache } from "@/lib/fetch-cache";
import { AMHARIC_VERSIONS, bibleComUrl, type PassageRange } from "@/lib/bible-books";

/** Amharic versions open the same passage on Bible.com / the YouVersion app. */
export function AmharicLinks({ range }: { range: PassageRange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid #F0E6D3" }}>
      <span lang="am" className="text-sm font-semibold mr-1" style={{ color: "#5C3D20" }}>በአማርኛ ያንብቡ</span>
      {AMHARIC_VERSIONS.map((v) => (
        <a
          key={v.key}
          href={bibleComUrl(v.youVersionId, range)}
          target="_blank"
          rel="noopener noreferrer"
          title={`${v.title} — opens on Bible.com`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: "#F0E6D3", color: "#3D2410" }}
        >
          {v.label} <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export const VERSION_TABS = [
  { key: "KJV", label: "KJV" },
  { key: "NIV", label: "NIV" },
] as const;
export type VersionKey = (typeof VERSION_TABS)[number]["key"];

const STORAGE_KEY = "wecf.bibleVersion";

/** The member's preferred version, remembered on this device. */
export function useBibleVersion(): [VersionKey, (v: VersionKey) => void] {
  const [version, setVersion] = useState<VersionKey>("KJV");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (VERSION_TABS.some((t) => t.key === saved)) setVersion(saved as VersionKey);
    } catch {}
  }, []);
  const choose = (v: VersionKey) => {
    setVersion(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  };
  return [version, choose];
}

export function VersionSwitch({ value, onChange }: { value: VersionKey; onChange: (v: VersionKey) => void }) {
  return (
    <div role="tablist" aria-label="Bible version" className="inline-flex rounded-xl p-1 gap-1" style={{ background: "#F0E6D3" }}>
      {VERSION_TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={value === t.key ? { background: "#3D2410", color: "#FAF7F0" } : { color: "#5C3D20" }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

interface ScriptureText {
  reference: string;
  content: string;
  copyright: string;
  fumsToken: string | null;
  previous?: { id: string; number: string } | null;
  next?: { id: string; number: string } | null;
}

declare global {
  interface Window {
    fums?: (...args: unknown[]) => void;
    fumsData?: unknown[];
  }
}

/** Report a display to API.Bible's Fair Use Management System (required). */
function trackView(token: string | null) {
  if (!token || typeof window === "undefined") return;
  window.fumsData = window.fumsData || [];
  window.fums = window.fums || function (...args: unknown[]) { window.fumsData!.push(args); };
  window.fums("trackView", token);
}

/** Verse numbers present in "[n]"-marked text, in order. */
export function verseNumbers(content: string): number[] {
  return Array.from(content.matchAll(/\[(\d+)\]/g), (m) => Number(m[1]));
}

/**
 * "[16] For God so loved…" → paragraphs with superscript verse numbers.
 * Each verse is a span with id "v-<n>" so the reader can scroll to it.
 */
function Verses({ content, highlight }: { content: string; highlight?: number | null }) {
  const paragraphs = content.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => {
        const parts = para.split(/\[(\d+)\]\s*/);
        // A paragraph without verse markers is a section heading.
        if (parts.length === 1) {
          return (
            <h4 key={i} className="font-display font-bold text-base mt-5 mb-1" style={{ color: "#3D2410" }}>
              {para}
            </h4>
          );
        }
        const verses: { n: number; text: string }[] = [];
        for (let j = 1; j < parts.length; j += 2) verses.push({ n: Number(parts[j]), text: parts[j + 1] ?? "" });
        return (
          <p key={i} className="mb-3">
            {parts[0] && <span>{parts[0]}</span>}
            {verses.map(({ n, text }) => (
              <span
                key={n}
                id={`v-${n}`}
                className="scroll-mt-24 rounded transition-colors duration-700"
                style={highlight === n ? { background: "rgba(201,168,76,0.28)", boxShadow: "0 0 0 3px rgba(201,168,76,0.28)" } : undefined}
              >
                <sup className="font-sans font-bold text-[0.65em] mr-0.5 select-none" style={{ color: "#A8862E" }}>{n}</sup>
                {text}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function textUrl(version: VersionKey, ref: { passage?: string; chapter?: string }) {
  return ref.passage
    ? `/api/bible/text?v=${version}&passage=${encodeURIComponent(ref.passage)}`
    : `/api/bible/text?v=${version}&chapter=${encodeURIComponent(ref.chapter ?? "")}`;
}

/**
 * Shows a passage or a chapter in the chosen version. Pass `onNavigate` to
 * get previous/next chapter buttons (used by the reader).
 */
export function ScriptureView({
  version,
  passage,
  chapter,
  verse,
  onNavigate,
}: {
  version: VersionKey;
  passage?: string;
  chapter?: string;
  /** Scroll to and briefly highlight this verse once the text is shown. */
  verse?: number | null;
  onNavigate?: (chapterId: string) => void;
}) {
  const url = textUrl(version, { passage, chapter });
  const [text, setText] = useState<ScriptureText | null>(() => peekCache<ScriptureText>(url) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);

  // Glide to the requested verse once its text is on screen.
  useEffect(() => {
    if (!verse || !text) return;
    const el = document.getElementById(`v-${verse}`);
    if (!el) return;
    const t1 = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(verse);
    }, 80);
    const t2 = setTimeout(() => setHighlight(null), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [verse, text]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setText(peekCache<ScriptureText>(url) ?? null);
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load this passage.");
        return data as ScriptureText;
      })
      .then((data) => {
        if (cancelled) return;
        rememberCache(url, data);
        setText(data);
        trackView(data.fumsToken);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div>
      <Script src="https://pkg.api.bible/fumsV3.min.js" strategy="afterInteractive" />

      {error && !text ? (
        <p className="text-sm py-6 text-center" style={{ color: "#8A6A4A" }}>{error}</p>
      ) : !text ? (
        <div className="space-y-2 py-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ background: "#F0E6D3", width: `${92 - i * 9}%` }} />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8A6A1F" }}>
            {text.reference}
          </p>
          <div className="font-scripture text-[17px] leading-[1.8]" style={{ color: "#2C1A0E" }}>
            <Verses content={text.content} highlight={highlight} />
          </div>
          {onNavigate && (text.previous || text.next) && (
            <div className="flex justify-between mt-6 gap-3">
              <button
                disabled={!text.previous}
                onClick={() => text.previous && onNavigate(text.previous.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                style={{ background: "#F0E6D3", color: "#3D2410" }}
              >
                ← Previous
              </button>
              <button
                disabled={!text.next}
                onClick={() => text.next && onNavigate(text.next.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                style={{ background: "#3D2410", color: "#FAF7F0" }}
              >
                Next →
              </button>
            </div>
          )}
          <p className="text-[11px] mt-5 leading-snug" style={{ color: "#9A7B5C" }}>{text.copyright}</p>
        </>
      )}
    </div>
  );
}
