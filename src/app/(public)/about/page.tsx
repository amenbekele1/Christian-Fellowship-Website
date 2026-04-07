import { Metadata } from "next";
import { Heart, BookOpen, Users, Star } from "lucide-react";

export const metadata: Metadata = { title: "About Us" };

const values = [
  {
    icon: BookOpen,
    title: "Rooted in Scripture",
    desc: "The Bible is our foundation. Every teaching, decision, and direction we take is anchored in the living Word of God.",
  },
  {
    icon: Heart,
    title: "Love in Action",
    desc: "We are called to love one another as Christ loved us — practically, sacrificially, and with open hearts.",
  },
  {
    icon: Users,
    title: "Community First",
    desc: "We believe God designed us for relationship. Through BUS groups and fellowship, nobody walks alone.",
  },
  {
    icon: Star,
    title: "Spirit-Led Worship",
    desc: "Our worship is authentic, vibrant, and Spirit-filled — rooted in Ethiopian tradition and alive in the Holy Spirit.",
  },
];

const leadership = [
  { name: "Ato Bekele Tadesse", title: "Senior Pastor", initials: "BT" },
  { name: "Woizero Selamawit Girma", title: "Women's Ministry Leader", initials: "SG" },
  { name: "Ato Yohannes Alemu", title: "BUS Director", initials: "YA" },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="absolute right-20 top-10 text-green-600 opacity-10 text-[150px] font-serif">✝</div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">Who We Are</p>
          <h1 className="font-display text-5xl font-bold text-white mb-5">About Our Fellowship</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto leading-relaxed">
            A community of Ethiopian believers and friends in Warsaw, bound together by the love of
            Christ and a shared hunger for God.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">Our Mission</p>
              <h2 className="font-display text-4xl font-bold text-gray-800 mb-5">
                Inspiring Lives for the Glory of God
              </h2>
              <div className="gold-bar mb-7" />
              <p className="text-gray-600 leading-relaxed mb-5 text-lg">
                The Warsaw Ethiopian Christian Fellowship exists to glorify God by making disciples,
                nurturing authentic community, and serving the Ethiopian diaspora and wider body of
                Christ in Poland.
              </p>
              <p className="text-gray-600 leading-relaxed mb-5">
                We are committed to reaching the lost, teaching the Word, equipping believers, and
                sending workers into the harvest. Through worship, prayer, fellowship, and service,
                we pursue an ever-deeper relationship with Jesus Christ.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Founded on the bedrock of Hebrews 10:24-25, we refuse to forsake the gathering of
                believers — because we know that together, we are stronger, sharper, and more
                effective for the Kingdom.
              </p>
            </div>

            {/* Verse block */}
            <div className="bg-green-900 rounded-3xl p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 text-[200px] font-serif text-white flex items-center justify-center select-none">✝</div>
              <p className="text-amber-300 text-xs uppercase tracking-widest mb-6 font-bold">Our Foundation</p>
              <blockquote className="scripture text-white text-2xl leading-relaxed mb-6">
                "And let us consider how we may spur one another on toward love and good deeds, not
                giving up meeting together, as some are in the habit of doing, but encouraging one
                another — and all the more as you see the Day approaching."
              </blockquote>
              <p className="text-amber-300 font-semibold">Hebrews 10:24-25 (NIV)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">What We Stand For</p>
            <h2 className="font-display text-4xl font-bold text-gray-800">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val) => (
              <div key={val.title} className="bg-white rounded-2xl p-7 border border-green-100 card-hover">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
                  <val.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-display font-bold text-gray-800 text-lg mb-3">{val.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">Those Who Serve</p>
          <h2 className="font-display text-4xl font-bold text-gray-800 mb-12">Our Leadership</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {leadership.map((leader) => (
              <div key={leader.name} className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl mx-auto mb-4 font-display">
                  {leader.initials}
                </div>
                <h3 className="font-display font-semibold text-gray-800 mb-1">{leader.name}</h3>
                <p className="text-sm text-green-600">{leader.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
