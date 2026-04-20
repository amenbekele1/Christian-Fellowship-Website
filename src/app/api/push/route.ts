import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth:   z.string(),
  }),
});

// GET — check if the current user has an active subscription
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ subscribed: false });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    const count = await prisma.pushSubscription.count({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ subscribed: count > 0 });
  }

  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  return NextResponse.json({ subscribed: !!sub });
}

// POST — save a new push subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = subSchema.parse(body);

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — remove a push subscription
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
