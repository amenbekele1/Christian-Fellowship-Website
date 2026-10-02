"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { peekCache, rememberCache } from "@/lib/fetch-cache";

export const VERSION_TABS = [
  { key: "KJV", label: "KJV", lang: "en" },
  { key: "NIV", label: "NIV", lang: "en" },
  { key: "AM1962", label: "1962", lang: "am" },
  { key: "NASV", label: "NASV", lang: "am" },
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

/** "[16] For God so loved…" → paragraphs with superscript verse numbers. */
function Verses({ content }: { content: string }) {
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
        return (
          <p key={i} className="mb-3">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <sup key={j} className="font-sans font-bold text-[0.65em] mr-0.5 select-none" style={{ color: "#A8862E" }}>
                  {part}
                </sup>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
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
  onNavigate,
}: {
  version: VersionKey;
  passage?: string;
  chapter?: string;
  onNavigate?: (chapterId: string) => void;
}) {
  const url = textUrl(version, { passage, chapter });
  const [text, setText] = useState<ScriptureText | null>(() => peekCache<ScriptureText>(url) ?? null);
  const [error, setError] = useState<string | null>(null);
  const lang = VERSION_TABS.find((t) => t.key === version)?.lang ?? "en";

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
          <div
            lang={lang}
            className={lang === "am" ? "text-[17px] leading-[1.9]" : "font-scripture text-[17px] leading-[1.8]"}
            style={{ color: "#2C1A0E" }}
          >
            <Verses content={text.content} />
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
