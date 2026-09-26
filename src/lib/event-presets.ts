/**
 * Preset themes and layouts for event pages.
 *
 * Editors pick from these rather than choosing free colours, so every event
 * page stays on-brand. Class strings are written out in full because
 * Tailwind only keeps classes it can see in source — building them
 * dynamically (`bg-${colour}-800`) would get purged from the bundle.
 */

export interface EventTheme {
  key: string;
  label: string;
  /** Small colour chip shown in the picker */
  swatch: string;
  /** Hero / banner background */
  hero: string;
  /** Text on the hero */
  heroText: string;
  /** Muted text on the hero */
  heroMuted: string;
  /** Accent used for icons, rules and the date badge */
  accent: string;
  /** Page background behind the article body */
  page: string;
}

export const EVENT_THEMES: EventTheme[] = [
  {
    key: "brown",
    label: "Deep Brown",
    swatch: "bg-brown-800",
    hero: "bg-gradient-to-br from-brown-800 to-brown-900",
    heroText: "text-white",
    heroMuted: "text-brown-200",
    accent: "text-gold-400",
    page: "bg-white",
  },
  {
    key: "gold",
    label: "Warm Gold",
    swatch: "bg-gold-500",
    hero: "bg-gradient-to-br from-gold-600 to-brown-800",
    heroText: "text-white",
    heroMuted: "text-gold-100",
    accent: "text-gold-300",
    page: "bg-white",
  },
  {
    key: "cream",
    label: "Light & Airy",
    swatch: "bg-brown-100",
    hero: "bg-brown-50 border-b border-brown-200",
    heroText: "text-brown-900",
    heroMuted: "text-brown-600",
    accent: "text-gold-600",
    page: "bg-white",
  },
  {
    key: "forest",
    label: "Evergreen",
    swatch: "bg-green-800",
    hero: "bg-gradient-to-br from-green-800 to-green-950",
    heroText: "text-white",
    heroMuted: "text-green-100",
    accent: "text-gold-300",
    page: "bg-white",
  },
  {
    key: "plum",
    label: "Plum",
    swatch: "bg-purple-900",
    hero: "bg-gradient-to-br from-purple-900 to-brown-900",
    heroText: "text-white",
    heroMuted: "text-purple-100",
    accent: "text-gold-300",
    page: "bg-white",
  },
  {
    key: "midnight",
    label: "Midnight",
    swatch: "bg-gray-900",
    hero: "bg-gradient-to-br from-gray-900 to-black",
    heroText: "text-white",
    heroMuted: "text-gray-300",
    accent: "text-gold-400",
    page: "bg-white",
  },
];

export interface EventLayout {
  key: string;
  label: string;
  hint: string;
}

export const EVENT_LAYOUTS: EventLayout[] = [
  { key: "banner",  label: "Photo banner", hint: "Large image across the top, details below" },
  { key: "side",    label: "Side by side", hint: "Image on the right, details on the left" },
  { key: "minimal", label: "Text first",   hint: "No hero image — best when you have no photo" },
];

export function getTheme(key: string | null | undefined): EventTheme {
  return EVENT_THEMES.find((t) => t.key === key) ?? EVENT_THEMES[0];
}

export function getLayout(key: string | null | undefined): EventLayout {
  return EVENT_LAYOUTS.find((l) => l.key === key) ?? EVENT_LAYOUTS[0];
}

/**
 * Extract a YouTube/Vimeo video id from the many URL shapes people paste.
 * Returns null when the link isn't recognised, so the caller can skip the
 * embed rather than render a broken iframe.
 */
export function parseVideoEmbed(
  url: string | null | undefined
): { provider: "youtube" | "vimeo"; id: string; embedUrl: string } | null {
  if (!url) return null;
  const trimmed = url.trim();

  const yt =
    trimmed.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/);
  if (yt) {
    return {
      provider: "youtube",
      id: yt[1],
      // nocookie host so viewers aren't tracked before they press play
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}`,
    };
  }

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      provider: "vimeo",
      id: vimeo[1],
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  }

  return null;
}

/** "Christmas Service!" -> "christmas-service" */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Shareable event URL: /events/christmas-service-clx8a7b2c
 *
 * The id is appended after the slug so the URL stays readable while
 * remaining unambiguous. cuid ids contain no dashes, so the id is always
 * the final dash-separated segment.
 */
export function eventPath(event: { id: string; title: string }): string {
  const slug = slugify(event.title);
  return slug ? `/events/${slug}-${event.id}` : `/events/${event.id}`;
}

/** Recover the event id from a slug produced by eventPath. */
export function idFromSlug(slug: string): string {
  const parts = slug.split("-");
  return parts[parts.length - 1] ?? slug;
}
