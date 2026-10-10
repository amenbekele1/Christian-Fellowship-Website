import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail, feedbackReceivedEmail, feedbackResolvedEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/webpush";
import { checkRateLimit } from "@/lib/rate-limit";
import { background } from "@/lib/background";

const FEEDBACK_INBOX = process.env.FEEDBACK_EMAIL || "info@wetcf.com";

const createSchema = z.object({
  message: z.string().trim().min(5, "Please tell us a little more").max(4000),
  category: z.enum(["bug", "idea", "other"]).optional(),
  pageUrl: z.string().max(500).optional(),
});

/**
 * GET — Guardians read the whole inbox (admin Feedback page); everyone else,
 * and anyone asking with ?mine=1 (the profile card), gets only their own.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const isGuardian = session.user.role === "GUARDIAN" && !mine;
  const status = req.nextUrl.searchParams.get("status");

  const items = await prisma.feedback.findMany({
    where: {
      ...(isGuardian ? {} : { userId: session.user.id }),
      ...(status && status !== "ALL" ? { status: status as any } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ items, isGuardian });
}

/** POST — a member sends feedback. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await checkRateLimit(`feedback:${session.user.id}`, 5, 60 * 60 * 1000)).allowed) {
    return NextResponse.json(
      { error: "You have sent several notes already. Please try again a little later." },
      { status: 429 }
    );
  }

  const data = createSchema.parse(await req.json());

  const item = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      message: data.message,
      category: data.category ?? "other",
      pageUrl: data.pageUrl ?? null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // Notify the fellowship inbox. Reply-to is the member so a Guardian can
  // simply hit reply. Non-blocking: the member's submission is already saved.
  background(sendEmail({
    to: FEEDBACK_INBOX,
    replyTo: item.user.email,
    subject: `Portal feedback from ${item.user.name}`,
    html: feedbackReceivedEmail(
      item.user.name,
      item.user.email,
      item.category,
      item.message,
      item.pageUrl
    ),
  }));

  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "FIXED", "DECLINED"]),
  adminNote: z.string().max(2000).optional().nullable(),
});

/**
 * PATCH — Guardian updates status. Moving to FIXED emails and pushes the
 * member, once only (guarded by `notified`).
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data = updateSchema.parse(await req.json());

  const existing = await prisma.feedback.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nowFixed = data.status === "FIXED";
  const shouldNotify = nowFixed && !existing.notified;

  const updated = await prisma.feedback.update({
    where: { id },
    data: {
      status: data.status,
      adminNote: data.adminNote ?? existing.adminNote,
      resolvedAt: nowFixed ? existing.resolvedAt ?? new Date() : null,
      notified: shouldNotify ? true : existing.notified,
    },
  });

  if (shouldNotify) {
    background(sendEmail({
      to: existing.user.email,
      subject: "Your feedback has been sorted — thank you",
      html: feedbackResolvedEmail(
        existing.user.name,
        existing.message,
        data.adminNote ?? existing.adminNote
      ),
    }));

    background(sendPushToUser(existing.user.id, {
      title: "Your feedback has been sorted",
      body: "Thank you for helping us improve the portal.",
      url: "/dashboard/profile",
      topic: "feedback",
    }));
  }

  return NextResponse.json({ ok: true, item: updated });
}
