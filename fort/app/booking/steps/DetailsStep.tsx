"use client";

import { useState } from "react";
import { COURTS, formatDateLabel, formatHour } from "../availability";
import {
  type BookingState,
  detailsValid,
  isEmail,
  isName,
  isPhone,
} from "../useBooking";

type Field = "name" | "email" | "phone";

const RULES: Record<Field, { test: (v: string) => boolean; error: string }> = {
  name: { test: isName, error: "Enter your full name" },
  email: { test: isEmail, error: "Enter a valid email address" },
  phone: { test: isPhone, error: "Enter a reachable phone number" },
};

export default function DetailsStep({
  state,
  onField,
  onSubmit,
}: {
  state: BookingState;
  onField: (field: Field, value: string) => void;
  onSubmit: () => void;
}) {
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    phone: false,
  });

  const court = COURTS.find((c) => c.id === state.courtId);
  const label = state.date ? formatDateLabel(state.date) : null;

  const errorFor = (field: Field): string | null => {
    if (!touched[field]) return null;
    return RULES[field].test(state[field]) ? null : RULES[field].error;
  };

  return (
    <>
      <h2 className="bk-h">ALMOST THERE<em>.</em></h2>

      <div className="bk-summary">
        <span>COURT {court?.label}</span>
        <span>
          {label ? `${label.weekday} ${label.day} ${label.month}` : ""}
        </span>
        <span>{state.hour !== null ? formatHour(state.hour) : ""}</span>
      </div>

      <form
        className="bk-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (detailsValid(state)) onSubmit();
        }}
      >
        {(["name", "email", "phone"] as Field[]).map((field) => {
          const error = errorFor(field);
          return (
            <label className="bk-field" key={field}>
              <span className="bk-label">
                {field === "name"
                  ? "FULL NAME"
                  : field === "email"
                    ? "EMAIL"
                    : "PHONE"}
              </span>
              <input
                className={error ? "has-error" : undefined}
                type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                value={state[field]}
                onChange={(e) => onField(field, e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, [field]: true }))}
                aria-invalid={error !== null}
                autoComplete={
                  field === "name" ? "name" : field === "email" ? "email" : "tel"
                }
              />
              {error && <span className="bk-error">{error}</span>}
            </label>
          );
        })}

        <button
          className="btn btn-lime bk-submit"
          type="submit"
          disabled={!detailsValid(state)}
        >
          CONFIRM BOOKING
          <i className="btn-ico" aria-hidden="true" />
        </button>
      </form>
    </>
  );
}
