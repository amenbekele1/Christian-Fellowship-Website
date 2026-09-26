"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bug, Lightbulb, MessageCircle, AlertCircle, X, Mail, Check } from "lucide-react";

type Status = "OPEN" | "IN_PROGRESS" | "FIXED" | "DECLINED";

interface Item {
  id: string;
  message: string;
  category: string | null;
  pageUrl: string | null;
  status: Status;
  adminNote: string | null;
  notified: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const FILTERS: { value: string; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "FIXED", label: "Sorted" },
  { value: "DECLINED", label: "Not planned" },
  { value: "ALL", label: "Everything" },
];

const CATEGORY_ICON: Record<string, any> = {
  bug: Bug,
  idea: Lightbulb,
  other: MessageCircle,
};

const STATUS_CLS: Record<Status, string> = {
  OPEN: "bg-brown-100 text-brown-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  FIXED: "bg-green-100 text-green-700",
  DECLINED: "bg-gray-100 text-gray-500",
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?status=${filter}`);
      if (!res.ok) throw new Error("Could not load feedback");
      const { items } = await res.json();
      setItems(Array.isArray(items) ? items : []);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const update = async (item: Item, status: Status, adminNote?: string | null) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback?id=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: adminNote ?? item.adminNote }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setNoteFor(null);
      setNote("");
      load();
    } catch (e: any) {
      setError(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">Feedback</h1>
        <p className="text-gray-500 mt-1">
          What members are telling you about the portal. Marking something
          <strong className="font-semibold"> Sorted</strong> emails them automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm font-medium px-3.5 py-2 rounded-lg border transition-colors ${
              filter === f.value
                ? "bg-brown-800 text-white border-brown-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-brown-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-7 h-7 text-gold-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-brown-200 rounded-2xl p-16 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 text-sm font-medium">Nothing here</p>
          <p className="text-gray-400 text-xs mt-1">
            {filter === "OPEN" ? "No open feedback — all caught up." : "Try another filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = CATEGORY_ICON[item.category ?? "other"] ?? MessageCircle;
            return (
              <div key={item.id} className="bg-white border border-brown-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-brown-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gold-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{item.user.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLS[item.status]}`}>
                        {item.status === "IN_PROGRESS" ? "In progress"
                          : item.status === "FIXED" ? "Sorted"
                          : item.status === "DECLINED" ? "Not planned" : "Open"}
                      </span>
                      {item.notified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Mail className="w-3 h-3" /> notified
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {item.user.email}{item.pageUrl ? `  ·  ${item.pageUrl}` : ""}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.message}
                    </p>

                    {item.adminNote && (
                      <p className="text-xs text-brown-600 mt-3 bg-brown-50 rounded-lg p-3">
                        <span className="font-semibold">Your reply:</span> {item.adminNote}
                      </p>
                    )}

                    {/* Note box shown when marking as sorted */}
                    {noteFor === item.id ? (
                      <div className="mt-3">
                        <textarea
                          autoFocus
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          placeholder="What did you do? This is included in the email to them (optional)."
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => update(item, "FIXED", note.trim() || null)}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {saving ? "Sending…" : "Mark sorted & email them"}
                          </button>
                          <button
                            onClick={() => { setNoteFor(null); setNote(""); }}
                            className="text-xs text-gray-500 px-3 py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.status !== "IN_PROGRESS" && item.status !== "FIXED" && (
                          <button
                            onClick={() => update(item, "IN_PROGRESS")}
                            disabled={saving}
                            className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Looking into it
                          </button>
                        )}
                        {item.status !== "FIXED" && (
                          <button
                            onClick={() => { setNoteFor(item.id); setNote(item.adminNote ?? ""); }}
                            className="text-xs bg-brown-800 text-white px-3 py-1.5 rounded-lg hover:bg-brown-700 transition-colors"
                          >
                            Mark sorted
                          </button>
                        )}
                        {item.status !== "DECLINED" && item.status !== "FIXED" && (
                          <button
                            onClick={() => update(item, "DECLINED")}
                            disabled={saving}
                            className="text-xs text-gray-400 px-3 py-1.5 rounded-lg hover:text-gray-600 transition-colors disabled:opacity-50"
                          >
                            Not planned
                          </button>
                        )}
                        <a
                          href={`mailto:${item.user.email}`}
                          className="text-xs text-gold-600 px-3 py-1.5 rounded-lg hover:bg-brown-50 transition-colors"
                        >
                          Reply by email
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
