"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, BookOpen } from "lucide-react";
import { BOOKS, formatReference } from "@/lib/bible-books";
import { warsawDateKey, warsawParts, formatWarsaw } from "@/lib/timezone";
import { peekCache, fetchJsonCached } from "@/lib/fetch-cache";
import { confirmDialog, toast } from "@/components/ui/toaster";

interface Session {
  id: string;
  seriesId: string;
  date: string;
  title: string | null;
  bookId: string;
  startChapter: number;
  startVerse: number | null;
  endChapter: number | null;
  endVerse: number | null;
  questions: string[];
  notes: string | null;
}
interface Series { id: string; title: string; description: string | null; sessions: Session[] }

const STUDY_URL = "/api/bible-study";

/** Next Saturday on the Warsaw calendar (today if it is Saturday). */
function nextSaturday(): string {
  const day = warsawParts(new Date()).weekday;
  const d = new Date(warsawDateKey() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((6 - day + 7) % 7));
  return d.toISOString().slice(0, 10);
}

const dateLabel = (iso: string) =>
  formatWarsaw(iso.slice(0, 10) + "T12:00:00Z", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

interface FormState {
  id?: string;
  seriesId: string;
  date: string;
  title: string;
  bookId: string;
  startChapter: string;
  startVerse: string;
  endChapter: string;
  endVerse: string;
  questions: string[];
  notes: string;
}

const emptyForm = (seriesId: string, bookId = "JHN"): FormState => ({
  seriesId, date: nextSaturday(), title: "", bookId, startChapter: "1", startVerse: "", endChapter: "", endVerse: "",
  questions: [""], notes: "",
});

const num = (v: string) => (v.trim() ? Number(v) : null);

export default function AdminBibleStudyPage() {
  const [series, setSeries] = useState<Series[]>(() => peekCache<Series[]>(STUDY_URL) ?? []);
  const [loading, setLoading] = useState(() => peekCache(STUDY_URL) === undefined);
  const [newSeries, setNewSeries] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchJsonCached<Series[]>(STUDY_URL);
      setSeries(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Couldn't load Bible studies.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const createSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/bible-study/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSeries }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Couldn't create the series");
    setNewSeries("");
    toast.success(`Series "${data.title}" created`);
    load();
  };

  const deleteSeries = async (s: Series) => {
    if (!(await confirmDialog({
      title: `Delete the ${s.title} series?`,
      message: `Its ${s.sessions.length} session(s) and their questions will be removed for everyone.`,
      destructive: true,
    }))) return;
    await fetch(`/api/bible-study/series?id=${s.id}`, { method: "DELETE" });
    load();
  };

  const deleteSession = async (s: Session) => {
    if (!(await confirmDialog({ title: "Delete this session?", message: formatReference(s), destructive: true }))) return;
    await fetch(`${STUDY_URL}?id=${s.id}`, { method: "DELETE" });
    load();
  };

  const editSession = (s: Session) =>
    setForm({
      id: s.id, seriesId: s.seriesId, date: s.date.slice(0, 10), title: s.title ?? "", bookId: s.bookId,
      startChapter: String(s.startChapter), startVerse: s.startVerse ? String(s.startVerse) : "",
      endChapter: s.endChapter ? String(s.endChapter) : "", endVerse: s.endVerse ? String(s.endVerse) : "",
      questions: s.questions.length ? s.questions : [""], notes: s.notes ?? "",
    });

  const saveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const body = {
      seriesId: form.seriesId,
      date: form.date,
      title: form.title.trim() || null,
      bookId: form.bookId,
      startChapter: Number(form.startChapter),
      startVerse: num(form.startVerse),
      endChapter: num(form.endChapter),
      endVerse: num(form.endVerse),
      questions: form.questions.map((q) => q.trim()).filter(Boolean),
      notes: form.notes.trim() || null,
    };
    const res = await fetch(form.id ? `${STUDY_URL}?id=${form.id}` : STUDY_URL, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setSaving(false);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) return toast.error(data?.error ?? "Couldn't save the session");
    toast.success(form.id ? "Session updated" : "Session posted");
    setForm(null);
    load();
  };

  const book = BOOKS.find((b) => b.id === form?.bookId);
  const preview = form && form.startChapter
    ? formatReference({
        bookId: form.bookId, startChapter: Number(form.startChapter), startVerse: num(form.startVerse),
        endChapter: num(form.endChapter), endVerse: num(form.endVerse),
      })
    : "";
  const input = "w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">Bible Study</h1>
        <p className="text-gray-500 mt-1">Post each Saturday&apos;s passage and questions. Members see the latest on their dashboard.</p>
      </div>

      <form onSubmit={createSeries} className="flex gap-2 mb-6">
        <input
          value={newSeries}
          onChange={(e) => setNewSeries(e.target.value)}
          placeholder="New series, e.g. Acts"
          className={input}
          required
          minLength={2}
        />
        <button type="submit" className="shrink-0 flex items-center gap-1.5 bg-brown-800 text-white px-4 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Series
        </button>
      </form>

      {loading ? (
        <div className="h-40 rounded-2xl animate-pulse bg-white border border-brown-200" />
      ) : series.length === 0 ? (
        <div className="text-center py-14 text-gray-400 bg-white rounded-2xl border border-brown-200">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Create your first series to start posting studies.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {series.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-4 bg-brown-50">
                <h2 className="font-display font-bold text-lg text-gray-800">{s.title}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm(emptyForm(s.id, s.sessions[0]?.bookId))}
                    className="flex items-center gap-1.5 bg-brown-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Session
                  </button>
                  <button onClick={() => deleteSeries(s)} className="p-1.5 text-red-400 hover:text-red-600" aria-label={`Delete ${s.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {s.sessions.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No sessions yet.</p>
              ) : (
                s.sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center gap-3 px-5 py-3 border-t border-brown-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{sess.title || formatReference(sess)}</p>
                      <p className="text-xs text-gray-500">
                        {dateLabel(sess.date)}{sess.title ? ` · ${formatReference(sess)}` : ""} · {sess.questions.length} question{sess.questions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button onClick={() => editSession(sess)} className="p-1.5 text-gray-500 hover:text-gray-700" aria-label="Edit session">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSession(sess)} className="p-1.5 text-red-400 hover:text-red-600" aria-label="Delete session">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={saveSession} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-800 text-xl">{form.id ? "Edit session" : "New session"}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                <select value={form.seriesId} onChange={(e) => setForm({ ...form, seriesId: e.target.value })} className={input}>
                  {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The coming of the Holy Spirit" className={input} maxLength={160} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passage</label>
              <select
                value={form.bookId}
                onChange={(e) => setForm({ ...form, bookId: e.target.value, startChapter: "1", endChapter: "" })}
                className={input + " mb-2"}
              >
                {BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-center gap-2">
                <input type="number" required min={1} max={book?.chapters} value={form.startChapter} onChange={(e) => setForm({ ...form, startChapter: e.target.value })} placeholder="Ch." aria-label="From chapter" className={input} />
                <input type="number" min={1} value={form.startVerse} onChange={(e) => setForm({ ...form, startVerse: e.target.value })} placeholder="Verse" aria-label="From verse" className={input} />
                <span className="text-gray-400 text-sm">to</span>
                <input type="number" min={1} max={book?.chapters} value={form.endChapter} onChange={(e) => setForm({ ...form, endChapter: e.target.value })} placeholder="Ch." aria-label="To chapter" className={input} />
                <input type="number" min={1} value={form.endVerse} onChange={(e) => setForm({ ...form, endVerse: e.target.value })} placeholder="Verse" aria-label="To verse" className={input} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {preview ? <>Shows as <strong>{preview}</strong>. </> : null}
                Leave verses empty for whole chapters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
              <div className="space-y-2">
                {form.questions.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs font-bold text-gray-400 w-5 pt-3 text-right">{i + 1}.</span>
                    <textarea
                      value={q}
                      rows={2}
                      onChange={(e) => {
                        const questions = [...form.questions];
                        questions[i] = e.target.value;
                        setForm({ ...form, questions });
                      }}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Question"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, questions: form.questions.filter((_, j) => j !== i).concat(form.questions.length === 1 ? [""] : []) })}
                      className="p-2 text-gray-400 hover:text-red-500"
                      aria-label={`Remove question ${i + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, questions: [...form.questions, ""] })}
                className="mt-2 text-sm font-semibold text-gold-600"
              >
                + Add question
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea value={form.notes} rows={3} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" placeholder="Background, key verse, or anything to read beforehand" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setForm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? "Saving..." : form.id ? "Save" : "Post session"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
