import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists
      return NextResponse.json(
        { message: "If an account exists with this email, a reset link has been sent" },
        { status: 200 }
      );
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

    return NextResponse.json(
      { message: "If an account exists with this email, a reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
