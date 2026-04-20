import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendRefreshPush } from "@/lib/webpush";

function canEditContent(session: any): boolean {
  return (
    session?.user?.role === "GUARDIAN" ||
    (session?.user?.serviceTeams ?? []).includes("WEBSITE_EDITOR")
  );
}


const programSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
});

export async function GET(req: NextRequest) {
  const programs = await prisma.program.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = programSchema.parse(body);

  const program = await prisma.program.create({
    data,
  });

  sendRefreshPush("programs").catch(() => {});
  return NextResponse.json(program, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Program ID required" }, { status: 400 });

  const body = await req.json();
  const data = programSchema.partial().parse(body);

  const program = await prisma.program.update({
    where: { id },
    data,
  });

  sendRefreshPush("programs").catch(() => {});
  return NextResponse.json(program);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Program ID required" }, { status: 400 });

  await prisma.program.update({
    where: { id },
    data: { isActive: false },
  });

  sendRefreshPush("programs").catch(() => {});
  return NextResponse.json({ message: "Program deleted" });
}
