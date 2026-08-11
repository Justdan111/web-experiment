/**
 * Module-level open signal for the booking overlay.
 *
 * Lifting this into React state would mean a client component wrapping both
 * Landing and the overlay — and any re-render that remounts Landing reverts
 * its gsap.context(), permanently destroying every pinned ScrollTrigger.
 */
type Listener = (trigger?: HTMLElement) => void;

const listeners = new Set<Listener>();

/**
 * `trigger` is the element that opened the overlay. WebKit does not focus a
 * <button> on click, so `document.activeElement` alone is not a reliable way
 * to know what to return focus to on close — callers should pass
 * `e.currentTarget` explicitly.
 */
export function openBooking(trigger?: HTMLElement): void {
  listeners.forEach((fn) => fn(trigger));
}

export function subscribeBooking(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
