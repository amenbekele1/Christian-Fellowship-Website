import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teamAuth, isTeamAuthError } from "@/lib/team-auth";
import { randomBytes } from "crypto";

const INVITE_TTL_DAYS = 30;

function baseUrl(req: NextRequest): string {
  return (
    process.env.NEXTAUTH_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`
  );
}

/**
 * POST — team leader creates a shareable join link.
 * Reuses the team's existing active link if one is still valid, so
 * repeated clicks don't pile up dead tokens.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;
  if (!auth.isLeader) {
    return NextResponse.json(
      { error: "Only the team leader can create a join link" },
      { status: 403 }
    );
  }

  const existing = await prisma.teamInviteToken.findFirst({
    where: { teamId: params.teamId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  const token = existing?.token ?? randomBytes(24).toString("hex");

  if (!existing) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);
    await prisma.teamInviteToken.create({
      data: { token, teamId: params.teamId, createdById: auth.userId, expiresAt },
    });
  }

  return NextResponse.json({
    url: `${baseUrl(req)}/teams/join/${token}`,
    expiresAt: existing?.expiresAt ?? null,
  });
}

/** DELETE — revoke the team's active join link. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;
  if (!auth.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.teamInviteToken.updateMany({
    where: { teamId: params.teamId, isActive: true },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
