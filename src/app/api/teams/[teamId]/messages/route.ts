import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teamAuth, isTeamAuthError } from "@/lib/team-auth";
import { z } from "zod";
import { sendPushToTeam } from "@/lib/webpush";

const msgSchema = z
  .object({
    content: z.string().min(1).max(4000).optional(),
    fileUrl: z.string().url().optional(),
    fileName: z.string().optional(),
    fileType: z.string().optional(),
  })
  .refine((d) => d.content || d.fileUrl, {
    message: "Message must have content or a file attachment",
  });

/** BigInt seq -> number (safe at this scale) */
function serializeMsg(msg: any) {
  return { ...msg, seq: Number(msg.seq) };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;

  const after = BigInt(req.nextUrl.searchParams.get("after") ?? "0");

  const messages = await prisma.groupMessage.findMany({
    where: { teamId: params.teamId, seq: { gt: after } },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { seq: "asc" },
    take: 50,
  });

  const serialized = messages.map(serializeMsg);
  const latestSeq =
    serialized.length > 0 ? serialized[serialized.length - 1].seq : Number(after);

  return NextResponse.json({ messages: serialized, latestSeq });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;

  const body = await req.json();
  const data = msgSchema.parse(body);

  const message = await prisma.groupMessage.create({
    data: {
      teamId: params.teamId,
      senderId: auth.userId,
      content: data.content,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      isAnnouncement: auth.isLeader,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  const preview = data.content
    ? data.content.slice(0, 120)
    : data.fileName
      ? `Attachment: ${data.fileName}`
      : "Attachment";

  sendPushToTeam(
    params.teamId,
    {
      title: `${message.sender.name} · ${auth.team.label}`,
      body: preview,
      url: `/dashboard/teams/${params.teamId}/chat`,
      topic: "team-messages",
    },
    auth.userId
  ).catch(() => {});

  return NextResponse.json(serializeMsg(message), { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;

  const msgId = req.nextUrl.searchParams.get("msgId");
  if (!msgId) return NextResponse.json({ error: "msgId required" }, { status: 400 });

  const msg = await prisma.groupMessage.findUnique({ where: { id: msgId } });
  if (!msg || msg.teamId !== params.teamId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Only the sender or the team leader may delete
  if (msg.senderId !== auth.userId && !auth.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupMessage.delete({ where: { id: msgId } });
  return NextResponse.json({ ok: true });
}
