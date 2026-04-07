"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, UserCog, Shield, Users } from "lucide-react";
import { getRoleLabel, getRoleBadgeColor, formatDate } from "@/lib/utils";

interface Member {
  id: string; name: string; email: string; phone: string | null;
  role: string; isActive: boolean; joinedAt: string;
  busGroup: { id: string; name: string } | null;
  busGroupId?: string | null;
}
interface BUSGroup { id: string; name: string; }

export default function AdminMembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [busGroups, setBusGroups] = useState<BUSGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.role !== "GUARDIAN") { router.push("/dashboard"); return; }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    const [m, g] = await Promise.all([fetch("/api/members"), fetch("/api/bus-groups")]);
    setMembers(await m.json());
    const gData = await g.json();
    setBusGroups(gData);
    setLoading(false);
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
    setUpdating(id);
    await fetch(`/api/members?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchData();
    setUpdating(null);
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
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
          <p className="text-gray-500 mt-1">{members.length} total members registered</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-green-100 rounded-xl px-4 py-2.5 text-center">
            <p className="font-display font-bold text-green-700 text-xl">{members.filter(m => m.isActive).length}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="bg-white border border-green-100 rounded-xl px-4 py-2.5 text-center">
            <p className="font-display font-bold text-amber-600 text-xl">{members.filter(m => m.role === "BUS_LEADER").length}</p>
            <p className="text-xs text-gray-400">Leaders</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-green-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">BUS Group</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
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
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white cursor-pointer disabled:opacity-50"
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
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white cursor-pointer disabled:opacity-50 max-w-[150px]"
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
                      onClick={() => updateMember(member.id, { isActive: !member.isActive })}
                      disabled={updating === member.id}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                        member.isActive
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          : "bg-red-100 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No members found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
