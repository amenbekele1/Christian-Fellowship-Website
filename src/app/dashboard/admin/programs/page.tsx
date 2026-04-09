"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Edit2 } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "",
    color: "bg-green-100",
    order: 0,
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const res = await fetch("/api/programs");
    setPrograms(await res.json());
    setLoading(false);
  };

  const saveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/programs?id=${editingId}` : "/api/programs";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    closeForm();
    fetchPrograms();
    setSaving(false);
  };

  const deleteProgram = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    await fetch(`/api/programs?id=${id}`, { method: "DELETE" });
    fetchPrograms();
  };

  const editProgram = (program: Program) => {
    setForm({
      title: program.title,
      description: program.description,
      icon: program.icon || "",
      color: program.color || "bg-green-100",
      order: program.order,
    });
    setEditingId(program.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", icon: "", color: "bg-green-100", order: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Programs</h1>
          <p className="text-gray-500 mt-1">{programs.length} programs</p>
        </div>
        <button
          onClick={() => {
            closeForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Program
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">
                {editingId ? "Edit Program" : "New Program"}
              </h2>
              <button onClick={closeForm}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={saveProgram} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Program name"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Program description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="📚"
                    maxLength={2}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="bg-green-100">Green</option>
                    <option value="bg-blue-100">Blue</option>
                    <option value="bg-purple-100">Purple</option>
                    <option value="bg-amber-100">Amber</option>
                    <option value="bg-crimson-100">Crimson</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50"
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
          <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">No programs yet.</p>
          )}
          {programs.map((program) => (
            <div key={program.id} className={`${program.color || "bg-green-100"} rounded-2xl p-5 border border-green-200 flex gap-4 items-start`}>
              <div className="text-3xl">{program.icon || "📋"}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{program.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{program.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => editProgram(program)}
                  className="text-gray-400 hover:text-green-600 transition-colors p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteProgram(program.id)}
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
