import Link from "next/link";
import { MapPin, Clock, Mail, Heart, Youtube, Instagram } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social";

const SOCIAL_ICONS: Record<string, typeof Youtube> = {
  youtube: Youtube,
  instagram: Instagram,
};

export function PublicFooter() {
  return (
    <footer style={{ background: "#1C0F07", color: "#C4A882" }}>
      {/* Gold accent line */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img src="/logo.svg" alt="WECF" className="h-14 w-auto shadow-md" />
              <div>
                <p className="font-display font-bold text-lg leading-tight" style={{ color: "#FAF7F0" }}>
                  Warsaw Ethiopian Christian Fellowship
                </p>
              </div>
            </div>
            <blockquote className="scripture text-sm leading-relaxed mb-4 max-w-sm" style={{ color: "#9A7B5C" }}>
              "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together…"
            </blockquote>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C9A84C" }}>
              Hebrews 10:24-25 (NIV)
            </p>

            {/* Social */}
            <div className="mt-7">
              <h3
                className="font-semibold mb-3 text-xs uppercase tracking-widest"
                style={{ color: "#FAF7F0" }}
              >
                Follow Us
              </h3>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map((s) => {
                  const Icon = SOCIAL_ICONS[s.key];
                  return (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Warsaw Ethiopian Christian Fellowship on ${s.label} (${s.handle})`}
                      title={`${s.label} · ${s.handle}`}
                      className="social-icon group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                      style={{
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: "#C9A84C",
                      }}
                    >
                      {Icon && <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: "#FAF7F0" }}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/about",    label: "About Us"        },
                { href: "/programs", label: "Programs"        },
                { href: "/events",   label: "Events"          },
                { href: "/visit",    label: "Visit Us"        },
                { href: "/register", label: "Join Fellowship" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-gold-hover text-sm">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: "#FAF7F0" }}>
              Find Us
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-2.5 text-sm" style={{ color: "#9A7B5C" }}>
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
                <span>Naddnieprzańska 7<br />04-205 Warszawa, Poland</span>
              </li>
              <li className="flex gap-2.5 text-sm" style={{ color: "#9A7B5C" }}>
                <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
                <span>Saturday 18:00</span>
              </li>
              <li className="flex gap-2.5 text-sm">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
                <a href="mailto:info@wetcf.com" className="link-gold-hover">info@wetcf.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}
        >
          <p className="text-xs" style={{ color: "#5C3D20" }}>
            © {new Date().getFullYear()} Warsaw Ethiopian Christian Fellowship. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs hover:underline transition-colors" style={{ color: "#5C3D20" }}>
              Privacy Policy
            </Link>
            <p className="flex items-center gap-1.5 text-xs" style={{ color: "#5C3D20" }}>
              Made with <Heart className="w-3 h-3" style={{ color: "#C9A84C" }} /> for the glory of God
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
