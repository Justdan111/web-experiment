import { describe, expect, it } from "vitest";
import {
  type BookingState,
  bookingReducer,
  detailsValid,
  firstIncompleteStep,
  initialBooking,
  isEmail,
  isName,
  isPhone,
} from "./useBooking";

const filled: BookingState = {
  ...initialBooking,
  step: 3,
  courtId: 3,
  date: "2026-08-08",
  hour: 18,
};

describe("bookingReducer", () => {
  it("starts on the court step with nothing chosen", () => {
    expect(initialBooking.step).toBe(0);
    expect(initialBooking.courtId).toBeNull();
  });

  it("advances to the date step when a court is picked", () => {
    const next = bookingReducer(initialBooking, {
      type: "SELECT_COURT",
      courtId: 4,
    });
    expect(next.courtId).toBe(4);
    expect(next.step).toBe(1);
  });

  it("clears the chosen date and hour when the court changes", () => {
    const next = bookingReducer(filled, { type: "SELECT_COURT", courtId: 7 });
    expect(next.date).toBeNull();
    expect(next.hour).toBeNull();
  });

  it("leaves date and hour null when the court changes from a fully-selected state", () => {
    const confirmed: BookingState = { ...filled, step: 4, reference: "FORT-A1B2C" };
    const next = bookingReducer(confirmed, { type: "SELECT_COURT", courtId: 7 });
    expect(next.courtId).toBe(7);
    expect(next.date).toBeNull();
    expect(next.hour).toBeNull();
    expect(next.step).toBe(1);
  });

  it("clears a chosen hour when the date changes", () => {
    const next = bookingReducer(filled, {
      type: "SELECT_DATE",
      date: "2026-08-09",
    });
    expect(next.hour).toBeNull();
    expect(next.step).toBe(2);
  });

  it("advances to details when an hour is picked", () => {
    const next = bookingReducer(
      { ...filled, step: 2, hour: null },
      { type: "SELECT_HOUR", hour: 19 },
    );
    expect(next.hour).toBe(19);
    expect(next.step).toBe(3);
  });

  it("sets a single named field", () => {
    const next = bookingReducer(filled, {
      type: "SET_FIELD",
      field: "email",
      value: "a@b.co",
    });
    expect(next.email).toBe("a@b.co");
    expect(next.name).toBe("");
  });

  it("steps back without losing selections", () => {
    const next = bookingReducer(filled, { type: "BACK" });
    expect(next.step).toBe(2);
    expect(next.courtId).toBe(3);
  });

  it("does not step back past the first step", () => {
    expect(bookingReducer(initialBooking, { type: "BACK" }).step).toBe(0);
  });

  it("stores the reference and moves to confirmation", () => {
    const next = bookingReducer(filled, {
      type: "CONFIRM",
      reference: "FORT-A1B2C",
    });
    expect(next.reference).toBe("FORT-A1B2C");
    expect(next.step).toBe(4);
  });

  it("resets back to the initial state", () => {
    expect(bookingReducer(filled, { type: "RESET" })).toEqual(initialBooking);
  });

  it("does not step back from the confirmation screen", () => {
    const confirmed = bookingReducer(filled, {
      type: "CONFIRM",
      reference: "FORT-A1B2C",
    });
    const afterBack = bookingReducer(confirmed, { type: "BACK" });
    expect(afterBack.step).toBe(4);
    expect(afterBack.reference).toBe("FORT-A1B2C");
  });

  it("clears reference when resetting from confirmed state", () => {
    const confirmed = bookingReducer(filled, {
      type: "CONFIRM",
      reference: "FORT-A1B2C",
    });
    const reset = bookingReducer(confirmed, { type: "RESET" });
    expect(reset).toEqual(initialBooking);
    expect(reset.reference).toBeNull();
  });
});

describe("firstIncompleteStep", () => {
  it("returns the court step when nothing is chosen", () => {
    expect(firstIncompleteStep(initialBooking)).toBe(0);
  });

  it("returns the date step when only a court is chosen", () => {
    expect(firstIncompleteStep({ ...initialBooking, courtId: 2 })).toBe(1);
  });

  it("returns the time step when the hour is still missing", () => {
    expect(
      firstIncompleteStep({ ...initialBooking, courtId: 2, date: "2026-08-08" }),
    ).toBe(2);
  });

  it("returns the details step once everything is chosen", () => {
    expect(firstIncompleteStep(filled)).toBe(3);
  });

  it("returns 4 for a confirmed state", () => {
    const confirmed = { ...filled, reference: "FORT-A1B2C" };
    expect(firstIncompleteStep(confirmed)).toBe(4);
  });

  it("still returns 3 for a fully-selected but unconfirmed state", () => {
    const unconfirmed = {
      ...filled,
      reference: null,
    };
    expect(firstIncompleteStep(unconfirmed)).toBe(3);
  });
});

describe("validation", () => {
  it("rejects a one-character name", () => {
    expect(isName("A")).toBe(false);
    expect(isName("Ada")).toBe(true);
  });

  it("rejects malformed email", () => {
    expect(isEmail("nope")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail("ada@fort.ng")).toBe(true);
  });

  it("accepts local and international phone shapes", () => {
    expect(isPhone("0803")).toBe(false);
    expect(isPhone("08031234567")).toBe(true);
    expect(isPhone("+234 803 123 4567")).toBe(true);
  });

  it("requires all three fields together", () => {
    expect(detailsValid(filled)).toBe(false);
    expect(
      detailsValid({
        ...filled,
        name: "Ada",
        email: "ada@fort.ng",
        phone: "08031234567",
      }),
    ).toBe(true);
  });
});
