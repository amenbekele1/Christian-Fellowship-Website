import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatShortDate, getRoleLabel } from "@/lib/utils";
import { getVerseOfDay } from "@/lib/verse";
import { formatWarsaw, warsawGreeting } from "@/lib/timezone";
import { eventPath } from "@/lib/event-presets";
import { getCurrentStudy, studyDateLabel } from "@/lib/bible-study";
import { formatReference } from "@/lib/bible";
import { Calendar, Bell, BookOpen, Users, ScrollText, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const verse = getVerseOfDay();
  const [study, announcements, events, user] = await Promise.all([
    getCurrentStudy(),
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
      select: {
        busGroup: { select: { id: true, name: true, leader: { select: { name: true, email: true } } } },
        // A BUS leader may lead a group without being listed as its member.
        ledBusGroup: { select: { id: true, name: true } },
        bookRentals: {
          where: { status: { in: ["ACTIVE", "OVERDUE"] } },
          orderBy: { dueDate: "asc" },
          select: { status: true, dueDate: true },
        },
      },
    }),
  ]);

  const myGroup   = user?.busGroup ?? user?.ledBusGroup ?? null;
  const rentals   = user?.bookRentals ?? [];
  const overdue   = rentals.filter((r) => r.status === "OVERDUE").length;
  const nextDue   = rentals.find((r) => r.dueDate)?.dueDate;


  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "#2C1A0E" }}>
            {warsawGreeting()}, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1" style={{ color: "#9A7B5C" }}>
            {getRoleLabel(session.user.role)} ·{" "}
            {formatWarsaw(new Date(), { weekday: "long", day: "numeric", month: "long" })}
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
          className="absolute right-4 top-0 select-none pointer-events-none"
          style={{ color: "rgba(201,168,76,0.04)" }}
        ><svg className="w-28 h-28" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M42,5 H58 V30 H90 V46 H58 V95 H42 V46 H10 V30 H42 Z"/></svg></div>
        <p className="section-label mb-3">✦ Verse of the Day</p>
        <blockquote className="scripture text-lg leading-relaxed mb-3" style={{ color: "#FAF7F0" }}>
          "{verse.text}"
        </blockquote>
        <p className="text-sm font-semibold" style={{ color: "#C9A84C" }}>
          — {verse.reference}{" "}
          <span className="font-normal" style={{ color: "#9A7B5C" }}>({verse.translation})</span>
        </p>
      </div>

      {/* ── Bible study ─────────────────────────────────────── */}
      {study && (
        <Link
          href="/dashboard/bible-study"
          className="flex items-center gap-4 rounded-2xl p-5 mb-6 card-hover"
          style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)" }}>
            <ScrollText className="w-5 h-5" style={{ color: "#A8862E" }} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8A6A1F" }}>
              {study.isUpcoming ? "Bible study" : "Latest Bible study"} · {studyDateLabel(study.session.date)}
            </p>
            <p className="font-display font-bold text-lg truncate" style={{ color: "#2C1A0E" }}>
              {formatReference(study.session)}
            </p>
            <p className="text-xs" style={{ color: "#7A5C3E" }}>
              {study.session.series.title}
              {study.session.questions.length > 0 && ` · ${study.session.questions.length} question${study.session.questions.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#C4A882" }} aria-hidden="true" />
        </Link>
      )}

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "BUS Group",
            value: myGroup?.name || "Not Assigned",
            sub:   user?.busGroup?.leader?.name || (myGroup ? "You lead this group" : "Ask a leader to join one"),
            icon:  Users,
            // No group -> plain tile, nothing to open.
            href:  myGroup ? `/dashboard/bus-groups/${myGroup.id}` : null,
          },
          {
            label: "My Books",
            value: rentals.length === 0 ? "None" : `${rentals.length} book${rentals.length === 1 ? "" : "s"}`,
            sub:   overdue > 0
              ? `${overdue} overdue — please return`
              : nextDue
                ? `Due ${formatShortDate(nextDue)}`
                : "Browse the library",
            icon:  BookOpen,
            href:  "/dashboard/library",
          },
          {
            label: "Announcements",
            value: announcements.length,
            sub:   `${announcements.filter((a) => a.isPinned).length} pinned`,
            icon:  Bell,
            href:  "#announcements",
          },
          {
            label: "Upcoming Events",
            value: events.length,
            sub:   events[0] ? `Next: ${formatShortDate(events[0].startDate)}` : "None scheduled",
            icon:  Calendar,
            href:  "/dashboard/events",
          },
        ].map(({ label, value, sub, icon: Icon, href }) => {
          const body = (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: "#9A7B5C" }}>{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.10)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#C9A84C" }} />
                </div>
              </div>
              <p className="font-display font-bold text-lg truncate" style={{ color: "#2C1A0E" }}>{value}</p>
              <p className="text-xs mt-1 truncate" style={{ color: label === "My Books" && overdue > 0 ? "#B42318" : "#8A6A4A" }}>{sub}</p>
            </>
          );
          const tile = { background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" };
          if (!href) {
            return <div key={label} className="rounded-2xl p-4" style={tile}>{body}</div>;
          }
          // In-page anchors use <a> so the browser scrolls; routes use Link.
          return href.startsWith("#") ? (
            <a key={label} href={href} className="block rounded-2xl p-4 card-hover" style={tile}>{body}</a>
          ) : (
            <Link key={label} href={href} className="block rounded-2xl p-4 card-hover" style={tile}>{body}</Link>
          );
        })}
      </div>

      {/* ── Main content grid ───────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Announcements */}
        <div
          id="announcements"
          className="lg:col-span-2 rounded-2xl p-6 scroll-mt-4"
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
              <Link href="/dashboard/events" className="ml-auto text-xs font-semibold" style={{ color: "#8A6A1F" }}>
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#C4A882" }}>No upcoming events.</p>
              ) : (
                events.map((event) => (
                  <Link
                    key={event.id}
                    href={eventPath(event)}
                    className="flex gap-3 py-2.5 rounded-lg transition-colors hover:bg-[#FAF7F0]"
                    style={{ borderBottom: "1px solid #F0E6D3" }}
                  >
                    <div
                      className="shrink-0 rounded-xl p-2 text-center min-w-[44px]"
                      style={{ background: "rgba(201,168,76,0.08)" }}
                    >
                      <p className="text-xs font-bold" style={{ color: "#C9A84C" }}>
                        {formatWarsaw(event.startDate, { month: "short" })}
                      </p>
                      <p className="font-bold text-sm" style={{ color: "#2C1A0E" }}>
                        {formatWarsaw(event.startDate, { day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "#3D2410" }}>{event.title}</p>
                      <p className="text-xs" style={{ color: "#8A6A4A" }}>{formatTime(event.startDate)}</p>
                    </div>
                  </Link>
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
                { href: "/dashboard/events",     icon: Calendar,      label: "All Events"     },
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
