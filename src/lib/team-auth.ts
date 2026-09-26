import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export interface TeamAuthResult {
  session: Session;
  team: { id: string; name: string; label: string; leaderId: string | null };
  /** Team leader or Guardian — may moderate, invite and remove members. */
  isLeader: boolean;
  userId: string;
}

/**
 * Shared auth check for all /api/teams/[teamId]/* routes.
 *
 * Access is granted to Guardians, the team's assigned leader, and any
 * member of the team. Everyone else gets 403.
 */
export async function teamAuth(
  teamId: string
): Promise<TeamAuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.serviceTeam.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, label: true, leaderId: true },
  });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const userId = session.user.id;
  const isGuardian = session.user.role === "GUARDIAN";
  const isLeader = isGuardian || team.leaderId === userId;

  if (!isLeader) {
    const membership = await prisma.userServiceTeam.findUnique({
      where: { userId_teamId: { userId, teamId } },
      select: { userId: true },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { session, team, isLeader, userId };
}

export function isTeamAuthError(
  result: TeamAuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
