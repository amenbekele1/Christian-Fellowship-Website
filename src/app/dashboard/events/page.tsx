import Link from "next/link";
import { Calendar, MapPin, Lock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";
import { formatWarsaw } from "@/lib/timezone";
import { eventPath } from "@/lib/event-presets";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  isPublic: boolean;
};

function EventItem({ event, past }: { event: EventRow; past?: boolean }) {
  return (
    <Link
      href={eventPath(event)}
      className="flex gap-4 p-4 rounded-xl transition-colors hover:bg-[#FAF7F0]"
      style={{ border: "1px solid #F0E6D3", opacity: past ? 0.85 : 1 }}
    >
      <div
        className="shrink-0 rounded-xl px-2 py-2 text-center min-w-[52px]"
        style={{ background: "rgba(201,168,76,0.10)" }}
      >
        <p className="text-xs font-bold uppercase" style={{ color: "#8A6A1F" }}>
          {formatWarsaw(event.startDate, { month: "short" })}
        </p>
        <p className="font-display font-bold text-lg leading-tight" style={{ color: "#2C1A0E" }}>
          {formatWarsaw(event.startDate, { day: "numeric" })}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate" style={{ color: "#2C1A0E" }}>{event.title}</p>
          {!event.isPublic && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: "#F0E6D3", color: "#5C3D20" }}
            >
              <Lock className="w-2.5 h-2.5" aria-hidden="true" /> Members
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#7A5C3E" }}>
          {formatWarsaw(event.startDate, { weekday: "long" })} · {formatTime(event.startDate)}
          {event.location && (
            <>
              {" · "}
              <MapPin className="w-3 h-3 inline -mt-0.5" aria-hidden="true" /> {event.location}
            </>
          )}
        </p>
        {event.description && (
          <p className="text-sm mt-1 line-clamp-2" style={{ color: "#7A5C3E" }}>{event.description}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 self-center shrink-0" style={{ color: "#C4A882" }} aria-hidden="true" />
    </Link>
  );
}

export default async function DashboardEventsPage() {
  const now = new Date();
  const select = { id: true, title: true, description: true, location: true, startDate: true, isPublic: true };

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { isActive: true, startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      select,
    }),
    prisma.event.findMany({
      where: { isActive: true, startDate: { lt: now } },
      orderBy: { startDate: "desc" },
      take: 12,
      select,
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold" style={{ color: "#2C1A0E" }}>Events</h1>
        <p className="mt-1" style={{ color: "#7A5C3E" }}>
          Everything coming up at the fellowship, including members-only gatherings.
        </p>
      </div>

      <section
        className="rounded-2xl p-5 mb-6"
        style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
      >
        <h2 className="font-display font-bold mb-4" style={{ color: "#2C1A0E" }}>Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-10" style={{ color: "#8A6A4A" }}>
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" aria-hidden="true" />
            <p className="text-sm">No upcoming events yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => <EventItem key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "1px solid #E0CBB0", boxShadow: "0 2px 8px rgba(44,26,14,0.05)" }}
        >
          <h2 className="font-display font-bold mb-4" style={{ color: "#2C1A0E" }}>Recent</h2>
          <div className="space-y-3">
            {past.map((e) => <EventItem key={e.id} event={e} past />)}
          </div>
        </section>
      )}
    </div>
  );
}
