"use client";

import { useEffect, useState } from "react";
import { formatClock, resolveTimeZone, utcOffsetLabel } from "../lib/time";
import type { ClockZone } from "../content/types";

export default function Clock({ zone }: { zone: ClockZone }) {
  const [state, setState] = useState<{ time: string; offset: string; city: string } | null>(null);

  useEffect(() => {
    const tz = zone.timeZone ?? resolveTimeZone();
    const city =
      zone.city === "LOCAL" ? (tz.split("/").pop() ?? "LOCAL").replace(/_/g, " ").toUpperCase() : zone.city;

    const tick = () => {
      const now = new Date();
      setState({ time: formatClock(now, tz), offset: utcOffsetLabel(now, tz), city });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [zone]);

  return (
    <div className="min-w-[7ch]">
      {/* Empty until mounted: server time is not the visitor's time. */}
      <div
        className="text-[32px] tabular-nums md:text-[40px] md:leading-10"
        style={{ letterSpacing: "var(--track-40)" }}
        suppressHydrationWarning
      >
        {state?.time ?? " "}
      </div>
      <div
        className="mt-4 font-mono text-[12px]"
        style={{ color: "var(--muted)", letterSpacing: "var(--track-12)" }}
        suppressHydrationWarning
      >
        {state ? (
          <>
            <div>{state.offset}</div>
            <div>{state.city}</div>
          </>
        ) : (
          " "
        )}
      </div>
    </div>
  );
}
