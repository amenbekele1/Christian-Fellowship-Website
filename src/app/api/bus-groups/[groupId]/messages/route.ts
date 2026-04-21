import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupAuth, isAuthError } from "@/lib/group-auth";
import { z } from "zod";
import { sendPushToBusGroup } from "@/lib/webpush";

const msgSchema = z.object({
  content: z.string().min(1).max(4000).optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
}).refine((d) => d.content || d.fileUrl, {
  message: "Message must have content or a file attachment",
});

/** Safely convert BigInt seq to number (safe for message counts in a church app) */
function serializeMsg(msg: any) {
  return { ...msg, seq: Number(msg.seq) };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const after = BigInt(req.nextUrl.searchParams.get("after") ?? "0");

  const messages = await prisma.groupMessage.findMany({
    where: { busGroupId: params.groupId, seq: { gt: after } },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { seq: "asc" },
    take: 50,
  });

  const serialized = messages.map(serializeMsg);
  const latestSeq = serialized.length > 0 ? serialized[serialized.length - 1].seq : Number(after);

  return NextResponse.json({ messages: serialized, latestSeq });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const data = msgSchema.parse(body);

  const message = await prisma.groupMessage.create({
    data: {
      busGroupId: params.groupId,
      senderId: auth.userId,
      content: data.content,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      isAnnouncement: auth.isLeader,
    },
    include: {
      sender:   { select: { id: true, name: true } },
      busGroup: { select: { name: true } },
    },
  });

  // Fire push + refresh to group members except sender (non-blocking)
  const preview = data.content
    ? data.content.slice(0, 120)
    : data.fileName
      ? `📎 ${data.fileName}`
      : "Attachment";
  sendPushToBusGroup(
    params.groupId,
    {
      title: `${message.sender.name} · ${message.busGroup.name}`,
      body:  preview,
      url:   `/dashboard/bus-groups/${params.groupId}/chat`,
      topic: "group-messages",
    },
    auth.userId
  ).catch(() => {});

  return NextResponse.json(serializeMsg(message), { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const msgId = req.nextUrl.searchParams.get("msgId");
  if (!msgId) return NextResponse.json({ error: "msgId required" }, { status: 400 });

  // Only sender or leader can delete
  const msg = await prisma.groupMessage.findUnique({ where: { id: msgId } });
  if (!msg || msg.busGroupId !== params.groupId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (msg.senderId !== auth.userId && !auth.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupMessage.delete({ where: { id: msgId } });
  return NextResponse.json({ ok: true });
}
