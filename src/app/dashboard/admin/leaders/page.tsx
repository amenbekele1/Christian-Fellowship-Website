"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Edit2 } from "lucide-react";

interface Leader {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  imageUrl: string | null;
  isActive: boolean;
  order: number;
}

export default function AdminLeadersPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "",
    bio: "",
    imageUrl: "",
    order: 0,
  });

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    setLoading(true);
    const res = await fetch("/api/leaders");
    setLeaders(await res.json());
    setLoading(false);
  };

  const saveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/leaders?id=${editingId}` : "/api/leaders";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    closeForm();
    fetchLeaders();
    setSaving(false);
  };

  const deleteLeader = async (id: string) => {
    if (!confirm("Delete this leader?")) return;
    await fetch(`/api/leaders?id=${id}`, { method: "DELETE" });
    fetchLeaders();
  };

  const editLeader = (leader: Leader) => {
    setForm({
      name: leader.name,
      title: leader.title,
      bio: leader.bio || "",
      imageUrl: leader.imageUrl || "",
      order: leader.order,
    });
    setEditingId(leader.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", title: "", bio: "", imageUrl: "", order: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Leadership</h1>
          <p className="text-gray-500 mt-1">{leaders.length} leaders</p>
        </div>
        <button
          onClick={() => {
            closeForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Leader
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">
                {editingId ? "Edit Leader" : "Add Leader"}
              </h2>
              <button onClick={closeForm}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={saveLeader} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Head Pastor, Youth Leader, etc."
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Brief biography..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50"
                >
                  {saving ? (editingId ? "Updating..." : "Creating...") : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="grid gap-4">
          {leaders.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">No leaders yet.</p>
          )}
          {leaders.map((leader) => (
            <div key={leader.id} className="bg-white border border-brown-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
              {leader.imageUrl && (
                <img
                  src={leader.imageUrl}
                  alt={leader.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{leader.name}</h3>
                <p className="text-sm text-gold-600 font-medium">{leader.title}</p>
                {leader.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{leader.bio}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => editLeader(leader)}
                  className="text-gray-400 hover:text-gold-600 transition-colors p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteLeader(leader.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
