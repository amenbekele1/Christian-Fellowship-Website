import { prisma } from "@/lib/prisma";
import { formatReference, passageId } from "@/lib/bible";
import { formatWarsaw, warsawDateKey } from "@/lib/timezone";
import type { StudySessionData } from "@/components/bible/StudySessionView";

type SessionRow = Awaited<ReturnType<typeof prisma.studySession.findFirst>> & {};

/** Study dates are stored as UTC midnight of the Warsaw calendar day. */
export function todayStudyDate(): Date {
  return new Date(`${warsawDateKey()}T00:00:00.000Z`);
}

export function studyDateLabel(date: Date): string {
  return formatWarsaw(new Date(date.toISOString().slice(0, 10) + "T12:00:00Z"), {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function toSessionData(s: NonNullable<SessionRow>, seriesTitle: string): StudySessionData {
  return {
    id: s.id,
    seriesTitle,
    dateLabel: studyDateLabel(s.date),
    title: s.title,
    reference: formatReference(s),
    passageId: passageId(s),
    chapterId: `${s.bookId}.${s.startChapter}`,
    questions: s.questions,
    notes: s.notes,
  };
}

/** This week's study: the next one from today, else the most recent. Null if none (or tables missing). */
export async function getCurrentStudy() {
  try {
    const today = todayStudyDate();
    const upcoming = await prisma.studySession.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      include: { series: { select: { title: true } } },
    });
    const s =
      upcoming ??
      (await prisma.studySession.findFirst({
        orderBy: { date: "desc" },
        include: { series: { select: { title: true } } },
      }));
    return s ? { session: s, isUpcoming: Boolean(upcoming) } : null;
  } catch {
    return null;
  }
}
