import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCron } from "@/lib/cron-auth";
import { sendPushToAll } from "@/lib/webpush";
import { formatWarsaw, parseWarsawDateTime, warsawDateKey } from "@/lib/timezone";
import { eventPath } from "@/lib/event-presets";
import { formatReference } from "@/lib/bible";

/**
 * Daily cron (08:00 UTC = 09:00/10:00 in Warsaw — Vercel Hobby only allows
 * one run per day). Sends, by Warsaw calendar day:
 *   • "Today"    — events later today      (flag: hourReminderSent)
 *   • "Tomorrow" — events on the next day  (flag: dayReminderSent)
 *   • Bible study — the day before a study session  (flag: reminderSent)
 * Idempotent: each reminder is sent at most once via flag columns.
 */
export async function GET(req: NextRequest) {
  const unauth = verifyCron(req);
  if (unauth) return unauth;

  const now = new Date();
  const tomorrowKey = warsawDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const startOfTomorrow = parseWarsawDateTime(`${tomorrowKey}T00:00`);
  const dayAfterKey = warsawDateKey(new Date(startOfTomorrow.getTime() + 36 * 60 * 60 * 1000));
  const startOfDayAfter = parseWarsawDateTime(`${dayAfterKey}T00:00`);

  const time = (d: Date) => formatWarsaw(d, { hour: "2-digit", minute: "2-digit" });
  const where = (ev: { location: string | null }) => (ev.location ? ` · ${ev.location}` : "");

  const [todayEvents, tomorrowEvents] = await Promise.all([
    prisma.event.findMany({
      where: { isActive: true, hourReminderSent: false, startDate: { gt: now, lt: startOfTomorrow } },
    }),
    prisma.event.findMany({
      where: { isActive: true, dayReminderSent: false, startDate: { gte: startOfTomorrow, lt: startOfDayAfter } },
    }),
  ]);

  await Promise.allSettled([
    ...todayEvents.map((ev) =>
      sendPushToAll({
        title: "⏰ Today: " + ev.title,
        body: `Starts at ${time(ev.startDate)}${where(ev)}`,
        url: eventPath(ev),
        topic: "events",
      })
    ),
    ...tomorrowEvents.map((ev) =>
      sendPushToAll({
        title: "📅 Tomorrow: " + ev.title,
        body: `${time(ev.startDate)}${where(ev)}`,
        url: eventPath(ev),
        topic: "events",
      })
    ),
  ]);

  if (todayEvents.length) {
    await prisma.event.updateMany({
      where: { id: { in: todayEvents.map((e) => e.id) } },
      // An event announced today needs no "tomorrow" reminder either.
      data: { hourReminderSent: true, dayReminderSent: true },
    });
  }
  if (tomorrowEvents.length) {
    await prisma.event.updateMany({
      where: { id: { in: tomorrowEvents.map((e) => e.id) } },
      data: { dayReminderSent: true },
    });
  }

  // Bible study "read ahead" reminder, the day before each session.
  let studySent = 0;
  try {
    const study = await prisma.studySession.findFirst({
      where: { date: new Date(`${tomorrowKey}T00:00:00.000Z`), reminderSent: false },
      include: { series: { select: { title: true } } },
    });
    if (study) {
      await sendPushToAll({
        title: "📖 Tomorrow's Bible study: " + formatReference(study),
        body: study.title ?? `${study.series.title} — read ahead and look at the questions.`,
        url: "/dashboard/bible-study",
        topic: "bible-study",
      }).catch(() => {});
      await prisma.studySession.update({ where: { id: study.id }, data: { reminderSent: true } });
      studySent = 1;
    }
  } catch (err) {
    console.error("study reminder:", (err as Error).message);
  }

  return NextResponse.json({ todaySent: todayEvents.length, tomorrowSent: tomorrowEvents.length, studySent });
}
