import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendPushToAll } from "@/lib/webpush";

function canEditContent(session: any): boolean {
  return (
    session?.user?.role === "GUARDIAN" ||
    (session?.user?.serviceTeams ?? []).includes("WEBSITE_EDITOR")
  );
}


const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  type: z.string().optional(),
  imageUrl: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get("public") === "true";
  const upcoming = searchParams.get("upcoming") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = { isActive: true };
  if (publicOnly) where.isPublic = true;
  if (upcoming) where.startDate = { gte: new Date() };

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: limit,
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = eventSchema.parse(body);

  const event = await prisma.event.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  // Fire push notification (non-blocking)
  sendPushToAll({
    title: "New Event",
    body: event.title,
    url: "/dashboard",
  }).catch(() => {});

  return NextResponse.json(event, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

  const body = await req.json();
  const data = eventSchema.partial().parse(body);

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

  await prisma.event.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ message: "Event deleted" });
}
