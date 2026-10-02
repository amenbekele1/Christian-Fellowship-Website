import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBookNames, isVersionKey } from "@/lib/bible";

/** GET ?v=AM1962 — book names in that version's language (Protestant canon). */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const v = req.nextUrl.searchParams.get("v");
  if (!isVersionKey(v)) return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  try {
    return NextResponse.json(await getBookNames(v));
  } catch {
    return NextResponse.json({});
  }
}
