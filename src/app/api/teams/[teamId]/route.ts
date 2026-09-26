import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireGuardian() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

const patchSchema = z.object({
  label: z.string().trim().min(2).max(40).optional(),
  description: z.string().trim().max(200).optional().nullable(),
});

/** PATCH — rename a team or change its description. Guardians only. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const denied = await requireGuardian();
  if (denied) return denied;

  const data = patchSchema.parse(await req.json());

  const team = await prisma.serviceTeam.update({
    where: { id: params.teamId },
    data: {
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
    },
    select: { id: true, name: true, label: true, description: true },
  });

  return NextResponse.json(team);
}

/**
 * DELETE — remove a team, but only once it is empty.
 *
 * Deleting a team cascades to its chat history and memberships, so this
 * refuses while anyone is still on it. The Guardian must clear the roster
 * first, which makes the consequence visible rather than silent.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const denied = await requireGuardian();
  if (denied) return denied;

  const team = await prisma.serviceTeam.findUnique({
    where: { id: params.teamId },
    select: {
      label: true,
      _count: { select: { members: true, messages: true } },
    },
  });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  if (team._count.members > 0) {
    return NextResponse.json(
      {
        error: `${team.label} still has ${team._count.members} member${
          team._count.members === 1 ? "" : "s"
        }. Remove them first.`,
      },
      { status: 400 }
    );
  }

  if (team._count.messages > 0) {
    return NextResponse.json(
      {
        error: `${team.label} has chat history that would be permanently deleted. Contact your developer if you are sure.`,
      },
      { status: 400 }
    );
  }

  await prisma.serviceTeam.delete({ where: { id: params.teamId } });
  return NextResponse.json({ ok: true });
}
