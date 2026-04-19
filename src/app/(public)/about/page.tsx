"use client";

import { useEffect, useState } from "react";
import { Metadata } from "next";
import { Heart, BookOpen, Users, Star } from "lucide-react";

interface Leader {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
}

const valueIcons = [BookOpen, Heart, Users, Star];

const DEFAULT_VALUES = [
  { title: "Rooted in Scripture", desc: "The Bible is our foundation. Every teaching, decision, and direction we take is anchored in the living Word of God." },
  { title: "Love in Action",      desc: "We are called to love one another as Christ loved us — practically, sacrificially, and with open hearts." },
  { title: "Community First",     desc: "We believe God designed us for relationship. Through BUS groups and fellowship, nobody walks alone." },
  { title: "Spirit-Led Worship",  desc: "Our worship is authentic, vibrant, and Spirit-filled — rooted in Ethiopian tradition and alive in the Holy Spirit." },
];

type ContentMap = Record<string, string>;

const DEFAULT_LEADERSHIP: Leader[] = [
  { id: "default-1", name: "Ato Bekele Tadesse", title: "Senior Pastor", bio: null, imageUrl: null, order: 0, isActive: true },
  { id: "default-2", name: "Woizero Selamawit Girma", title: "Women's Ministry Leader", bio: null, imageUrl: null, order: 1, isActive: true },
  { id: "default-3", name: "Ato Yohannes Alemu", title: "BUS Director", bio: null, imageUrl: null, order: 2, isActive: true },
];

export default function AboutContent() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentMap>({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [leadersRes, contentRes] = await Promise.all([
          fetch("/api/leaders"),
          fetch("/api/page-content?page=about"),
        ]);
        const leadersData = await leadersRes.json();
        setLeaders(Array.isArray(leadersData) && leadersData.length > 0 ? leadersData : []);
        const contentRows: { fieldKey: string; value: string }[] = await contentRes.json();
        const map: ContentMap = {};
        for (const row of contentRows) map[row.fieldKey] = row.value;
        setContent(map);
      } catch {
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const displayLeaders = leaders.length > 0 ? leaders : DEFAULT_LEADERSHIP;

  return (
    <>
      {/* Header */}
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <svg className="absolute right-20 top-10 w-36 h-36 opacity-10 text-gold-600" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M42,5 H58 V30 H90 V46 H58 V95 H42 V46 H10 V30 H42 Z"/></svg>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">Who We Are</p>
          <h1 className="font-display text-5xl font-bold text-white mb-5">About Our Fellowship</h1>
          <p className="text-brown-100 text-lg max-w-2xl mx-auto leading-relaxed">
            {content.header_subtitle ?? "A community of Ethiopian believers and friends in Warsaw, bound together by the love of Christ and a shared hunger for God."}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-gold-600 text-sm font-semibold uppercase tracking-widest mb-3">Our Mission</p>
              <h2 className="font-display text-4xl font-bold text-gray-800 mb-5">
                {content.mission_title ?? "Inspiring Lives for the Glory of God"}
              </h2>
              <div className="gold-bar mb-7" />
              <p className="text-gray-600 leading-relaxed mb-5 text-lg">
                {content.mission_body_1 ?? "The Warsaw Ethiopian Christian Fellowship exists to glorify God by making disciples, nurturing authentic community, and serving the Ethiopian diaspora and wider body of Christ in Poland."}
              </p>
              <p className="text-gray-600 leading-relaxed mb-5">
                {content.mission_body_2 ?? "We are committed to reaching the lost, teaching the Word, equipping believers, and sending workers into the harvest. Through worship, prayer, fellowship, and service, we pursue an ever-deeper relationship with Jesus Christ."}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {content.mission_body_3 ?? "Founded on the bedrock of Hebrews 10:24-25, we refuse to forsake the gathering of believers — because we know that together, we are stronger, sharper, and more effective for the Kingdom."}
              </p>
            </div>

            {/* Verse block */}
            <div className="bg-brown-900 rounded-3xl p-10 text-center relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-5 text-white" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M42,5 H58 V30 H90 V46 H58 V95 H42 V46 H10 V30 H42 Z"/></svg>
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
            <p className="text-gold-600 text-sm font-semibold uppercase tracking-widest mb-3">What We Stand For</p>
            <h2 className="font-display text-4xl font-bold text-gray-800">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((n, i) => {
              const Icon = valueIcons[i];
              const title = content[`value_${n}_title`] ?? DEFAULT_VALUES[i].title;
              const desc  = content[`value_${n}_desc`]  ?? DEFAULT_VALUES[i].desc;
              return (
                <div key={n} className="bg-white rounded-2xl p-7 border border-brown-200 card-hover">
                  <div className="w-12 h-12 rounded-xl bg-brown-50 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-gold-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg mb-3">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gold-600 text-sm font-semibold uppercase tracking-widest mb-3">Those Who Serve</p>
          <h2 className="font-display text-4xl font-bold text-gray-800 mb-12">Our Leadership</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-8">
              {displayLeaders.map((leader) => {
                const initials = leader.name
                  ? leader.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "??";

                return (
                  <div key={leader.id} className="text-center">
                    {leader.imageUrl ? (
                      <img
                        src={leader.imageUrl}
                        alt={leader.name}
                        className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brown-100 flex items-center justify-center text-gold-500 font-bold text-2xl mx-auto mb-4 font-display">
                        {initials}
                      </div>
                    )}
                    <h3 className="font-display font-semibold text-gray-800 mb-1">{leader.name}</h3>
                    <p className="text-sm text-gold-600">{leader.title}</p>
                    {leader.bio && <p className="text-xs text-gray-500 mt-2">{leader.bio}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
