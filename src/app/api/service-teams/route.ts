import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/service-teams — list all teams with their members (Guardian only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teams = await prisma.serviceTeam.findMany({
    orderBy: { name: "asc" },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });

  return NextResponse.json(teams);
}

// POST /api/service-teams — assign or remove a user from a team (Guardian only)
const assignSchema = z.object({
  action: z.enum(["assign", "remove"]),
  userId: z.string(),
  teamName: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, userId, teamName } = assignSchema.parse(body);

  const team = await prisma.serviceTeam.findUnique({ where: { name: teamName } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  if (action === "assign") {
    await prisma.userServiceTeam.upsert({
      where: { userId_teamId: { userId, teamId: team.id } },
      update: {},
      create: { userId, teamId: team.id },
    });
    return NextResponse.json({ message: "Member assigned to team" });
  } else {
    await prisma.userServiceTeam.deleteMany({
      where: { userId, teamId: team.id },
    });
    return NextResponse.json({ message: "Member removed from team" });
  }
}
