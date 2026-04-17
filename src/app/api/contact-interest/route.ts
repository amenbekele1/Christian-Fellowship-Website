import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Rate limiter: 10 submissions per IP per hour
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

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { name, email, message } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Get all guardian emails to notify
    const guardians = await prisma.user.findMany({
      where: { role: "GUARDIAN" },
      select: { email: true },
    });
    const guardianEmails = guardians.map(g => g.email);

    if (guardianEmails.length > 0) {
      await sendEmail({
        to: guardianEmails,
        subject: `New Membership Interest — ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2C1A0E; padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: white; margin: 0;">New Membership Interest</h2>
              <p style="color: #bbf7d0; margin: 4px 0 0;">Someone wants to join the fellowship</p>
            </div>
            <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${name}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}" style="color: #C9A84C;">${email}</a></td></tr>
                ${message ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #111827;">${message}</td></tr>` : ""}
              </table>
              <div style="margin-top: 20px; padding: 16px; background: #dcfce7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #2C1A0E;">
                  Send them an invite link from the <strong>Invites</strong> section of the dashboard to let them register.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact interest error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
