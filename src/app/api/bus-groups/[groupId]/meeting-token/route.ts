import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { groupAuth, isAuthError } from "@/lib/group-auth";

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

    return NextResponse.json({ token, roomName, appId });
  } catch (err: any) {
    console.error("JaaS token error:", err);
    return NextResponse.json({ error: "Failed to generate meeting token" }, { status: 500 });
  }
}
