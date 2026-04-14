"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, BookOpen, Calendar, Bell,
  ClipboardList, LogOut, Shield, UserCog, BookMarked,
  ChevronRight, UserCircle, Link2, MessageSquare,
} from "lucide-react";
import { cn, getRoleLabel, getInitials } from "@/lib/utils";

const memberLinks = [
  { href: "/dashboard",            label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile",    label: "Profile",      icon: UserCircle },
  { href: "/dashboard/library",    label: "Library",      icon: BookOpen },
  { href: "/dashboard/bus-groups", label: "My BUS Group", icon: Users },
];

const leaderLinks = [
  { href: "/dashboard/bus-groups", label: "Group Hub", icon: MessageSquare },
];

const adminLinks = [
  { href: "/dashboard/attendance",         label: "Record Attendance", icon: ClipboardList },
  { href: "/dashboard/admin/members",      label: "Members",           icon: UserCog },
  { href: "/dashboard/admin/bus-groups",   label: "BUS Groups",        icon: Users },
  { href: "/dashboard/admin/events",       label: "Events",            icon: Calendar },
  { href: "/dashboard/admin/announcements",label: "Announcements",     icon: Bell },
  { href: "/dashboard/admin/programs",     label: "Programs",          icon: BookOpen },
  { href: "/dashboard/admin/leaders",      label: "Leadership",        icon: Shield },
  { href: "/dashboard/admin/books",        label: "Library Books",     icon: BookMarked },
  { href: "/dashboard/admin/invites",      label: "Invites",           icon: Link2 },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (!session) return null;

  const isLeader   = session.user.role === "BUS_LEADER";
  const isGuardian = session.user.role === "GUARDIAN";

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ background: "#1C0F07" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-200 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #C9A84C, #EDD090)", color: "#1C0F07" }}
          >
            ✝
          </div>
          <div>
            <p className="font-display font-bold text-xs leading-tight" style={{ color: "#FAF7F0" }}>
              Warsaw Ethiopian
            </p>
            <p className="text-xs leading-tight" style={{ color: "#C9A84C" }}>
              Christian Fellowship
            </p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
          >
            {getInitials(session.user.name || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#FAF7F0" }}>
              {session.user.name}
            </p>
            <p className="text-xs font-medium" style={{ color: "#C9A84C" }}>
              {getRoleLabel(session.user.role)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Member section */}
        <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.45)" }}>
          Member
        </p>
        {memberLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn("sidebar-link", isActive(link.href, link.exact) && "active")}
          >
            <link.icon className="w-4 h-4 shrink-0" />
            {link.label}
          </Link>
        ))}

        {/* Leader section */}
        {isLeader && (
          <>
            <div className="pt-4">
              <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.45)" }}>
                Leadership
              </p>
            </div>
            {leaderLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("sidebar-link", isActive(link.href) && "active")}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            ))}
          </>
        )}

        {/* Guardian / Admin section */}
        {isGuardian && (
          <>
            <div className="pt-4">
              <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.45)" }}>
                Guardian
              </p>
            </div>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("sidebar-link", isActive(link.href) && "active")}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-1" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <Link href="/" className="sidebar-link">
          <ChevronRight className="w-4 h-4 shrink-0" />
          Public Website
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="sidebar-link w-full text-left"
          style={{ color: "#7A5C3E" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e87070")}
          onMouseLeave={e => (e.currentTarget.style.color = "#7A5C3E")}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
