import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const busGroupId = searchParams.get("busGroupId");
  const search = searchParams.get("search");
  const role = searchParams.get("role");

  if (session.user.role === "MEMBER") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { busGroup: { include: { leader: { select: { name: true, email: true } } } } },
    });
    return NextResponse.json(user ? [user] : []);
  }

  const where: any = {};
  if (busGroupId) where.busGroupId = busGroupId;
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (session.user.role === "BUS_LEADER") {
    const leader = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { ledBusGroup: true },
    });
    if (leader?.ledBusGroup) where.busGroupId = leader.ledBusGroup.id;
  }

  const members = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      joinedAt: true,
      busGroup: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(["MEMBER", "BUS_LEADER", "GUARDIAN"]).optional(),
  busGroupId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

  if (session.user.role === "MEMBER" && id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = updateSchema.parse(body);

  if (session.user.role !== "GUARDIAN") {
    delete (data as any).role;
    delete (data as any).isActive;
    delete (data as any).busGroupId;
  }

  const member = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json(member);
}
