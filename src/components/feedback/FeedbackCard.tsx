"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquarePlus, Check, AlertCircle, X, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MyFeedback {
  id: string;
  message: string;
  category: string | null;
  status: "OPEN" | "IN_PROGRESS" | "FIXED" | "DECLINED";
  adminNote: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "bug", label: "Something is broken", icon: Bug },
  { value: "idea", label: "I have an idea", icon: Lightbulb },
  { value: "other", label: "Something else", icon: MessageCircle },
] as const;

const STATUS_STYLES: Record<MyFeedback["status"], { label: string; cls: string }> = {
  OPEN:        { label: "Received",    cls: "bg-brown-100 text-brown-700" },
  IN_PROGRESS: { label: "Looking into it", cls: "bg-amber-100 text-amber-700" },
  FIXED:       { label: "Sorted",      cls: "bg-green-100 text-green-700" },
  DECLINED:    { label: "Not planned", cls: "bg-gray-100 text-gray-500" },
};

/** Feedback form plus the member's own history. Lives on the profile page. */
export default function FeedbackCard() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string>("bug");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<MyFeedback[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) return;
      const { items } = await res.json();
      setMine(Array.isArray(items) ? items : []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError("Please tell us a little more.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category,
          pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Could not send");
      }
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 6000);
      load();
    } catch (err: any) {
      setError(err.message ?? "Could not send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-brown-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brown-100 flex items-center justify-center shrink-0">
          <MessageSquarePlus className="w-5 h-5 text-gold-500" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">Send us feedback</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Found something broken, or have an idea? Tell us and we will look into it.
          </p>
        </div>
      </div>

      {sent && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
          <Check className="w-4 h-4 shrink-0" />
          Thank you — we have received it and will be in touch.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                category === value
                  ? "bg-brown-800 text-white border-brown-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brown-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="Tell us what happened, or what you would like to see…"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            Your name and email are included so we can reply.
          </p>
          <button
            type="submit"
            disabled={sending || message.trim().length < 5}
            className="bg-brown-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-700 transition-colors disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send feedback"}
          </button>
        </div>
      </form>

      {/* Member's own history */}
      {mine.length > 0 && (
        <div className="mt-6 pt-6 border-t border-brown-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-brown-400 mb-3">
            What you have sent
          </p>
          <ul className="space-y-3">
            {mine.map((f) => {
              const s = STATUS_STYLES[f.status];
              return (
                <li key={f.id} className="bg-brown-50 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-brown-700 whitespace-pre-wrap">{f.message}</p>
                  {f.adminNote && (
                    <p className="text-xs text-brown-600 mt-2 pt-2 border-t border-brown-200">
                      <span className="font-semibold">Our reply:</span> {f.adminNote}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
