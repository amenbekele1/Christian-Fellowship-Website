"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BOOKS } from "@/lib/bible-books";
import { ScriptureView, VersionSwitch, useBibleVersion, AmharicLinks } from "@/components/bible/ScriptureView";

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
  const [pos, setPos] = useState(fromUrl ?? { book: "JHN", chapter: 1 });

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

  const book = BOOKS.find((b) => b.id === pos.book) ?? BOOKS[0];
  const go = (chapterId: string) => {
    const next = parseChapter(chapterId);
    if (!next) return;
    setPos(next);
    router.replace(`/dashboard/bible?chapter=${chapterId}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectStyle = { background: "#fff", border: "1px solid #E0CBB0", color: "#2C1A0E" };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-3xl font-bold" style={{ color: "#2C1A0E" }}>Bible</h1>
        <VersionSwitch value={version} onChange={setVersion} />
      </div>

      <div className="flex gap-2 mb-5">
        <select
          aria-label="Book"
          value={book.id}
          onChange={(e) => go(`${e.target.value}.1`)}
          className="flex-1 min-w-0 h-11 rounded-xl px-3 text-sm font-semibold"
          style={selectStyle}
        >
          <optgroup label="Old Testament">
            {BOOKS.slice(0, 39).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </optgroup>
          <optgroup label="New Testament">
            {BOOKS.slice(39).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </optgroup>
        </select>
        <select
          aria-label="Chapter"
          value={pos.chapter}
          onChange={(e) => go(`${book.id}.${e.target.value}`)}
          className="w-24 h-11 rounded-xl px-3 text-sm font-semibold"
          style={selectStyle}
        >
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}>
        <ScriptureView version={version} chapter={`${pos.book}.${pos.chapter}`} onNavigate={go} />
        <AmharicLinks range={{ bookId: pos.book, startChapter: pos.chapter }} />
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
