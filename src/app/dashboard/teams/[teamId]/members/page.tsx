"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserPlus, UserMinus, Link2, Copy, Check, AlertCircle, X, Crown, Search,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isLeader: boolean;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
}

export default function TeamMembersPage({ params }: { params: { teamId: string } }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-member search
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);

  // Invite link
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch(`/api/teams/${params.teamId}/members`),
        fetch("/api/teams?mine=1"),
      ]);
      if (!mRes.ok) throw new Error("Could not load members");
      const { members } = await mRes.json();
      setMembers(members);

      const teams = await tRes.json();
      const t = Array.isArray(teams) ? teams.find((x: any) => x.id === params.teamId) : null;
      setIsLeader(Boolean(t?.isLeader));
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [params.teamId]);

  useEffect(() => { load(); }, [load]);

  // Debounced member search
  useEffect(() => {
    if (!showAdd || query.trim().length < 2) { setCandidates([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/teams/${params.teamId}/candidates?q=${encodeURIComponent(query)}`
        );
        const { candidates } = await res.json();
        setCandidates(Array.isArray(candidates) ? candidates : []);
      } catch {
        setCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, showAdd, params.teamId]);

  const addMember = async (userId: string) => {
    setError(null);
    const res = await fetch(`/api/teams/${params.teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not add member");
      return;
    }
    setQuery("");
    setShowAdd(false);
    load();
  };

  const removeMember = async (m: Member) => {
    if (!confirm(`Remove ${m.name} from this team?`)) return;
    setError(null);
    const res = await fetch(`/api/teams/${params.teamId}/members?userId=${m.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not remove member");
      return;
    }
    load();
  };

  const generateLink = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${params.teamId}/invite`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const { url } = await res.json();
      setInviteUrl(url);
    } catch (e: any) {
      setError(e.message ?? "Could not generate link");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
      <div className="flex items-center justify-between mb-5 gap-3">
        <p className="text-gray-500 text-sm">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        {isLeader && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd((s) => !s)}
              className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brown-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add member
            </button>
            <button
              onClick={generateLink}
              disabled={generating}
              className="flex items-center gap-2 border border-brown-200 text-brown-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-brown-50 transition-colors disabled:opacity-50"
            >
              <Link2 className="w-4 h-4" /> {generating ? "Creating…" : "Join link"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Invite link result */}
      {inviteUrl && (
        <div className="bg-brown-50 border border-brown-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium text-brown-800 mb-1">Share this link</p>
          <p className="text-xs text-brown-600 mb-3">
            Anyone who already has a fellowship account can open it to join this team.
            People without an account will be asked to register first. Valid for 30 days.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 h-10 rounded-lg border border-brown-200 bg-white px-3 text-xs text-brown-700"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-brown-800 text-white px-3 rounded-lg text-sm hover:bg-brown-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Add member search */}
      {showAdd && isLeader && (
        <div className="bg-white border border-brown-200 rounded-2xl p-4 mb-4">
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
            <p className="text-xs text-gray-400 mt-2">No matching members found.</p>
          )}
          {candidates.length > 0 && (
            <ul className="mt-3 divide-y divide-gray-100">
              {candidates.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  <button
                    onClick={() => addMember(c.id)}
                    className="shrink-0 text-xs bg-brown-800 text-white px-3 py-1.5 rounded-lg hover:bg-brown-700 transition-colors"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Roster */}
      {members.length === 0 ? (
        <div className="bg-white border border-brown-200 rounded-2xl p-16 text-center">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 text-sm font-medium">No members yet</p>
          {isLeader && (
            <p className="text-gray-400 text-xs mt-1">
              Add someone directly, or share a join link.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-brown-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-brown-100 text-gold-500 font-bold text-sm flex items-center justify-center shrink-0">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  {m.isLeader && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                      <Crown className="w-3 h-3" /> Leader
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {[m.email, m.phone].filter(Boolean).join("  ·  ")}
                </p>
              </div>
              {isLeader && !m.isLeader && (
                <button
                  onClick={() => removeMember(m)}
                  title="Remove from team"
                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
