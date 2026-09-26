import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, MapPin, Clock, Lock, LogIn } from "lucide-react";
import { getTheme, getLayout, parseVideoEmbed, idFromSlug, eventPath } from "@/lib/event-presets";
import RichText from "@/components/events/RichText";

export const dynamic = "force-dynamic";

async function loadEvent(slug: string) {
  const id = idFromSlug(slug);
  return prisma.event.findFirst({
    where: { id, isActive: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await loadEvent(params.slug);
  if (!event) return { title: "Event not found" };

  // Members-only events get no rich preview — a shared link should not leak
  // the description to anyone who cannot open the page.
  if (!event.isPublic) {
    return { title: "Members only · WETCF", robots: { index: false, follow: false } };
  }

  return {
    title: `${event.title} · WETCF`,
    description: event.description ?? undefined,
    openGraph: {
      title: event.title,
      description: event.description ?? undefined,
      images: event.imageUrl ? [event.imageUrl] : undefined,
      type: "article",
    },
  };
}

function formatWhen(start: Date, end: Date | null): string {
  const d = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(start);
  const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(start);
  if (!end) return `${d} · ${t}`;
  const te = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(end);
  return `${d} · ${t} – ${te}`;
}

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await loadEvent(params.slug);
  if (!event) notFound();

  // Members-only gate. Enforced here on the server, so the content is never
  // sent to a signed-out visitor regardless of what the UI does.
  if (!event.isPublic) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return (
        <div className="min-h-[70vh] bg-brown-50 flex items-center justify-center px-6 py-20">
          <div className="bg-white border border-brown-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-brown-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gold-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-800 mb-2">
              This event is for members
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Sign in with your fellowship account to see the details.
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(eventPath(event))}`}
              className="inline-flex items-center gap-2 bg-brown-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brown-700 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Sign in
            </Link>
          </div>
        </div>
      );
    }
  }

  const theme = getTheme(event.theme);
  const layout = getLayout(event.layout);
  const video = parseVideoEmbed(event.videoUrl);
  const gallery = event.gallery ?? [];
  const when = formatWhen(event.startDate, event.endDate);
  const showHeroImage = layout.key !== "minimal" && Boolean(event.imageUrl);

  return (
    <article className={theme.page}>
      {/* ── Hero ───────────────────────────────────────────── */}
      <header className={`${theme.hero} relative overflow-hidden`}>
        <div
          className={`max-w-5xl mx-auto px-6 ${
            layout.key === "side" && showHeroImage
              ? "py-12 grid md:grid-cols-2 gap-10 items-center"
              : "py-14"
          }`}
        >
          <div>
            {!event.isPublic && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-4 ${theme.accent}`}>
                <Lock className="w-3.5 h-3.5" /> Members only
              </span>
            )}
            {event.type && (
              <p className={`text-sm font-semibold uppercase tracking-widest mb-3 ${theme.accent}`}>
                {event.type}
              </p>
            )}
            <h1 className={`font-display text-4xl md:text-5xl font-bold ${theme.heroText} leading-tight`}>
              {event.title}
            </h1>

            <div className={`mt-6 space-y-2.5 ${theme.heroMuted}`}>
              <p className="flex items-start gap-2.5 text-sm">
                <Calendar className={`w-4 h-4 mt-0.5 shrink-0 ${theme.accent}`} />
                <span className="font-medium">{when}</span>
              </p>
              {event.location && (
                <p className="flex items-start gap-2.5 text-sm">
                  <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${theme.accent}`} />
                  <span>{event.location}</span>
                </p>
              )}
            </div>
          </div>

          {layout.key === "side" && showHeroImage && (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={event.imageUrl!}
                alt={event.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>

        {layout.key === "banner" && showHeroImage && (
          <div className="relative w-full h-64 md:h-96">
            <Image
              src={event.imageUrl!}
              alt={event.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-brown-500 hover:text-gold-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All events
        </Link>

        {event.description && (
          <p className="text-lg text-brown-800 leading-relaxed mb-8">{event.description}</p>
        )}

        {event.body && <RichText content={event.body} />}

        {/* Video */}
        {video && (
          <div className="mt-10">
            <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={video.embedUrl}
                title={`${event.title} video`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
              />
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-brown-900 mb-4">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden bg-brown-50 hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={url}
                    alt={`${event.title} photo ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer detail block */}
        <div className="mt-12 pt-8 border-t border-brown-100">
          <div className="flex flex-wrap gap-6 text-sm text-brown-600">
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-500" /> {when}
            </p>
            {event.location && (
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-500" /> {event.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
