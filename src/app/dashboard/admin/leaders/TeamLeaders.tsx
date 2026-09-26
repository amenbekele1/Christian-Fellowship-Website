"use client";

import { useEffect, useState, useCallback } from "react";
import { Crown, Search, X, Check, AlertCircle, Users, Plus, Pencil, Trash2, Sparkles } from "lucide-react";

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

interface Candidate {
  id: string;
  name: string;
  email: string;
}

/**
 * Guardian panel for assigning who leads each service team.
 * Leadership is stored on the team, so it never changes the person's
 * account role.
 */
export default function TeamLeaders() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create / rename
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Could not load teams");
      setTeams(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Guardians can use the full member directory
  useEffect(() => {
    if (!openFor || query.trim().length < 2) { setCandidates([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members?search=${encodeURIComponent(query)}&limit=8`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        setCandidates(
          rows.map((u: any) => ({ id: u.id, name: u.name, email: u.email })).slice(0, 8)
        );
      } catch {
        setCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, openFor]);

  const assign = async (teamId: string, userId: string | null) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/leader`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setOpenFor(null);
      setQuery("");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const createTeam = async (label: string, description?: string | null) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, description: description ?? null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowNew(false);
      setNewLabel("");
      setNewDesc("");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Could not create the team");
    } finally {
      setSaving(false);
    }
  };

  /** Create every suggested team that does not exist yet. */
  const createMissingSuggested = async () => {
    const existing = new Set(teams.map((t) => t.label.toLowerCase()));
    const missing = SUGGESTED_TEAMS.filter((s) => !existing.has(s.label.toLowerCase()));
    if (missing.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      for (const s of missing) {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
        // 409 just means someone added it already — keep going
        if (!res.ok && res.status !== 409) {
          const d = await res.json();
          throw new Error(d.error);
        }
      }
      await load();
    } catch (e: any) {
      setError(e.message ?? "Could not create the teams");
    } finally {
      setSaving(false);
    }
  };

  const renameTeam = async (teamId: string) => {
    if (editLabel.trim().length < 2) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setEditingId(null);
      setEditLabel("");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Could not rename the team");
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async (team: Team) => {
    if (!confirm(`Remove the ${team.label} team?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await load();
    } catch (e: any) {
      setError(e.message ?? "Could not remove the team");
    } finally {
      setSaving(false);
    }
  };

  const missingCount = SUGGESTED_TEAMS.filter(
    (s) => !teams.some((t) => t.label.toLowerCase() === s.label.toLowerCase())
  ).length;

  if (loading) return null;

  return (
    <div className="mb-10">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-800">Serving Teams</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Create teams and assign who leads each one. Leading a team does not
            change someone&apos;s account role.
          </p>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="shrink-0 flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New team
        </button>
      </div>

      {/* One-click setup for the standard teams */}
      {missingCount > 0 && (
        <div className="bg-brown-50 border border-brown-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-gold-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brown-800">
              Set up your {missingCount} standard team{missingCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-brown-600 mt-0.5">
              {SUGGESTED_TEAMS.filter(
                (s) => !teams.some((t) => t.label.toLowerCase() === s.label.toLowerCase())
              )
                .map((s) => s.label)
                .join(", ")}
            </p>
          </div>
          <button
            onClick={createMissingSuggested}
            disabled={saving}
            className="shrink-0 bg-gold-500 text-brown-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-400 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create them"}
          </button>
        </div>
      )}

      {/* New team form */}
      {showNew && (
        <div className="bg-white border border-brown-200 rounded-2xl p-4 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Team name, e.g. Ushering"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => createTeam(newLabel, newDesc)}
              disabled={saving || newLabel.trim().length < 2}
              className="bg-brown-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brown-700 transition-colors disabled:opacity-40"
            >
              {saving ? "Creating…" : "Create team"}
            </button>
            <button
              onClick={() => { setShowNew(false); setNewLabel(""); setNewDesc(""); }}
              className="text-sm text-gray-500 px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white border border-brown-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
        {teams.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            No teams yet.
          </p>
        )}
        {teams.map((team) => (
          <div key={team.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brown-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-gold-500" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === team.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") renameTeam(team.id); }}
                      className="flex-1 h-8 rounded-lg border border-gray-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <button
                      onClick={() => renameTeam(team.id)}
                      disabled={saving}
                      className="text-xs bg-brown-800 text-white px-3 rounded-lg hover:bg-brown-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditLabel(""); }}
                      className="text-xs text-gray-500 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-800">{team.label}</p>
                    <p className="text-xs text-gray-400">
                      {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                      {team.leaderName ? ` · led by ${team.leaderName}` : " · no leader yet"}
                    </p>
                  </>
                )}
              </div>
              {editingId !== team.id && (
                <div className="flex items-center gap-2 shrink-0">
                  {team.leaderId && (
                    <button
                      onClick={() => assign(team.id, null)}
                      disabled={saving}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => { setOpenFor(openFor === team.id ? null : team.id); setQuery(""); }}
                    className="flex items-center gap-1.5 text-xs border border-brown-200 text-brown-700 px-3 py-1.5 rounded-lg hover:bg-brown-50 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    {team.leaderId ? "Change" : "Assign"}
                  </button>
                  <button
                    onClick={() => { setEditingId(team.id); setEditLabel(team.label); }}
                    title="Rename"
                    className="text-gray-300 hover:text-gold-600 transition-colors p-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeTeam(team)}
                    title="Remove team"
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {openFor === team.id && (
              <div className="mt-3 pl-12">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search members by name or email…"
                    className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                {searching && <p className="text-xs text-gray-400 mt-2">Searching…</p>}
                {!searching && query.trim().length >= 2 && candidates.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">No matching members.</p>
                )}
                {candidates.length > 0 && (
                  <ul className="mt-2 divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                    {candidates.map((c) => (
                      <li key={c.id} className="flex items-center justify-between px-3 py-2 bg-white">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                        <button
                          onClick={() => assign(team.id, c.id)}
                          disabled={saving}
                          className="shrink-0 flex items-center gap-1 text-xs bg-brown-800 text-white px-3 py-1.5 rounded-lg hover:bg-brown-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Make leader
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
