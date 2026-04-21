import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCron } from "@/lib/cron-auth";
import { sendPushToUser } from "@/lib/webpush";

/**
 * Weekly encouragement for members currently reading a book. Picks a short
 * rotating message so they don't see the same line every week.
 */
const MESSAGES = [
  "Keep turning the pages — a chapter a day is all it takes.",
  "How's the reading going? May the Word guide your thoughts this week.",
  "“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105",
  "A good book read slowly is better than a fast one forgotten. Keep going!",
  "Take 15 quiet minutes today to continue your book — you'll be glad you did.",
  "Reading is feeding the soul. Grab your book and a cup of coffee ☕",
];

function pickMessage(salt: string): string {
  // Deterministic-ish picker so each cron run rotates for different users.
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = (h * 31 + salt.charCodeAt(i)) | 0;
  return MESSAGES[Math.abs(h) % MESSAGES.length];
}

export async function GET(req: NextRequest) {
  const unauth = verifyCron(req);
  if (unauth) return unauth;

  const activeRentals = await prisma.bookRental.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { id: true, name: true } },
      book: { select: { title: true } },
    },
  });

  // Rotate the message weekly by mixing in the current ISO week number.
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

  let sent = 0;
  for (const r of activeRentals) {
    const body = pickMessage(`${r.user.id}-${week}`);
    await sendPushToUser(r.user.id, {
      title: `📖 Still reading "${r.book.title}"?`,
      body,
      url:   "/dashboard/library",
      topic: "reading-encouragement",
    }).catch(() => {});
    sent++;
  }

  return NextResponse.json({ sent });
}
