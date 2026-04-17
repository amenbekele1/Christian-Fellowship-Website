import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Rate limiter: 10 attempts per IP per hour
const rateMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and a number"),
  confirmPassword: z.string().min(10),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: "Reset link has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
