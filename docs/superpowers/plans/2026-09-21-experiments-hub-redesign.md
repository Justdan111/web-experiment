# Experiments Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the hub from a two-entry web-experiment index into a thirteen-entry index of mobile and web experiments, styled as the portfolio, deployed on Vercel.

**Architecture:** One `content/experiments.ts` array drives the index, the filter and every detail page — MDX is removed so there is a single rendering path. The hub keeps `output: "export"`; a root build script assembles it with the two sibling exports into one `dist/` tree, replacing Docker and nginx.

**Tech Stack:** Next 16 (App Router, static export), React 19, Tailwind v4, Vitest, `motion`, `gsap`, `lenis`, `clsx`, Geist Sans + Geist Mono.

**Spec:** `docs/superpowers/specs/2026-09-21-experiments-hub-redesign-design.md`

## Global Constraints

- Colour tokens, exactly: `--background #ffffff`, `--foreground #0a0a0a`, `--muted #f4f4f5`, `--muted-foreground #71717a`, `--border rgba(10, 10, 10, 0.08)`, `--card #f5f5f4`, `--accent #2563eb`, `--accent-foreground #ffffff`. **One accent. No experiment has a hue of its own.**
- Fonts: `Geist` and `Geist_Mono` from `next/font/google`, as `--font-geist-sans` / `--font-geist-mono`.
- Easing everywhere: `[0.22, 1, 0.36, 1]`.
- Site name: `dan / experiments`. Never "Web Experiments".
- **`next/link` is banned in `hub/app/**`.** `/verso/` and `/fort/` are built by a different Next app; a client-side navigation to them 404s. `app/page.test.ts` enforces this — do not weaken it.
- Detail pages are short. Two sections, roughly 50–70 words each.
- The hub stays `output: "export"`. No server components that need a runtime, no route handlers.
- `prefers-reduced-motion: reduce` must disable autoplaying video and entrance animation.
- Run tests with `pnpm test` from `hub/`.

---

### Task 1: Replace Docker with a Vercel build

**Files:**
- Create: `package.json`, `vercel.json`, `scripts/build-site.mjs`
- Delete: `hub/Dockerfile`, `verso/Dockerfile`, `fort/Dockerfile`, `hub/nginx.conf`, `verso/nginx.conf`, `fort/nginx.conf`, `proxy/`, `docker-compose.local.yml`, `.dockerignore`, `.github/workflows/deploy.yml`
- Modify: `scripts/smoke.sh` (default BASE), `docs/deployment.md` (rewrite), `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `dist/` — `dist/index.html` from the hub, `dist/verso/index.html`, `dist/fort/index.html`. `pnpm build` at the repo root produces it.

- [ ] **Step 1: Write the failing test**

`scripts/build-site.test.mjs`:

```js
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dist = join(process.cwd(), "dist");

