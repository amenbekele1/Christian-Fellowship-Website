import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail, absenceNotificationEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

const recordSchema = z.object({
  records: z.array(
    z.object({
      userId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
      notes: z.string().optional(),
    })
  ),
  busGroupId: z.string(),
  date: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const busGroupId = searchParams.get("busGroupId");
  const userId = searchParams.get("userId");
  const month = searchParams.get("month"); // YYYY-MM

  const where: any = {};
  if (busGroupId) where.busGroupId = busGroupId;
  if (userId) where.userId = userId;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  // BUS leaders can only see their own group
  if (session.user.role === "BUS_LEADER") {
    const leader = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { ledBusGroup: true },
    });
    if (leader?.ledBusGroup) where.busGroupId = leader.ledBusGroup.id;
  }

  // Regular members can only see their own
  if (session.user.role === "MEMBER") {
    where.userId = session.user.id;
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      busGroup: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(attendance);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["GUARDIAN", "BUS_LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { records, busGroupId, date } = recordSchema.parse(body);
  const attendanceDate = new Date(date);

  // Fetch BUS group with leader
  const busGroup = await prisma.bUSGroup.findUnique({
    where: { id: busGroupId },
    include: { leader: true },
  });
  if (!busGroup) return NextResponse.json({ error: "BUS group not found" }, { status: 404 });

  const results = [];

  for (const record of records) {
    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId: record.userId, date: attendanceDate } },
      update: { status: record.status, notes: record.notes },
      create: {
        userId: record.userId,
        busGroupId,
        date: attendanceDate,
        status: record.status,
        notes: record.notes,
      },
      include: { user: true },
    });

    results.push(attendance);

    // Send email to BUS leader if member is ABSENT
    if (record.status === "ABSENT" && busGroup.leader) {
      const member = attendance.user;
      sendEmail({
        to: busGroup.leader.email,
        subject: `Follow-up Needed: ${member.name} was absent on ${formatDate(attendanceDate)}`,
        html: absenceNotificationEmail(
          busGroup.leader.name,
          member.name,
          formatDate(attendanceDate)
        ),
      }).catch(console.error);
    }
  }

  return NextResponse.json({ message: "Attendance recorded", count: results.length });
}
