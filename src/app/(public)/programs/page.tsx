import { Metadata } from "next";

export const metadata: Metadata = { title: "Programs" };

const programs = [
  {
    icon: "📖",
    title: "Bible Study",
    schedule: "Every Wednesday · 7:00 PM",
    description:
      "Our weekly Bible Study is the heartbeat of our spiritual formation. We journey through Scripture book by book, verse by verse, discovering timeless truths for modern life. Come with your Bible, a notebook, and an open heart.",
    details: ["Led by trained teachers and elders", "Open discussion and Q&A format", "Available to all members and visitors", "Study materials provided"],
    color: "from-green-600 to-green-800",
    accent: "bg-green-100 text-green-700",
  },
  {
    icon: "🎵",
    title: "Worship Night",
    schedule: "Monthly · Friday 7:00 PM",
    description:
      "A dedicated evening of praise and worship where we encounter God through music, prayer, and the Holy Spirit. Worship Night is one of the most anticipated gatherings of the month — leave refreshed and renewed.",
    details: ["Live worship team", "Spirit-led prayer time", "Open to all — members and guests welcome", "Childcare available"],
    color: "from-amber-500 to-amber-700",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    icon: "🎤",
    title: "Sunday Sermon",
    schedule: "Every Sunday · 10:00 AM",
    description:
      "The centerpiece of our weekly gathering. Anointed, Spirit-filled preaching from the Word of God that challenges, encourages, and equips believers to live victoriously in Christ.",
    details: ["Expository preaching style", "Translated into Amharic when needed", "Combined with worship and prayer", "Sermon notes available online"],
    color: "from-purple-600 to-purple-800",
    accent: "bg-purple-100 text-purple-700",
  },
  {
    icon: "📚",
    title: "Literature Night",
    schedule: "Monthly · Saturday 5:00 PM",
    description:
      "We believe Christian reading transforms the mind. Each month we select a great Christian book — from classics like C.S. Lewis and A.W. Tozer to modern theologians — and gather to discuss, debate, and be shaped by ideas that have shaped the church.",
    details: ["Monthly book selection voted by members", "Library books available for borrowing", "Lively group discussion", "Snacks and fellowship included"],
    color: "from-blue-600 to-blue-800",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    icon: "👥",
    title: "BUS Meetings",
    schedule: "Monthly · Saturday 3:00 PM",
    description:
      "BUS (Brotherhood & Unity in the Spirit) groups are our small-group system. Each group is led by a trained BUS leader and meets regularly for prayer, accountability, fellowship, and care. Every member belongs to a BUS group.",
    details: ["Small groups of 8–15 members", "Led by appointed BUS leaders", "Personal pastoral care", "Attendance tracked to support members"],
    color: "from-rose-600 to-rose-800",
    accent: "bg-rose-100 text-rose-700",
  },
];

export default function ProgramsPage() {
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
          {programs.map((prog, i) => (
            <div
              key={prog.title}
              className={`rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover flex flex-col lg:flex-row ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              {/* Color panel */}
              <div className={`bg-gradient-to-br ${prog.color} p-10 lg:w-72 flex flex-col items-center justify-center text-center shrink-0`}>
                <div className="text-6xl mb-4">{prog.icon}</div>
                <h2 className="font-display font-bold text-white text-2xl mb-2">{prog.title}</h2>
                <p className="text-white/70 text-sm">{prog.schedule}</p>
              </div>

              {/* Content */}
              <div className="p-8 flex-1">
                <p className="text-gray-600 leading-relaxed mb-6 text-base">{prog.description}</p>
                <ul className="space-y-2">
                  {prog.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className={`mt-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${prog.accent}`}>✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
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
