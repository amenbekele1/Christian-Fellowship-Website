import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendRefreshPush } from "@/lib/webpush";
import { background } from "@/lib/background";

const busGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters").max(80),
  description: z.string().trim().max(500).optional().nullable(),
  // Optional: a group can be created first and given a leader later.
  leaderId: z.string().min(1).optional().nullable(),
});

/**
 * Leading a group makes a regular member a BUS leader; losing it reverts a
 * BUS leader to member. Guardians keep their role either way — otherwise
 * assigning a Guardian to lead a group silently removed their admin access.
 */
async function promoteToLeader(userId: string) {
  await prisma.user.updateMany({ where: { id: userId, role: "MEMBER" }, data: { role: "BUS_LEADER" } });
}
async function demoteFromLeader(userId: string) {
  await prisma.user.updateMany({ where: { id: userId, role: "BUS_LEADER" }, data: { role: "MEMBER" } });
}

/** A person can lead only one group; explain clashes instead of a 500. */
async function leadershipClash(leaderId: string, exceptGroupId?: string): Promise<string | null> {
  const other = await prisma.bUSGroup.findFirst({
    where: { leaderId, ...(exceptGroupId ? { NOT: { id: exceptGroupId } } : {}) },
    select: { name: true, leader: { select: { name: true } } },
  });
  return other
    ? `${other.leader?.name ?? "That person"} already leads ${other.name}. Choose someone else, or change that group's leader first.`
    : null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const include = {
    leader: { select: { id: true, name: true, email: true } },
    members: { select: { id: true, name: true, email: true, role: true } },
    _count: { select: { members: true } },
  };

  let groups;
  if (session.user.role === "BUS_LEADER") {
    groups = await prisma.bUSGroup.findMany({
      where: { leaderId: session.user.id },
      include,
      orderBy: { name: "asc" },
    });
  } else if (session.user.role === "MEMBER") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { busGroupId: true },
    });
    groups = user?.busGroupId
      ? await prisma.bUSGroup.findMany({ where: { id: user.busGroupId }, include })
      : [];
  } else {
    // GUARDIAN sees all
    groups = await prisma.bUSGroup.findMany({ include, orderBy: { name: "asc" } });
  }

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = busGroupSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const data = parsed.data;

  if (data.leaderId) {
    const clash = await leadershipClash(data.leaderId);
    if (clash) return NextResponse.json({ error: clash }, { status: 400 });
    await promoteToLeader(data.leaderId);
  }

  const group = await prisma.bUSGroup.create({
    data,
    include: {
      leader: { select: { id: true, name: true, email: true } },
      members: { select: { id: true, name: true } },
    },
  });

  background(sendRefreshPush("bus-groups"));
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
    background(sendRefreshPush("bus-groups"));
    return NextResponse.json(updated);
  }

  if (body.removeMemberId) {
    const updated = await prisma.user.update({
      where: { id: body.removeMemberId },
      data: { busGroupId: null },
    });
    background(sendRefreshPush("bus-groups"));
    return NextResponse.json(updated);
  }

  const parsed = busGroupSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const data = parsed.data;

  // Changing (or removing, with leaderId: null) the leader: hand the role
  // over. Guardians keep theirs.
  if (data.leaderId !== undefined) {
    const current = await prisma.bUSGroup.findUnique({ where: { id }, select: { leaderId: true } });
    if (!current) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const next = data.leaderId ?? null;
    if (current.leaderId !== next) {
      if (next) {
        const clash = await leadershipClash(next, id);
        if (clash) return NextResponse.json({ error: clash }, { status: 400 });
      }
      if (current.leaderId) await demoteFromLeader(current.leaderId);
      if (next) await promoteToLeader(next);
    }
    data.leaderId = next;
  }

  const group = await prisma.bUSGroup.update({
    where: { id },
    data,
    include: {
      leader: { select: { id: true, name: true, email: true } },
      members: { select: { id: true, name: true } },
    },
  });

  background(sendRefreshPush("bus-groups"));
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

  // Unassign all members before deleting so no orphaned busGroupId references remain
  await prisma.$transaction([
    prisma.user.updateMany({ where: { busGroupId: id }, data: { busGroupId: null } }),
    prisma.bUSGroup.delete({ where: { id } }),
  ]);
  background(sendRefreshPush("bus-groups"));
  return NextResponse.json({ message: "Deleted" });
}
