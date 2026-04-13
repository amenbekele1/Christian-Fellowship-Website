import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail, inviteEmail } from "@/lib/email";

const generateInviteSchema = z.object({
  email: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const tokens = await prisma.inviteToken.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const enriched = tokens.map((token: any) => ({
    ...token,
    isExpired: token.expiresAt < now,
    status: token.used ? "Used" : token.expiresAt < now ? "Expired" : "Valid",
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { email } = generateInviteSchema.parse(body);

  // Generate random token
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const inviteToken = await prisma.inviteToken.create({
    data: {
      token,
      email: email || null,
      expiresAt,
      createdById: session.user.id,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?invite=${token}`;

  // Send email if recipient address was provided
  if (email) {
    sendEmail({
      to: email,
      subject: "You're invited to join Warsaw Ethiopian Christian Fellowship",
      html: inviteEmail(inviteUrl, session.user.name ?? "A fellowship guardian"),
    }).catch(console.error);
  }

  return NextResponse.json({ inviteToken, inviteUrl }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.inviteToken.delete({ where: { id } });
  return NextResponse.json({ message: "Invite token deleted" });
}
