"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-brown-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brown-800 flex items-center justify-center text-amber-300 text-xs font-bold">
            ✝
          </div>
          <span className="font-display font-bold text-brown-700 text-sm">WECF Member Portal</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-brown-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="flex justify-end p-4">
              <button onClick={() => setOpen(false)} className="p-2 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <DashboardSidebar />
          </div>
        </div>
      )}
    </>
  );
}
