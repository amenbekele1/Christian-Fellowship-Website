import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teams
 *   ?mine=1  -> only teams the caller belongs to or leads
 *   (default) -> all teams, with member counts (Guardians only)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const isGuardian = session.user.role === "GUARDIAN";

  if (!mine && !isGuardian) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teams = await prisma.serviceTeam.findMany({
    where: mine
      ? { OR: [{ leaderId: userId }, { members: { some: { userId } } }] }
      : undefined,
    select: {
      id: true,
      name: true,
      label: true,
      description: true,
      leaderId: true,
      leader: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { label: "asc" },
  });

  return NextResponse.json(
    teams.map((t) => ({
      id: t.id,
      name: t.name,
      label: t.label,
      description: t.description,
      leaderId: t.leaderId,
      leaderName: t.leader?.name ?? null,
      memberCount: t._count.members,
      isLeader: t.leaderId === userId || isGuardian,
    }))
  );
}
