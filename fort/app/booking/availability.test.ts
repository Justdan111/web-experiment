import { describe, expect, it } from "vitest";
import {
  COURTS,
  SLOT_HOURS,
  bookingDates,
  formatDateLabel,
  formatHour,
  openSlotCount,
  slotState,
} from "./availability";

const NOW = new Date(2026, 7, 6, 9, 30); // 2026-08-06 09:30 local

describe("COURTS", () => {
  it("has the eight courts the stats section promises", () => {
    expect(COURTS).toHaveLength(8);
  });

  it("gives every court a unique id", () => {
    expect(new Set(COURTS.map((c) => c.id)).size).toBe(8);
  });
});

describe("SLOT_HOURS", () => {
  it("closes through the afternoon heat", () => {
    expect(SLOT_HOURS).not.toContain(14);
    expect(SLOT_HOURS).not.toContain(15);
  });

  it("runs from early morning to late evening", () => {
    expect(SLOT_HOURS[0]).toBe(6);
    expect(SLOT_HOURS[SLOT_HOURS.length - 1]).toBe(21);
  });
});

describe("slotState", () => {
  it("is deterministic for the same court, date and hour", () => {
    const a = slotState(3, "2026-08-08", 18, NOW);
    const b = slotState(3, "2026-08-08", 18, NOW);
    expect(a).toBe(b);
  });

  it("stays stable across a thousand repeat calls", () => {
    const first = slotState(5, "2026-08-11", 9, NOW);
    for (let i = 0; i < 1000; i++) {
      expect(slotState(5, "2026-08-11", 9, NOW)).toBe(first);
    }
  });

  it("does not return the same pattern for every court", () => {
    const perCourt = COURTS.map((c) =>
      SLOT_HOURS.map((h) => slotState(c.id, "2026-08-09", h, NOW)).join(""),
    );
    expect(new Set(perCourt).size).toBeGreaterThan(1);
  });

  it("marks hours earlier today as past", () => {
    expect(slotState(1, "2026-08-06", 6, NOW)).toBe("past");
  });

  it("never marks a future date as past", () => {
    for (const h of SLOT_HOURS) {
      expect(slotState(1, "2026-08-20", h, NOW)).not.toBe("past");
    }
  });

  it("derives past purely from the injected now", () => {
    const later = new Date(2026, 7, 6, 23, 0);
    expect(slotState(1, "2026-08-06", 18, NOW)).not.toBe("past");
    expect(slotState(1, "2026-08-06", 18, later)).toBe("past");
  });

  it("books peak evening slots more often than off-peak", () => {
    const dates = bookingDates(NOW, 14);
    let peakBooked = 0;
    let peakTotal = 0;
    let offBooked = 0;
    let offTotal = 0;

    for (const court of COURTS) {
      for (const date of dates) {
        for (const hour of SLOT_HOURS) {
          const state = slotState(court.id, date, hour, NOW);
          if (state === "past") continue;
          const peak = hour >= 17;
          if (peak) {
            peakTotal++;
            if (state === "booked") peakBooked++;
          } else {
            offTotal++;
            if (state === "booked") offBooked++;
          }
        }
      }
    }

    expect(peakBooked / peakTotal).toBeGreaterThan(offBooked / offTotal);
  });
});

describe("bookingDates", () => {
  it("returns fourteen days by default, starting today", () => {
    const dates = bookingDates(NOW);
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe("2026-08-06");
    expect(dates[13]).toBe("2026-08-19");
  });

  it("rolls over month boundaries", () => {
    const dates = bookingDates(new Date(2026, 7, 30), 5);
    expect(dates).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("does not shift the day for late-evening local times", () => {
    // toISOString() would report the next day here in any positive offset
    expect(bookingDates(new Date(2026, 7, 6, 23, 59), 1)[0]).toBe("2026-08-06");
  });
});

describe("formatHour", () => {
  it("zero-pads to a 24-hour label", () => {
    expect(formatHour(6)).toBe("06:00");
    expect(formatHour(18)).toBe("18:00");
  });
});

describe("formatDateLabel", () => {
  it("splits an ISO date into display parts", () => {
    expect(formatDateLabel("2026-08-06")).toEqual({
      weekday: "THU",
      day: "06",
      month: "AUG",
    });
  });
});

describe("openSlotCount", () => {
  it("counts only open slots", () => {
    const count = openSlotCount(2, "2026-08-12", NOW);
    const manual = SLOT_HOURS.filter(
      (h) => slotState(2, "2026-08-12", h, NOW) === "open",
    ).length;
    expect(count).toBe(manual);
  });

  it("never exceeds the number of slots in a day", () => {
    expect(openSlotCount(2, "2026-08-12", NOW)).toBeLessThanOrEqual(
      SLOT_HOURS.length,
    );
  });
});
