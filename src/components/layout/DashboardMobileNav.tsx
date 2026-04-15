"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — dark brown, no white space */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: "#1C0F07", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="WECF" className="h-9 w-auto" />
          <span className="font-display font-bold text-sm" style={{ color: "#FAF7F0" }}>WECF Member Portal</span>
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
              <DashboardSidebar onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
