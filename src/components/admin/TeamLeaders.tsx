"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Users, Edit2, X, Sparkles, UserPlus } from "lucide-react";
import { confirmDialog, toast } from "@/components/ui/toaster";
import { peekCache, fetchJsonCached } from "@/lib/fetch-cache";

/** The teams the fellowship expects to have. Offered as one-click setup. */
const SUGGESTED_TEAMS = [
  { label: "Worship",        description: "Leads the congregation in worship — singers, musicians and sound." },
  { label: "Prayer",         description: "Leads and coordinates prayer for the fellowship." },
  { label: "Evangelism",     description: "Outreach, sharing the gospel and welcoming newcomers." },
  { label: "Social Affairs", description: "Care, hospitality and practical support for members." },
  { label: "Social Media",   description: "Manages the fellowship's social media presence." },
];

interface Team {
  id: string;
  name: string;
  label: string;
  description: string | null;
  leaderId: string | null;
  leaderName: string | null;
  memberCount: number;
}
interface Person { id: string; name: string; email: string }

const TEAMS_URL = "/api/teams";
const USERS_URL = "/api/members?limit=500";
const membersUrl = (teamId: string) => `/api/teams/${teamId}/members`;

const inputCls =
  "w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500";

/**
 * Admin → Serving Teams. Laid out like BUS Groups: one card per team with
 * its leader and members; Guardians create, edit and remove teams, choose
 * the leader and add or remove members. Leading a team never changes
 * someone's account role.
 */
