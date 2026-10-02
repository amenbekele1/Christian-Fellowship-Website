"use client";

import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { ScriptureView, VersionSwitch, useBibleVersion } from "./ScriptureView";

export interface StudySessionData {
  id: string;
  seriesTitle: string;
  dateLabel: string;
  title: string | null;
  reference: string;
  passageId: string;
  chapterId: string;
  questions: string[];
  notes: string | null;
}

const card = { background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" };

/** One Saturday study: the passage (in the member's chosen version) and the questions. */
export function StudySessionView({ session }: { session: StudySessionData }) {
  const [version, setVersion] = useBibleVersion();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8A6A1F" }}>
          {session.seriesTitle} · {session.dateLabel}
        </p>
        <h1 className="font-display text-3xl font-bold mt-1" style={{ color: "#2C1A0E" }}>
          {session.title || session.reference}
        </h1>
        {session.title && <p className="mt-1 font-semibold" style={{ color: "#7A5C3E" }}>{session.reference}</p>}
      </div>

      {session.questions.length > 0 && (
        <section className="rounded-2xl p-5" style={card}>
          <h2 className="font-display font-bold flex items-center gap-2 mb-4" style={{ color: "#2C1A0E" }}>
            <HelpCircle className="w-5 h-5" style={{ color: "#A8862E" }} aria-hidden="true" /> Questions
          </h2>
          <ol className="space-y-3">
            {session.questions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#8A6A1F" }}
                >
                  {i + 1}
                </span>
                <p className="leading-relaxed pt-0.5 whitespace-pre-wrap" style={{ color: "#3D2410" }}>{q}</p>
              </li>
            ))}
          </ol>
          {session.notes && (
            <p className="mt-5 pt-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ borderTop: "1px solid #F0E6D3", color: "#7A5C3E" }}>
              {session.notes}
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl p-5" style={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-bold flex items-center gap-2" style={{ color: "#2C1A0E" }}>
            <BookOpen className="w-5 h-5" style={{ color: "#A8862E" }} aria-hidden="true" /> Passage
          </h2>
          <VersionSwitch value={version} onChange={setVersion} />
        </div>
        <ScriptureView version={version} passage={session.passageId} />
        <Link
          href={`/dashboard/bible?chapter=${session.chapterId}`}
          className="inline-block mt-4 text-sm font-semibold"
          style={{ color: "#8A6A1F" }}
        >
          Read the whole chapter →
        </Link>
      </section>
    </div>
  );
}
