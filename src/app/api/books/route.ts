import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  translatedBy: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  imageUrl: z.string().optional(),
  totalQuantity: z.number().int().positive().default(1),
  category: z.string().optional(),
  publishedYear: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const available = searchParams.get("available") === "true";
  const search = searchParams.get("search");

  const where: any = { isActive: true };
  if (category) where.category = category;
  if (available) where.availableQty = { gt: 0 };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { translatedBy: { contains: search, mode: "insensitive" } },
    ];
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: { title: "asc" },
    include: {
      _count: { select: { rentals: true } },
    },
  });

  return NextResponse.json(books);
}

function canManageLibrary(session: any): boolean {
  return (
    session?.user?.role === "GUARDIAN" ||
    (session?.user?.serviceTeams ?? []).includes("LIBRARIAN")
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageLibrary(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = bookSchema.parse(body);

  const book = await prisma.book.create({
    data: { ...data, availableQty: data.totalQuantity },
  });

  return NextResponse.json(book, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageLibrary(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Book ID required" }, { status: 400 });

  const body = await req.json();
  const data = bookSchema.partial().parse(body);

  const book = await prisma.book.update({ where: { id }, data });
  return NextResponse.json(book);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageLibrary(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Book ID required" }, { status: 400 });

  await prisma.book.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ message: "Book removed from library" });
}
