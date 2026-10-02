/**
 * The fellowship runs on Warsaw time (CET/CEST). Servers (Vercel) run in UTC
 * and members' phones may be set to any zone, so every date that is shown to
 * a person or typed in by one goes through these helpers.
 */
export const TIME_ZONE = "Europe/Warsaw";

interface WallParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Calendar/clock fields of `date` as seen on a wall clock in Warsaw. */
export function warsawParts(date: Date | string): WallParts {
  const out: Record<string, string> = {};
  for (const p of partsFormatter.formatToParts(new Date(date))) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: WEEKDAYS.indexOf(out.weekday),
  };
}

/** Warsaw's offset from UTC at the given instant, in milliseconds. */
function offsetMs(date: Date): number {
  const p = warsawParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Interpret a wall-clock string typed in Warsaw ("2026-10-03T18:00" or
 * "2026-10-03") as the correct instant. Strings that already carry a zone
 * ("…Z", "…+02:00") are taken as-is.
 */
export function parseWarsawDateTime(value: string): Date {
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value);

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return new Date(value);
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);

  // Two passes so times next to a DST switch land on the right side.
  let result = guess - offsetMs(new Date(guess));
  result = guess - offsetMs(new Date(result));
  return new Date(result);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Value for an <input type="datetime-local"> showing Warsaw time. */
export function toWarsawInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const p = warsawParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM-DD" of the Warsaw calendar day containing `date`. */
export function warsawDateKey(date: Date | string = new Date()): string {
  const p = warsawParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** The last moment of a Warsaw calendar day given as "YYYY-MM-DD". */
export function endOfWarsawDay(dateKey: string): Date {
  return parseWarsawDateTime(`${dateKey.slice(0, 10)}T23:59:59`);
}

/** Time-of-day greeting for Warsaw. */
export function warsawGreeting(now: Date = new Date()): string {
  const h = warsawParts(now).hour;
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Format with Intl in Warsaw time. */
export function formatWarsaw(
  date: Date | string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...options }).format(
    new Date(date)
  );
}
