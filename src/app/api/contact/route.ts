import { NextRequest, NextResponse } from "next/server";
import { sendEmail, esc } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { TIME_ZONE } from "@/lib/timezone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`contact:${ip}`, 10, 60 * 60 * 1000)).allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const name = String(raw.name ?? "").slice(0, 120);
    const email = String(raw.email ?? "").trim().slice(0, 200);
    const subject = String(raw.subject ?? "").replace(/[\r\n]+/g, " ").slice(0, 200);
    const message = String(raw.message ?? "").slice(0, 5000);

    // Validation
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Get all Leaders (GUARDIAN role) emails
    const leaders = await prisma.user.findMany({
      where: { role: "GUARDIAN", isActive: true },
      select: { email: true, name: true },
    });

    const leaderEmails = leaders.map((l) => l.email);

    if (leaderEmails.length === 0) {
      return NextResponse.json(
        { error: "Unable to send message. Please try emailing info@wetcf.com directly." },
        { status: 500 }
      );
    }

    const sentAt = new Date().toLocaleString("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // Email to Leaders
    await sendEmail({
      to: leaderEmails,
      replyTo: { name: name.replace(/["<>\r\n]/g, ""), address: email },
      subject: `Contact Form: ${esc(subject)}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF7F0;">
          <!-- Header -->
          <div style="background: #1C0F07; padding: 28px 32px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #C9A84C;">
            <h2 style="color: #FAF7F0; margin: 0 0 4px; font-size: 20px;">New Contact Form Message</h2>
            <p style="color: #C9A84C; margin: 0; font-size: 13px;">Warsaw Ethiopian Christian Fellowship · wetcf.com</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 32px; background: #ffffff; border: 1px solid #e5d9c8; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px 0; color: #7A5C3E; font-size: 13px; width: 90px; vertical-align: top;">From</td>
                <td style="padding: 10px 0; color: #1C0F07; font-weight: 600; font-size: 14px;">${esc(name)}</td>
              </tr>
              <tr style="border-top: 1px solid #f0e6d6;">
                <td style="padding: 10px 0; color: #7A5C3E; font-size: 13px; vertical-align: top;">Email</td>
                <td style="padding: 10px 0; font-size: 14px;">
                  <a href="mailto:${encodeURIComponent(email)}" style="color: #C9A84C; text-decoration: none;">${esc(email)}</a>
                </td>
              </tr>
              <tr style="border-top: 1px solid #f0e6d6;">
                <td style="padding: 10px 0; color: #7A5C3E; font-size: 13px; vertical-align: top;">Subject</td>
                <td style="padding: 10px 0; color: #1C0F07; font-size: 14px; font-weight: 600;">${esc(subject)}</td>
              </tr>
              <tr style="border-top: 1px solid #f0e6d6;">
                <td style="padding: 10px 0; color: #7A5C3E; font-size: 13px; vertical-align: top;">Received</td>
                <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">${sentAt}</td>
              </tr>
            </table>

            <div style="background: #FAF7F0; border-left: 4px solid #C9A84C; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 6px; color: #7A5C3E; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
              <p style="margin: 0; color: #1C0F07; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${esc(message)}</p>
            </div>

            <a href="mailto:${encodeURIComponent(email)}?subject=Re: ${encodeURIComponent(subject)}"
              style="display: inline-block; background: #C9A84C; color: #1C0F07; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Reply to ${esc(name)} →
            </a>
          </div>

          <p style="text-align: center; color: #9A7B5C; font-size: 12px; margin-top: 16px;">
            This message was sent via the contact form at wetcf.com
          </p>
        </div>
      `,
    });

    // Auto-reply to sender
    await sendEmail({
      to: [email],
      subject: "We received your message — Warsaw Ethiopian Christian Fellowship",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF7F0;">
          <div style="background: #1C0F07; padding: 28px 32px; border-radius: 12px 12px 0 0; border-bottom: 3px solid #C9A84C;">
            <h2 style="color: #FAF7F0; margin: 0 0 4px; font-size: 20px;">Thank You, ${esc(name)}</h2>
            <p style="color: #C9A84C; margin: 0; font-size: 13px;">Warsaw Ethiopian Christian Fellowship</p>
          </div>
          <div style="padding: 28px 32px; background: #ffffff; border: 1px solid #e5d9c8; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #1C0F07; font-size: 15px; line-height: 1.8; margin-top: 0;">
              We have received your message and one of our leaders will get back to you as soon as possible.
            </p>
            <div style="background: #FAF7F0; border-left: 4px solid #C9A84C; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0;">
              <p style="margin: 0 0 4px; color: #7A5C3E; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your message</p>
              <p style="margin: 0; color: #5C3D20; font-size: 13px; font-style: italic; line-height: 1.6; white-space: pre-wrap;">${esc(message)}</p>
            </div>
            <p style="color: #7A5C3E; font-size: 14px; line-height: 1.8;">
              In the meantime, feel free to visit us on <strong>Saturdays at 18:00</strong> at
              Naddnieprzańska 7, Warsaw. All are welcome.
            </p>
            <p style="color: #9A7B5C; font-size: 13px; margin-bottom: 0;">
              Blessings,<br/>
              <strong style="color: #1C0F07;">Warsaw Ethiopian Christian Fellowship</strong><br/>
              <a href="https://wetcf.com" style="color: #C9A84C;">wetcf.com</a>
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
