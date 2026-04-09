"use client";

import { useEffect, useState } from "next";

interface Program {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
}

// Default programs if database is empty
const DEFAULT_PROGRAMS = [
  {
    icon: "📖",
    title: "Sunday Worship",
    schedule: "Every Sunday · 10:00 AM",
    description:
      "The centerpiece of our weekly gathering. Anointed, Spirit-filled preaching from the Word of God that challenges, encourages, and equips believers to live victoriously in Christ.",
    details: ["Expository preaching style", "Translated into Amharic when needed", "Combined with worship and prayer", "Sermon notes available online"],
    color: "from-green-600 to-green-800",
    accent: "bg-green-100 text-green-700",
  },
  {
    icon: "👥",
    title: "BUS Ministry",
    schedule: "Monthly · Saturday 3:00 PM",
    description:
      "BUS (Brotherhood & Unity in the Spirit) groups are our small-group system. Each group is led by a trained BUS leader and meets regularly for prayer, accountability, fellowship, and care. Every member belongs to a BUS group.",
    details: ["Small groups of 8–15 members", "Led by appointed BUS leaders", "Personal pastoral care", "Attendance tracked to support members"],
    color: "from-rose-600 to-rose-800",
    accent: "bg-rose-100 text-rose-700",
  },
  {
    icon: "🎤",
    title: "Youth Ministry",
    schedule: "Weekly · Saturday 5:00 PM",
    description:
      "A dynamic program focused on developing young believers in Christ. Through worship, teaching, and community service, we equip the next generation to be leaders and witnesses for Christ.",
    details: ["Ages 13–25", "Youth-led worship and discussion", "Service and outreach projects", "Social events and fellowship"],
    color: "from-purple-600 to-purple-800",
    accent: "bg-purple-100 text-purple-700",
  },
  {
    icon: "👩‍👩‍👧‍👦",
    title: "Women's Fellowship",
    schedule: "Monthly · Saturday 2:00 PM",
    description:
      "A community of women growing together in faith, encouraged to become mighty women of God. Through Bible study, prayer, and practical service, we support one another in all seasons of life.",
    details: ["Safe space for women of all ages", "Led by experienced mentors", "Study, prayer, and fellowship", "Childcare provided"],
    color: "from-amber-600 to-amber-800",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    icon: "⛪",
    title: "Prayer & Fasting",
    schedule: "Monthly · First Friday 6:00 AM",
    description:
      "Dedicated times of corporate prayer and fasting to seek God's face, intercede for our community, and deepen our dependence on the Holy Spirit. A transformative spiritual practice.",
    details: ["Early morning prayer time", "Guided intercession", "Fasting support resources", "Prayer journals available"],
    color: "from-blue-600 to-blue-800",
    accent: "bg-blue-100 text-blue-700",
  },
];

function ProgramsContent() {
  const [programs, setPrograms] = useState<(Program & { schedule?: string; details?: string[] })[]>([]);
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

  const colorMap: { [key: string]: string } = {
    "bg-green-100": "from-green-600 to-green-800",
    "bg-blue-100": "from-blue-600 to-blue-800",
    "bg-purple-100": "from-purple-600 to-purple-800",
    "bg-amber-100": "from-amber-600 to-amber-800",
    "bg-crimson-100": "from-crimson-600 to-crimson-800",
  };

  const accentMap: { [key: string]: string } = {
    "bg-green-100": "bg-green-100 text-green-700",
    "bg-blue-100": "bg-blue-100 text-blue-700",
    "bg-purple-100": "bg-purple-100 text-purple-700",
    "bg-amber-100": "bg-amber-100 text-amber-700",
    "bg-crimson-100": "bg-crimson-100 text-crimson-700",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">How We Grow Together</p>
          <h1 className="font-display text-5xl font-bold text-white mb-5">Our Programs</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto leading-relaxed">
            From Scripture study to worship nights, we have something for every season of your
            spiritual journey.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          {programs.map((prog, i) => {
            const gradientColor = prog.color || colorMap[prog.color || "bg-green-100"] || "from-green-600 to-green-800";
            const accentClass = accentMap[prog.color || "bg-green-100"] || "bg-green-100 text-green-700";
            const details = prog.details || [];

            return (
              <div
                key={prog.id || prog.title}
                className={`rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover flex flex-col lg:flex-row ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Color panel */}
                <div className={`bg-gradient-to-br ${gradientColor} p-10 lg:w-72 flex flex-col items-center justify-center text-center shrink-0`}>
                  <div className="text-6xl mb-4">{prog.icon || "📋"}</div>
                  <h2 className="font-display font-bold text-white text-2xl mb-2">{prog.title}</h2>
                  {prog.schedule && <p className="text-white/70 text-sm">{prog.schedule}</p>}
                </div>

                {/* Content */}
                <div className="p-8 flex-1">
                  <p className="text-gray-600 leading-relaxed mb-6 text-base">{prog.description}</p>
                  {details.length > 0 && (
                    <ul className="space-y-2">
                      {details.map((d) => (
                        <li key={d} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <span className={`mt-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${accentClass}`}>✓</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-50 border-t border-green-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-4">
            Ready to Get Involved?
          </h2>
          <p className="text-gray-600 mb-8">
            Join our fellowship today and start participating in all these life-changing programs.
          </p>
          <a
            href="/register"
            className="inline-block bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-green-800 transition-colors shadow-sm"
          >
            Create Your Member Account
          </a>
        </div>
      </section>
    </>
  );
}

export default ProgramsContent;
