import type { ComponentType } from "react";
import fort from "./fort.mdx";
import verso from "./verso.mdx";

/**
 * Slug → case study body. `app/notes/[slug]/page.tsx` reads this.
 *
 * Registering here is the step that is easy to forget after adding an `.mdx`
 * file, so `content/case-study.test.ts` asserts every experiment appears.
 */
export const caseStudyBodies: Record<string, ComponentType> = {
  verso,
  fort,
};
