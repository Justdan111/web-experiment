"use client";

import { COURTS } from "../availability";
import { onGridKeyDown } from "../gridKeys";

export default function CourtStep({
  value,
  onSelect,
}: {
  value: number | null;
  onSelect: (courtId: number) => void;
}) {
  return (
    <>
      <h2 className="bk-h">SELECT YOUR COURT<em>.</em></h2>
      <div className="bk-grid bk-grid-court" onKeyDown={onGridKeyDown}>
        {COURTS.map((court) => (
          <button
            key={court.id}
            type="button"
            className={`bk-tile${value === court.id ? " is-on" : ""}`}
            onClick={() => onSelect(court.id)}
            aria-pressed={value === court.id}
          >
            <span className="bk-tile-num">{court.label}</span>
            <span className="bk-tile-meta">
              {court.surface === "hard" ? "HARD COURT" : "CLAY COURT"}
            </span>
            <span className="bk-tile-meta dim">
              {court.floodlit ? "FLOODLIT" : "DAYLIGHT ONLY"}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
