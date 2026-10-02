import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BibleNotConfigured, getChapter, getPassage, isVersionKey } from "@/lib/bible";

/**
 * GET ?v=KJV&passage=JHN.3.16-JHN.3.21   or   ?v=NIV&chapter=JHN.3
 * Members only — keeps our API.Bible quota for the fellowship.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const v = sp.get("v");
  const passage = sp.get("passage");
  const chapter = sp.get("chapter");
  if (!isVersionKey(v) || (!passage && !chapter)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const text = passage ? await getPassage(v, passage) : await getChapter(v, chapter!);
    return NextResponse.json(text, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    if (err instanceof BibleNotConfigured) {
      return NextResponse.json({ error: "Bible text is not connected yet.", notConfigured: true }, { status: 503 });
    }
    console.error("bible text:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load this passage right now." }, { status: 502 });
  }
}
