"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, BookOpen, Calendar, Bell,
  ClipboardList, LogOut, Shield, UserCog, BookMarked,
  ChevronRight, Church, UserCircle, Link2
} from "lucide-react";
import { cn, getRoleLabel } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/library", label: "Library", icon: BookOpen },
  { href: "/dashboard/bus-groups", label: "My BUS Group", icon: Users },
];

const leaderLinks: { href: string; label: string; icon: any }[] = [];

const adminLinks = [
  { href: "/dashboard/attendance", label: "Record Attendance", icon: ClipboardList },
  { href: "/dashboard/admin/members", label: "Members", icon: UserCog },
  { href: "/dashboard/admin/bus-groups", label: "BUS Groups", icon: Users },
  { href: "/dashboard/admin/events", label: "Events", icon: Calendar },
  { href: "/dashboard/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard/admin/programs", label: "Programs", icon: BookOpen },
  { href: "/dashboard/admin/leaders", label: "Leadership", icon: Shield },
  { href: "/dashboard/admin/books", label: "Library Books", icon: BookMarked },
  { href: "/dashboard/admin/invites", label: "Invites", icon: Link2 },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (!session) return null;

  const isLeader = ["BUS_LEADER", "GUARDIAN"].includes(session.user.role);
  const isGuardian = session.user.role === "GUARDIAN";

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-green-100 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-green-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-amber-300 text-sm font-bold">
            ✝
          </div>
          <div>
            <p className="font-display font-bold text-green-800 text-xs leading-tight">Warsaw Ethiopian</p>
            <p className="text-xs text-green-600 leading-tight">Christian Fellowship</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
            {getInitials(session.user.name || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{session.user.name}</p>
            <p className="text-xs text-green-600 font-medium">{getRoleLabel(session.user.role)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Member
        </p>
        {memberLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "sidebar-link",
              isActive(link.href, link.exact) && "active"
            )}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}

        {isLeader && (
          <>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-5">
              Leadership
            </p>
            {leaderLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("sidebar-link", isActive(link.href) && "active")}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </>
        )}

        {isGuardian && (
          <>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-5">
              Guardian
            </p>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("sidebar-link", isActive(link.href) && "active")}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-green-100">
        <Link href="/" className="sidebar-link mb-1 text-green-700">
          <ChevronRight className="w-4 h-4" />
          Public Website
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
