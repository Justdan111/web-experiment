import { experiments } from "../experiments";

/**
 * The static params for `app/notes/[slug]/page.tsx`.
 *
 * Kept apart from the route so it can be tested without pulling MDX through
 * vitest, which has no loader for it.
 */
export const caseStudyParams = () => experiments.map((e) => ({ slug: e.slug }));
