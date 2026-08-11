"use client";

import {
  COURTS,
  SLOT_HOURS,
  formatDateLabel,
  formatHour,
  slotState,
} from "../availability";
import { onGridKeyDown } from "../gridKeys";

export default function TimeStep({
  courtId,
  date,
  now,
  value,
  onSelect,
}: {
  courtId: number;
  date: string;
  now: Date;
  value: number | null;
  onSelect: (hour: number) => void;
}) {
  const court = COURTS.find((c) => c.id === courtId);
  const { weekday, day, month } = formatDateLabel(date);

  const states = SLOT_HOURS.map((hour) => ({
    hour,
    state: slotState(courtId, date, hour, now),
  }));
  const peakLeft = states.filter(
    (s) => s.hour >= 17 && s.state === "open",
  ).length;

  return (
    <>
      <h2 className="bk-h">SELECT A TIME<em>.</em></h2>
      <p className="bk-context">
        COURT {court?.label} — {weekday} {day} {month}
      </p>

      <div className="bk-grid bk-grid-time" onKeyDown={onGridKeyDown}>
        {states.map(({ hour, state }) => {
          const taken = state !== "open";
          return (
            <button
              key={hour}
              type="button"
              className={`bk-slot${value === hour ? " is-on" : ""}${
                taken ? " is-off" : ""
              }`}
              onClick={() => {
                if (!taken) onSelect(hour);
              }}
              aria-disabled={taken}
              aria-pressed={value === hour}
              aria-label={
                state === "open"
                  ? `${formatHour(hour)}, available`
                  : state === "booked"
                    ? `${formatHour(hour)}, already booked`
                    : `${formatHour(hour)}, no longer available today`
              }
            >
              {formatHour(hour)}
            </button>
          );
        })}
      </div>

      <p className="bk-note">
        {peakLeft === 0
          ? "No peak evening slots left — try an earlier hour."
          : `${peakLeft} slot${peakLeft === 1 ? "" : "s"} left at peak this evening`}
      </p>
    </>
  );
}