export default function TeamLeaders() {
  const [teams, setTeams] = useState<Team[]>(() => peekCache<Team[]>(TEAMS_URL) ?? []);
  const [users, setUsers] = useState<Person[]>(() => peekCache<{ data?: Person[] }>(USERS_URL)?.data ?? []);
  const [members, setMembers] = useState<Record<string, Person[]>>({});
  const [loading, setLoading] = useState(() => peekCache(TEAMS_URL) === undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ label: "", description: "" });
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState({ label: "", description: "", leaderId: "" });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addUserId, setAddUserId] = useState("");

  const loadMembers = useCallback(async (list: Team[]) => {
    const entries = await Promise.all(
      list.map(async (t) => {
        const d = await fetchJsonCached<{ members: Person[] }>(membersUrl(t.id)).catch(() => null);
        return [t.id, d?.members ?? peekCache<{ members: Person[] }>(membersUrl(t.id))?.members ?? []] as const;
      })
    );
    setMembers(Object.fromEntries(entries));
  }, []);

  const load = useCallback(async () => {
    try {
      const [teamData, userData] = await Promise.all([
        fetchJsonCached<Team[]>(TEAMS_URL),
        fetchJsonCached<any>(USERS_URL).catch(() => null),
      ]);
      const list = Array.isArray(teamData) ? teamData : [];
      setTeams(list);
      if (userData) setUsers(Array.isArray(userData) ? userData : (userData.data ?? []));
      await loadMembers(list);
    } catch {
      setError("Could not load teams");
    } finally {
      setLoading(false);
    }
  }, [loadMembers]);

  // Show cached member lists immediately, then refresh.
  useEffect(() => {
    setMembers(Object.fromEntries(teams.map((t) => [t.id, peekCache<{ members: Person[] }>(membersUrl(t.id))?.members ?? []])));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const call = async (url: string, init: RequestInit, ok?: string) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Something went wrong"); }
      if (ok) toast.success(ok);
      await load();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await call(TEAMS_URL, { method: "POST", body: JSON.stringify({ label: newForm.label, description: newForm.description || null }) }, "Team created")) {
      setShowNew(false);
      setNewForm({ label: "", description: "" });
    }
  };

  const createMissingSuggested = async () => {
    const existing = new Set(teams.map((t) => t.label.toLowerCase()));
    for (const s of SUGGESTED_TEAMS.filter((s) => !existing.has(s.label.toLowerCase()))) {
      await fetch(TEAMS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    }
    toast.success("Standard teams created");
    load();
  };

  const openEdit = (team: Team) => {
    setEditTeam(team);
    setEditForm({ label: team.label, description: team.description ?? "", leaderId: team.leaderId ?? "" });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeam) return;
    const okDetails = await call(`/api/teams/${editTeam.id}`, {
      method: "PATCH",
      body: JSON.stringify({ label: editForm.label, description: editForm.description || null }),
    });
    if (!okDetails) return;
    if ((editForm.leaderId || null) !== editTeam.leaderId) {
      const okLeader = await call(`/api/teams/${editTeam.id}/leader`, {
        method: "PATCH",
        body: JSON.stringify({ userId: editForm.leaderId || null }),
      });
      if (!okLeader) return;
    }
    toast.success("Team updated");
    setEditTeam(null);
  };

  const removeTeam = async (team: Team) => {
    if (!(await confirmDialog({ title: `Remove the ${team.label} team?`, message: "Its members must be removed first.", confirmLabel: "Remove", destructive: true }))) return;
    call(`/api/teams/${team.id}`, { method: "DELETE" }, "Team removed");
  };

  const addMember = async (teamId: string) => {
    if (!addUserId) return;
    if (await call(membersUrl(teamId), { method: "POST", body: JSON.stringify({ userId: addUserId }) }, "Member added")) {
      setAddingTo(null);
      setAddUserId("");
    }
  };

  const removeMember = async (team: Team, person: Person) => {
    if (!(await confirmDialog({ title: `Remove ${person.name} from ${team.label}?`, confirmLabel: "Remove", destructive: true }))) return;
    call(`${membersUrl(team.id)}?userId=${person.id}`, { method: "DELETE" });
  };

  const missing = SUGGESTED_TEAMS.filter((s) => !teams.some((t) => t.label.toLowerCase() === s.label.toLowerCase()));
  const totalMembers = Object.values(members).reduce((a, m) => a + m.length, 0);

  if (loading && teams.length === 0) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Serving Teams</h1>
          <p className="text-gray-500 mt-1">{teams.length} teams · {totalMembers} members serving</p>
        </div>
        <button onClick={() => setShowNew(true)} className="shrink-0 flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      {missing.length > 0 && (
        <div className="bg-brown-50 border border-brown-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-gold-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brown-800">Set up your {missing.length} standard team{missing.length === 1 ? "" : "s"}</p>
            <p className="text-xs text-brown-600 mt-0.5">{missing.map((s) => s.label).join(", ")}</p>
          </div>
          <button onClick={createMissingSuggested} disabled={saving} className="shrink-0 bg-gold-500 text-brown-900 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            Create them
          </button>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{error}</div>}

      {/* Team cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {teams.map((team) => {
          const list = members[team.id] ?? [];
          const available = users.filter((u) => !list.some((m) => m.id === u.id));
          return (
            <div key={team.id} className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-brown-800 to-brown-900 px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-white text-lg">{team.label}</h3>
                  {team.description && <p className="text-brown-200 text-xs mt-0.5">{team.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {list.length} member{list.length === 1 ? "" : "s"}
                  </span>
                  <button onClick={() => openEdit(team)} className="text-white/60 hover:text-white p-1" title="Edit team" aria-label={`Edit ${team.label}`}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeTeam(team)} className="text-white/50 hover:text-red-300 p-1" title="Remove team" aria-label={`Remove ${team.label}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Leader */}
              <div className="px-5 py-3 bg-brown-50 border-b border-brown-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gold-600 font-bold shrink-0">Leader:</span>
                  {team.leaderName
                    ? <span className="text-sm text-gray-700 truncate">{team.leaderName}</span>
                    : <span className="text-sm text-gray-400 italic">Not assigned</span>}
                </div>
                <button onClick={() => openEdit(team)} className="text-gray-400 hover:text-gold-600 shrink-0 p-1" title="Change leader">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Members */}
              <div className="p-4 flex-1">
                {list.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No members yet</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((m) => (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">{m.name.charAt(0)}</div>
                          <div className="min-w-0">
                            <p className="text-gray-800 font-medium leading-none truncate">
                              {m.name}{m.id === team.leaderId && <span className="ml-1.5 text-[10px] font-bold text-gold-600 uppercase">Leader</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                        </div>
                        <button onClick={() => removeMember(team, m)} className="text-gray-300 hover:text-red-400 p-1" aria-label={`Remove ${m.name}`}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add member */}
              <div className="px-4 pb-4">
                {addingTo === team.id ? (
                  <div className="flex gap-2">
                    <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className={inputCls} autoFocus>
                      <option value="">Choose a member…</option>
                      {available.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                    <button onClick={() => addMember(team.id)} disabled={!addUserId || saving} className="shrink-0 bg-brown-800 text-white px-3 rounded-lg text-sm font-medium disabled:opacity-40">
                      Add
                    </button>
                    <button onClick={() => { setAddingTo(null); setAddUserId(""); }} className="shrink-0 text-gray-400 px-1" aria-label="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingTo(team.id); setAddUserId(""); }}
                    className="w-full flex items-center justify-center gap-1.5 border border-dashed border-brown-200 text-brown-700 py-2 rounded-xl text-sm font-medium hover:bg-brown-50"
                  >
                    <UserPlus className="w-4 h-4" /> Add member
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-brown-200 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No serving teams yet. Create your first team!</p>
          </div>
        )}
      </div>

      {/* New team */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <form onSubmit={createTeam} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-800 text-xl">Create Serving Team</h2>
              <button type="button" onClick={() => setShowNew(false)} className="text-gray-400" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Name *</label>
              <input required minLength={2} maxLength={40} value={newForm.label} onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} placeholder="e.g. Ushering" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows={3} maxLength={200} value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} placeholder="What does this team do?" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none" />
            </div>
            <p className="text-xs text-gray-500">You can choose a leader and add members once the team is created.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowNew(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">{saving ? "Creating..." : "Create Team"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit team */}
      {editTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setEditTeam(null)}>
          <form onSubmit={saveEdit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-800 text-xl">Edit Team</h2>
              <button type="button" onClick={() => setEditTeam(null)} className="text-gray-400" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Name *</label>
              <input required minLength={2} maxLength={40} value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows={3} maxLength={200} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Leader</label>
              <select value={editForm.leaderId} onChange={(e) => setEditForm({ ...editForm, leaderId: e.target.value })} className={inputCls}>
                <option value="">No leader</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email}){u.id === editTeam.leaderId ? " — current" : ""}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">Leading a team does not change someone&apos;s account role.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditTeam(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
