/**
 * One shared pointer broadcast so every particle ball reacts to the racket
 * cursor without each one attaching its own window listener.
 */
type Listener = (x: number | null, y: number | null) => void;

const listeners = new Set<Listener>();

export function registerBall(fn: Listener): Listener {
  listeners.add(fn);
  return fn;
}

export function unregisterBall(fn: Listener) {
  listeners.delete(fn);
}

export function broadcastPointer(x: number | null, y: number | null) {
  listeners.forEach((fn) => fn(x, y));
}
