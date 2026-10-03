"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, Search, X, BookOpen } from "lucide-react";
import { BOOKS } from "@/lib/bible-books";
import { peekCache, rememberCache } from "@/lib/fetch-cache";
import { textUrl, verseNumbers, type VersionKey } from "./ScriptureView";

export interface Position {
  book: string;
  chapter: number;
  verse?: number | null;
}

type Step = "book" | "chapter" | "verse";

const OT = BOOKS.slice(0, 39);
const NT = BOOKS.slice(39);

/**
 * Book → chapter → verse picker in a centred card. It is portalled to
 * <body> so ancestors with transforms/backdrop-filter (e.g. the reader's
 * sticky toolbar) can't trap it; tapping outside closes it.
 */
export function PassagePicker({
  value,
  version,
  onChange,
}: {
  value: Position;
  version: VersionKey;
  onChange: (p: Position) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("book");
  const [book, setBook] = useState(value.book);
  const [chapter, setChapter] = useState(value.chapter);
  const [testament, setTestament] = useState<"OT" | "NT">(OT.some((b) => b.id === value.book) ? "OT" : "NT");
  const [query, setQuery] = useState("");
  const [verses, setVerses] = useState<number[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = BOOKS.find((b) => b.id === value.book) ?? BOOKS[0];
  const picked = BOOKS.find((b) => b.id === book) ?? BOOKS[0];
  const label = `${current.am} ${value.chapter}${value.verse ? `:${value.verse}` : ""}`;

  const openPicker = () => {
    setBook(value.book);
    setChapter(value.chapter);
    setTestament(OT.some((b) => b.id === value.book) ? "OT" : "NT");
    setQuery("");
    setStep("book");
    setOpen(true);
  };

  // Escape closes; focus the search box when the book list opens (desktop).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    if (step === "book" && window.matchMedia("(min-width: 640px)").matches) searchRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  // Verse numbers come from the chapter text itself (same request the
  // reader makes, so it is usually already cached).
  useEffect(() => {
    if (!open || step !== "verse") return;
    const url = textUrl(version, { chapter: `${book}.${chapter}` });
    const cached = peekCache<{ content: string }>(url);
    if (cached) { setVerses(verseNumbers(cached.content)); return; }
    setVerses(null);
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        rememberCache(url, data);
        if (!cancelled) setVerses(verseNumbers(data.content));
      })
      .catch(() => !cancelled && setVerses([]));
    return () => { cancelled = true; };
  }, [open, step, book, chapter, version]);

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return BOOKS.filter((b) => b.am.includes(query.trim()) || b.name.toLowerCase().includes(q) || b.id.toLowerCase().startsWith(q));
    return testament === "OT" ? OT : NT;
  }, [query, testament]);

  const choose = (p: Position) => {
    onChange(p);
    setOpen(false);
  };

  const back = () => setStep(step === "verse" ? "chapter" : "book");

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="flex-1 min-w-0 h-12 flex items-center gap-2.5 px-4 rounded-2xl text-left transition-shadow hover:shadow-md"
        style={{ background: "linear-gradient(135deg, #1C0F07 0%, #3D2410 100%)", color: "#FAF7F0" }}
        aria-haspopup="dialog"
      >
        <BookOpen className="w-4 h-4 shrink-0" style={{ color: "#C9A84C" }} aria-hidden="true" />
        <span lang="am" className="font-bold text-lg truncate">{label}</span>
        <ChevronDown className="w-4 h-4 ml-auto shrink-0" style={{ color: "#C9A84C" }} aria-hidden="true" />
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          <div className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose a passage"
            className="relative w-full max-w-xl h-[min(640px,100%)] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-fade-up"
            style={{ background: "#FAF7F0" }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-4 shrink-0" style={{ background: "linear-gradient(135deg, #1C0F07 0%, #3D2410 100%)" }}>
              <div className="flex items-center gap-2">
                {step !== "book" ? (
                  <button onClick={back} className="p-1.5 -ml-1.5 rounded-lg" style={{ color: "#C9A84C" }} aria-label="Back">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                ) : null}
                <h2 className="font-bold text-xl flex-1 truncate" style={{ color: "#FAF7F0" }}>
                  {step === "book" ? (
                    <span className="font-display">Choose a book</span>
                  ) : (
                    <span lang="am">{step === "chapter" ? picked.am : `${picked.am} ${chapter}`}</span>
                  )}
                </h2>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg" style={{ color: "#C9A84C" }} aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Steps */}
              <div className="flex gap-1.5 mt-3" aria-hidden="true">
                {(["book", "chapter", "verse"] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: i <= ["book", "chapter", "verse"].indexOf(step) ? "#C9A84C" : "rgba(201,168,76,0.2)" }}
                  />
                ))}
              </div>

              {step === "book" && (
                <>
                  <div className="relative mt-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9A7B5C" }} aria-hidden="true" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search · መጽሐፍ ፈልግ"
                      className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(250,247,240,0.1)", color: "#FAF7F0", border: "1px solid rgba(201,168,76,0.25)" }}
                    />
                  </div>
                  {!query && (
                    <div className="grid grid-cols-2 gap-1 mt-3 p-1 rounded-xl" style={{ background: "rgba(250,247,240,0.08)" }}>
                      {(["OT", "NT"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTestament(t)}
                          className="py-2 rounded-lg text-sm font-semibold transition-colors"
                          style={testament === t ? { background: "#C9A84C", color: "#1C0F07" } : { color: "#C4A882" }}
                        >
                          <span lang="am">{t === "OT" ? "ብሉይ ኪዳን" : "አዲስ ኪዳን"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
              {step === "book" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {books.map((b) => {
                    const active = b.id === value.book;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBook(b.id);
                          // One-chapter books (Jude, Philemon…) go straight to verses.
                          if (b.chapters === 1) { setChapter(1); setStep("verse"); }
                          else setStep("chapter");
                        }}
                        className="h-14 px-3 rounded-xl text-left transition-colors flex flex-col justify-center min-w-0"
                        style={
                          active
                            ? { background: "#3D2410", color: "#FAF7F0" }
                            : { background: "#fff", color: "#2C1A0E", border: "1px solid #E0CBB0" }
                        }
                      >
                        <span lang="am" className="text-[15px] font-bold truncate leading-tight">{b.am}</span>
                        <span className="text-[11px] truncate leading-tight mt-0.5" style={{ opacity: 0.6 }}>{b.name}</span>
                      </button>
                    );
                  })}
                  {books.length === 0 && (
                    <p className="col-span-full text-center text-sm py-8" style={{ color: "#8A6A4A" }}>No book matches “{query}”.</p>
                  )}
                </div>
              )}

              {step === "chapter" && (
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {Array.from({ length: picked.chapters }, (_, i) => i + 1).map((n) => {
                    const active = picked.id === value.book && n === value.chapter;
                    return (
                      <button
                        key={n}
                        onClick={() => { setChapter(n); setStep("verse"); }}
                        className="aspect-square rounded-xl text-base font-bold transition-colors"
                        style={
                          active
                            ? { background: "#3D2410", color: "#FAF7F0" }
                            : { background: "#fff", color: "#2C1A0E", border: "1px solid #E0CBB0" }
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === "verse" && (
                <>
                  <button
                    onClick={() => choose({ book, chapter, verse: null })}
                    className="w-full h-12 mb-3 rounded-xl text-sm font-bold"
                    style={{ background: "#C9A84C", color: "#1C0F07" }}
                  >
                    Read <span lang="am">{picked.am} {chapter}</span> from the start
                  </button>
                  {verses === null ? (
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2" aria-busy="true">
                      {Array.from({ length: 20 }, (_, i) => (
                        <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: "#F0E6D3" }} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                      {verses.map((n) => (
                        <button
                          key={n}
                          onClick={() => choose({ book, chapter, verse: n })}
                          className="aspect-square rounded-xl text-sm font-bold transition-colors hover:bg-[#F0E6D3]"
                          style={{ background: "#fff", color: "#2C1A0E", border: "1px solid #E0CBB0" }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/** Previous / next chapter across book boundaries. */
export function stepChapter(p: Position, dir: -1 | 1): Position | null {
  const i = BOOKS.findIndex((b) => b.id === p.book);
  if (i < 0) return null;
  const ch = p.chapter + dir;
  if (ch >= 1 && ch <= BOOKS[i].chapters) return { book: p.book, chapter: ch };
  const nb = BOOKS[i + dir];
  if (!nb) return null;
  return { book: nb.id, chapter: dir === 1 ? 1 : nb.chapters };
}
