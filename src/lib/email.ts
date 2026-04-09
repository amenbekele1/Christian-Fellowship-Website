import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Warsaw Ethiopian Christian Fellowship <noreply@wecf.org>",
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export function absenceNotificationEmail(
  leaderName: string,
  memberName: string,
  date: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; background: #f9f6f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #14532d, #166534); padding: 40px; text-align: center; }
        .header h1 { color: #fde047; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header p { color: #bbf7d0; margin: 8px 0 0; font-size: 14px; }
        .cross { font-size: 40px; margin-bottom: 12px; display: block; }
        .body { padding: 40px; }
        .body h2 { color: #166534; font-size: 20px; margin-top: 0; }
        .body p { color: #374151; line-height: 1.7; }
        .highlight { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .highlight strong { color: #14532d; }
        .verse { background: #fefce8; border: 1px solid #fde047; padding: 20px; border-radius: 8px; margin: 24px 0; font-style: italic; color: #713f12; text-align: center; }
        .footer { background: #f0fdf4; padding: 24px 40px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #dcfce7; }
        .footer strong { color: #14532d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="cross">✝</span>
          <h1>Warsaw Ethiopian Christian Fellowship</h1>
          <p>Member Attendance Notification</p>
        </div>
        <div class="body">
          <h2>Dear ${leaderName},</h2>
          <p>This is an automated notification from the fellowship attendance system.</p>
          <div class="highlight">
            <p style="margin:0"><strong>${memberName}</strong> was marked <strong>absent</strong> from the fellowship gathering on <strong>${date}</strong>.</p>
          </div>
          <p>As their BUS group leader, we kindly ask you to reach out to ${memberName} to check on their wellbeing and encourage their continued participation in our fellowship community.</p>
          <div class="verse">
            <p style="margin:0">"And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together..."</p>
            <p style="margin:8px 0 0; font-weight: bold; font-style: normal;">— Hebrews 10:24-25 (NIV)</p>
          </div>
          <p>Thank you for your dedication to shepherding your group members. Your pastoral care makes a real difference in our community.</p>
          <p>In His service,<br><strong>Warsaw Ethiopian Christian Fellowship</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p><strong>Warsaw Ethiopian Christian Fellowship</strong> · Warsaw, Poland</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function bookReminderEmail(
  memberName: string,
  bookTitle: string,
  dueDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; background: #f9f6f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #14532d, #166534); padding: 40px; text-align: center; }
        .header h1 { color: #fde047; margin: 0; font-size: 22px; }
        .header p { color: #bbf7d0; margin: 8px 0 0; font-size: 14px; }
        .cross { font-size: 40px; margin-bottom: 12px; display: block; }
        .body { padding: 40px; }
        .body h2 { color: #166534; font-size: 20px; margin-top: 0; }
        .body p { color: #374151; line-height: 1.7; }
        .book-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .book-card strong { color: #14532d; font-size: 18px; }
        .due-date { background: #fefce8; border: 2px solid #fde047; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; }
        .due-date strong { color: #713f12; font-size: 20px; display: block; margin-top: 4px; }
        .footer { background: #f0fdf4; padding: 24px 40px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #dcfce7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="cross">📚</span>
          <h1>Warsaw Ethiopian Christian Fellowship</h1>
          <p>Library Book Return Reminder</p>
        </div>
        <div class="body">
          <h2>Dear ${memberName},</h2>
          <p>This is a friendly reminder that a library book you borrowed is due soon.</p>
          <div class="book-card">
            <p style="margin:0; color:#6b7280; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Book Title</p>
            <strong>${bookTitle}</strong>
          </div>
          <div class="due-date">
            <p style="margin:0; color:#6b7280; font-size:13px;">Return Due Date</p>
            <strong>${dueDate}</strong>
          </div>
          <p>Please return the book during <strong>Saturday service</strong> at the fellowship hall. If you need more time, please contact a fellowship guardian.</p>
          <p>Thank you for using our library and helping keep books available for all members.</p>
          <p>In His service,<br><strong>Warsaw Ethiopian Christian Fellowship Library</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p><strong>Warsaw Ethiopian Christian Fellowship</strong> · Warsaw, Poland</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function passwordResetEmail(
  name: string,
  resetUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; background: #f9f6f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #14532d, #166534); padding: 40px; text-align: center; }
        .header h1 { color: #fde047; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header p { color: #bbf7d0; margin: 8px 0 0; font-size: 14px; }
        .cross { font-size: 40px; margin-bottom: 12px; display: block; }
        .body { padding: 40px; }
        .body h2 { color: #166534; font-size: 20px; margin-top: 0; }
        .body p { color: #374151; line-height: 1.7; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { background: #166534; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; display: inline-block; }
        .warning { background: #fefce8; border: 1px solid #fde047; padding: 16px 20px; border-radius: 8px; margin: 20px 0; color: #713f12; font-size: 13px; line-height: 1.6; }
        .footer { background: #f0fdf4; padding: 24px 40px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #dcfce7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="cross">✝</span>
          <h1>Warsaw Ethiopian Christian Fellowship</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="body">
          <h2>Dear ${name},</h2>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <div class="cta">
            <a href="${resetUrl}">Reset Your Password</a>
          </div>
          <div class="warning">
            <strong>Security Note:</strong> This link will expire in 1 hour. If the link has expired, you can request a new password reset from the login page.
          </div>
          <p>If you have any questions or concerns, please contact a fellowship guardian.</p>
          <p>In His service,<br><strong>Warsaw Ethiopian Christian Fellowship</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p><strong>Warsaw Ethiopian Christian Fellowship</strong> · Warsaw, Poland</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function welcomeEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; background: #f9f6f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #14532d, #166534); padding: 40px; text-align: center; }
        .header h1 { color: #fde047; margin: 0; font-size: 24px; }
        .header p { color: #bbf7d0; margin: 8px 0 0; font-size: 15px; }
        .cross { font-size: 48px; margin-bottom: 12px; display: block; }
        .body { padding: 40px; }
        .body h2 { color: #166534; font-size: 22px; margin-top: 0; }
        .body p { color: #374151; line-height: 1.7; }
        .verse { background: #fefce8; border: 1px solid #fde047; padding: 20px; border-radius: 8px; margin: 24px 0; font-style: italic; color: #713f12; text-align: center; }
        .features { display: grid; gap: 12px; margin: 20px 0; }
        .feature { background: #f0fdf4; padding: 12px 16px; border-radius: 8px; color: #166534; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { background: #166534; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; display: inline-block; }
        .footer { background: #f0fdf4; padding: 24px 40px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #dcfce7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="cross">✝</span>
          <h1>Warsaw Ethiopian Christian Fellowship</h1>
          <p>Welcome to the Family!</p>
        </div>
        <div class="body">
          <h2>Dear ${name},</h2>
          <p>Welcome to the Warsaw Ethiopian Christian Fellowship! We are so glad you have joined our community. You are now part of a family that worships, grows, and serves together.</p>
          <div class="verse">
            <p style="margin:0">"And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another..."</p>
            <p style="margin:8px 0 0; font-weight: bold; font-style: normal;">— Hebrews 10:24-25 (NIV)</p>
          </div>
          <p>With your new member account, you can:</p>
          <div class="features">
            <div class="feature">📋 Access the member dashboard and announcements</div>
            <div class="feature">📚 Browse and reserve books from our library</div>
            <div class="feature">📅 View upcoming events and programs</div>
            <div class="feature">👥 Connect with your BUS group</div>
          </div>
          <div class="cta">
            <a href="${process.env.NEXTAUTH_URL}/dashboard">Go to My Dashboard →</a>
          </div>
          <p>If you have any questions, please speak with a guardian or leader during service.</p>
          <p>God bless you,<br><strong>Warsaw Ethiopian Christian Fellowship</strong></p>
        </div>
        <div class="footer">
          <p><strong>Warsaw Ethiopian Christian Fellowship</strong> · Warsaw, Poland</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
