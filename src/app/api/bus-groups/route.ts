import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const busGroupSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  leaderId: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.bUSGroup.findMany({
    include: {
      leader: { select: { id: true, name: true, email: true } },
      members: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = busGroupSchema.parse(body);

  // Ensure leader exists and update their role
  await prisma.user.update({
    where: { id: data.leaderId },
    data: { role: "BUS_LEADER" },
  });

  const group = await prisma.bUSGroup.create({
    data,
    include: {
      leader: { select: { id: true, name: true, email: true } },
      members: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Group ID required" }, { status: 400 });

  const body = await req.json();

  // Handle member assignment separately
  if (body.addMemberId) {
    const updated = await prisma.user.update({
      where: { id: body.addMemberId },
      data: { busGroupId: id },
    });
    return NextResponse.json(updated);
  }

  if (body.removeMemberId) {
    const updated = await prisma.user.update({
      where: { id: body.removeMemberId },
      data: { busGroupId: null },
    });
    return NextResponse.json(updated);
  }

  const data = busGroupSchema.partial().parse(body);
  const group = await prisma.bUSGroup.update({
    where: { id },
    data,
    include: {
      leader: { select: { id: true, name: true, email: true } },
      members: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Group ID required" }, { status: 400 });

  await prisma.bUSGroup.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
