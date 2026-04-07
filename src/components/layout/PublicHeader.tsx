"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, Cross, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/events", label: "Events" },
  { href: "/visit", label: "Visit Us" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-green-100 shadow-sm">
      {/* Ethiopian flag stripe — ultra-thin */}
      <div className="h-0.5 eth-stripe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-amber-300 font-bold text-sm shadow-md group-hover:shadow-green-200 transition-shadow">
              ✝
            </div>
            <div className="hidden sm:block">
              <p className="font-display font-bold text-green-800 text-sm leading-tight">
                Warsaw Ethiopian
              </p>
              <p className="text-xs text-green-600 leading-tight">Christian Fellowship</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link",
                  pathname === link.href && "active"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 transition-colors shadow-sm"
                >
                  Join Fellowship
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-green-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-green-100 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-green-50 hover:text-green-700"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-green-100 flex flex-col gap-2">
            {session ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-green-700 bg-green-50">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block text-left px-3 py-2.5 rounded-lg text-sm text-gray-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-green-700 text-center"
                >
                  Join Fellowship
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
