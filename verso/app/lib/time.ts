/** 24-hour, zero-padded wall time in the given IANA zone. */
export function formatClock(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

/**
 * "UTC+9", "UTC-5", "UTC+0", "UTC+5:30".
 *
 * Derived from Intl rather than a lookup table so that daylight saving is
 * handled by the platform's tz database instead of by us.
 */
export function utcOffsetLabel(now: Date, timeZone: string): string {
  const raw =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";

  // longOffset yields "GMT+09:00", or bare "GMT" at exactly zero.
  const match = raw.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return "UTC+0";

  const [, sign, hours, minutes] = match;
  const h = Number(hours);
  const m = Number(minutes);
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${minutes}`;
}

/** The visitor's own IANA zone. Client-only — there is no such thing on the server. */
export function resolveTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
