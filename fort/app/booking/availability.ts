/**
 * Seeded, deterministic court availability.
 *
 * Nothing here touches the network or the clock — `now` is always injected —
 * so the same court and date always produce the same grid. That matters more
 * than it sounds: a demo that reshuffles its "booked" slots on every reload
 * reads as fake the moment anyone scrolls back.
 */

export type Surface = "hard" | "clay";

export type Court = {
  id: number;
  label: string;
  surface: Surface;
  floodlit: boolean;
};

export type SlotState = "open" | "booked" | "past";

export const COURTS: Court[] = [
  { id: 1, label: "01", surface: "hard", floodlit: true },
  { id: 2, label: "02", surface: "hard", floodlit: true },
  { id: 3, label: "03", surface: "clay", floodlit: true },
  { id: 4, label: "04", surface: "hard", floodlit: true },
  { id: 5, label: "05", surface: "hard", floodlit: false },
  { id: 6, label: "06", surface: "clay", floodlit: true },
  { id: 7, label: "07", surface: "hard", floodlit: true },
  { id: 8, label: "08", surface: "hard", floodlit: false },
];

/** Courts close 14:00–15:00 — nobody plays outdoors through the Abuja afternoon. */
export const SLOT_HOURS: number[] = [
  6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21,
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** FNV-1a over the slot identity, normalised to 0..1. */
function seed(courtId: number, dateISO: string, hour: number): number {
  const key = `${courtId}:${dateISO}:${hour}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Evening slots are the ones everyone wants, so they should mostly be gone. */
function bookedChance(hour: number): number {
  if (hour >= 17) return 0.62;
  if (hour <= 8) return 0.28;
  return 0.18;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function slotState(
  courtId: number,
  dateISO: string,
  hour: number,
  now: Date,
): SlotState {
  const [y, m, d] = dateISO.split("-").map(Number);
  const slot = new Date(y, m - 1, d, hour, 0, 0, 0);
  if (slot.getTime() <= now.getTime()) return "past";
  return seed(courtId, dateISO, hour) < bookedChance(hour) ? "booked" : "open";
}

export function bookingDates(now: Date, days = 14): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
  }
  return out;
}

export function formatHour(hour: number): string {
  return `${pad(hour)}:00`;
}

export function formatDateLabel(dateISO: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: WEEKDAYS[date.getDay()],
    day: pad(d),
    month: MONTHS[m - 1],
  };
}

export function openSlotCount(
  courtId: number,
  dateISO: string,
  now: Date,
): number {
  return SLOT_HOURS.filter(
    (h) => slotState(courtId, dateISO, h, now) === "open",
  ).length;
}
