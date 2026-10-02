import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatReference } from "@/lib/bible";
import { getCurrentStudy, studyDateLabel, toSessionData } from "@/lib/bible-study";
import { StudySessionView } from "@/components/bible/StudySessionView";

export const dynamic = "force-dynamic";

export default async function BibleStudyPage() {
  const [current, series] = await Promise.all([
    getCurrentStudy(),
    prisma.studySeries
      .findMany({
        orderBy: { createdAt: "desc" },
        include: { sessions: { orderBy: { date: "desc" } } },
      })
      .catch(() => []),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      {current ? (
        <>
          {!current.isUpcoming && (
            <p className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#F0E6D3", color: "#5C3D20" }}>
              The next study hasn&apos;t been posted yet — here is the most recent one.
            </p>
          )}
          <StudySessionView session={toSessionData(current.session, current.session.series.title)} />
        </>
      ) : (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#fff", border: "1px solid #E0CBB0" }}>
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: "#8A6A4A" }} aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold" style={{ color: "#2C1A0E" }}>Bible Study</h1>
          <p className="text-sm mt-2" style={{ color: "#7A5C3E" }}>This week&apos;s passage and questions will appear here.</p>
          <Link href="/dashboard/bible" className="inline-block mt-5 text-sm font-semibold" style={{ color: "#8A6A1F" }}>
            Open the Bible →
          </Link>
        </div>
      )}

      {series.some((s) => s.sessions.length > 0) && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold mb-4" style={{ color: "#2C1A0E" }}>All studies</h2>
          <div className="space-y-6">
            {series
              .filter((s) => s.sessions.length > 0)
              .map((s) => (
                <div key={s.id}>
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#8A6A1F" }}>{s.title}</h3>
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E0CBB0" }}>
                    {s.sessions.map((sess, i) => (
                      <Link
                        key={sess.id}
                        href={`/dashboard/bible-study/${sess.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAF7F0] transition-colors"
                        style={i > 0 ? { borderTop: "1px solid #F0E6D3" } : undefined}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "#2C1A0E" }}>
                            {sess.title || formatReference(sess)}
                          </p>
                          <p className="text-xs" style={{ color: "#7A5C3E" }}>
                            {studyDateLabel(sess.date)}{sess.title ? ` · ${formatReference(sess)}` : ""}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#C4A882" }} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
