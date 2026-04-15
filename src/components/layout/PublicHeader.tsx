"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/about",    label: "About"    },
  { href: "/programs", label: "Programs" },
  { href: "/events",   label: "Events"   },
  { href: "/visit",    label: "Visit Us" },
];

export function PublicHeader() {
  const pathname    = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-brown-900/97 backdrop-blur-md shadow-lg shadow-brown-900/20"
          : "bg-brown-900"
      )}
      style={{ backgroundColor: scrolled ? "rgba(28,15,7,0.97)" : "#1C0F07" }}
    >
      {/* Gold accent line */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="WECF" className="w-10 h-10 transition-transform duration-200 group-hover:scale-105" />
            <div className="hidden sm:block">
              <p className="font-display font-bold text-sm leading-tight" style={{ color: "#FAF7F0" }}>
                Warsaw Ethiopian
              </p>
              <p className="text-xs leading-tight" style={{ color: "#C9A84C" }}>
                Christian Fellowship
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  pathname === link.href
                    ? "text-gold-400"
                    : "text-brown-300 hover:text-gold-400 hover:bg-white/5"
                )}
                style={pathname === link.href ? { color: "#DDB95A" } : {}}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors"
                  style={{ color: "#C4A882" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#C9A84C")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#C4A882")}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm transition-colors"
                  style={{ color: "#9A7B5C" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#C4A882")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#9A7B5C")}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors"
                  style={{ color: "#C4A882" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#C9A84C")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#C4A882")}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 hover:shadow-gold"
                  style={{ background: "#C9A84C", color: "#1C0F07" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#DDB95A")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#C9A84C")}
                >
                  Join Fellowship
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: "#C4A882" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-1 border-t" style={{ borderColor: "rgba(201,168,76,0.15)", background: "#1C0F07" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={
                pathname === link.href
                  ? { background: "rgba(201,168,76,0.12)", color: "#C9A84C" }
                  : { color: "#C4A882" }
              }
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t space-y-1" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: "#C9A84C", background: "rgba(201,168,76,0.10)" }} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-4 py-2.5 rounded-xl text-sm" style={{ color: "#9A7B5C" }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: "#C4A882" }} onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
                <Link href="/register" className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-center" style={{ background: "#C9A84C", color: "#1C0F07" }} onClick={() => setMobileOpen(false)}>
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
