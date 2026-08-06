/**
 * Module-level open signal for the booking overlay.
 *
 * Lifting this into React state would mean a client component wrapping both
 * Landing and the overlay — and any re-render that remounts Landing reverts
 * its gsap.context(), permanently destroying every pinned ScrollTrigger.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function openBooking(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeBooking(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
