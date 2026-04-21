import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCron } from "@/lib/cron-auth";
import { sendEmail, bookReminderEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/webpush";
import { formatDate } from "@/lib/utils";
import { addDays } from "date-fns";

/**
 * Daily cron. Two passes:
 *   1. Rentals due within 24–48 hours that haven't had a reminder yet.
 *      → Sends email + push, flips reminderSent.
 *   2. Rentals now overdue.
 *      → Marks status=OVERDUE and sends a push.
 *
 * Replaces the old PUT /api/books/rentals cron (Vercel Cron only fires GET).
 */
export async function GET(req: NextRequest) {
  const unauth = verifyCron(req);
  if (unauth) return unauth;

  const tomorrow = addDays(new Date(), 1);
  const dayAfter = addDays(new Date(), 2);

  // 1) Due-soon rentals (24–48 h out)
  const dueRentals = await prisma.bookRental.findMany({
    where: {
      status: "ACTIVE",
      reminderSent: false,
      dueDate: { gte: tomorrow, lte: dayAfter },
    },
    include: { user: true, book: true },
  });

  const results = [];
  for (const rental of dueRentals) {
    const result = await sendEmail({
      to: rental.user.email,
      subject: `📚 Book Return Reminder: "${rental.book.title}"`,
      html: bookReminderEmail(
        rental.user.name,
        rental.book.title,
        formatDate(rental.dueDate!)
      ),
    });

    sendPushToUser(rental.userId, {
      title: "📚 Book due soon",
      body:  `"${rental.book.title}" is due on ${formatDate(rental.dueDate!)}.`,
      url:   "/dashboard/library",
      topic: "rentals",
    }).catch(() => {});

    if (result.success) {
      await prisma.bookRental.update({
        where: { id: rental.id },
        data: { reminderSent: true },
      });
      results.push({ id: rental.id, sent: true });
    }
  }

  // 2) Newly-overdue rentals
  const nowOverdue = await prisma.bookRental.findMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    include: { book: true },
  });

  await prisma.bookRental.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    data:  { status: "OVERDUE" },
  });

  for (const r of nowOverdue) {
    sendPushToUser(r.userId, {
      title: "📕 Overdue book",
      body:  `"${r.book.title}" is past its due date. Please return it.`,
      url:   "/dashboard/library",
      topic: "rentals",
    }).catch(() => {});
  }

  return NextResponse.json({
    processed: results.length,
    overdue:   nowOverdue.length,
    results,
  });
}
