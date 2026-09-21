import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The hub deliberately uses plain <a> everywhere, including for its own
      // routes. Most paths on this host are served by a different container,
      // so client navigation to one breaks; a rule with no exceptions is the
      // point, because the previous targeted version of the check silently
      // stopped applying when card markup moved to its own file. Prefetch buys
      // nothing on a static export of this size. `app/page.test.ts` enforces it.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
