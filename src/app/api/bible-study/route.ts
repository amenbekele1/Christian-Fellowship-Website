import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getBook } from "@/lib/bible";
import { sendRefreshPush } from "@/lib/webpush";
import { background } from "@/lib/background";

const sessionSchema = z
  .object({
    seriesId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    title: z.string().trim().max(160).optional().nullable(),
    bookId: z.string().refine((id) => Boolean(getBook(id)), "Pick a book"),
    startChapter: z.number().int().min(1),
    startVerse: z.number().int().min(1).optional().nullable(),
    endChapter: z.number().int().min(1).optional().nullable(),
    endVerse: z.number().int().min(1).optional().nullable(),
    questions: z.array(z.string().trim().min(1).max(1000)).max(40).default([]),
    notes: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((d) => d.startChapter <= (getBook(d.bookId)?.chapters ?? 0), {
    message: "That chapter doesn't exist in this book",
  })
  .refine((d) => !d.endChapter || d.endChapter >= d.startChapter, {
    message: "The passage ends before it starts",
  })
  .refine((d) => !d.endChapter || d.endChapter <= (getBook(d.bookId)?.chapters ?? 0), {
    message: "That chapter doesn't exist in this book",
  });

/** Study dates are calendar days: stored as UTC midnight of the Warsaw date. */
const toDate = (key: string) => new Date(`${key}T00:00:00.000Z`);

/** GET — every series with its sessions (members). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const series = await prisma.studySeries.findMany({
    orderBy: { createdAt: "desc" },
    include: { sessions: { orderBy: { date: "desc" } } },
  });
  return NextResponse.json(series);
}

async function guardian() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "GUARDIAN" ? session : null;
}

/** POST — add a session (Guardians). */
export async function POST(req: NextRequest) {
  const session = await guardian();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = sessionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const { date, ...rest } = parsed.data;
  const created = await prisma.studySession.create({
    data: { ...rest, date: toDate(date), createdById: session.user.id },
  });
  background(sendRefreshPush("bible-study"));
  return NextResponse.json(created, { status: 201 });
}

/** PATCH ?id= — edit a session (Guardians). */
export async function PATCH(req: NextRequest) {
  if (!(await guardian())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = sessionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const { date, ...rest } = parsed.data;
  const existing = await prisma.studySession.findUnique({ where: { id }, select: { date: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const newDate = toDate(date);
  const updated = await prisma.studySession.update({
    where: { id },
    data: {
      ...rest,
      date: newDate,
      // Moved to another day: remind again.
      ...(existing.date.getTime() !== newDate.getTime() ? { reminderSent: false } : {}),
    },
  });
  background(sendRefreshPush("bible-study"));
  return NextResponse.json(updated);
}

/** DELETE ?id= (Guardians). */
export async function DELETE(req: NextRequest) {
  if (!(await guardian())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.studySession.delete({ where: { id } });
  background(sendRefreshPush("bible-study"));
  return NextResponse.json({ ok: true });
}
