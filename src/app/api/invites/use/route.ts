import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const useInviteSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token } = useInviteSchema.parse(body);

  const inviteToken = await prisma.inviteToken.findUnique({
    where: { token },
  });

  if (!inviteToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (inviteToken.used) {
    return NextResponse.json({ error: "Token already used" }, { status: 400 });
  }

  const now = new Date();
  if (inviteToken.expiresAt < now) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  // Mark token as used
  await prisma.inviteToken.update({
    where: { token },
    data: { used: true, usedAt: now },
  });

  return NextResponse.json({ message: "Token used" });
}
