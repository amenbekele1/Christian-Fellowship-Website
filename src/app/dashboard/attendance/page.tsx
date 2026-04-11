"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, CheckCircle, XCircle, MinusCircle, Save } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Member { id: string; name: string; email: string; }
interface BUSGroup { id: string; name: string; members: Member[]; }
interface AttendanceRecord { id: string; date: string; status: string; user: { name: string }; busGroup: { name: string }; }

export default function AttendancePage() {
  const { data: session } = useSession();
  const [busGroups, setBusGroups] = useState<BUSGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT" | "EXCUSED">>({});
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const isGuardian = session?.user.role === "GUARDIAN";

  useEffect(() => {
    if (isGuardian) {
      fetch("/api/bus-groups")
        .then(r => r.json())
        .then(data => {
          setBusGroups(data);
          if (data.length > 0) setSelectedGroup(data[0].id);
        })
        .finally(() => setLoading(false));
    } else {
      fetch("/api/attendance?userId=" + session?.user.id)
        .then(r => r.json())
        .then(data => setMyAttendance(Array.isArray(data) ? data : []))
        .finally(() => setLoading(false));
    }
  }, [isGuardian, session]);

  useEffect(() => {
    if (selectedGroup) {
      const group = busGroups.find(g => g.id === selectedGroup);
      if (group) {
        const init: Record<string, "PRESENT" | "ABSENT" | "EXCUSED"> = {};
        group.members.forEach(m => { init[m.id] = "PRESENT"; });
        setAttendance(init);
      }
    }
  }, [selectedGroup, busGroups]);

  const toggleStatus = (memberId: string) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: prev[memberId] === "PRESENT" ? "ABSENT" : prev[memberId] === "ABSENT" ? "EXCUSED" : "PRESENT",
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const records = Object.entries(attendance).map(([userId, status]) => ({ userId, status }));
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, busGroupId: selectedGroup, date }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const currentGroup = busGroups.find(g => g.id === selectedGroup);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">
          {isGuardian ? "Record Attendance" : "My Attendance"}
        </h1>
        <p className="text-gray-500 mt-1">
          {isGuardian ? "Mark attendance for BUS group members" : "Your attendance history"}
        </p>
      </div>

      {isGuardian ? (
        /* ── Leader: record attendance ── */
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm">
          <div className="p-5 border-b border-green-50">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">BUS Group</label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {busGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {currentGroup && currentGroup.members.length > 0 ? (
            <>
              {/* Legend */}
              <div className="px-5 pt-4 flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500"/>Present</span>
                <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400"/>Absent</span>
                <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-amber-400"/>Excused</span>
                <span className="text-gray-400">· Click name to toggle</span>
              </div>

              <div className="divide-y divide-green-50">
                {currentGroup.members.map((member) => {
                  const status = attendance[member.id] || "PRESENT";
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleStatus(member.id)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status === "PRESENT" && <CheckCircle className="w-5 h-5 text-green-500"/>}
                        {status === "ABSENT" && <XCircle className="w-5 h-5 text-red-400"/>}
                        {status === "EXCUSED" && <MinusCircle className="w-5 h-5 text-amber-400"/>}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          status === "PRESENT" ? "text-green-700 bg-green-100" :
                          status === "ABSENT" ? "text-red-700 bg-red-100" :
                          "text-amber-700 bg-amber-100"
                        }`}>{status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-5 border-t border-green-50 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {Object.values(attendance).filter(s => s === "PRESENT").length} present ·{" "}
                  {Object.values(attendance).filter(s => s === "ABSENT").length} absent ·{" "}
                  {Object.values(attendance).filter(s => s === "EXCUSED").length} excused
                </div>
                <button
                  onClick={saveAttendance}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {saving ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Save className="w-4 h-4"/>}
                  {saved ? "Saved! ✓" : saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-14 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p>No members in this group yet.</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Member: view own attendance ── */
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm">
          {myAttendance.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p>No attendance records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-green-50">
              {myAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{formatDate(record.date)}</p>
                    <p className="text-xs text-gray-400">{record.busGroup?.name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    record.status === "PRESENT" ? "bg-green-100 text-green-700 border-green-200" :
                    record.status === "ABSENT" ? "bg-red-100 text-red-700 border-red-200" :
                    "bg-amber-100 text-amber-700 border-amber-200"
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
