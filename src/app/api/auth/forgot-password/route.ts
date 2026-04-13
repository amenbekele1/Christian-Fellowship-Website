import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const SAFE_RESPONSE = { message: "If an account exists with this email, a reset link has been sent" };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Rate limit: 3 requests per email per 15 min (DB-based, works across instances)
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });
    if (recentTokens >= 3) {
      return NextResponse.json(SAFE_RESPONSE, { status: 200 });
    }

    // IP-based rate limit: 10 requests per IP per 15 min
    const ip = getClientIp(req);
    const rl = checkRateLimit(`forgot-pwd:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(SAFE_RESPONSE, { status: 200 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(SAFE_RESPONSE, { status: 200 });
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your password - Warsaw Ethiopian Christian Fellowship",
      html: passwordResetEmail(user.name, resetUrl),
    });

    return NextResponse.json(SAFE_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
