import type { KeyboardEvent } from "react";

const STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowUp: -1,
};

/**
 * Roving focus across a .bk-grid. Columns are read from the live computed
 * style rather than hard-coded, so the same handler works at every breakpoint.
 */
export function onGridKeyDown(e: KeyboardEvent<HTMLElement>): void {
  const key = e.key;
  if (!(key in STEP) && key !== "Home" && key !== "End") return;

  const grid = e.currentTarget;
  const items = Array.from(
    grid.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
  );
  if (!items.length) return;

  const index = items.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;

  e.preventDefault();

  if (key === "Home") {
    items[0].focus();
    return;
  }
  if (key === "End") {
    items[items.length - 1].focus();
    return;
  }

  const columns = Math.max(
    1,
    window
      .getComputedStyle(grid)
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length,
  );

  const stride = key === "ArrowUp" || key === "ArrowDown" ? columns : 1;
  const next = index + STEP[key] * stride;
  if (next >= 0 && next < items.length) items[next].focus();
}
