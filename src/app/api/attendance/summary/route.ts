import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { warsawDateKey } from "@/lib/timezone";

/** Attendance dates are calendar days stored as UTC midnight. */
const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
const keyOf = (d: Date) => d.toISOString().slice(0, 10);
const isKey = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&busGroupId=
 * Guardians: attendance per recorded date, and per member over the period.
 * Defaults to the last three months.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const today = warsawDateKey();
  const defaultFrom = keyOf(new Date(day(today).getTime() - 91 * 86_400_000));
  const from = isKey(sp.get("from")) ? sp.get("from")! : defaultFrom;
  const to = isKey(sp.get("to")) ? sp.get("to")! : today;
  const busGroupId = sp.get("busGroupId") || undefined;

  const where = {
    date: { gte: day(from), lte: day(to) },
    ...(busGroupId ? { busGroupId } : {}),
  };

  const [byDate, byMember] = await Promise.all([
    prisma.attendance.groupBy({ by: ["date", "status"], where, _count: { _all: true } }),
    prisma.attendance.groupBy({ by: ["userId", "status"], where, _count: { _all: true }, _max: { date: true } }),
  ]);

  // Sessions (one per recorded date)
  const sessions = new Map<string, { date: string; present: number; absent: number; excused: number }>();
  for (const r of byDate) {
    const k = keyOf(r.date);
    const s = sessions.get(k) ?? { date: k, present: 0, absent: 0, excused: 0 };
    s[r.status === "PRESENT" ? "present" : r.status === "ABSENT" ? "absent" : "excused"] += r._count._all;
    sessions.set(k, s);
  }

  // Members: everyone active (so people never marked still show), plus their counts
  const people = await prisma.user.findMany({
    where: {
      isActive: true,
      NOT: { email: { endsWith: "@wetcf.deleted" } },
      ...(busGroupId ? { busGroupId } : {}),
    },
    select: { id: true, name: true, phone: true, busGroup: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  const stats = new Map<string, { present: number; absent: number; excused: number; lastPresent: string | null }>();
  for (const r of byMember) {
    const s = stats.get(r.userId) ?? { present: 0, absent: 0, excused: 0, lastPresent: null };
    if (r.status === "PRESENT") {
      s.present += r._count._all;
      s.lastPresent = r._max.date ? keyOf(r._max.date) : null;
    } else if (r.status === "ABSENT") s.absent += r._count._all;
    else s.excused += r._count._all;
    stats.set(r.userId, s);
  }

  const members = people.map((p) => {
    const s = stats.get(p.id) ?? { present: 0, absent: 0, excused: 0, lastPresent: null };
    const marked = s.present + s.absent; // excused doesn't count against the rate
    return {
      userId: p.id,
      name: p.name,
      phone: p.phone,
      busGroup: p.busGroup,
      ...s,
      rate: marked > 0 ? Math.round((s.present / marked) * 100) : null,
    };
  });

  return NextResponse.json({
    from,
    to,
    sessions: [...sessions.values()].sort((a, b) => b.date.localeCompare(a.date)),
    members,
  });
}
