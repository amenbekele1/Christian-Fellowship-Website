import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, getRoleLabel, getRoleBadgeColor } from "@/lib/utils";
import { Calendar, Bell, BookOpen, Users, ClipboardList } from "lucide-react";
import Link from "next/link";

async function getVerseOfDay() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/verse`, { cache: "no-store" });
    return res.json();
  } catch {
    return { reference: "Hebrews 10:24-25", text: "Not giving up meeting together, but encouraging one another...", translation: "NIV" };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [verse, announcements, events, user] = await Promise.all([
    getVerseOfDay(),
    prisma.announcement.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.event.findMany({
      where: { isActive: true, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        busGroup: { include: { leader: { select: { name: true, email: true } } } },
        attendances: { orderBy: { date: "desc" }, take: 5 },
      },
    }),
  ]);

  const presentCount = user?.attendances.filter((a) => a.status === "PRESENT").length ?? 0;
  const totalCount = user?.attendances.length ?? 0;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-800">
              Welcome, {session.user.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              {getRoleLabel(session.user.role)} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getRoleBadgeColor(session.user.role)}`}>
            {getRoleLabel(session.user.role)}
          </span>
        </div>
      </div>

      {/* Verse of the day */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-white opacity-5 text-[100px] font-serif leading-none">✝</div>
        <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">✦ Verse of the Day</p>
        <blockquote className="scripture text-white text-lg leading-relaxed mb-3">
          "{verse.text}"
        </blockquote>
        <p className="text-green-300 text-sm font-semibold">
          — {verse.reference} <span className="font-normal text-green-400">({verse.translation})</span>
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">BUS Group</p>
          <p className="font-display font-bold text-gray-800 text-lg truncate">
            {user?.busGroup?.name || "Not Assigned"}
          </p>
          <p className="text-xs text-green-600 mt-1">{user?.busGroup?.leader?.name || "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Attendance Rate</p>
          <p className="font-display font-bold text-gray-800 text-lg">{attendanceRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{presentCount} of {totalCount} sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Announcements</p>
          <p className="font-display font-bold text-gray-800 text-lg">{announcements.length}</p>
          <p className="text-xs text-green-600 mt-1">{announcements.filter((a) => a.isPinned).length} pinned</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Upcoming Events</p>
          <p className="font-display font-bold text-gray-800 text-lg">{events.length}</p>
          <p className="text-xs text-gray-400 mt-1">this month</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-green-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              <h2 className="font-display font-bold text-gray-800">Announcements</h2>
            </div>
          </div>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No announcements at the moment.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className={`p-4 rounded-xl border ${ann.isPinned ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-start gap-2 mb-1">
                    {ann.isPinned && <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-medium shrink-0">📌 Pinned</span>}
                    <h3 className="font-semibold text-gray-800 text-sm">{ann.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(ann.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming events + BUS group */}
        <div className="space-y-5">
          {/* Events */}
          <div className="bg-white rounded-2xl border border-green-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-green-600" />
              <h2 className="font-display font-bold text-gray-800">Upcoming Events</h2>
            </div>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming events.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="shrink-0 bg-green-50 rounded-lg p-2 text-center min-w-[44px]">
                      <p className="text-xs font-bold text-green-600">
                        {new Date(event.startDate).toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                      <p className="font-bold text-green-800 text-sm leading-tight">
                        {new Date(event.startDate).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">{formatTime(event.startDate)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BUS Group */}
          {user?.busGroup && (
            <div className="bg-white rounded-2xl border border-green-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-green-600" />
                <h2 className="font-display font-bold text-gray-800">My BUS Group</h2>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="font-display font-bold text-green-800 text-lg mb-1">{user.busGroup.name}</p>
                {user.busGroup.leader && (
                  <div className="mt-3 pt-3 border-t border-green-100">
                    <p className="text-xs text-gray-400 mb-1">Group Leader</p>
                    <p className="text-sm font-medium text-gray-700">{user.busGroup.leader.name}</p>
                    <p className="text-xs text-green-600">{user.busGroup.leader.email}</p>
                  </div>
                )}
              </div>
              <Link href="/dashboard/bus-groups" className="text-xs text-green-700 font-medium mt-3 inline-block hover:underline">
                View group details →
              </Link>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-green-100 p-5">
            <h2 className="font-display font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/dashboard/library" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Browse Library</span>
              </Link>
              <Link href="/dashboard/attendance" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group">
                <ClipboardList className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">My Attendance</span>
              </Link>
              <Link href="/events" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">All Events</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