describe("assembled site", () => {
  it("has been built", () => {
    expect(existsSync(dist), "run `pnpm build` first").toBe(true);
  });

  it.each(["index.html", "verso/index.html", "fort/index.html"])(
    "serves %s",
    (page) => {
      expect(existsSync(join(dist, page))).toBe(true);
    },
  );

  it("leaves no Docker artefacts in the repo", () => {
    const root = readdirSync(process.cwd());
    expect(root).not.toContain("docker-compose.local.yml");
    expect(root).not.toContain("proxy");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd "$(git rev-parse --show-toplevel)" && npx vitest run scripts/build-site.test.mjs`
Expected: FAIL — `dist` does not exist.

- [ ] **Step 3: Delete the Docker layer**

```bash
cd "$(git rev-parse --show-toplevel)"
git rm -r --quiet hub/Dockerfile verso/Dockerfile fort/Dockerfile \
  hub/nginx.conf verso/nginx.conf fort/nginx.conf \
  proxy docker-compose.local.yml .dockerignore .github/workflows/deploy.yml
```

- [ ] **Step 4: Write the root package.json**

```json
{
  "name": "web-experiments",
  "private": true,
  "scripts": {
    "build": "node scripts/build-site.mjs",
    "audit": "node scripts/audit-export.mjs dist",
    "smoke": "scripts/smoke.sh",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.7"
  },
  "packageManager": "pnpm@10.17.0"
}
```

- [ ] **Step 5: Write `scripts/build-site.mjs`**

```js
#!/usr/bin/env node
// Assembles the three static exports into one tree, which is what nginx used
// to do at request time. Each app already emits its files at the path it is
// served from (verso and fort set basePath), so this is a copy, not a rewrite.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

/** `from` is relative to the app's own out/, `to` relative to dist/. */
const apps = [
  { name: "hub", from: ".", to: "." },
  { name: "verso", from: "verso", to: "verso" },
  { name: "fort", from: "fort", to: "fort" },
];

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env });

rmSync(dist, { recursive: true, force: true });

for (const app of apps) {
  const cwd = join(root, app.name);
  console.log(`\n── ${app.name} ──`);
  run("pnpm", ["install", "--frozen-lockfile"], cwd);
  run("pnpm", ["build"], cwd);

  const out = join(cwd, "out", app.from);
  if (!existsSync(out)) {
    throw new Error(
      `${app.name} built no export at ${out} — is output: "export" still set?`,
    );
  }
  cpSync(out, join(dist, app.to), { recursive: true });
}

console.log(`\nAssembled ${apps.length} apps into ${dist}`);
```

- [ ] **Step 6: Write `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install --ignore-scripts",
  "framework": null
}
```

- [ ] **Step 7: Point the smoke test at a local static server**

In `scripts/smoke.sh`, change the default base and add the how-to comment:

```bash
# Serve the assembled tree first:
#   pnpm build && npx serve dist -l 8080
BASE="${1:-http://localhost:8080}"
```

- [ ] **Step 8: Build, then run the test**

Run: `pnpm install && pnpm build && npx vitest run scripts/build-site.test.mjs`
Expected: PASS — all four assertions.

- [ ] **Step 9: Rewrite `docs/deployment.md`**

Replace the whole file. It documents: one Vercel project, root directory `.`, build `pnpm build`, output `dist`, and that `verso`/`fort` keep their `basePath` so their URLs are unchanged. Delete every mention of GHCR, Dokploy, Cloudflare and Traefik. State plainly which steps have been verified locally and which have not.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Build the three experiments into one tree for Vercel"
```

---

### Task 2: The content model

**Files:**
- Modify: `hub/content/experiments.ts` (replace wholesale)
- Create: `hub/content/experiments.test.ts` (replace existing)
- Delete: `hub/content/case-studies/`, `hub/content/case-study.test.ts`, `hub/mdx-components.tsx`

**Interfaces:**
- Produces:
  - `type Platform = "mobile" | "web"`
  - `type Category = "Motion" | "Gestures" | "Generative" | "Full flows"`
  - `type Status = "live" | "source" | "wip"`
  - `type Note = { heading: string; body: string }`
  - `type Experiment` — fields as in the spec
  - `const experiments: Experiment[]` — 13 entries, mobile first, `verso` and `fort` last
  - `const CATEGORIES: Category[]`
  - `function byPlatform(p: Platform): Experiment[]`
  - `function countsFor(list: Experiment[]): { platform: Record<Platform, number>; category: Record<Category, number> }`

- [ ] **Step 1: Write the failing test**

`hub/content/experiments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CATEGORIES, countsFor, experiments } from "./experiments";

describe("experiments", () => {
  it("has thirteen", () => {
    expect(experiments).toHaveLength(13);
  });

  it("gives every experiment a unique slug", () => {
    const slugs = experiments.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses url-safe slugs", () => {
    for (const e of experiments) expect(e.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("gives every web experiment a live path and no repo", () => {
    for (const e of experiments.filter((x) => x.platform === "web")) {
      expect(e.live, e.slug).toMatch(/^\/[a-z0-9-]+\/$/);
      expect(e.repo, e.slug).toBeUndefined();
    }
  });

  it("gives every mobile experiment a repo and no live path", () => {
    for (const e of experiments.filter((x) => x.platform === "mobile")) {
      expect(e.repo, e.slug).toMatch(/^https:\/\/github\.com\//);
      expect(e.live, e.slug).toBeUndefined();
    }
  });

  it("splits eleven mobile and two web", () => {
    const { platform } = countsFor(experiments);
    expect(platform).toEqual({ mobile: 11, web: 2 });
  });

  it("counts every experiment into exactly one known category", () => {
    const { category } = countsFor(experiments);
    const total = CATEGORIES.reduce((n, c) => n + category[c], 0);
    expect(total).toBe(experiments.length);
  });

  it("gives every experiment two short notes and at least one tag", () => {
    for (const e of experiments) {
      expect(e.notes, e.slug).toHaveLength(2);
      for (const n of e.notes) {
        expect(n.body.split(/\s+/).length, `${e.slug}/${n.heading}`)
          .toBeLessThanOrEqual(90);
      }
      expect(e.tags.length, e.slug).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd hub && pnpm test`
Expected: FAIL — `CATEGORIES` and `countsFor` are not exported.

- [ ] **Step 3: Write the data file**

Replace `hub/content/experiments.ts`. Types and helpers first:

```ts
export type Platform = "mobile" | "web";
export type Category = "Motion" | "Gestures" | "Generative" | "Full flows";
/** live: a site you can open. source: code only. wip: still being built. */
export type Status = "live" | "source" | "wip";

export type Note = { heading: string; body: string };

export type Experiment = {
  slug: string;
  title: string;
  /** One or two sentences, shown on the card. */
  blurb: string;
  platform: Platform;
  category: Category;
  tags: string[];
  year: number;
  status: Status;
  /** Web only. Built by a different Next app — always link with a plain <a>. */
  live?: string;
  /** Mobile only. */
  repo?: string;
  media: { poster?: string; video?: string };
  notes: Note[];
};

export const CATEGORIES: Category[] = [
  "Motion",
  "Gestures",
  "Generative",
  "Full flows",
];

const REPO = "https://github.com/Justdan111/mobile-interaction/tree/main";
```

Then the thirteen entries, prose condensed from each app's own README in
`../mobile interactions/<folder>/README.md` (and, for moodlift, from
`docs/superpowers/specs/2026-09-13-moodlift-design.md`). Category, status and
tag assignments are fixed as:

| slug | title | platform | category | status | tags |
| --- | --- | --- | --- | --- | --- |
| moodlift | Moodlift | mobile | Full flows | source | Reanimated, Expo Router, SVG, Haptics |
| widget | Widget Lab | mobile | Motion | source | expo-widgets, SwiftUI, Live Activities |
| halftone | Halftone | mobile | Generative | source | Reanimated, Liquid Glass, SVG |
| glucose | Glucose | mobile | Generative | source | SVG, Reanimated, NativeWind |
| rally | Rally | mobile | Gestures | source | Reanimated, Gestures, NativeWind |
| travel | Travel | mobile | Gestures | source | Reanimated, Gestures, expo-blur |
| sushi | Sushi | mobile | Full flows | source | Reanimated, SVG, NativeWind |
| trackit | Trackit | mobile | Motion | source | Reanimated, SVG, Expo Router |
| sora | Sora | mobile | Motion | source | Reanimated, NativeWind, Gradient |
| cars | Cars | mobile | Motion | source | Reanimated, SVG, expo-image |
| chompo | Chompo | mobile | Motion | source | Reanimated, SVG, Anton |
| verso | Verso | web | Motion | live | Next.js, GSAP, Scroll |
| fort | Fort | web | Full flows | live | Next.js, GSAP, Booking |

`repo` is `` `${REPO}/<folder>` `` where folder is the path in the mobile repo —
note the three that differ from the slug: `travel app`, `aiagent/sora`,
`car/cars-proj`, `food/chompo`. URL-encode the space in `travel app`.
`live` is `/verso/` and `/fort/`. Every `media` is `{}` for now — no videos
have been supplied. Each entry's `notes` are exactly two:
`{ heading: "What it is" }` and `{ heading: "How it's built" }`.

- [ ] **Step 4: Add the helpers**

```ts
export function byPlatform(platform: Platform): Experiment[] {
  return experiments.filter((e) => e.platform === platform);
}

export function countsFor(list: Experiment[]) {
  const platform: Record<Platform, number> = { mobile: 0, web: 0 };
  const category: Record<Category, number> = {
    Motion: 0,
    Gestures: 0,
    Generative: 0,
    "Full flows": 0,
  };
  for (const e of list) {
    platform[e.platform] += 1;
    category[e.category] += 1;
  }
  return { platform, category };
}
```

- [ ] **Step 5: Delete the MDX layer**

```bash
cd hub
git rm -r --quiet content/case-studies content/case-study.test.ts mdx-components.tsx
pnpm remove @mdx-js/loader @mdx-js/react @next/mdx @types/mdx
```

Then in `next.config.ts`, drop `createMDX` and the `mdx` page extension:

```ts
import type { NextConfig } from "next";

// The hub is served at the root, so it has no basePath. Its siblings do.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 6: Run the tests**

Run: `cd hub && pnpm test`
Expected: PASS — 8 tests in `experiments.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Index thirteen experiments from one data file"
```

---

### Task 3: Portfolio tokens, fonts and layout

**Files:**
- Modify: `hub/app/globals.css` (replace wholesale), `hub/app/layout.tsx`
- Create: `hub/app/components/SmoothScroll.tsx`

**Interfaces:**
- Produces: the token set as Tailwind colours (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `text-accent`), `font-sans`/`font-mono`, and `<SmoothScroll />`.

- [ ] **Step 1: Replace `hub/app/globals.css`**

All bespoke `.ix-*` and `.cs-*` rules go; the new components are Tailwind. Keep only tokens, the base layer and the reduced-motion block:

```css
@import "tailwindcss";
@import "lenis/dist/lenis.css";

/* The portfolio's palette, unchanged, so the two sites read as siblings.
   One accent: no experiment carries a hue of its own. */
:root {
  color-scheme: light;
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: rgba(10, 10, 10, 0.08);
  --card: #f5f5f4;
  --accent: #2563eb;
  --accent-foreground: #ffffff;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-card: var(--card);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  border-color: var(--border);
}

html.lenis,
html.lenis body {
  height: auto;
}

html:not(.lenis) {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Add the dependencies**

```bash
cd hub && pnpm add clsx gsap lenis motion
```

- [ ] **Step 3: Port `SmoothScroll`**

Copy `~/Documents/portfolio/dan-tech/app/components/SmoothScroll.tsx` to
`hub/app/components/SmoothScroll.tsx` unchanged.

- [ ] **Step 4: Rewrite `hub/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./components/SmoothScroll";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "dan / experiments",
  description:
    "Mobile and web experiments by Emmanuel Ngulube — eleven React Native apps and two sites, each built to answer one question.",
  metadataBase: new URL("https://experiments.dan-code.dev"),
  openGraph: {
    title: "dan / experiments",
    description:
      "Eleven React Native apps and two sites, each built to answer one question.",
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@Dan_code" },
};

export const viewport: Viewport = { colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify it builds**

Run: `cd hub && pnpm build`
Expected: the build fails only on `app/page.tsx` and `app/notes/[slug]/page.tsx`
still referencing deleted classes and the MDX bodies. That is expected — they
are replaced in Tasks 6–8. Confirm no error mentions `globals.css` or fonts.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Take the palette and type from the portfolio"
```

---

### Task 4: Primitives ported from the portfolio

**Files:**
- Create: `hub/app/components/SectionLabel.tsx`, `hub/app/components/Reveal.tsx`, `hub/app/components/icons.tsx`, `hub/app/components/Nav.tsx`, `hub/app/components/Footer.tsx`

**Interfaces:**
- Produces: `<SectionLabel>`, `<Reveal as delay className>`, `<RevealStagger gap>`, `<RevealItem>`, `<Nav />`, `<Footer />`, and the icon set.

- [ ] **Step 1: Copy `SectionLabel` and `Reveal` verbatim**

From `~/Documents/portfolio/dan-tech/app/components/`. Both are already
dependency-free apart from `clsx` and `motion`.

- [ ] **Step 2: Copy `icons.tsx`, keeping only what is used**

Needed: `Menu`, `Close`, `ArrowUpRight`. Add `ArrowUpRight` if the portfolio
lacks it:

```tsx
export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}
      width="14" height="14" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 11L11 5M11 5H6M11 5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 3: Adapt `Nav`**

Start from the portfolio's `Nav.tsx` — same sticky pill, same scroll shadow,
same mobile sheet. Changes: the wordmark reads `dan` over `experiments`; the
links are `[{ href: "#playground", label: "playground" }, { href: "#services",
label: "services" }]`; the two outbound links (`github`, `x`) and the CTA use
plain `<a>` with `target="_blank" rel="noreferrer"`. **Do not import
`next/link`** — `app/page.test.ts` fails the build-time check if you do.

- [ ] **Step 4: Write `Footer`**

Three columns on desktop, stacked on mobile: the wordmark and one line
(`An annex of dan-code.dev.`), a column of outbound links (portfolio, GitHub,
X), and the copyright. Same `border-border` hairline and mono labels as the
rest.

- [ ] **Step 5: Verify the link rule still holds**

Run: `cd hub && pnpm test`
Expected: PASS — `never uses next/link anywhere in the app`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Port the portfolio's nav, footer and reveal primitives"
```

---

### Task 5: The media plate and the experiment card

**Files:**
- Create: `hub/app/components/MediaPlate.tsx`
- Modify: `hub/app/components/ExperimentCard.tsx` (replace wholesale)

**Interfaces:**
- Consumes: `Experiment` from Task 2; `Reveal` from Task 4.
- Produces:
  - `<MediaPlate experiment={e} className?={string} />`
  - `<ExperimentCard experiment={e} index={number} />` — `index` is the 1-based number shown on the card.

- [ ] **Step 1: Write `MediaPlate`**

Three states, in order: video, poster, typographic placeholder. The placeholder
is the shipped state today, so it must look deliberate rather than broken.

```tsx
"use client";

import type { Experiment } from "../../content/experiments";

/**
 * A video when one has been supplied, a poster when only that exists, and
 * otherwise the slug set in mono on the card ground. No experiment has an
 * accent of its own, so every plate sits on the same surface.
 */
export function MediaPlate({ experiment }: { experiment: Experiment }) {
  const { media, title, slug } = experiment;

  if (media.video) {
    return (
      <video
        src={media.video}
        poster={media.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-label={`${title} — screen recording`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  if (media.poster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- images are unoptimized in a static export
      <img
        src={media.poster}
        alt={`${title} — screenshot`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center bg-card"
    >
      <span className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {slug}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `ExperimentCard`**

The reference's anatomy, in the portfolio's clothes: a header row of
`NN` + title + status pill, the category line, the plate, the blurb, then the
tag chips. The whole card is one anchor to the detail page — the live/GitHub
link lives on the detail page, so the card has exactly one target.

```tsx
"use client";

import { motion } from "motion/react";
import type { Experiment } from "../../content/experiments";
import { MediaPlate } from "./MediaPlate";

const easing = [0.22, 1, 0.36, 1] as const;

const STATUS_LABEL = {
  live: "Live demo",
  source: "Source",
  wip: "In progress",
} as const;

export function ExperimentCard({
  experiment,
  index,
}: {
  experiment: Experiment;
  index: number;
}) {
  const { slug, title, blurb, platform, category, tags, status } = experiment;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: easing }}
    >
      {/* Plain anchor, never next/link — see app/page.test.ts. */}
      <a href={`/notes/${slug}/`} className="group block h-full">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {String(index).padStart(2, "0")}
          </span>
          <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
            {title}
          </h3>
          <span className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {STATUS_LABEL[status]}
          </span>
        </div>

        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {platform} · {category}
        </p>

        <div className="relative mt-4 aspect-4/3 overflow-hidden rounded-2xl border border-border transition-transform duration-500 group-hover:scale-[1.01]">
          <MediaPlate experiment={experiment} />
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {blurb}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      </a>
    </motion.li>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Draw an experiment card with its plate, number and tags"
```

---

### Task 6: The filter, and the playground

**Files:**
- Create: `hub/content/filter.ts`, `hub/content/filter.test.ts`, `hub/app/components/FilterRail.tsx`, `hub/app/components/Playground.tsx`

**Interfaces:**
- Consumes: `experiments`, `CATEGORIES`, `countsFor` (Task 2); `ExperimentCard` (Task 5).
- Produces:
  - `type Filter = { kind: "all" } | { kind: "platform"; value: Platform } | { kind: "category"; value: Category }`
  - `function applyFilter(list: Experiment[], filter: Filter): Experiment[]`
  - `function filterKey(filter: Filter): string` — a stable string for React keys and comparison
  - `<Playground />`

- [ ] **Step 1: Write the failing test**

`hub/content/filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";
import { applyFilter, filterKey } from "./filter";

describe("applyFilter", () => {
  it("returns everything for all", () => {
    expect(applyFilter(experiments, { kind: "all" })).toHaveLength(13);
  });

  it("narrows to a platform", () => {
    const got = applyFilter(experiments, { kind: "platform", value: "web" });
    expect(got).toHaveLength(2);
    expect(got.every((e) => e.platform === "web")).toBe(true);
  });

  it("narrows to a category", () => {
    const got = applyFilter(experiments, { kind: "category", value: "Gestures" });
    expect(got.every((e) => e.category === "Gestures")).toBe(true);
    expect(got.length).toBeGreaterThan(0);
  });

  it("preserves the source order", () => {
    const got = applyFilter(experiments, { kind: "platform", value: "mobile" });
    const expected = experiments.filter((e) => e.platform === "mobile");
    expect(got.map((e) => e.slug)).toEqual(expected.map((e) => e.slug));
  });

  it("never returns the same key for two different filters", () => {
    const keys = [
      filterKey({ kind: "all" }),
      filterKey({ kind: "platform", value: "mobile" }),
      filterKey({ kind: "platform", value: "web" }),
      filterKey({ kind: "category", value: "Motion" }),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd hub && pnpm test`
Expected: FAIL — cannot resolve `./filter`.

- [ ] **Step 3: Write `hub/content/filter.ts`**

```ts
import type { Category, Experiment, Platform } from "./experiments";

export type Filter =
  | { kind: "all" }
  | { kind: "platform"; value: Platform }
  | { kind: "category"; value: Category };

export function applyFilter(list: Experiment[], filter: Filter): Experiment[] {
  switch (filter.kind) {
    case "all":
      return list;
    case "platform":
      return list.filter((e) => e.platform === filter.value);
    case "category":
      return list.filter((e) => e.category === filter.value);
  }
}

export function filterKey(filter: Filter): string {
  return filter.kind === "all" ? "all" : `${filter.kind}:${filter.value}`;
}
```

- [ ] **Step 4: Run the tests**

Run: `cd hub && pnpm test`
Expected: PASS.

- [ ] **Step 5: Write `FilterRail`**

One list, two groups divided by a hairline: platform above, craft below, with
`All experiments` at the top and `Showing N of N` at the foot. Every row shows
its count. Each row is a `<button>` with `aria-pressed`. Sticky at
`top-24` from `lg:` up; below that the same rows render as a horizontally
scrolling chip row. The selected row is `bg-muted text-foreground`; the rest
are `text-muted-foreground hover:text-foreground`.

- [ ] **Step 6: Write `Playground`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { experiments } from "../../content/experiments";
import { applyFilter, filterKey, type Filter } from "../../content/filter";
import { ExperimentCard } from "./ExperimentCard";
import { FilterRail } from "./FilterRail";
import { SectionLabel } from "./SectionLabel";

export function Playground() {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const shown = useMemo(() => applyFilter(experiments, filter), [filter]);

  return (
    <section id="playground" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
      <SectionLabel>Studio R&amp;D, in the open</SectionLabel>
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          the playground
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Every experiment is a standalone app that isolates one question — how
          should this feel to touch, how should this page move? Filter it, open
          it, clone it.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,15rem)_1fr]">
        <FilterRail selected={filter} onSelect={setFilter} shown={shown.length} />

        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((experiment, i) => (
              <ExperimentCard
                key={filterKey(filter) + experiment.slug}
                experiment={experiment}
                index={i + 1}
              />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Filter the playground from a counted rail"
```

---

### Task 7: The home page

**Files:**
- Create: `hub/app/components/Hero.tsx`, `hub/app/components/Featured.tsx`, `hub/app/components/Services.tsx`
- Modify: `hub/app/page.tsx` (replace wholesale)

**Interfaces:**
- Consumes: everything from Tasks 4–6.
- Produces: the rendered `/`.

- [ ] **Step 1: Write `Hero`**

Two columns from `lg:` up — the statement on the left, the status rail on the
right; stacked below that. Copy, verbatim:

- Eyebrow: `Mobile and web · 13 builds`
- Heading: `an idea isn't real until it ` then `runs.` in `text-accent`
- Body: `dan / experiments is where I take one question — how should this gesture feel, how should this page move — and build the smallest thing that answers it. Eleven React Native apps, two sites. Each one standalone, each one open.`
- Buttons: `the playground` (solid `bg-foreground text-background`, href `#playground`) and `github ↗` (outlined, outbound).

The rail is four rows, each `border-t border-border py-4` with a mono
uppercase label left and the value right:

| STATUS | `● open for projects` — the dot `bg-green-500` |
| EXPERIMENTS | `13` |
| LATEST DROP | `Moodlift` — links to `/notes/moodlift/` |
| CURRENTLY INTO | `live activities` |

Stagger the heading words with `RevealStagger`, then the body and buttons.

- [ ] **Step 2: Write `Featured`**

Three experiments — `moodlift`, `widget`, `verso` — selected by slug from
`experiments`, rendered larger than the grid cards: plate at `aspect-16/10`,
title, blurb, and one outbound or detail link each. Reuse `MediaPlate`.

- [ ] **Step 3: Write `Services`**

`SectionLabel` `What I do`, a heading, and three `rounded-3xl border-border
p-8` cards with a mono index (`01`–`03`), a title and two lines:

- **Mobile interaction** — React Native and Expo apps, and the gestures,
  transitions and haptics that make them feel handled rather than operated.
- **Web interfaces** — Next.js sites with editorial layout, scroll
  choreography and motion that survives a slow connection.
- **Design to build** — taking a comp to the interaction it implies but
  cannot show, and shipping the result.

- [ ] **Step 4: Rewrite `hub/app/page.tsx`**

```tsx
import { Featured } from "./components/Featured";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Nav } from "./components/Nav";
import { Playground } from "./components/Playground";
import { Services } from "./components/Services";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Featured />
        <Playground />
        <Services />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Build and look at it**

Run: `cd hub && pnpm build && pnpm dev`
Open `http://localhost:3000`. Check at 1440px and at 390px: no horizontal
scroll, the rail becomes a chip row, the grid becomes one column.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Open the hub on a statement, a status rail and the playground"
```

---

### Task 8: The detail page

**Files:**
- Modify: `hub/app/notes/[slug]/page.tsx` (replace wholesale)

**Interfaces:**
- Consumes: `experiments`, `MediaPlate`, `Nav`, `Footer`, `SectionLabel`.
- Produces: 13 static pages at `/notes/<slug>/`.

- [ ] **Step 1: Replace the page**

`generateStaticParams` returns every slug from `experiments` — the separate
`content/case-studies/params.ts` is gone with the MDX. One call to action:
`View live ↗` for web (`experiment.live`), `View on GitHub ↗` for mobile
(`experiment.repo`). Both are plain `<a>`; the live one **must not** be
`next/link`.

```tsx
export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}
```

Layout: `Nav`, then a `max-w-3xl` column — eyebrow (`{platform} · {category}`
via `SectionLabel`), `h1`, summary line, the CTA, the plate at
`aspect-16/10 rounded-3xl border border-border`, tag chips, the two note
sections as `h2` + `p`, then a prev/next row across the full `max-w-6xl`
width, then `Footer`.

- [ ] **Step 2: Verify every page is generated**

Run: `cd hub && pnpm build`
Expected: the route summary lists `/notes/[slug]` with 13 generated paths.

- [ ] **Step 3: Check the link rule and the data**

Run: `cd hub && pnpm test`
Expected: PASS — all tests, `next/link` included.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Give every experiment a short detail page"
```

---

### Task 9: Verify the assembled site, and the docs

**Files:**
- Modify: `README.md`, `hub/README.md`

- [ ] **Step 1: Build the whole tree**

Run: `cd "$(git rev-parse --show-toplevel)" && pnpm build`
Expected: `dist/` with the hub at the root, `dist/verso/`, `dist/fort/`.

- [ ] **Step 2: Audit for escaped assets**

Run: `node scripts/audit-export.mjs dist`
Expected: exit 0 — no asset referenced outside its own prefix.

- [ ] **Step 3: Smoke the site**

```bash
npx serve dist -l 8080 &
scripts/smoke.sh http://localhost:8080
```
Expected: every page and asset 200s, including all 13 `/notes/<slug>/`,
`/verso/` and `/fort/`.

- [ ] **Step 4: Run the full test suite**

Run: `cd hub && pnpm test && cd .. && npx vitest run scripts/build-site.test.mjs`
Expected: PASS.

- [ ] **Step 5: Rewrite the READMEs**

Root `README.md`: the site is `dan / experiments`, thirteen experiments across
mobile and web; local dev is `pnpm build` then serving `dist`, or
`cd hub && pnpm dev` for the hub alone. Delete every Docker instruction.
`hub/README.md`: how to add an experiment — one entry in
`content/experiments.ts`, a video at `public/media/<slug>.mp4`, and nothing
else.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Document the Vercel build and how to add an experiment"
```

---

## Self-review

**Spec coverage.** Deployment → Task 1. Content model → Task 2. Design
language → Tasks 3–4. Pages → Tasks 6–8. Media → Task 5. Testing → Tasks 2,
6, 9.

**Types.** `Experiment`, `Platform`, `Category`, `Status`, `Note` are defined
once in Task 2 and used under those names in Tasks 5–8. `countsFor` returns
`{ platform, category }` in Task 2 and is destructured that way in Task 2's
test and Task 6's rail. `applyFilter`/`filterKey` are defined in Task 6 Step 3
and used in Step 6 with the same signatures.

**Known gap, deliberate:** no videos exist yet, so every card ships the
placeholder plate. `MediaPlate` handles all three states from day one, so
adding a video is one file plus one field — no code change.
