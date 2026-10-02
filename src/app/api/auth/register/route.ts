import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, welcomeEmail, newMemberNotificationEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().pipe(z.string().email("Invalid email address").max(200)),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(PASSWORD_REGEX, "Password must contain uppercase, lowercase, and a number"),
  phone: z.string().trim().min(6, "Phone number is required").max(40),
  inviteToken: z.string().min(1, "An invite link is required to register").max(200),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit per IP. Generous because a whole congregation may register
    // at once from the venue Wi-Fi (one shared IP) after scanning the QR code.
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`register:${ip}`, 40, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, inviteToken } = registerSchema.parse(body);

    // Block reserved deleted-account placeholder addresses
    if (email.endsWith("@wetcf.deleted")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Membership is by invitation: the token must exist, be enabled and unexpired.
    // Links are multi-use (one link can be shared with a family), so a valid
    // token is not consumed — a Guardian disables it from the Invites page.
    const invite = await prisma.inviteToken.findUnique({ where: { token: inviteToken } });
    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invite link is invalid or has expired. Please ask a leader for a new one." },
        { status: 403 }
      );
    }
    if (invite.email && invite.email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address." },
        { status: 403 }
      );
    }

    // Check for an existing active account with this email.
    // Soft-deleted accounts have their email anonymised to deleted_<id>@wetcf.deleted,
    // so their original email is freed up and they can re-register normally.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
        },
      }),
      prisma.inviteToken.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    ]);

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: "Welcome to Warsaw Ethiopian Christian Fellowship!",
      html: welcomeEmail(name),
    }).catch(console.error);

    // Send notification to all Guardians (non-blocking)
    try {
      const guardians = await prisma.user.findMany({
        where: { role: "GUARDIAN", isActive: true },
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
