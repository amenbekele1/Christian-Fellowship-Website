import Link from "next/link";
import { Calendar, ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { getPageContent } from "@/lib/page-content";

async function getVerseOfDay() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/verse`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return {
      reference: "Hebrews 10:24-25",
      text: "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together…",
      translation: "NIV",
    };
  }
}

async function getUpcomingEvents() {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/events?public=true&upcoming=true&limit=3`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return [];
  }
}

const programs = [
  { icon: "📖", title: "Bible Study",      desc: "Deep dive into the Word of God every week"         },
  { icon: "🎵", title: "Worship Night",    desc: "An evening of praise and worship"                   },
  { icon: "🎤", title: "Sunday Sermon",    desc: "Anointed preaching every Sunday service"            },
  { icon: "📚", title: "Literature Night", desc: "Exploring great Christian writings together"        },
  { icon: "👥", title: "BUS Meetings",     desc: "Building community in small groups"                 },
];

function formatEventDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function formatEventTime(date: string) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const [verse, events, c] = await Promise.all([
    getVerseOfDay(),
    getUpcomingEvents(),
    getPageContent("home"),
  ]);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center hero-gradient">
        {/* Decorative gold cross watermark */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg className="absolute top-10 right-14 w-56 h-56" viewBox="0 0 100 100" fill="rgba(201,168,76,0.04)" aria-hidden="true">
            <path d="M42,5 H58 V30 H90 V46 H58 V95 H42 V46 H10 V30 H42 Z"/>
          </svg>
          <svg className="absolute bottom-16 left-8 w-36 h-36" viewBox="0 0 100 100" fill="rgba(201,168,76,0.03)" aria-hidden="true">
            <path d="M42,5 H58 V30 H90 V46 H58 V95 H42 V46 H10 V30 H42 Z"/>
          </svg>
          {/* Warm radial glow */}
          <div
            className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            {/* Scripture pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 animate-fade-up"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 100 100" fill="#C9A84C" aria-hidden="true"><rect x="42" y="5" width="16" height="90" rx="3"/><rect x="10" y="30" width="80" height="16" rx="3"/></svg>
              <span className="text-sm font-medium tracking-wide" style={{ color: "#EDD090" }}>
                Hebrews 10:24-25
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-up stagger-1"
              style={{ color: "#FAF7F0" }}>
              Warsaw Ethiopian
              <span className="block" style={{ color: "#C9A84C" }}>Christian Fellowship</span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mb-10 animate-fade-up stagger-2"
              style={{ color: "#C4A882" }}>
              {c.hero_subtitle ?? "A Christ-centred community in the heart of Warsaw, united by faith, love, and the Holy Spirit. Worshipping, growing, and serving together."}
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up stagger-3">
              <Link href="/register" className="btn-gold font-semibold px-7 py-3.5 rounded-xl">
                Join the Fellowship
              </Link>
              <Link href="/about" className="btn-outline-gold font-medium px-7 py-3.5 rounded-xl">
                Learn More →
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ color: "rgba(201,168,76,0.4)" }}>
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ── VERSE OF THE DAY ──────────────────────────────────── */}
      <section style={{ background: "#F0E6D3", borderTop: "1px solid #E0CBB0", borderBottom: "1px solid #E0CBB0" }}>
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <p className="section-label mb-5">✦ Verse of the Day ✦</p>
          <blockquote className="scripture text-2xl sm:text-3xl leading-relaxed mb-5" style={{ color: "#3D2410" }}>
            "{verse.text}"
          </blockquote>
          <p className="font-semibold" style={{ color: "#5C3D20" }}>
            — {verse.reference}{" "}
            <span className="font-normal" style={{ color: "#9A7B5C" }}>({verse.translation})</span>
          </p>
        </div>
      </section>

      {/* ── WELCOME ───────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "#FAF7F0" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-up">
              <p className="section-label mb-3">Welcome Home</p>
              <h2 className="font-display text-4xl font-bold mb-5 leading-tight" style={{ color: "#2C1A0E" }}>
                {c.welcome_title ?? "You Are Welcome Here"}
              </h2>
              <div className="gold-bar mb-7" />
              <p className="text-lg leading-relaxed mb-5" style={{ color: "#7A5C3E" }}>
                {c.welcome_body_1 ?? "The Warsaw Ethiopian Christian Fellowship is a vibrant, Spirit-filled community serving the Ethiopian and broader Christian diaspora in Warsaw, Poland."}
              </p>
              <p className="leading-relaxed mb-8" style={{ color: "#9A7B5C" }}>
                {c.welcome_body_2 ?? "We believe every person is created in the image of God and deserves a place to belong. Whether you are visiting for the first time or looking for a spiritual home, our doors — and our hearts — are open."}
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 font-semibold transition-all hover:gap-3" style={{ color: "#C9A84C" }}>
                Read our story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { value: "5+",       label: "Years of Ministry",    icon: "🙏" },
                { value: "BUS",      label: "Small Group System",   icon: "👥" },
                { value: "Sat & Sun",label: "Weekly Services",      icon: "⛪" },
                { value: "E-Library",label: "Digital Book Access",  icon: "📚" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl p-6 card-hover animate-fade-up stagger-${i + 1}`}
                  style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.06)" }}
                >
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <p className="font-display font-bold text-2xl mb-1" style={{ color: "#2C1A0E" }}>{stat.value}</p>
                  <p className="text-sm" style={{ color: "#9A7B5C" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ──────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "#F0E6D3" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">How We Grow</p>
            <h2 className="font-display text-4xl font-bold mb-4" style={{ color: "#2C1A0E" }}>Our Programs</h2>
            <p className="max-w-xl mx-auto" style={{ color: "#7A5C3E" }}>
              We offer a range of programs to help every member grow spiritually and build meaningful community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {programs.map((prog, i) => (
              <div
                key={prog.title}
                className={`rounded-2xl p-6 text-center card-hover animate-fade-up stagger-${i + 1}`}
                style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
              >
                <div className="text-4xl mb-4">{prog.icon}</div>
                <h3 className="font-display font-bold mb-2" style={{ color: "#2C1A0E" }}>{prog.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9A7B5C" }}>{prog.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 font-semibold transition-all hover:gap-3"
              style={{ color: "#C9A84C" }}
            >
              View all programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ───────────────────────────────────── */}
      <section className="py-24" style={{ background: "#FAF7F0" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="section-label mb-3">What's Coming Up</p>
              <h2 className="font-display text-4xl font-bold" style={{ color: "#2C1A0E" }}>Upcoming Events</h2>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium hidden sm:block transition-colors"
              style={{ color: "#C9A84C" }}
            >
              View all →
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: any, i: number) => (
                <div
                  key={event.id}
                  className={`rounded-2xl overflow-hidden card-hover animate-fade-up stagger-${i + 1}`}
                  style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.06)" }}
                >
                  {/* Type bar */}
                  <div className="h-1.5" style={{ background: event.type === "Worship" || event.type === "Worship Night" ? "#C9A84C" : event.type === "Bible Study" ? "#7A9B5C" : "#7A6B9A" }} />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4" style={{ color: "#C9A84C" }} />
                      <span className="text-sm font-medium" style={{ color: "#5C3D20" }}>
                        {formatEventDate(event.startDate)}
                      </span>
                      <span style={{ color: "#C4A882" }}>·</span>
                      <span className="text-sm" style={{ color: "#9A7B5C" }}>{formatEventTime(event.startDate)}</span>
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2" style={{ color: "#2C1A0E" }}>{event.title}</h3>
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: "#7A5C3E" }}>{event.description}</p>
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#C4A882" }}>
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: "#C4A882" }}>
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── JOIN CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 hero-gradient">
        {/* Decorative glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-6" viewBox="0 0 100 100" fill="rgba(201,168,76,0.6)" aria-hidden="true"><rect x="42" y="5" width="16" height="90" rx="3"/><rect x="10" y="30" width="80" height="16" rx="3"/></svg>
          <h2 className="font-display text-4xl font-bold mb-5" style={{ color: "#FAF7F0" }}>
            {c.cta_title ?? "Ready to Join the Fellowship?"}
          </h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: "#C4A882" }}>
            {c.cta_body ?? "Become part of a growing community of believers. Create your member account today and connect with your brothers and sisters in Christ."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-gold font-bold px-8 py-4 rounded-xl">
              Create an Account
            </Link>
            <Link href="/visit" className="btn-outline-gold font-medium px-8 py-4 rounded-xl">
              Visit Us First
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
