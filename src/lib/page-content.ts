import { prisma } from "@/lib/prisma";

/** Server-side helper — returns a map of { fieldKey: value } for a page. */
export async function getPageContent(pageKey: string): Promise<Record<string, string>> {
  const rows = await prisma.pageContent.findMany({
    where: { pageKey },
    select: { fieldKey: true, value: true },
  });
  return Object.fromEntries(rows.map((r) => [r.fieldKey, r.value]));
}
