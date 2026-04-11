import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
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
            <div style="background: #166534; padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: white; margin: 0;">New Membership Interest</h2>
              <p style="color: #bbf7d0; margin: 4px 0 0;">Someone wants to join the fellowship</p>
            </div>
            <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${name}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></td></tr>
                ${message ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #111827;">${message}</td></tr>` : ""}
              </table>
              <div style="margin-top: 20px; padding: 16px; background: #dcfce7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #166534;">
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
