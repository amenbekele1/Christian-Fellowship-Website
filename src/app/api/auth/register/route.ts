import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, welcomeEmail, newMemberNotificationEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and a number"),
  phone: z.string().optional(),
  inviteToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registration attempts per IP per 15 minutes
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, inviteToken } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
      },
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: "Welcome to Warsaw Ethiopian Christian Fellowship!",
      html: welcomeEmail(name),
    }).catch(console.error);

    // Send notification to all Guardians (non-blocking)
    try {
      const guardians = await prisma.user.findMany({
        where: { role: "GUARDIAN" },
        select: { id: true, name: true, email: true },
      });

      if (guardians.length > 0) {
        const registrationDate = formatDate(new Date());

        for (const guardian of guardians) {
          sendEmail({
            to: guardian.email,
            subject: `New Member Registration — ${name}`,
            html: newMemberNotificationEmail(guardian.name, name, email, registrationDate),
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error("Failed to send guardian notifications:", err);
    }

    return NextResponse.json({
      message: "Account created successfully",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
