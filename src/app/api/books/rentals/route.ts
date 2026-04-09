import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, bookReminderEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { addDays, nextSaturday } from "date-fns";

// Helper to calculate due date: next Saturday + 14 days
function calculateDueDate(): Date {
  const today = new Date();
  const nextSat = nextSaturday(today);
  return addDays(nextSat, 14);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  const where: any = {};
  if (mine || session.user.role === "MEMBER") where.userId = session.user.id;

  const rentals = await prisma.bookRental.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, author: true, coverImage: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rentals);
}

// Reserve a book
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookId } = body;

  if (!bookId) return NextResponse.json({ error: "Book ID required" }, { status: 400 });

  // Check availability
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  if (book.availableQty <= 0) {
    return NextResponse.json({ error: "Book is not available" }, { status: 400 });
  }

  // Check if user already has an active rental for this book
  const existing = await prisma.bookRental.findFirst({
    where: { userId: session.user.id, bookId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have this book reserved" }, { status: 400 });
  }

  // Create rental — due date is next Saturday + 14 days
  const dueDate = calculateDueDate();

  const rental = await prisma.bookRental.create({
    data: {
      userId: session.user.id,
      bookId,
      dueDate,
      status: "ACTIVE",
    },
    include: {
      book: true,
      user: true,
    },
  });

  // Decrement available quantity
  await prisma.book.update({
    where: { id: bookId },
    data: { availableQty: { decrement: 1 } },
  });

  return NextResponse.json(rental, { status: 201 });
}

// Return a book or update rental
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Rental ID required" }, { status: 400 });

  const body = await req.json();

  // Return a book
  if (body.action === "return") {
    if (!["GUARDIAN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Only guardians can mark books as returned" }, { status: 403 });
    }

    const rental = await prisma.bookRental.update({
      where: { id },
      data: { status: "RETURNED", returnedAt: new Date() },
      include: { book: true },
    });

    await prisma.book.update({
      where: { id: rental.bookId },
      data: { availableQty: { increment: 1 } },
    });

    return NextResponse.json(rental);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// Cron-style endpoint to send reminders (call via cron job or Vercel cron)
export async function PUT(req: NextRequest) {
  const cronSecret = req.headers.get("x-vercel-cron-secret");
  const authHeader = req.headers.get("authorization");

  const isValidCron = cronSecret === process.env.CRON_SECRET;
  const isValidBearer = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isValidCron && !isValidBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = addDays(new Date(), 1);
  const dayAfter = addDays(new Date(), 2);

  // Find rentals due within 48 hours where reminder hasn't been sent
  const dueRentals = await prisma.bookRental.findMany({
    where: {
      status: "ACTIVE",
      reminderSent: false,
      dueDate: { gte: tomorrow, lte: dayAfter },
    },
    include: {
      user: true,
      book: true,
    },
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

    if (result.success) {
      await prisma.bookRental.update({
        where: { id: rental.id },
        data: { reminderSent: true },
      });
      results.push({ id: rental.id, sent: true });
    }
  }

  // Mark overdue
  await prisma.bookRental.updateMany({
    where: {
      status: "ACTIVE",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  return NextResponse.json({ processed: results.length, results });
}
