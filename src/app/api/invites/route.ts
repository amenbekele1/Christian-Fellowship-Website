import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail, inviteEmail } from "@/lib/email";
import { endOfWarsawDay, warsawDateKey } from "@/lib/timezone";

const MAX_DAYS = 366;
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-12-31");

const generateInviteSchema = z.object({
  email: z.string().email().optional(),
  // Last day the link works (Warsaw calendar, valid through 23:59).
  // Omitted -> 48 hours from now.
  expiresOn: dateKey.optional(),
});

const updateInviteSchema = z.object({ expiresOn: dateKey });

/** End of the given Warsaw day, or an error message if it is not usable. */
function resolveExpiry(expiresOn: string): Date | string {
  if (expiresOn < warsawDateKey()) return "The expiry date can't be in the past.";
  const expiresAt = endOfWarsawDay(expiresOn);
  if (expiresAt.getTime() - Date.now() > MAX_DAYS * 24 * 60 * 60 * 1000) {
    return "Invites can last at most one year.";
  }
  return expiresAt;
}

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
  const parsed = generateInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { email, expiresOn } = parsed.data;

  let expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  if (expiresOn) {
    const resolved = resolveExpiry(expiresOn);
    if (typeof resolved === "string") return NextResponse.json({ error: resolved }, { status: 400 });
    expiresAt = resolved;
  }

  // Generate random token
  const token = crypto.randomUUID();

  const inviteToken = await prisma.inviteToken.create({
    data: {
      token,
      email: email || null,
      expiresAt,
      createdById: session.user.id,
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/register?invite=${token}`;

  // Send email if recipient address was provided
  let emailSent = false;
  let emailError: string | undefined;
  if (email) {
    const result = await sendEmail({
      to: email,
      subject: "You're invited to join Warsaw Ethiopian Christian Fellowship",
      html: inviteEmail(inviteUrl, session.user.name ?? "A fellowship guardian"),
    });
    emailSent = result.success;
    if (!result.success) {
      emailError = String((result as any).error ?? "Email send failed");
      console.error("Invite email error:", emailError);
    }
  }

  return NextResponse.json({ inviteToken, inviteUrl, emailSent, emailError }, { status: 201 });
}

/** PATCH ?id= — change how long an existing invite stays valid. */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const parsed = updateInviteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const resolved = resolveExpiry(parsed.data.expiresOn);
  if (typeof resolved === "string") return NextResponse.json({ error: resolved }, { status: 400 });

  const updated = await prisma.inviteToken.update({ where: { id }, data: { expiresAt: resolved } });
  return NextResponse.json(updated);
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
