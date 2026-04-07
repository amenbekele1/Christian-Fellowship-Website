import Link from "next/link";
import { MapPin, Clock, Mail, Heart } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-green-900 text-green-100">
      {/* Ethiopian stripe */}
      <div className="h-1 eth-stripe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-green-900 font-bold text-lg">
                ✝
              </div>
              <div>
                <p className="font-display font-bold text-white text-lg leading-tight">
                  Warsaw Ethiopian Christian Fellowship
                </p>
              </div>
            </div>
            <p className="scripture text-green-200 text-sm leading-relaxed mb-4 max-w-sm">
              "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together..."
            </p>
            <p className="text-xs text-green-400 font-semibold tracking-widest uppercase">
              Hebrews 10:24-25 (NIV)
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/programs", label: "Programs" },
                { href: "/events", label: "Events" },
                { href: "/visit", label: "Visit Us" },
                { href: "/register", label: "Join Fellowship" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-green-300 hover:text-amber-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Find Us
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-2 text-sm text-green-300">
                <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>Warsaw, Poland</span>
              </li>
              <li className="flex gap-2 text-sm text-green-300">
                <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>Saturday 10:00 AM<br />Sunday 10:00 AM</span>
              </li>
              <li className="flex gap-2 text-sm text-green-300">
                <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <a href="mailto:info@wecf.org" className="hover:text-amber-400 transition-colors">
                  info@wecf.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-green-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-green-500">
            © {new Date().getFullYear()} Warsaw Ethiopian Christian Fellowship. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-green-500">
            Made with <Heart className="w-3 h-3 text-amber-400" /> for the glory of God
          </p>
        </div>
      </div>
    </footer>
  );
}
