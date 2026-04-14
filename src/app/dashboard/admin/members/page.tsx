"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Users, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { getRoleLabel, getRoleBadgeColor, formatDate } from "@/lib/utils";

interface Member {
  id: string; name: string; email: string; phone: string | null;
  role: string; isActive: boolean; joinedAt: string;
  busGroup: { id: string; name: string } | null;
  busGroupId?: string | null;
}
interface BUSGroup { id: string; name: string; }

const PAGE_SIZE = 20;

export default function AdminMembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [busGroups, setBusGroups] = useState<BUSGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.role !== "GUARDIAN") { router.push("/dashboard"); return; }
    fetchBusGroups();
  }, [session]);

  useEffect(() => {
    if (session?.user.role !== "GUARDIAN") return;
    fetchMembers();
  }, [page, search, session]);

  const fetchBusGroups = async () => {
    try {
      const res = await fetch("/api/bus-groups");
      if (!res.ok) throw new Error("Failed to load groups");
      const data = await res.json();
      setBusGroups(Array.isArray(data) ? data : []);
    } catch {
      // non-critical, keep empty
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/members?${params}`);
      if (!res.ok) throw new Error("Failed to load members");
      const json = await res.json();
      setMembers(Array.isArray(json) ? json : (json.data ?? []));
      setTotal(json.total ?? json.length ?? 0);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/members?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Update failed");
        return;
      }
      await fetchMembers();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const toggleActive = async (member: Member) => {
    const action = member.isActive ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} ${member.name}?`)) return;
    await updateMember(member.id, { isActive: !member.isActive });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading && members.length === 0) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Members</h1>
          <p className="text-gray-500 mt-1">{total} total members registered</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-brown-200 rounded-xl px-4 py-2.5 text-center">
            <p className="font-display font-bold text-gold-500 text-xl">{members.filter(m => m.isActive).length}</p>
            <p className="text-xs text-gray-400">Active (this page)</p>
          </div>
          <div className="bg-white border border-brown-200 rounded-xl px-4 py-2.5 text-center">
            <p className="font-display font-bold text-amber-600 text-xl">{members.filter(m => m.role === "BUS_LEADER").length}</p>
            <p className="text-xs text-gray-400">Leaders (this page)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchMembers} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
          />
        </div>
        <button type="submit" className="px-4 h-10 bg-brown-800 text-white rounded-xl text-sm font-medium hover:bg-brown-800">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="px-3 h-10 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-brown-200">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">BUS Group</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brown-100 flex items-center justify-center text-gold-500 font-bold text-sm shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={member.role}
                      onChange={e => updateMember(member.id, { role: e.target.value as any })}
                      disabled={updating === member.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white cursor-pointer disabled:opacity-50"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="BUS_LEADER">BUS Leader</option>
                      <option value="GUARDIAN">Guardian</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={member.busGroup?.id || ""}
                      onChange={e => updateMember(member.id, { busGroupId: e.target.value || null })}
                      disabled={updating === member.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white cursor-pointer disabled:opacity-50 max-w-[150px]"
                    >
                      <option value="">Unassigned</option>
                      {busGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-gray-500">{formatDate(member.joinedAt)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(member)}
                      disabled={updating === member.id}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                        member.isActive
                          ? "bg-brown-100 text-gold-500 border-brown-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          : "bg-red-100 text-red-700 border-red-200 hover:bg-brown-50 hover:text-gold-500 hover:border-brown-200"
                      }`}
                    >
                      {updating === member.id ? "..." : member.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{search ? "No members match your search." : "No members found."}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-brown-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} members
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
