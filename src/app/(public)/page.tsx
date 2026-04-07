import Link from "next/link";
import { Calendar, BookOpen, Users, MapPin, ArrowRight, ChevronDown } from "lucide-react";

async function getVerseOfDay() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/verse`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return {
      reference: "Hebrews 10:24-25",
      text: "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together...",
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
  { icon: "📖", title: "Bible Study", desc: "Deep dive into the Word of God every week" },
  { icon: "🎵", title: "Worship Night", desc: "An evening of praise and worship" },
  { icon: "🎤", title: "Sermon", desc: "Anointed preaching every Sunday service" },
  { icon: "📚", title: "Literature Night", desc: "Exploring great Christian writings together" },
  { icon: "👥", title: "BUS Meetings", desc: "Building community in small groups" },
];

function formatEventDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatEventTime(date: string) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const [verse, events] = await Promise.all([getVerseOfDay(), getUpcomingEvents()]);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden hero-gradient min-h-[92vh] flex items-center">
        {/* Decorative background crosses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 right-16 text-green-600 opacity-10 text-[180px] font-serif select-none">✝</div>
          <div className="absolute bottom-20 left-10 text-green-600 opacity-5 text-[120px] font-serif select-none">✝</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-600 opacity-5 blur-3xl" />
        </div>

        {/* Ethiopian flag stripe on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            {/* Motto pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
              <span className="text-amber-300 text-sm">✝</span>
              <span className="text-green-100 text-sm font-medium tracking-wide">Hebrews 10:24-25</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in stagger-1">
              Warsaw Ethiopian
              <span className="block text-amber-300">Christian Fellowship</span>
            </h1>

            <p className="text-green-100 text-lg sm:text-xl leading-relaxed max-w-2xl mb-10 animate-fade-in stagger-2">
              A Christ-centred community in the heart of Warsaw, united by faith, love, and the Holy
              Spirit. Worshipping, growing, and serving together.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in stagger-3">
              <Link
                href="/register"
                className="bg-amber-400 text-green-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-amber-300 transition-all shadow-lg hover:shadow-amber-400/25 hover:-translate-y-0.5"
              >
                Join the Fellowship
              </Link>
              <Link
                href="/about"
                className="border border-white/30 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ── VERSE OF THE DAY ──────────────────────────────── */}
      <section className="bg-amber-50 border-y border-amber-100 py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-5">
            ✦ Verse of the Day ✦
          </p>
          <blockquote className="scripture text-2xl sm:text-3xl text-gray-800 leading-relaxed mb-5">
            "{verse.text}"
          </blockquote>
          <p className="font-semibold text-green-700">
            — {verse.reference} <span className="text-gray-400 font-normal">({verse.translation})</span>
          </p>
        </div>
      </section>

      {/* ── WELCOME ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Welcome Home
              </p>
              <h2 className="font-display text-4xl font-bold text-gray-800 mb-6 leading-tight">
                You Are Welcome Here
              </h2>
              <div className="gold-bar mb-7" />
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                The Warsaw Ethiopian Christian Fellowship is a vibrant, Spirit-filled community
                serving the Ethiopian and broader Christian diaspora in Warsaw, Poland.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                We believe every person is created in the image of God and deserves a place to
                belong. Whether you are visiting for the first time or looking for a spiritual home,
                our doors — and our hearts — are open.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-green-700 font-semibold hover:gap-3 transition-all"
              >
                Read our story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats / highlights */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { value: "5+", label: "Years of Ministry", icon: "🙏" },
                { value: "BUS", label: "Small Group System", icon: "👥" },
                { value: "Sat & Sun", label: "Weekly Services", icon: "⛪" },
                { value: "E-Library", label: "Digital Book Access", icon: "📚" },
              ].map((stat) => (
                <div key={stat.label} className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <p className="font-display font-bold text-2xl text-green-800 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ──────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">
              How We Grow
            </p>
            <h2 className="font-display text-4xl font-bold text-gray-800 mb-4">Our Programs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We offer a range of programs to help every member grow spiritually and build meaningful
              community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {programs.map((prog, i) => (
              <div
                key={prog.title}
                className="bg-white rounded-2xl p-6 border border-green-100 card-hover text-center animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{prog.icon}</div>
                <h3 className="font-display font-bold text-gray-800 mb-2">{prog.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{prog.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/programs" className="inline-flex items-center gap-2 text-green-700 font-semibold hover:gap-3 transition-all">
              View all programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ───────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">
                What's Coming Up
              </p>
              <h2 className="font-display text-4xl font-bold text-gray-800">Upcoming Events</h2>
            </div>
            <Link href="/events" className="text-green-700 font-medium text-sm hover:underline hidden sm:block">
              View all →
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: any, i: number) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-green-100 overflow-hidden card-hover bg-white animate-fade-in"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  {/* Color band based on type */}
                  <div className={`h-2 ${
                    event.type === "Worship" || event.type === "Worship Night"
                      ? "bg-amber-400"
                      : event.type === "Bible Study"
                      ? "bg-green-500"
                      : event.type === "BUS Meeting"
                      ? "bg-blue-400"
                      : "bg-purple-400"
                  }`} />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {formatEventDate(event.startDate)}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{formatEventTime(event.startDate)}</span>
                    </div>
                    <h3 className="font-display font-bold text-gray-800 text-lg mb-2">{event.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{event.description}</p>
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── JOIN CTA ──────────────────────────────────────── */}
      <section className="py-20 hero-gradient relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="text-5xl mb-6">✝</div>
          <h2 className="font-display text-4xl font-bold text-white mb-5">
            Ready to Join the Fellowship?
          </h2>
          <p className="text-green-100 text-lg mb-10 leading-relaxed">
            Become part of a growing community of believers. Create your member account today and
            connect with your brothers and sisters in Christ.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-amber-400 text-green-900 font-bold px-8 py-4 rounded-xl hover:bg-amber-300 transition-all shadow-lg hover:-translate-y-0.5"
            >
              Create an Account
            </Link>
            <Link
              href="/visit"
              className="border border-white/30 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              Visit Us First
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
