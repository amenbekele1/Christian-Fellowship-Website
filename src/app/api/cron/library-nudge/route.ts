import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCron } from "@/lib/cron-auth";
import { sendPushToUsers } from "@/lib/webpush";

/**
 * Weekly library nudge. Encourages members who DON'T currently have an active
 * rental to browse the library. Runs once a week (see vercel.json schedule).
 */
export async function GET(req: NextRequest) {
  const unauth = verifyCron(req);
  if (unauth) return unauth;

  // How many titles are currently available? Skip the nudge if the shelf is empty.
  const availableCount = await prisma.book.count({
    where: { isActive: true, availableQty: { gt: 0 } },
  });
  if (availableCount === 0) {
    return NextResponse.json({ skipped: "no available books" });
  }

  // Members without an ACTIVE rental
  const activeRenterIds = await prisma.bookRental.findMany({
    where: { status: "ACTIVE" },
    select: { userId: true },
    distinct: ["userId"],
  });
  const excludeIds = new Set(activeRenterIds.map((r) => r.userId));

  const members = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { notIn: Array.from(excludeIds) },
    },
    select: { id: true },
  });

  const userIds = members.map((m) => m.id);

  await sendPushToUsers(userIds, {
    title: "📚 New books waiting for you",
    body:  `${availableCount} ${availableCount === 1 ? "book is" : "books are"} available to borrow from the fellowship library.`,
    url:   "/dashboard/library",
    topic: "library-nudge",
  });

  return NextResponse.json({ notified: userIds.length, availableCount });
}
