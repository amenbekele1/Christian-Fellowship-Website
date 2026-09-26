import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendPushToUser } from "@/lib/webpush";

const DELETED_SUFFIX = "@wetcf.deleted";

const bodySchema = z.object({
  userId: z.string().min(1).nullable(),
});

/**
 * PATCH — assign (or clear) the leader of a service team. Guardians only.
 *
 * Leadership lives on the team, so this never touches the person's account
 * role: a Worship leader stays a MEMBER everywhere else in the app.
 * Assigning someone also adds them to the team if they are not already in it.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "GUARDIAN") {
    return NextResponse.json(
      { error: "Only Guardians can assign team leaders" },
      { status: 403 }
    );
  }

  const team = await prisma.serviceTeam.findUnique({
    where: { id: params.teamId },
    select: { id: true, label: true, leaderId: true },
  });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const { userId } = bodySchema.parse(await req.json());

  // Clearing the leader
  if (userId === null) {
    await prisma.serviceTeam.update({
      where: { id: params.teamId },
      data: { leaderId: null },
    });
    return NextResponse.json({ ok: true, leaderId: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user || !user.isActive || user.email.endsWith(DELETED_SUFFIX)) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.serviceTeam.update({
      where: { id: params.teamId },
      data: { leaderId: userId },
    }),
    // A leader is always a member of their own team
    prisma.userServiceTeam.upsert({
      where: { userId_teamId: { userId, teamId: params.teamId } },
      create: { userId, teamId: params.teamId },
      update: {},
    }),
  ]);

  if (team.leaderId !== userId) {
    sendPushToUser(userId, {
      title: `You now lead the ${team.label} team`,
      body: "You can add members, share files and start meetings.",
      url: `/dashboard/teams/${params.teamId}/members`,
      topic: "teams",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, leaderId: userId });
}
