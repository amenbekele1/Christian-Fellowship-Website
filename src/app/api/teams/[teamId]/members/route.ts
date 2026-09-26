import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teamAuth, isTeamAuthError } from "@/lib/team-auth";
import { z } from "zod";
import { sendPushToUser } from "@/lib/webpush";

const DELETED_SUFFIX = "@wetcf.deleted";

/** GET — list team members (any team member may view the roster). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;

  const rows = await prisma.userServiceTeam.findMany({
    where: { teamId: params.teamId },
    select: {
      assignedAt: true,
      user: { select: { id: true, name: true, email: true, phone: true, image: true } },
    },
    orderBy: { assignedAt: "asc" },
  });

  const members = rows
    .filter((r) => !r.user.email.endsWith(DELETED_SUFFIX))
    .map((r) => ({ ...r.user, assignedAt: r.assignedAt, isLeader: r.user.id === auth.team.leaderId }));

  return NextResponse.json({ members, leaderId: auth.team.leaderId });
}

/** POST — add an existing fellowship member to the team. Leader only. */
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;
  if (!auth.isLeader) {
    return NextResponse.json({ error: "Only the team leader can add members" }, { status: 403 });
  }

  const { userId } = z.object({ userId: z.string().min(1) }).parse(await req.json());

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user || !user.isActive || user.email.endsWith(DELETED_SUFFIX)) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.userServiceTeam.upsert({
    where: { userId_teamId: { userId, teamId: params.teamId } },
    create: { userId, teamId: params.teamId },
    update: {},
  });

  sendPushToUser(userId, {
    title: `You joined the ${auth.team.label} team`,
    body: "Open the team to see chat, files and meetings.",
    url: `/dashboard/teams/${params.teamId}`,
    topic: "teams",
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}

/** DELETE — remove a member from the team. Leader only. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;
  if (!auth.isLeader) {
    return NextResponse.json({ error: "Only the team leader can remove members" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // The assigned leader cannot be removed from their own team — a Guardian
  // must reassign leadership first.
  if (userId === auth.team.leaderId) {
    return NextResponse.json(
      { error: "This member leads the team. A Guardian must reassign leadership first." },
      { status: 400 }
    );
  }

  await prisma.userServiceTeam.deleteMany({
    where: { userId, teamId: params.teamId },
  });

  return NextResponse.json({ ok: true });
}
