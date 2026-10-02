import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by the `rate_limits` table, so the limit
 * holds across every serverless instance. If the database call fails (e.g.
 * the table has not been created yet) it falls back to a per-instance
 * in-memory window rather than blocking the request.
 */
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  entry.count++;
  return { allowed: entry.count <= limit, retryAfterMs: entry.resetAt - now };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  try {
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "rate_limits" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "rate_limits"."resetAt" <= NOW() THEN 1 ELSE "rate_limits"."count" + 1 END,
        "resetAt" = CASE WHEN "rate_limits"."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE "rate_limits"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0];
    return {
      allowed: Number(row.count) <= limit,
      retryAfterMs: Math.max(0, new Date(row.resetAt).getTime() - Date.now()),
    };
  } catch (err) {
    console.error("rate-limit: falling back to memory", (err as Error).message);
    return memoryLimit(key, limit, windowMs);
  }
}

/** Drop expired windows. Called from a daily cron. */
export async function pruneRateLimits(): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "rate_limits" WHERE "resetAt" < NOW()`.catch(() => {});
}

/** Get client IP from Next.js request headers */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
