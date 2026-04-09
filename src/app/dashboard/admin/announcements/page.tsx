"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, Trash2, X, Pin, Edit2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: string; title: string; content: string; isPublic: boolean; isPinned: boolean;
  expiresAt: string | null; createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", isPublic: false, isPinned: false, expiresAt: "" });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await fetch("/api/announcements");
    setAnnouncements(await res.json());
    setLoading(false);
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      // Update existing announcement
      await fetch(`/api/announcements?id=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined }),
      });
    } else {
      // Create new announcement
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined }),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", content: "", isPublic: false, isPinned: false, expiresAt: "" });
    fetchAnnouncements();
    setSaving(false);
  };

  const editAnnouncement = (ann: Announcement) => {
    setForm({
      title: ann.title,
      content: ann.content,
      isPublic: ann.isPublic,
      isPinned: ann.isPinned,
      expiresAt: ann.expiresAt ? ann.expiresAt.slice(0, 10) : "",
    });
    setEditingId(ann.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", content: "", isPublic: false, isPinned: false, expiresAt: "" });
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  const togglePin = async (ann: Announcement) => {
    await fetch(`/api/announcements?id=${ann.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !ann.isPinned }),
    });
    fetchAnnouncements();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500 mt-1">Manage fellowship announcements</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ title: "", content: "", isPublic: false, isPinned: false, expiresAt: "" }); setShowForm(true); }} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 shadow-sm">
          <Plus className="w-4 h-4"/> New Announcement
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">{editingId ? "Edit Announcement" : "New Announcement"}</h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <form onSubmit={createAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Announcement title" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                <textarea required value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                  placeholder="Write your announcement..." rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expires On (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})}
                    className="w-4 h-4 rounded accent-green-600"/>
                  <span className="text-sm text-gray-700">Visible on public website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm({...form, isPinned: e.target.checked})}
                    className="w-4 h-4 rounded accent-green-600"/>
                  <span className="text-sm text-gray-700">Pin to top</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50">
                  {saving ? (editingId ? "Updating..." : "Publishing...") : (editingId ? "Update Announcement" : "Publish Announcement")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : (
        <div className="space-y-4">
          {announcements.length === 0 && (
            <div className="text-center py-14 bg-white rounded-2xl border border-green-100 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <p>No announcements yet.</p>
            </div>
          )}
          {announcements.map(ann => (
            <div key={ann.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${ann.isPinned ? "border-amber-200" : "border-green-100"}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.isPinned && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">📌 Pinned</span>}
                  {ann.isPublic && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">🌐 Public</span>}
                  <h3 className="font-semibold text-gray-800">{ann.title}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePin(ann)} className={`p-1.5 rounded-lg transition-colors ${ann.isPinned ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"}`}>
                    <Pin className="w-4 h-4"/>
                  </button>
                  <button onClick={() => editAnnouncement(ann)} className="p-1.5 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4"/>
                  </button>
                  <button onClick={() => deleteAnnouncement(ann.id)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{ann.content}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400">Published {formatDate(ann.createdAt)}</p>
                {ann.expiresAt && <p className="text-xs text-amber-600">Expires {formatDate(ann.expiresAt)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
