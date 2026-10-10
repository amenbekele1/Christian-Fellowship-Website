"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList, CheckCircle, XCircle, MinusCircle, Save, Search, Download, ChevronRight, CalendarDays, Users,
} from "lucide-react";
import { formatWarsaw, warsawDateKey } from "@/lib/timezone";
import { peekCache, fetchJsonCached } from "@/lib/fetch-cache";
import { toast } from "@/components/ui/toaster";

type Status = "PRESENT" | "ABSENT" | "EXCUSED";
type Tab = "record" | "sessions" | "members";

interface Member {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
  busGroup?: { id: string; name: string } | null;
}
interface Group { id: string; name: string }
interface SessionRow { date: string; present: number; absent: number; excused: number }
interface MemberStat {
  userId: string;
  name: string;
  phone: string | null;
  busGroup: Group | null;
  present: number;
  absent: number;
  excused: number;
  lastPresent: string | null;
  rate: number | null;
}

const MEMBERS_URL = "/api/members?limit=500";
const GROUPS_URL = "/api/bus-groups";

const STATUS: Record<Status, { label: string; short: string; icon: typeof CheckCircle; on: string }> = {
  PRESENT: { label: "Present", short: "P", icon: CheckCircle, on: "bg-green-600 text-white border-green-600" },
  ABSENT: { label: "Absent", short: "A", icon: XCircle, on: "bg-red-600 text-white border-red-600" },
  EXCUSED: { label: "Excused", short: "E", icon: MinusCircle, on: "bg-amber-500 text-white border-amber-500" },
};

