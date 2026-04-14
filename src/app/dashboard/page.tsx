import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, getRoleLabel, getRoleBadgeColor } from "@/lib/utils";
import { Calendar, Bell, BookOpen, Users, ClipboardList, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getVerseOfDay() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/verse`, { cache: "no-store" });
    return res.json();
  } catch {
    return { reference: "Hebrews 10:24-25", text: "Not giving up meeting together, but encouraging one another…", translation: "NIV" };
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

  const presentCount   = user?.attendances.filter((a) => a.status === "PRESENT").length ?? 0;
  const totalCount     = user?.attendances.length ?? 0;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "#2C1A0E" }}>
            {greeting()}, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1" style={{ color: "#9A7B5C" }}>
            {getRoleLabel(session.user.role)} ·{" "}
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0"
          style={{ background: "rgba(201,168,76,0.10)", color: "#C9A84C", borderColor: "rgba(201,168,76,0.25)" }}
        >
          {getRoleLabel(session.user.role)}
        </span>
      </div>

      {/* ── Verse of the day ────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1C0F07 0%, #2C1A0E 60%, #3D2410 100%)" }}
      >
        {/* Decorative cross */}
        <div
          className="absolute right-4 top-0 text-[120px] font-serif leading-none select-none pointer-events-none"
          style={{ color: "rgba(201,168,76,0.04)" }}
        >✝</div>
        <p className="section-label mb-3">✦ Verse of the Day</p>
        <blockquote className="scripture text-lg leading-relaxed mb-3" style={{ color: "#FAF7F0" }}>
          "{verse.text}"
        </blockquote>
        <p className="text-sm font-semibold" style={{ color: "#C9A84C" }}>
          — {verse.reference}{" "}
          <span className="font-normal" style={{ color: "#9A7B5C" }}>({verse.translation})</span>
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "BUS Group",
            value: user?.busGroup?.name || "Not Assigned",
            sub:   user?.busGroup?.leader?.name || "—",
            icon:  Users,
          },
          {
            label: "Attendance Rate",
            value: `${attendanceRate}%`,
            sub:   `${presentCount} of ${totalCount} sessions`,
            icon:  TrendingUp,
          },
          {
            label: "Announcements",
            value: announcements.length,
            sub:   `${announcements.filter((a) => a.isPinned).length} pinned`,
            icon:  Bell,
          },
          {
            label: "Upcoming Events",
            value: events.length,
            sub:   "this month",
            icon:  Calendar,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 card-hover"
            style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide" style={{ color: "#9A7B5C" }}>{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.10)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "#C9A84C" }} />
              </div>
            </div>
            <p className="font-display font-bold text-lg truncate" style={{ color: "#2C1A0E" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "#C4A882" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main content grid ───────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Announcements */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.10)" }}>
              <Bell className="w-4 h-4" style={{ color: "#C9A84C" }} />
            </div>
            <h2 className="font-display font-bold" style={{ color: "#2C1A0E" }}>Announcements</h2>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#C4A882" }}>No announcements at the moment.</p>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl"
                  style={
                    ann.isPinned
                      ? { background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.20)" }
                      : { background: "#FAF7F0", border: "1px solid #E0CBB0" }
                  }
                >
                  <div className="flex items-start gap-2 mb-1">
                    {ann.isPinned && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
                      >
                        📌 Pinned
                      </span>
                    )}
                    <h3 className="font-semibold text-sm" style={{ color: "#2C1A0E" }}>{ann.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#7A5C3E" }}>{ann.content}</p>
                  <p className="text-xs mt-2" style={{ color: "#C4A882" }}>{formatDate(ann.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Upcoming events */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.10)" }}>
                <Calendar className="w-4 h-4" style={{ color: "#C9A84C" }} />
              </div>
              <h2 className="font-display font-bold" style={{ color: "#2C1A0E" }}>Upcoming Events</h2>
            </div>
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#C4A882" }}>No upcoming events.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex gap-3 py-2.5" style={{ borderBottom: "1px solid #F0E6D3" }}>
                    <div
                      className="shrink-0 rounded-xl p-2 text-center min-w-[44px]"
                      style={{ background: "rgba(201,168,76,0.08)" }}
                    >
                      <p className="text-xs font-bold" style={{ color: "#C9A84C" }}>
                        {new Date(event.startDate).toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                      <p className="font-bold text-sm" style={{ color: "#2C1A0E" }}>
                        {new Date(event.startDate).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "#3D2410" }}>{event.title}</p>
                      <p className="text-xs" style={{ color: "#C4A882" }}>{formatTime(event.startDate)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BUS Group */}
          {user?.busGroup && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.10)" }}>
                  <Users className="w-4 h-4" style={{ color: "#C9A84C" }} />
                </div>
                <h2 className="font-display font-bold" style={{ color: "#2C1A0E" }}>My BUS Group</h2>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}>
                <p className="font-display font-bold text-lg" style={{ color: "#2C1A0E" }}>{user.busGroup.name}</p>
                {user.busGroup.leader && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                    <p className="text-xs mb-1" style={{ color: "#9A7B5C" }}>Group Leader</p>
                    <p className="text-sm font-medium" style={{ color: "#3D2410" }}>{user.busGroup.leader.name}</p>
                    <p className="text-xs" style={{ color: "#C9A84C" }}>{user.busGroup.leader.email}</p>
                  </div>
                )}
              </div>
              <Link
                href="/dashboard/bus-groups"
                className="text-xs font-medium mt-3 inline-block transition-colors"
                style={{ color: "#C9A84C" }}
              >
                View group details →
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
          >
            <h2 className="font-display font-bold mb-4" style={{ color: "#2C1A0E" }}>Quick Actions</h2>
            <div className="space-y-1">
              {[
                { href: "/dashboard/library",    icon: BookOpen,      label: "Browse Library" },
                { href: "/dashboard/attendance", icon: ClipboardList, label: "My Attendance"  },
                { href: "/events",               icon: Calendar,      label: "All Events"     },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className="quick-action flex items-center gap-3 p-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
