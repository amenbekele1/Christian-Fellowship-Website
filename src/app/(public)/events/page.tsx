import { Metadata } from "next";
import { Calendar, MapPin, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Events" };
export const revalidate = 60;

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const typeColors: Record<string, string> = {
  "Worship": "bg-amber-100 text-amber-700 border-amber-200",
  "Worship Night": "bg-amber-100 text-amber-700 border-amber-200",
  "Bible Study": "bg-brown-100 text-gold-500 border-brown-200",
  "Literature Night": "bg-blue-100 text-blue-700 border-blue-200",
  "BUS Meeting": "bg-purple-100 text-purple-700 border-purple-200",
  "Sermon": "bg-rose-100 text-rose-700 border-rose-200",
};

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { startDate: "asc" },
  });

  const upcoming = events.filter((e) => new Date(e.startDate) >= new Date());
  const past = events.filter((e) => new Date(e.startDate) < new Date());

  return (
    <>
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">Stay Connected</p>
          <h1 className="font-display text-5xl font-bold text-white mb-5">Events</h1>
          <p className="text-brown-100 text-lg max-w-xl mx-auto">
            Don't miss a moment of fellowship, worship, and growth.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          {/* Upcoming */}
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-6">Upcoming Events</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-14">
              {upcoming.map((event) => (
                <div key={event.id} className="bg-white border border-brown-200 rounded-2xl p-6 card-hover flex gap-5">
                  {/* Date badge */}
                  <div className="shrink-0 text-center bg-brown-50 rounded-xl px-4 py-3 border border-brown-200 min-w-[68px]">
                    <p className="text-xs font-bold text-gold-600 uppercase">
                      {new Date(event.startDate).toLocaleDateString("en-GB", { month: "short" })}
                    </p>
                    <p className="font-display font-bold text-brown-700 text-2xl leading-none">
                      {new Date(event.startDate).getDate()}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h3 className="font-display font-bold text-gray-800 text-xl">{event.title}</h3>
                      {event.type && (
                        <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${typeColors[event.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {event.type}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-3">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(event.startDate)}
                        {event.endDate && ` – ${formatTime(event.endDate)}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <>
              <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 mt-12">Past Events</h2>
              <div className="space-y-3">
                {past.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 opacity-60">
                    <div className="shrink-0 text-center bg-gray-50 rounded-lg px-3 py-2 min-w-[56px]">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        {new Date(event.startDate).toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                      <p className="font-bold text-gray-500 text-lg leading-none">
                        {new Date(event.startDate).getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.startDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
