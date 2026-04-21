import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { groupAuth, isAuthError } from "@/lib/group-auth";
import { prisma } from "@/lib/prisma";
import { sendPushToBusGroup } from "@/lib/webpush";

const MEETING_PING_DEBOUNCE_MS = 15 * 60 * 1000; // don't re-notify within 15 min

async function notifyMeetingStartedIfFirst(groupId: string, starterUserId: string) {
  const group = await prisma.bUSGroup.findUnique({
    where: { id: groupId },
    select: { name: true, lastMeetingPingAt: true },
  });
  if (!group) return;

  const now = new Date();
  if (
    group.lastMeetingPingAt &&
    now.getTime() - group.lastMeetingPingAt.getTime() < MEETING_PING_DEBOUNCE_MS
  ) {
    return; // someone already notified recently
  }

  // Claim the ping window atomically-ish (best-effort)
  await prisma.bUSGroup.update({
    where: { id: groupId },
    data:  { lastMeetingPingAt: now },
  });

  await sendPushToBusGroup(
    groupId,
    {
      title: `📹 ${group.name} meeting is live`,
      body:  "Tap to join the video chat.",
      url:   `/dashboard/bus-groups/${groupId}/meeting`,
      topic: "group-meeting",
    },
    starterUserId
  ).catch(() => {});
}

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const appId    = process.env.JAAS_APP_ID;
  const keyId    = process.env.JAAS_KEY_ID;
  const pemKey   = process.env.JAAS_PRIVATE_KEY;

  if (!appId || !keyId || !pemKey) {
    return NextResponse.json(
      { error: "JaaS not configured — add JAAS_APP_ID, JAAS_KEY_ID, JAAS_PRIVATE_KEY to env" },
      { status: 503 }
    );
  }

  // Room name must match what the meeting page uses
  const roomName = `wecf-bus-${params.groupId.replace(/[^a-z0-9]/gi, "")}`;

  try {
    const privateKey = await importPKCS8(pemKey, "RS256");

    const token = await new SignJWT({
      context: {
        user: {
          id:        auth.userId,
          name:      auth.session.user.name ?? "Member",
          email:     auth.session.user.email ?? "",
          moderator: auth.isLeader,  // BUS leader = Jitsi moderator
          avatar:    "",
        },
        features: {
          livestreaming:  false,
          recording:      false,
          transcription:  false,
          "outbound-call": false,
        },
      },
      // room: "*" allows any room; use specific room to lock token to this room only
      room: roomName,
    })
      .setProtectedHeader({ alg: "RS256", kid: keyId, typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .setNotBefore("-10 seconds")
      .setIssuer("chat")
      .setAudience("jitsi")
      .setSubject(appId)
      .sign(privateKey);

    // Fire-and-forget: if this is the first token issued for this group in a while,
    // notify the rest of the group that a meeting has started.
    notifyMeetingStartedIfFirst(params.groupId, auth.userId).catch(() => {});

    return NextResponse.json({ token, roomName, appId });
  } catch (err: any) {
    console.error("JaaS token error:", err);
    return NextResponse.json({ error: "Failed to generate meeting token" }, { status: 500 });
  }
}
