import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const leaderSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const leaders = await prisma.leader.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(leaders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = leaderSchema.parse(body);

  const leader = await prisma.leader.create({
    data,
  });

  return NextResponse.json(leader, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Leader ID required" }, { status: 400 });

  const body = await req.json();
  const data = leaderSchema.partial().parse(body);

  const leader = await prisma.leader.update({
    where: { id },
    data,
  });

  return NextResponse.json(leader);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Leader ID required" }, { status: 400 });

  await prisma.leader.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ message: "Leader deleted" });
}