const longDate = (key: string) =>
  formatWarsaw(`${key}T12:00:00Z`, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = (key: string) =>
  formatWarsaw(`${key}T12:00:00Z`, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const daysAgo = (n: number) => warsawDateKey(new Date(Date.now() - n * 86_400_000));

const PERIODS = [
  { key: "1m", label: "Last month", from: () => daysAgo(31) },
  { key: "3m", label: "Last 3 months", from: () => daysAgo(91) },
  { key: "6m", label: "Last 6 months", from: () => daysAgo(183) },
  { key: "1y", label: "Last 12 months", from: () => daysAgo(365) },
] as const;

function membersFrom(json: any): Member[] {
  const raw = Array.isArray(json) ? json : (json?.data ?? []);
  return raw.filter((m: Member) => m && m.isActive !== false);
}

/**
 * Attendance tracker (Guardians): record a session, browse every recorded
 * session, and see each member's attendance over a period.
 */
export default function AttendancePage() {
  const { data: session } = useSession();
  const isGuardian = session?.user.role === "GUARDIAN";
  const [tab, setTab] = useState<Tab>("record");

  // Shared data
  const [members, setMembers] = useState<Member[]>(() => membersFrom(peekCache(MEMBERS_URL)));
  const [groups, setGroups] = useState<Group[]>(() => peekCache<Group[]>(GROUPS_URL) ?? []);
  const [groupFilter, setGroupFilter] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isGuardian) return;
    fetchJsonCached<any>(MEMBERS_URL).then((j) => setMembers(membersFrom(j))).catch(() => {});
    fetchJsonCached<Group[]>(GROUPS_URL).then((g) => setGroups(Array.isArray(g) ? g : [])).catch(() => {});
  }, [isGuardian]);

  // ── Record ───────────────────────────────────────────────────
  const [date, setDate] = useState(() => warsawDateKey());
  const [marks, setMarks] = useState<Record<string, Status | null>>({});
  const [recordedCount, setRecordedCount] = useState(0);
  const [loadingDate, setLoadingDate] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDate = useCallback(async (key: string, list: Member[]) => {
    setLoadingDate(true);
    try {
      const res = await fetch(`/api/attendance?date=${key}`);
      const rows: { userId: string; status: Status }[] = res.ok ? await res.json() : [];
      const existing = new Map(rows.map((r) => [r.userId, r.status]));
      setRecordedCount(rows.length);
      // A recorded session shows what was saved; a new one starts all-present.
      setMarks(Object.fromEntries(list.map((m) => [m.id, existing.get(m.id) ?? (rows.length ? null : "PRESENT")])));
    } finally {
      setLoadingDate(false);
    }
  }, []);

  useEffect(() => {
    if (isGuardian && members.length) loadDate(date, members);
  }, [isGuardian, date, members, loadDate]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!groupFilter || (groupFilter === "none" ? !m.busGroup : m.busGroup?.id === groupFilter)) &&
        (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    );
  }, [members, groupFilter, query]);

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, EXCUSED: 0, none: 0 };
    for (const m of members) {
      const s = marks[m.id];
      if (s) c[s]++;
      else c.none++;
    }
    return c;
  }, [members, marks]);

  // ── Sessions & Members (summary) ─────────────────────────────
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("3m");
  const [summary, setSummary] = useState<{ sessions: SessionRow[]; members: MemberStat[] } | null>(null);
  const [sortBy, setSortBy] = useState<"rate" | "name">("rate");
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [history, setHistory] = useState<{ date: string; status: Status }[]>([]);

  const save = async () => {
    const records = members
      .filter((m) => marks[m.id])
      .map((m) => ({ userId: m.id, status: marks[m.id] as Status, busGroupId: m.busGroup?.id ?? null }));
    if (!records.length) return toast.error("Mark at least one member first.");
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Saving failed");
      toast.success(`Attendance saved for ${shortDate(date)}`);
      setRecordedCount(records.length);
      setSummary(null); // the other tabs reload with the new numbers
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!isGuardian || tab === "record") return;
    const from = PERIODS.find((p) => p.key === period)!.from();
    const params = new URLSearchParams({ from, to: warsawDateKey() });
    if (groupFilter && groupFilter !== "none") params.set("busGroupId", groupFilter);
    let cancelled = false;
    fetch(`/api/attendance/summary?${params}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setSummary({ sessions: d.sessions ?? [], members: d.members ?? [] }))
      .catch(() => !cancelled && setSummary({ sessions: [], members: [] }));
    return () => { cancelled = true; };
  }, [isGuardian, tab, period, groupFilter, recordedCount]);

  const memberRows = useMemo(() => {
    if (!summary) return [];
    const q = query.trim().toLowerCase();
    const rows = summary.members.filter(
      (m) => (groupFilter !== "none" || !m.busGroup) && (!q || m.name.toLowerCase().includes(q))
    );
    return rows.sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : (a.rate ?? 101) - (b.rate ?? 101) || a.name.localeCompare(b.name)
    );
  }, [summary, query, sortBy, groupFilter]);

  const openHistory = async (userId: string) => {
    if (openMember === userId) return setOpenMember(null);
    setOpenMember(userId);
    setHistory([]);
    const res = await fetch(`/api/attendance?userId=${userId}`);
    const rows = res.ok ? await res.json() : [];
    setHistory(rows.map((r: any) => ({ date: String(r.date).slice(0, 10), status: r.status })));
  };

  const downloadCsv = () => {
    const header = ["Member", "BUS group", "Present", "Absent", "Excused", "Rate %", "Last present"];
    const lines = memberRows.map((m) =>
      [m.name, m.busGroup?.name ?? "", m.present, m.absent, m.excused, m.rate ?? "", m.lastPresent ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${period}-${warsawDateKey()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (session && !isGuardian) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ClipboardList className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-400 text-sm">Only Guardians can manage attendance.</p>
      </div>
    );
  }

  const filterBar = (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          className="w-full pl-9 pr-3 h-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>
      <select
        value={groupFilter}
        onChange={(e) => setGroupFilter(e.target.value)}
        className="h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
      >
        <option value="">All BUS groups</option>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        <option value="none">No BUS group</option>
      </select>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold text-gray-800">Attendance</h1>
        <p className="text-gray-500 mt-1">Record each gathering and follow how members are attending.</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-white p-1 mb-5 w-fit" role="tablist">
        {([
          ["record", "Record", ClipboardList],
          ["sessions", "Sessions", CalendarDays],
          ["members", "Members", Users],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-semibold transition-colors ${
              tab === key ? "bg-brown-800 text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Record ── */}
      {tab === "record" && (
        <>
          <div className="bg-white rounded-2xl border border-brown-200 p-4 mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
              <input
                type="date"
                value={date}
                max={warsawDateKey()}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold text-gray-800">{longDate(date)}</p>
              <p className="text-xs mt-0.5 text-gray-500">
                {loadingDate
                  ? "Loading…"
                  : recordedCount
                    ? `Already recorded (${recordedCount} marked) — changes update this session.`
                    : "Not recorded yet — everyone starts as present; mark who was absent."}
              </p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              <span className="text-green-700">{counts.PRESENT} present</span>
              <span className="text-red-700">{counts.ABSENT} absent</span>
              <span className="text-amber-700">{counts.EXCUSED} excused</span>
              {counts.none > 0 && <span className="text-gray-400">{counts.none} not marked</span>}
            </div>
          </div>

          {filterBar}

          <div className="bg-white rounded-2xl border border-brown-200 overflow-hidden divide-y divide-gray-100">
            {visible.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No members match.</p>}
            {visible.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-brown-100 flex items-center justify-center text-gold-600 font-bold text-sm shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.busGroup?.name ?? "No BUS group"}</p>
                </div>
                <div className="flex gap-1.5 shrink-0" role="radiogroup" aria-label={`Attendance for ${m.name}`}>
                  {(Object.keys(STATUS) as Status[]).map((s) => (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={marks[m.id] === s}
                      title={STATUS[s].label}
                      onClick={() => setMarks((prev) => ({ ...prev, [m.id]: s }))}
                      className={`w-9 h-9 rounded-lg border text-xs font-bold transition-colors ${
                        marks[m.id] === s ? STATUS[s].on : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {STATUS[s].short}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 mt-4 py-3 bg-gray-50/95 backdrop-blur flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => setMarks((prev) => ({ ...prev, ...Object.fromEntries(visible.map((m) => [m.id, "PRESENT" as Status])) }))}
              className="px-4 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600"
            >
              Mark shown as present
            </button>
            <button
              onClick={save}
              disabled={saving || loadingDate}
              className="flex items-center gap-2 px-6 h-11 rounded-xl bg-brown-800 text-white text-sm font-semibold disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving…" : recordedCount ? "Update attendance" : "Save attendance"}
            </button>
          </div>
        </>
      )}

      {/* Period picker for summaries */}
      {tab !== "record" && (
        <div className="flex flex-wrap gap-2 mb-3">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 h-8 rounded-lg text-xs font-semibold border ${
                period === p.key ? "bg-brown-800 text-white border-brown-800" : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Sessions ── */}
      {tab === "sessions" && (
        <>
          {filterBar}
          <div className="bg-white rounded-2xl border border-brown-200 overflow-hidden divide-y divide-gray-100">
            {!summary && <p className="text-center text-sm text-gray-400 py-10">Loading…</p>}
            {summary?.sessions.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No attendance recorded in this period.</p>}
            {summary?.sessions.map((s) => {
              const marked = s.present + s.absent;
              const rate = marked ? Math.round((s.present / marked) * 100) : 0;
              return (
                <button
                  key={s.date}
                  onClick={() => { setDate(s.date); setTab("record"); }}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{shortDate(s.date)}</p>
                    <p className="text-xs text-gray-500">
                      <span className="text-green-700">{s.present} present</span> · <span className="text-red-700">{s.absent} absent</span>
                      {s.excused > 0 && <> · <span className="text-amber-700">{s.excused} excused</span></>}
                    </p>
                  </div>
                  <div className="w-28 hidden sm:block">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-green-600" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12 text-right">{rate}%</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">Tap a session to view or correct it. Rate = present ÷ (present + absent); excused doesn&apos;t count against it.</p>
        </>
      )}

      {/* ── Members ── */}
      {tab === "members" && (
        <>
          {filterBar}
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold">
              {([["rate", "Lowest attendance first"], ["name", "A–Z"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)} className={`px-3 h-7 rounded-md ${sortBy === k ? "bg-brown-800 text-white" : "text-gray-500"}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={downloadCsv} disabled={!memberRows.length} className="flex items-center gap-1.5 text-xs font-semibold text-brown-700 px-3 h-8 rounded-lg border border-gray-200 bg-white disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-brown-200 overflow-hidden divide-y divide-gray-100">
            {!summary && <p className="text-center text-sm text-gray-400 py-10">Loading…</p>}
            {summary && memberRows.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No members match.</p>}
            {memberRows.map((m) => (
              <div key={m.userId}>
                <button onClick={() => openHistory(m.userId)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {m.busGroup?.name ?? "No BUS group"} · {m.present}P {m.absent}A {m.excused}E
                      {m.lastPresent ? ` · last present ${shortDate(m.lastPresent)}` : " · not present in this period"}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold w-14 text-right ${
                      m.rate === null ? "text-gray-300" : m.rate < 50 ? "text-red-600" : m.rate < 75 ? "text-amber-600" : "text-green-700"
                    }`}
                  >
                    {m.rate === null ? "—" : `${m.rate}%`}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${openMember === m.userId ? "rotate-90" : ""}`} />
                </button>
                {openMember === m.userId && (
                  <div className="px-4 pb-4">
                    {m.phone && <p className="text-xs text-gray-500 mb-2">Phone: <a className="underline" href={`tel:${m.phone}`}>{m.phone}</a></p>}
                    {history.length === 0 ? (
                      <p className="text-xs text-gray-400">No attendance recorded yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {history.slice(0, 30).map((h) => (
                          <span key={h.date} className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                            h.status === "PRESENT" ? "bg-green-50 text-green-700" : h.status === "ABSENT" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {shortDate(h.date)} · {STATUS[h.status].label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">“—” means the member hasn&apos;t been marked present or absent in this period.</p>
        </>
      )}
    </div>
  );
}
