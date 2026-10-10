"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronLeft } from "lucide-react";
import { DashboardSidebar, type SidebarUser, type MyTeam } from "./DashboardSidebar";

/** Section pages that exist on their own (others fall back to the dashboard). */
const NO_INDEX = new Set(["/dashboard/admin", "/dashboard/teams"]);

function parentPath(path: string): string {
  const parent = path.replace(/\/[^/]+\/?$/, "") || "/dashboard";
  return NO_INDEX.has(parent) || !parent.startsWith("/dashboard") ? "/dashboard" : parent;
}

export function DashboardMobileNav({ user, teams }: { user: SidebarUser; teams: MyTeam[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // The installed app has no browser back button, so keep our own trail of
  // pages visited in this session: going back pops it; with nothing to go
  // back to (e.g. opened from a notification) we go up to the parent page.
  const trail = useRef<string[]>([]);
  useEffect(() => {
    const t = trail.current;
    if (t.length >= 2 && t[t.length - 2] === pathname) t.pop();
    else if (t[t.length - 1] !== pathname) t.push(pathname);
  }, [pathname]);

  const goBack = () => {
    if (trail.current.length > 1) router.back();
    else router.push(parentPath(pathname));
  };
  const showBack = pathname !== "/dashboard";

  return (
    <>
      {/* Mobile top bar — dark brown, no white space */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: "#1C0F07", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <div className="flex items-center gap-1 min-w-0">
          {showBack && (
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-lg shrink-0"
              style={{ color: "#C9A84C" }}
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0" aria-label="Dashboard">
            <img src="/logo.svg" alt="" className="h-9 w-auto shrink-0" />
            <span className="font-display font-bold text-sm" style={{ color: "#FAF7F0" }}>WECF</span>
          </Link>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: "#C9A84C" }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col overflow-hidden shadow-xl" style={{ background: "#1C0F07" }}>
            {/* Close button row */}
            <div className="flex justify-end px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg" style={{ color: "#C9A84C" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Scrollable sidebar content */}
            <div className="flex-1 overflow-y-auto">
              <DashboardSidebar user={user} teams={teams} onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
