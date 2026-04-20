import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendRefreshPush } from "@/lib/webpush";

function canEditContent(session: any): boolean {
  return (
    session?.user?.role === "GUARDIAN" ||
    (session?.user?.serviceTeams ?? []).includes("WEBSITE_EDITOR")
  );
}

// GET /api/page-content?page=home  — public read
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageKey = searchParams.get("page");

  const where = pageKey ? { pageKey } : {};
  const rows = await prisma.pageContent.findMany({
    where,
    select: { pageKey: true, fieldKey: true, label: true, value: true, updatedAt: true },
    orderBy: [{ pageKey: "asc" }, { fieldKey: "asc" }],
  });

  return NextResponse.json(rows);
}

// PATCH /api/page-content  — editor/guardian only
const patchSchema = z.object({
  pageKey:  z.string().min(1),
  fieldKey: z.string().min(1),
  value:    z.string(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canEditContent(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { pageKey, fieldKey, value } = patchSchema.parse(body);

  const row = await prisma.pageContent.update({
    where: { pageKey_fieldKey: { pageKey, fieldKey } },
    data: { value },
    select: { pageKey: true, fieldKey: true, value: true, updatedAt: true },
  });

  sendRefreshPush("page-content").catch(() => {});
  return NextResponse.json(row);
}
