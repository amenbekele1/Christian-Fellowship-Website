import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail, sendBusLeaderAbsenceReport, sendLeaderUnassignedAbsenceReport } from "@/lib/email";
import { formatDate } from "@/lib/utils";

const recordSchema = z.object({
  records: z.array(
    z.object({
      userId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
      busGroupId: z.string().optional().nullable(),
      notes: z.string().optional(),
    })
  ),
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
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Only Guardians can record attendance" }, { status: 403 });
  }

  const body = await req.json();
  const { records, date } = recordSchema.parse(body);
  // Normalize to midnight UTC so the composite unique key (userId, date)
  // is always identical for the same calendar day regardless of submission time.
  const attendanceDate = new Date(date.split("T")[0] + "T00:00:00.000Z");

  const results = [];
  // Map: busGroupId -> { group, absentMembers[] }
  const absentByGroup = new Map<string, { group: any; members: Array<{ name: string; phone?: string }> }>();
  // Members absent with no BUS group assigned
  const unassignedAbsent: Array<{ name: string; phone?: string }> = [];

  for (const record of records) {
    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId: record.userId, date: attendanceDate } },
      update: { status: record.status, notes: record.notes, ...(record.busGroupId ? { busGroupId: record.busGroupId } : {}) },
      create: {
        userId: record.userId,
        busGroupId: record.busGroupId ?? undefined,
        date: attendanceDate,
        status: record.status,
        notes: record.notes,
      },
      include: { user: true },
    });
    results.push(attendance);

    if (record.status === "ABSENT") {
      if (record.busGroupId) {
        if (!absentByGroup.has(record.busGroupId)) {
          const grp = await prisma.bUSGroup.findUnique({
            where: { id: record.busGroupId },
            include: { leader: true },
          });
          absentByGroup.set(record.busGroupId, { group: grp, members: [] });
        }
        absentByGroup.get(record.busGroupId)!.members.push({
          name: attendance.user.name,
          phone: attendance.user.phone || undefined,
        });
      } else {
        // No BUS group — collect for leader follow-up
        unassignedAbsent.push({
          name: attendance.user.name,
          phone: attendance.user.phone || undefined,
        });
      }
    }
  }

  // Send one consolidated email per BUS leader
  for (const { group, members } of absentByGroup.values()) {
    if (group?.leader && members.length > 0) {
      sendEmail({
        to: group.leader.email,
        subject: `Absence Report — ${group.name} (${formatDate(attendanceDate)})`,
        html: sendBusLeaderAbsenceReport(
          group.leader.name,
          group.name,
          formatDate(attendanceDate),
          members
        ),
      }).catch(console.error);
    }
  }

  // Send one email to each Leader (GUARDIAN) for unassigned absent members
  if (unassignedAbsent.length > 0) {
    const leaders = await prisma.user.findMany({
      where: { role: "GUARDIAN", isActive: true },
      select: { name: true, email: true },
    });
    for (const leader of leaders) {
      sendEmail({
        to: leader.email,
        subject: `Follow-up Needed — Unassigned Absent Members (${formatDate(attendanceDate)})`,
        html: sendLeaderUnassignedAbsenceReport(
          leader.name,
          formatDate(attendanceDate),
          unassignedAbsent
        ),
      }).catch(console.error);
    }
  }

  return NextResponse.json({ message: "Attendance recorded", count: results.length });
}
