import { NextRequest } from "next/server";

/**
 * Verify a cron request came from Vercel Cron or an authorized caller.
 * Returns null if valid, or an error Response if not.
 */
export function verifyCron(req: NextRequest): Response | null {
  const cronHeader = req.headers.get("x-vercel-cron-secret");
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  // Vercel Cron sends x-vercel-cron: 1 on its requests; we still require the shared secret
  // to be present so local curl/external callers can also hit it.
  if (!secret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not set" }), { status: 500 });
  }

  if (cronHeader === secret || authHeader === `Bearer ${secret}`) return null;

  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
