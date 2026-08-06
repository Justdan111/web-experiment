"use client";

import { bookingDates, formatDateLabel, openSlotCount } from "../availability";
import { onGridKeyDown } from "../gridKeys";

export default function DateStep({
  courtId,
  now,
  value,
  onSelect,
}: {
  courtId: number;
  now: Date;
  value: string | null;
  onSelect: (date: string) => void;
}) {
  const dates = bookingDates(now);

  return (
    <>
      <h2 className="bk-h">PICK A DAY<em>.</em></h2>
      <div className="bk-grid bk-grid-date" onKeyDown={onGridKeyDown}>
        {dates.map((date) => {
          const { weekday, day, month } = formatDateLabel(date);
          const free = openSlotCount(courtId, date, now);
          return (
            <button
              key={date}
              type="button"
              className={`bk-tile bk-date${value === date ? " is-on" : ""}${
                free === 0 ? " is-off" : ""
              }`}
              onClick={() => {
                if (free > 0) onSelect(date);
              }}
              aria-disabled={free === 0}
              aria-pressed={value === date}
              aria-label={`${weekday} ${day} ${month}, ${free} slots free`}
            >
              <span className="bk-tile-meta">{weekday}</span>
              <span className="bk-tile-num">{day}</span>
              <span className="bk-tile-meta dim">{month}</span>
              <span className="bk-free">{free} FREE</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
