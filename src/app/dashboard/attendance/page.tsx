"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, CheckCircle, XCircle, MinusCircle, Save } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  busGroup?: { id: string; name: string } | null;
}

interface MemberRecord {
  userId: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  busGroupId: string | null;
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "EXCUSED">>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members?limit=200")
      .then(r => r.json())
      .then((json: any) => {
        const raw = Array.isArray(json) ? json : (json.data ?? []);
        const active = raw.filter((m: Member) => m);
        setMembers(active);
        const init: Record<string, "PRESENT" | "ABSENT" | "EXCUSED"> = {};
        active.forEach((m: Member) => { init[m.id] = "PRESENT"; });
        setAttendance(init);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === "PRESENT" ? "ABSENT" : prev[id] === "ABSENT" ? "EXCUSED" : "PRESENT",
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const records: MemberRecord[] = members.map(m => ({
        userId: m.id,
        status: attendance[m.id] || "PRESENT",
        busGroupId: m.busGroup?.id || null,
      }));
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Group members by BUS group
  const grouped = members.reduce<Record<string, { name: string; members: Member[] }>>((acc, m) => {
    const key = m.busGroup?.id || "__none__";
    const label = m.busGroup?.name || "No BUS Group";
    if (!acc[key]) acc[key] = { name: label, members: [] };
    acc[key].members.push(m);
    return acc;
  }, {});

  // Sort: named groups first, unassigned last
  const groupEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    return 0;
  });

  const present = Object.values(attendance).filter(s => s === "PRESENT").length;
  const absent = Object.values(attendance).filter(s => s === "ABSENT").length;
  const excused = Object.values(attendance).filter(s => s === "EXCUSED").length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Record Attendance</h1>
          <p className="text-gray-500 mt-1">{members.length} members · click to toggle status</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-gold-500"/>Present</span>
        <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400"/>Absent</span>
        <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-amber-400"/>Excused</span>
        <span className="text-gray-400">· Click name to toggle</span>
      </div>

      <div className="space-y-4">
        {groupEntries.map(([groupId, { name: groupName, members: groupMembers }]) => (
          <div key={groupId} className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-brown-50 border-b border-brown-200 flex items-center justify-between">
              <p className="text-sm font-semibold text-brown-700">{groupName}</p>
              <span className="text-xs text-gray-400">{groupMembers.length} members</span>
            </div>
            <div className="divide-y divide-brown-100">
              {groupMembers.map(member => {
                const status = attendance[member.id] || "PRESENT";
                return (
                  <button
                    key={member.id}
                    onClick={() => toggle(member.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brown-100 flex items-center justify-center text-gold-500 font-bold text-sm shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "PRESENT" && <CheckCircle className="w-5 h-5 text-gold-500"/>}
                      {status === "ABSENT" && <XCircle className="w-5 h-5 text-red-400"/>}
                      {status === "EXCUSED" && <MinusCircle className="w-5 h-5 text-amber-400"/>}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        status === "PRESENT" ? "text-gold-500 bg-brown-100" :
                        status === "ABSENT" ? "text-red-700 bg-red-100" :
                        "text-amber-700 bg-amber-100"
                      }`}>{status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer save bar */}
      <div className="sticky bottom-4 mt-6">
        <div className="bg-white border border-brown-200 rounded-2xl shadow-lg px-5 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="text-gold-500 font-semibold">{present}</span> present ·{" "}
            <span className="text-red-600 font-semibold">{absent}</span> absent ·{" "}
            <span className="text-amber-600 font-semibold">{excused}</span> excused
          </div>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="flex items-center gap-2 bg-brown-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 transition-colors disabled:opacity-50"
          >
            {saving
              ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <Save className="w-4 h-4"/>}
            {saved ? "Saved! ✓" : saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
