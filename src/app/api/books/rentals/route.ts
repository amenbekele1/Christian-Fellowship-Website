import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRentalSchema = z.object({
  bookId: z.string().min(1),
  pickupDate: z.string(),
  returnDate: z.string(),
});

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
  const { bookId, pickupDate, returnDate } = createRentalSchema.parse(body);

  // Parse and validate dates first (before hitting DB)
  const pickupDateObj = new Date(pickupDate);
  const returnDateObj = new Date(returnDate);

  if (returnDateObj <= pickupDateObj) {
    return NextResponse.json({ error: "Return date must be after pickup date" }, { status: 400 });
  }
  const daysDifference = Math.floor(
    (returnDateObj.getTime() - pickupDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDifference > 30) {
    return NextResponse.json({ error: "Rental period cannot exceed 30 days" }, { status: 400 });
  }

  // Atomic transaction: check availability, claim copy, create rental
  let rental;
  try {
    rental = await prisma.$transaction(async (tx) => {
      // Check existing rental inside transaction to avoid TOCTOU race
      const existing = await tx.bookRental.findFirst({
        where: { userId: session!.user.id, bookId, status: "ACTIVE" },
      });
      if (existing) throw new Error("ALREADY_RESERVED");

      // Decrement with a WHERE guard — this acts as the availability check AND the claim.
      // If availableQty is 0, the update returns 0 rows and Prisma throws P2025.
      const updatedBook = await tx.book.update({
        where: { id: bookId, availableQty: { gt: 0 } },
        data: { availableQty: { decrement: 1 } },
      });

      return tx.bookRental.create({
        data: {
          userId: session!.user.id,
          bookId,
          pickupDate: pickupDateObj,
          dueDate: returnDateObj,
          status: "ACTIVE",
        },
        include: { book: true, user: true },
      });
    });
  } catch (err: any) {
    if (err.message === "ALREADY_RESERVED") {
      return NextResponse.json({ error: "You already have this book reserved" }, { status: 400 });
    }
    // Prisma P2025 = record not found (availableQty was 0, WHERE guard failed)
    if (err.code === "P2025" || err.message?.includes("Record to update not found")) {
      return NextResponse.json({ error: "Book is not available" }, { status: 400 });
    }
    // Book itself doesn't exist
    if (err.code === "P2003" || err.code === "P2016") {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    throw err;
  }

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

// Cron logic for reminders moved to GET /api/cron/book-reminders
// (Vercel Cron only fires GET requests).
