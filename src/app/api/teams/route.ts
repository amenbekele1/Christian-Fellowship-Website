import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

const createSchema = z.object({
  label: z.string().trim().min(2, "Name is too short").max(40),
  description: z.string().trim().max(200).optional().nullable(),
});

/** Turn a display label into a stable uppercase key: "Social Media" -> SOCIAL_MEDIA */
function toTeamKey(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/** POST /api/teams — create a serving team. Guardians only. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Only Guardians can create teams" }, { status: 403 });
  }

  const data = createSchema.parse(await req.json());
  const name = toTeamKey(data.label);
  if (!name) {
    return NextResponse.json({ error: "Please use letters or numbers in the name" }, { status: 400 });
  }

  const clash = await prisma.serviceTeam.findUnique({ where: { name }, select: { id: true } });
  if (clash) {
    return NextResponse.json({ error: "A team with that name already exists" }, { status: 409 });
  }

  const team = await prisma.serviceTeam.create({
    data: { name, label: data.label.trim(), description: data.description?.trim() || null },
    select: { id: true, name: true, label: true },
  });

  return NextResponse.json(team, { status: 201 });
}
