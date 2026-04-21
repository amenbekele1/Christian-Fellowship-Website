import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCron } from "@/lib/cron-auth";
import { sendPushToAll } from "@/lib/webpush";

/**
 * Hourly cron. Fires two kinds of reminders per event:
 *   • day-before  — within 20–28 hours of start
 *   • hour-before — within 30–90 minutes of start
 * Idempotent: each reminder is sent at most once per event via flag columns.
 */
export async function GET(req: NextRequest) {
  const unauth = verifyCron(req);
  if (unauth) return unauth;

  const now     = new Date();
  const in30m   = new Date(now.getTime() + 30 * 60 * 1000);
  const in90m   = new Date(now.getTime() + 90 * 60 * 1000);
  const in20h   = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const in28h   = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  let daySent  = 0;
  let hourSent = 0;

  // Day-before reminders
  const dayEvents = await prisma.event.findMany({
    where: {
      isActive:         true,
      dayReminderSent:  false,
      startDate:        { gte: in20h, lte: in28h },
    },
  });

  for (const ev of dayEvents) {
    await sendPushToAll({
      title: "📅 Tomorrow: " + ev.title,
      body:  ev.location ? `At ${ev.location}` : "See you there.",
      url:   "/dashboard",
      topic: "events",
    }).catch(() => {});
    await prisma.event.update({
      where: { id: ev.id },
      data:  { dayReminderSent: true },
    });
    daySent++;
  }

  // Hour-before reminders
  const hourEvents = await prisma.event.findMany({
    where: {
      isActive:         true,
      hourReminderSent: false,
      startDate:        { gte: in30m, lte: in90m },
    },
  });

  for (const ev of hourEvents) {
    await sendPushToAll({
      title: "⏰ Starting soon: " + ev.title,
      body:  ev.location ? `At ${ev.location}` : "Starting within the hour.",
      url:   "/dashboard",
      topic: "events",
    }).catch(() => {});
    await prisma.event.update({
      where: { id: ev.id },
      data:  { hourReminderSent: true },
    });
    hourSent++;
  }

  return NextResponse.json({ daySent, hourSent });
}
