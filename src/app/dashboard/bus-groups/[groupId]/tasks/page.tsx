"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, X, CheckCircle2, Circle, Clock, Trash2, Calendar, User, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TaskUser { id: string; name: string; }
interface Task {
  id: string; title: string; description?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate?: string | null; createdAt: string;
  createdBy: TaskUser; assignedTo?: TaskUser | null;
  busGroupId: string;
}
interface GroupMember { id: string; name: string; }

const STATUS_CONFIG = {
  PENDING:     { label: "To Do",       icon: Circle,       color: "bg-gray-100 text-gray-600 border-gray-200" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,        color: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED:   { label: "Done",        icon: CheckCircle2, color: "bg-brown-100 text-gold-500 border-brown-200" },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "IN_PROGRESS",
};

export default function TasksPage({ params }: { params: { groupId: string } }) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", assignedToId: "", dueDate: "" });

  useEffect(() => {
    Promise.all([
      fetch(`/api/bus-groups/${params.groupId}/tasks`).then(r => r.json()),
      fetch(`/api/bus-groups/${params.groupId}`).then(r => r.json()),
    ]).then(([taskData, groupData]) => {
      setTasks(Array.isArray(taskData) ? taskData : []);
      setMembers(groupData.members ?? []);
      setIsLeader(groupData.isLeader ?? false);
    }).catch(() => setError("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [params.groupId]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bus-groups/${params.groupId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          assignedToId: form.assignedToId || null,
          dueDate: form.dueDate || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const task = await res.json();
      setTasks(prev => [task, ...prev]);
      setShowForm(false);
      setForm({ title: "", description: "", assignedToId: "", dueDate: "" });
    } catch (err: any) {
      setError(err.message ?? "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: Task) => {
    const newStatus = NEXT_STATUS[task.status];
    try {
      const res = await fetch(`/api/bus-groups/${params.groupId}/tasks?taskId=${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (err: any) {
      setError(err.message ?? "Update failed");
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/bus-groups/${params.groupId}/tasks?taskId=${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      setError("Delete failed");
    }
  };

  const grouped = {
    PENDING:     tasks.filter(t => t.status === "PENDING"),
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
    COMPLETED:   tasks.filter(t => t.status === "COMPLETED"),
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <svg className="animate-spin w-7 h-7 text-gold-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 text-sm">{tasks.length} tasks</p>
        {isLeader && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brown-800">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">New Task</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Task title" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional details..." rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to</label>
                  <select value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option value="">Whole Group</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task columns */}
      {tasks.length === 0 ? (
        <div className="bg-white border border-brown-200 rounded-2xl p-12 text-center text-gray-400">
          <p className="text-sm">{isLeader ? 'No tasks yet. Create one to get started.' : 'No tasks assigned yet.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map(status => {
            const { label, icon: Icon, color } = STATUS_CONFIG[status];
            const group = grouped[status];
            if (group.length === 0) return null;
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-600">{label}</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map(task => {
                    const canAct = isLeader || task.assignedTo?.id === session?.user?.id || !task.assignedTo;
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
                    return (
                      <div key={task.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-brown-200 transition-colors">
                        <div className="flex items-start gap-3">
                          <button onClick={() => canAct && updateStatus(task)} disabled={!canAct}
                            className={`mt-0.5 shrink-0 transition-colors ${canAct ? "cursor-pointer hover:text-gold-600" : "cursor-default opacity-50"}`}>
                            <Icon className={`w-4 h-4 ${status === "COMPLETED" ? "text-gold-500" : status === "IN_PROGRESS" ? "text-blue-500" : "text-gray-400"}`} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {task.title}
                            </p>
                            {task.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                              {task.assignedTo ? (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <User className="w-3 h-3" />{task.assignedTo.name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Whole Group</span>
                              )}
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(task.dueDate)}{isOverdue && " · Overdue"}
                                </span>
                              )}
                            </div>
                          </div>
                          {isLeader && (
                            <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {canAct && task.status !== "COMPLETED" && (
                          <button onClick={() => updateStatus(task)}
                            className="mt-3 text-xs text-gold-600 hover:text-gold-500 font-medium">
                            Mark as {STATUS_CONFIG[NEXT_STATUS[task.status] as keyof typeof STATUS_CONFIG].label} →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
