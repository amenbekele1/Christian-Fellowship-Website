"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Users, Edit2, X } from "lucide-react";

interface BUSGroup {
  id: string; name: string; description: string | null;
  leader: { id: string; name: string; email: string };
  members: { id: string; name: string; email: string }[];
  _count: { members: number };
}
interface User { id: string; name: string; email: string; role: string; }

export default function AdminBusGroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<BUSGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", leaderId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editLeaderGroup, setEditLeaderGroup] = useState<BUSGroup | null>(null);
  const [newLeaderId, setNewLeaderId] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [g, u] = await Promise.all([fetch("/api/bus-groups"), fetch("/api/members?limit=500")]);
    setGroups(await g.json());
    const uData = await u.json();
    setUsers(Array.isArray(uData) ? uData : (uData.data ?? []));
    setLoading(false);
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/bus-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false);
      setForm({ name: "", description: "", leaderId: "" });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Delete this BUS group? Members will be unassigned.")) return;
    await fetch(`/api/bus-groups?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const changeLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLeaderGroup || !newLeaderId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bus-groups?id=${editLeaderGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderId: newLeaderId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setEditLeaderGroup(null);
      setNewLeaderId("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    await fetch(`/api/bus-groups?id=${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMemberId: memberId }),
    });
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">BUS Groups</h1>
          <p className="text-gray-500 mt-1">{groups.length} groups · {groups.reduce((a, g) => a + g._count.members, 0)} members assigned</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">Create BUS Group</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Alpha Group" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Brief description of the group..." rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Leader *</label>
                <select required value={form.leaderId} onChange={e => setForm({...form, leaderId: e.target.value})}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500">
                  <option value="">Select a leader...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-brown-800 to-brown-900 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-white text-lg">{group.name}</h3>
                {group.description && <p className="text-brown-200 text-xs mt-0.5">{group.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  {group._count.members} members
                </span>
                <button onClick={() => deleteGroup(group.id)} className="text-white/50 hover:text-red-300 transition-colors p-1">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* Leader */}
            <div className="px-5 py-3 bg-brown-50 border-b border-brown-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-gold-600 font-bold shrink-0">Leader:</span>
                <span className="text-sm text-gray-700 truncate">{group.leader.name}</span>
                <span className="text-xs text-gray-400 truncate hidden sm:inline">· {group.leader.email}</span>
              </div>
              <button
                onClick={() => { setEditLeaderGroup(group); setNewLeaderId(group.leader.id); setError(""); }}
                className="text-gray-400 hover:text-gold-600 transition-colors shrink-0 p-1"
                title="Change leader"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Members list */}
            <div className="p-4">
              {group.members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No members assigned</p>
              ) : (
                <ul className="space-y-2">
                  {group.members.map(member => (
                    <li key={member.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">{member.name.charAt(0)}</div>
                        <div>
                          <p className="text-gray-800 font-medium leading-none">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                      <button onClick={() => removeMember(group.id, member.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-brown-200 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            <p>No BUS groups yet. Create your first group!</p>
          </div>
        )}
      </div>

      {/* Change Leader modal */}
      {editLeaderGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-gray-800 text-xl">Change Leader</h2>
                <p className="text-sm text-gray-500 mt-0.5">{editLeaderGroup.name}</p>
              </div>
              <button onClick={() => { setEditLeaderGroup(null); setError(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5"/>
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
            <form onSubmit={changeLeader} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Group Leader *</label>
                <select
                  required
                  value={newLeaderId}
                  onChange={e => setNewLeaderId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Select a leader...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}){u.id === editLeaderGroup.leader.id ? " — current" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  The previous leader will be reverted to a regular member automatically.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setEditLeaderGroup(null); setError(""); }}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving || newLeaderId === editLeaderGroup.leader.id}
                  className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-900 disabled:opacity-50">
                  {saving ? "Saving..." : "Update Leader"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
