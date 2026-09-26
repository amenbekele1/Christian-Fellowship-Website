import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teamAuth, isTeamAuthError } from "@/lib/team-auth";

const DELETED_SUFFIX = "@wetcf.deleted";

/**
 * GET /api/teams/[teamId]/candidates?q=...
 *
 * Narrow member lookup for team leaders building their roster.
 *
 * /api/members deliberately returns only the caller's own record to
 * MEMBER-role users, and most team leaders are regular members — so this
 * gives them just enough to find someone (name + email, capped at 8
 * results, minimum 2-character query) without opening up the full
 * member directory.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;
  if (!auth.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ candidates: [] });

  const candidates = await prisma.user.findMany({
    where: {
      isActive: true,
      NOT: { email: { endsWith: DELETED_SUFFIX } },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
      // exclude people already on this team
      serviceTeams: { none: { teamId: params.teamId } },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 8,
  });

  return NextResponse.json({ candidates });
}
