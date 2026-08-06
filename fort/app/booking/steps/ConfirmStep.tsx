"use client";

import { COURTS, formatDateLabel, formatHour } from "../availability";
import type { BookingState } from "../useBooking";

export default function ConfirmStep({
  state,
  onClose,
}: {
  state: BookingState;
  onClose: () => void;
}) {
  const court = COURTS.find((c) => c.id === state.courtId);
  const label = state.date ? formatDateLabel(state.date) : null;

  return (
    <div className="bk-done">
      <span className="bk-done-mark" aria-hidden="true" />
      <h2 className="bk-h">YOU&rsquo;RE ON<em>.</em></h2>
      <p className="bk-done-line">
        Court {court?.label} ·{" "}
        {label ? `${label.weekday} ${label.day} ${label.month}` : ""} ·{" "}
        {state.hour !== null ? formatHour(state.hour) : ""}
      </p>
      <p className="bk-ref">
        <span>BOOKING REFERENCE</span>
        <strong>{state.reference}</strong>
      </p>
      <p className="bk-done-note">
        Bring the reference to the front desk. See you on court, {state.name.trim().split(" ")[0]}.
      </p>
      <button type="button" className="btn btn-lime" onClick={onClose}>
        DONE
        <i className="btn-ico" aria-hidden="true" />
      </button>
    </div>
  );
}
