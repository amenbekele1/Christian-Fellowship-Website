"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, FileText } from "lucide-react";

interface ContentRow {
  pageKey:   string;
  fieldKey:  string;
  label:     string;
  value:     string;
  updatedAt: string;
}

const PAGE_LABELS: Record<string, string> = {
  home:  "Home Page",
  about: "About Page",
};

export default function ContentEditorPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [rows, setRows] = useState<ContentRow[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved]   = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "about">("home");

  useEffect(() => {
    if (!session) return;
    const teams = session.user.serviceTeams ?? [];
    const allowed = session.user.role === "GUARDIAN" || teams.includes("WEBSITE_EDITOR");
    if (!allowed) { router.push("/dashboard"); return; }
    fetchContent();
  }, [session]);

  const fetchContent = async () => {
    const res = await fetch("/api/page-content");
    const data: ContentRow[] = await res.json();
    setRows(data);
    const initial: Record<string, string> = {};
    for (const row of data) initial[`${row.pageKey}__${row.fieldKey}`] = row.value;
    setEdits(initial);
  };

  const handleSave = async (row: ContentRow) => {
    const key = `${row.pageKey}__${row.fieldKey}`;
    const newValue = edits[key] ?? row.value;
    if (newValue === row.value) return; // nothing changed

    setSaving(key);
    setError(null);
    try {
      const res = await fetch("/api/page-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey: row.pageKey, fieldKey: row.fieldKey, value: newValue }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      // Update the row so "nothing changed" check works after save
      setRows(prev => prev.map(r =>
        r.pageKey === row.pageKey && r.fieldKey === row.fieldKey
          ? { ...r, value: newValue }
          : r
      ));
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const pageRows = rows.filter(r => r.pageKey === activeTab);
  const pages    = Array.from(new Set(rows.map(r => r.pageKey)));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">Website Content</h1>
        <p className="text-gray-500 mt-1">Edit the text shown on public pages. Changes go live immediately.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Page tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-7 w-fit">
        {pages.map(p => (
          <button
            key={p}
            onClick={() => setActiveTab(p as "home" | "about")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === p ? "bg-white text-gold-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {PAGE_LABELS[p] ?? p}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {pageRows.map(row => {
          const key        = `${row.pageKey}__${row.fieldKey}`;
          const currentVal = edits[key] ?? row.value;
          const isDirty    = currentVal !== row.value;
          const isLong     = row.value.length > 120;

          return (
            <div key={key} className="bg-white rounded-2xl border border-brown-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">{row.label}</label>
                {saved === key && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>

              {isLong ? (
                <textarea
                  value={currentVal}
                  onChange={e => setEdits(prev => ({ ...prev, [key]: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={currentVal}
                  onChange={e => setEdits(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              )}

              <div className="flex justify-end mt-3">
                <button
                  onClick={() => handleSave(row)}
                  disabled={!isDirty || saving === key}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: isDirty ? "#C9A84C" : "#f3f4f6", color: isDirty ? "#1C0F07" : "#9ca3af" }}
                >
                  {saving === key ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          );
        })}

        {pageRows.length === 0 && (
          <div className="text-center py-14 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No editable content for this page yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
