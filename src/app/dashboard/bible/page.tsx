"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BOOKS } from "@/lib/bible-books";
import { ScriptureView, VersionSwitch, useBibleVersion, AmharicLinks } from "@/components/bible/ScriptureView";
import { PassagePicker, stepChapter, type Position } from "@/components/bible/PassagePicker";

const LAST_KEY = "wecf.bibleLast";

function parseChapter(id: string | null): { book: string; chapter: number } | null {
  const m = id?.match(/^([1-3A-Z]{3})\.(\d{1,3})$/);
  if (!m || !BOOKS.some((b) => b.id === m[1])) return null;
  return { book: m[1], chapter: Number(m[2]) };
}

function Reader() {
  const router = useRouter();
  const params = useSearchParams();
  const [version, setVersion] = useBibleVersion();
  const fromUrl = parseChapter(params.get("chapter"));
  const verseParam = Number(params.get("verse")) || null;
  const [pos, setPos] = useState<Position>(fromUrl ? { ...fromUrl, verse: verseParam } : { book: "JHN", chapter: 1 });

  // Resume where the member left off, unless a link asked for a chapter.
  useEffect(() => {
    if (fromUrl) return;
    try {
      const last = parseChapter(localStorage.getItem(LAST_KEY));
      if (last) setPos(last);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LAST_KEY, `${pos.book}.${pos.chapter}`); } catch {}
  }, [pos]);

  const go = (next: Position) => {
    setPos(next);
    const q = `chapter=${next.book}.${next.chapter}${next.verse ? `&verse=${next.verse}` : ""}`;
    router.replace(`/dashboard/bible?${q}`, { scroll: false });
    // A verse is scrolled to by ScriptureView; a new chapter starts at the top.
    if (!next.verse) document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prev = stepChapter(pos, -1);
  const next = stepChapter(pos, 1);
  const arrow = "w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl transition-colors disabled:opacity-30";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-3xl font-bold" style={{ color: "#2C1A0E" }}>Bible</h1>
        <VersionSwitch value={version} onChange={setVersion} />
      </div>

      {/* Sticky so the picker is always at hand while reading */}
      <div className="sticky top-0 z-20 -mx-4 lg:mx-0 px-4 lg:px-0 py-2 mb-3" style={{ background: "rgba(249,250,251,0.92)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-2">
          <button
            disabled={!prev}
            onClick={() => prev && go(prev)}
            className={arrow}
            style={{ background: "#F0E6D3", color: "#3D2410" }}
            aria-label="Previous chapter"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <PassagePicker value={pos} version={version} onChange={go} />
          <button
            disabled={!next}
            onClick={() => next && go(next)}
            className={arrow}
            style={{ background: "#F0E6D3", color: "#3D2410" }}
            aria-label="Next chapter"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}>
        <ScriptureView
          version={version}
          chapter={`${pos.book}.${pos.chapter}`}
          verse={pos.verse}
          onNavigate={(id) => {
            const p = parseChapter(id);
            if (p) go(p);
          }}
        />
        <AmharicLinks range={{ bookId: pos.book, startChapter: pos.chapter, startVerse: pos.verse ?? null, endVerse: pos.verse ?? null }} />
      </div>
    </div>
  );
}

export default function BiblePage() {
  return (
    <Suspense>
      <Reader />
    </Suspense>
  );
}
