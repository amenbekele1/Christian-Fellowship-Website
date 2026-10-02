import { NextRequest, NextResponse } from "next/server";
import { sendEmail, esc } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`interest:${ip}`, 10, 60 * 60 * 1000)).allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const raw = await req.json();
    const name = String(raw.name ?? "").slice(0, 120);
    const email = String(raw.email ?? "").trim().slice(0, 200);
    const message = raw.message ? String(raw.message).slice(0, 5000) : "";
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Get all guardian emails to notify
    const guardians = await prisma.user.findMany({
      where: { role: "GUARDIAN", isActive: true },
      select: { email: true },
    });
    const guardianEmails = guardians.map(g => g.email);

    if (guardianEmails.length > 0) {
      await sendEmail({
        to: guardianEmails,
        subject: `New Membership Interest — ${name.replace(/[\r\n]+/g, " ")}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2C1A0E; padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: white; margin: 0;">New Membership Interest</h2>
              <p style="color: #bbf7d0; margin: 4px 0 0;">Someone wants to join the fellowship</p>
            </div>
            <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${esc(name)}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #111827;"><a href="mailto:${encodeURIComponent(email)}" style="color: #C9A84C;">${esc(email)}</a></td></tr>
                ${message ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #111827; white-space: pre-wrap;">${esc(message)}</td></tr>` : ""}
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
