"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Users, HandHeart } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string;
  schedule: string | null;
  location: string | null;
  details: string[];
  icon: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
}

type DisplayProgram = Program & { accent?: string };

// Shown if the database is empty or unreachable
const DEFAULT_PROGRAMS: DisplayProgram[] = [
  {
    id: "default-1",
    icon: "fellowship",
    title: "Weekly Fellowship",
    schedule: "Every Saturday · 18:00",
    location: "Naddnieprzańska 7, 04-205 Warszawa",
    description:
      "Our main weekly gathering. We come together to worship, open the Word, and encourage one another as a family in Christ. Whether you have walked with the Lord for years or are just beginning, there is a place for you here.",
    details: [
      "Prayer",
      "Worship",
      "Word of Encouragement (15 min)",
      "Bible Study",
      "Closing Prayer",
    ],
    color: "from-brown-700 to-brown-900",
    isActive: true,
    order: 0,
  },
  {
    id: "default-2",
    icon: "prayer",
    title: "Weekly Prayer",
    schedule: "Every Friday · 18:00",
    location: "Śniardwy 8/118, Warszawa",
    description:
      "An evening set apart for prayer — interceding for our fellowship, for one another, and for the needs God lays on our hearts. A quiet, unhurried time to seek Him together.",
    details: ["Prayer"],
    color: "from-gold-700 to-brown-800",
    isActive: true,
    order: 1,
  },
];

function ProgramsContent() {
  const [programs, setPrograms] = useState<DisplayProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.length > 0) {
          setPrograms(data);
        } else {
          setPrograms(DEFAULT_PROGRAMS);
        }
      } catch (error) {
        setPrograms(DEFAULT_PROGRAMS);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Brand-palette gradients only. Legacy admin values (bg-blue-100 etc.) are
  // remapped onto the brown/gold family so nothing clashes with the page.
  const colorMap: { [key: string]: string } = {
    "bg-brown-100": "from-brown-700 to-brown-900",
    "bg-gold-100": "from-gold-700 to-brown-800",
    "bg-blue-100": "from-brown-700 to-brown-900",
    "bg-purple-100": "from-gold-700 to-brown-800",
    "bg-amber-100": "from-gold-600 to-brown-800",
    "bg-crimson-100": "from-brown-800 to-brown-900",
  };

  // Alternating brand gradients for anything with no colour set
  const FALLBACK_GRADIENTS = [
    "from-brown-700 to-brown-900",
    "from-gold-700 to-brown-800",
  ];

  /** Resolve a program's panel gradient, accepting either a raw
   *  `from-… to-…` value or a legacy `bg-…-100` key. */
  const resolveGradient = (color: string | null, index: number): string => {
    if (color?.startsWith("from-")) return color;
    if (color && colorMap[color]) return colorMap[color];
    return FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Hero — fellowship photo with dark overlay */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/fellowship-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-brown-900/70" />

        {/* Ethiopian stripe accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe z-10" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 text-center">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4 drop-shadow">
            How We Grow Together
          </p>
          <h1 className="font-display text-5xl font-bold text-white mb-5 drop-shadow-lg">
            Our Programs
          </h1>
          <p className="text-white/85 text-lg max-w-2xl mx-auto leading-relaxed drop-shadow">
            We gather twice a week — Friday to pray, Saturday to worship and open the Word.
            You are welcome at both.
          </p>
        </div>
      </section>

      <section className="py-20 bg-brown-50">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          {programs.map((prog, i) => {
            const gradient = resolveGradient(prog.color, i);
            const details = prog.details || [];
            const Icon = prog.icon === "prayer" ? HandHeart : Users;

            return (
              <article
                key={prog.id}
                className="rounded-2xl overflow-hidden bg-white border border-brown-200 shadow-sm card-hover flex flex-col lg:flex-row"
              >
                {/* Left panel — identity, schedule, location */}
                <div
                  className={`bg-gradient-to-br ${gradient} p-8 lg:p-9 lg:w-[19rem] shrink-0 flex flex-col justify-center`}
                >
                  <div className="w-12 h-12 rounded-full bg-gold-500/20 ring-1 ring-gold-400/40 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-gold-300" strokeWidth={1.75} />
                  </div>

                  <h2 className="font-display font-bold text-white text-2xl leading-snug mb-5">
                    {prog.title}
                  </h2>

                  <div className="space-y-3">
                    {prog.schedule && (
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-gold-300 mt-0.5 shrink-0" strokeWidth={2} />
                        <span className="text-white/90 text-sm font-medium leading-snug">
                          {prog.schedule}
                        </span>
                      </div>
                    )}
                    {prog.location && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-gold-300 mt-0.5 shrink-0" strokeWidth={2} />
                        <span className="text-white/75 text-sm leading-snug">{prog.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right panel — description + ordered flow */}
                <div className="p-8 lg:p-9 flex-1">
                  <p className="text-brown-600 leading-relaxed text-[15px]">{prog.description}</p>

                  {details.length > 0 && (
                    <div className="mt-7 pt-7 border-t border-brown-100">
                      <p className="text-xs font-semibold uppercase tracking-widest text-brown-400 mb-4">
                        {details.length > 1 ? "How the evening flows" : "What we do"}
                      </p>
                      <ol className="space-y-2.5">
                        {details.map((d, idx) => (
                          <li key={d} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-brown-100 text-brown-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-brown-700 text-sm">{d}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA — dark close, bookends the photo hero */}
      <section className="py-20 bg-brown-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Come and Join Us
          </h2>
          <p className="text-brown-200 mb-8 leading-relaxed">
            You are welcome at any of our gatherings — no account needed. Create one to stay
            connected between meetings.
          </p>
          <a
            href="/register"
            className="inline-block bg-gold-500 text-brown-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-gold-400 transition-colors shadow-sm"
          >
            Create Your Member Account
          </a>
        </div>
      </section>
    </>
  );
}

export default ProgramsContent;
