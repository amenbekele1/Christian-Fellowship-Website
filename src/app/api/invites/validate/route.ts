import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const inviteToken = await prisma.inviteToken.findUnique({
    where: { token },
  });

  if (!inviteToken) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  if (inviteToken.used) {
    return NextResponse.json({ error: "Invite token already used" }, { status: 400 });
  }

  const now = new Date();
  if (inviteToken.expiresAt < now) {
    return NextResponse.json({ error: "Invite token has expired" }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
