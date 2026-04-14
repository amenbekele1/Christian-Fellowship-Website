import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface GroupAuthResult {
  session: Awaited<ReturnType<typeof getServerSession>>;
  group: { id: string; name: string; leaderId: string };
  isLeader: boolean;
  userId: string;
}

/** Shared auth check for all /api/bus-groups/[groupId]/* routes. */
export async function groupAuth(
  groupId: string
): Promise<GroupAuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.bUSGroup.findUnique({
    where: { id: groupId },
    select: { id: true, name: true, leaderId: true },
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const userId = session.user.id;
  const isLeader =
    group.leaderId === userId || session.user.role === "GUARDIAN";

  if (!isLeader && session.user.role !== "GUARDIAN") {
    // Regular member — verify they belong to this group
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { busGroupId: true },
    });
    if (user?.busGroupId !== groupId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { session, group, isLeader, userId };
}

export function isAuthError(
  result: GroupAuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
