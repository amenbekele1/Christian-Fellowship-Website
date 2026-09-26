import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { teamAuth, isTeamAuthError } from "@/lib/team-auth";
import { sendPushToTeam } from "@/lib/webpush";

/**
 * Issues a JaaS token for a team's video room.
 * Mirrors the BUS group meeting-token route; the team leader is moderator.
 */

// In-process debounce so the "meeting is live" push isn't spammed when
// several people join at once. Teams have no lastMeetingPingAt column.
const MEETING_PING_DEBOUNCE_MS = 15 * 60 * 1000;
const lastPingByTeam = new Map<string, number>();

function shouldNotify(teamId: string): boolean {
  const now = Date.now();
  const last = lastPingByTeam.get(teamId);
  if (last && now - last < MEETING_PING_DEBOUNCE_MS) return false;
  lastPingByTeam.set(teamId, now);
  return true;
}

export async function GET(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;

  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  const pemKey = process.env.JAAS_PRIVATE_KEY;

  if (!appId || !keyId || !pemKey) {
    return NextResponse.json(
      { error: "JaaS not configured — add JAAS_APP_ID, JAAS_KEY_ID, JAAS_PRIVATE_KEY to env" },
      { status: 503 }
    );
  }

  const roomName = `wecf-team-${params.teamId.replace(/[^a-z0-9]/gi, "")}`;

  try {
    const privateKey = await importPKCS8(pemKey, "RS256");

    const token = await new SignJWT({
      context: {
        user: {
          id: auth.userId,
          name: auth.session.user.name ?? "Member",
          email: auth.session.user.email ?? "",
          moderator: auth.isLeader, // team leader = Jitsi moderator
          avatar: "",
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          "outbound-call": false,
        },
      },
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

    if (shouldNotify(params.teamId)) {
      sendPushToTeam(
        params.teamId,
        {
          title: `${auth.team.label} meeting is live`,
          body: "Tap to join the video call.",
          url: `/dashboard/teams/${params.teamId}/meeting`,
          topic: "team-meeting",
        },
        auth.userId
      ).catch(() => {});
    }

    return NextResponse.json({ token, roomName, appId });
  } catch (err: any) {
    console.error("JaaS token error:", err);
    return NextResponse.json({ error: "Failed to generate meeting token" }, { status: 500 });
  }
}
