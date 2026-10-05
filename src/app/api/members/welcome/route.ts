import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { parseWarsawDateTime } from "@/lib/timezone";

// Sends one at a time with a short pause, so allow up to a minute.
export const maxDuration = 60;

const schema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  /** true = only report who would get the email */
  preview: z.boolean().optional(),
  /** how many of the list earlier batches already handled */
  offset: z.number().int().min(0).optional(),
});

/**
 * POST — (re)send the welcome email to every active member who joined on or
 * after `since` (Warsaw date). Guardians only. Used to catch up on welcome
 * emails that Gmail refused during the launch rush.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const members = await prisma.user.findMany({
    where: {
      joinedAt: { gte: parseWarsawDateTime(`${parsed.data.since}T00:00`) },
      isActive: true,
      NOT: { email: { endsWith: "@wetcf.deleted" } },
    },
    select: { id: true, name: true, email: true },
    orderBy: { joinedAt: "asc" },
    take: 200,
  });

  if (parsed.data.preview) {
    return NextResponse.json({ count: members.length, names: members.map((m) => m.name) });
  }

  // Vercel stops a request after 60s; send in ~45s batches and let the
  // page call again with the new offset until done.
  const started = Date.now();
  const offset = parsed.data.offset ?? 0;
  let processed = offset;
  let sent = 0;
  const failed: string[] = [];
  for (const m of members.slice(offset)) {
    if (Date.now() - started > 45_000) break;
    const result = await sendEmail({
      to: m.email,
      subject: "Welcome to Warsaw Ethiopian Christian Fellowship!",
      html: welcomeEmail(m.name),
    });
    if (result.success) sent++;
    else failed.push(m.name);
    processed++;
    // Gentle pace: Gmail throttles accounts that send in tight bursts.
    await new Promise((r) => setTimeout(r, 400));
  }

  return NextResponse.json({
    count: members.length,
    processed,
    sent,
    failed,
    done: processed >= members.length,
  });
}
