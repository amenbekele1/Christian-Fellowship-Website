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


const announcementSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(5),
  isPublic: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get("public") === "true";

  const where: any = {};
  if (!session || publicOnly) where.isPublic = true;

  const announcements = await prisma.announcement.findMany({
    where: {
      ...where,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = announcementSchema.parse(body);

  const announcement = await prisma.announcement.create({
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  // Fire push notification (non-blocking)
  sendPushToAll({
    title: "New Announcement",
    body: announcement.title,
    url: "/dashboard",
  }).catch(() => {});

  return NextResponse.json(announcement, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const data = announcementSchema.partial().parse(body);

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });

  return NextResponse.json(announcement);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
