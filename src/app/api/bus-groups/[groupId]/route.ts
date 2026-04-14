import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupAuth, isAuthError } from "@/lib/group-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const auth = await groupAuth(params.groupId);
  if (isAuthError(auth)) return auth;

  const group = await prisma.bUSGroup.findUnique({
    where: { id: params.groupId },
    include: {
      leader: { select: { id: true, name: true, email: true, phone: true } },
      members: { select: { id: true, name: true, email: true, phone: true, role: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ ...group, isLeader: auth.isLeader });
}
