import type Lenis from "lenis";

/**
 * The one Lenis instance, set by <SmoothScroll /> at mount.
 *
 * The featured rail is scroll-driven and draggable, and a drag has to move the
 * page. Calling window.scrollTo during a drag fights the smoothing — Lenis is
 * mid-interpolation and immediately pulls back. Going through Lenis itself with
 * `immediate` keeps one source of truth for where the page is.
 */
let instance: Lenis | null = null;

export const setLenis = (next: Lenis | null) => {
  instance = next;
};

/** Null before mount, and whenever reduced motion has kept Lenis from starting. */
export const getLenis = () => instance;
