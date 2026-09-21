/**
 * The URL prefix this experiment is served under. Equals the folder name, and
 * the path `scripts/build-site.mjs` assembles this app into. `next.config.ts`
 * reads it, so there is one place to change it.
 */
export const BASE_PATH = "/fort";

/**
 * Prefixes a path to a file in `public/`.
 *
 * Next's `basePath` rewrites `_next/static` URLs, route links and metadata
 * routes — but NOT literal paths to `public/`. Unprefixed, `/media/x.png`
 * resolves against the hub container in production and 404s.
 */
export const asset = (path: string) =>
  path.startsWith(`${BASE_PATH}/`) ? path : `${BASE_PATH}${path}`;
