"use client";

import { useEffect, useState, useCallback } from "react";
import { Crown, Search, X, Check, AlertCircle, Users } from "lucide-react";

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

  if (loading) return null;

  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-gray-800">Team Leaders</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Assign who leads each serving team. This does not change their account role.
        </p>
      </div>

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
                <p className="text-sm font-semibold text-gray-800">{team.label}</p>
                <p className="text-xs text-gray-400">
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                  {team.leaderName ? ` · led by ${team.leaderName}` : " · no leader yet"}
                </p>
              </div>
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
              </div>
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
