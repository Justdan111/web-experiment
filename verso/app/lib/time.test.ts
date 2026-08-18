import { describe, expect, it } from "vitest";
import { formatClock, utcOffsetLabel } from "./time";

// 2026-01-15 12:00 UTC — northern winter
const WINTER = new Date("2026-01-15T12:00:00Z");
// 2026-07-15 12:00 UTC — northern summer
const SUMMER = new Date("2026-07-15T12:00:00Z");

describe("formatClock", () => {
  it("renders 24-hour time for the studio zone", () => {
    expect(formatClock(WINTER, "Asia/Tokyo")).toBe("21:00");
  });

  it("zero-pads the hour", () => {
    expect(formatClock(new Date("2026-01-15T23:05:00Z"), "UTC")).toBe("23:05");
    expect(formatClock(new Date("2026-01-15T04:05:00Z"), "UTC")).toBe("04:05");
  });

  it("renders midnight as 00:00, never 24:00", () => {
    expect(formatClock(new Date("2026-01-15T00:00:00Z"), "UTC")).toBe("00:00");
  });

  it("handles a half-hour offset zone", () => {
    expect(formatClock(WINTER, "Asia/Kolkata")).toBe("17:30");
  });
});

describe("utcOffsetLabel", () => {
  it("labels the studio zone", () => {
    expect(utcOffsetLabel(WINTER, "Asia/Tokyo")).toBe("UTC+9");
  });

  it("labels UTC itself with an explicit zero", () => {
    expect(utcOffsetLabel(WINTER, "UTC")).toBe("UTC+0");
  });

  it("labels a negative offset", () => {
    expect(utcOffsetLabel(WINTER, "America/New_York")).toBe("UTC-5");
  });

  it("follows a zone across its DST boundary", () => {
    expect(utcOffsetLabel(WINTER, "America/New_York")).toBe("UTC-5");
    expect(utcOffsetLabel(SUMMER, "America/New_York")).toBe("UTC-4");
  });

  it("follows Lisbon across its DST boundary", () => {
    expect(utcOffsetLabel(WINTER, "Europe/Lisbon")).toBe("UTC+0");
    expect(utcOffsetLabel(SUMMER, "Europe/Lisbon")).toBe("UTC+1");
  });

  it("keeps Tokyo fixed, because Japan observes no DST", () => {
    expect(utcOffsetLabel(WINTER, "Asia/Tokyo")).toBe("UTC+9");
    expect(utcOffsetLabel(SUMMER, "Asia/Tokyo")).toBe("UTC+9");
  });

  it("renders a half-hour offset with minutes", () => {
    expect(utcOffsetLabel(WINTER, "Asia/Kolkata")).toBe("UTC+5:30");
  });
});
