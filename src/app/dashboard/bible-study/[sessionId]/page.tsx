import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toSessionData } from "@/lib/bible-study";
import { StudySessionView } from "@/components/bible/StudySessionView";

export const dynamic = "force-dynamic";

export default async function StudySessionPage({ params }: { params: { sessionId: string } }) {
  const session = await prisma.studySession
    .findUnique({ where: { id: params.sessionId }, include: { series: { select: { title: true } } } })
    .catch(() => null);
  if (!session) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/bible-study" className="inline-block text-sm font-semibold mb-4" style={{ color: "#8A6A1F" }}>
        ← All studies
      </Link>
      <StudySessionView session={toSessionData(session, session.series.title)} />
    </div>
  );
}
