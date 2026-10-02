import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const seriesSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
});

async function guardian() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "GUARDIAN" ? session : null;
}

/** POST — create a series (Guardians). */
export async function POST(req: NextRequest) {
  if (!(await guardian())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = seriesSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const series = await prisma.studySeries.create({ data: parsed.data });
  return NextResponse.json(series, { status: 201 });
}

/** PATCH ?id= — rename / describe a series (Guardians). */
export async function PATCH(req: NextRequest) {
  if (!(await guardian())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = seriesSchema.partial().safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const series = await prisma.studySeries.update({ where: { id }, data: parsed.data });
  return NextResponse.json(series);
}

/** DELETE ?id= — remove a series and its sessions (Guardians). */
export async function DELETE(req: NextRequest) {
  if (!(await guardian())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.studySeries.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
