# Verso Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the homepage of Verso, a fictional design studio, reproducing the layout, type system, and scroll choreography of `besign.co/en/` with entirely original identity, copy, and imagery.

**Architecture:** A single-route Next.js App Router page. Content lives in three typed TypeScript modules imported directly by server components. Only four components run on the client — the two that need GSAP, the clock that needs live time, and the theme toggle that needs `localStorage`. The two hardest pieces (3D rail geometry, timezone clocks) are extracted into pure functions in `lib/` so they can be unit-tested without a DOM.

**Tech Stack:** Next 16.3.0, React 19.2.8, GSAP 3.15.0 (+ `@gsap/react`), Tailwind 4, TypeScript 5, pnpm 10.17.0, vitest 3.

**Spec:** `docs/superpowers/specs/2026-08-16-verso-homepage-design.md` — read it before starting. This plan argues from that spec; where the plan is silent, the spec governs.

## Global Constraints

- **Project root is `verso/`**, a new sibling of `fort/` inside the `web experiments` repo. All paths below are relative to `verso/` unless stated otherwise.
- **This is NOT the Next.js you know.** Next 16 has breaking changes from training data. Before writing any Next-specific code (layout props, metadata, image, font APIs), read the relevant guide in `verso/node_modules/next/dist/docs/`. This rule is copied from `fort/AGENTS.md` and applies here identically.
- **Next 16 typed route props:** root layout takes `LayoutProps<"/">`, a generated type. Do not hand-write `{ children }: { children: React.ReactNode }`.
- **Exact pinned versions:** `next@16.3.0`, `react@19.2.8`, `react-dom@19.2.8`, `gsap@^3.15.0`, `eslint-config-next@16.3.0`, `tailwindcss@^4`, `vitest@^3.2.7`. Package manager `pnpm@10.17.0`.
- **GSAP plugins are free in 3.15.** `SplitText`, `ScrollTrigger`, and `Observer` ship in the public `gsap` package. Import as `import { SplitText } from "gsap/SplitText"`. There is no Club license, no auth-gated registry.
- **No runtime network dependencies.** Fonts self-host via `next/font/google` (which downloads at build time). All media is committed to `public/media/`.
- **Copy is verbatim from spec §3.** Do not paraphrase, improve, or shorten any headline, statement, project title, or signoff. If a string looks wrong, flag it — do not silently edit it.
- **Color tokens are exact hex from spec §3.** Do not substitute near values or Tailwind palette colors.
- **Tracking scale is exact:** −0.02em @ 12px, −0.03em @ 16px and 32px, −0.04em @ 40px, −0.05em @ 48px.
- **Layout constants are exact:** 32px desktop gutter, 1376px content width, 8px grid gap, 400px card height.
- **Tests:** vitest, `environment: "node"`, `include: ["app/**/*.test.ts"]`. Test pure logic only. Do not write DOM or animation-state assertions — see the note in Task 8.
- **Every task ends with a commit.** Message style follows the repo: imperative subject, body explaining *why*, and the `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` trailer.
- **Reduced motion is not optional.** Every animated component must bail under `prefers-reduced-motion: reduce`, leaving content fully visible.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `app/layout.tsx` | Root shell: html/body, font variables, metadata, pre-paint theme script |
| `app/page.tsx` | Composes the six sections in order. Server component. |
| `app/globals.css` | Tailwind import, `@theme inline` tokens, light/dark blocks, base resets |
| `app/fonts.ts` | Space Grotesk + Space Mono declarations |
| `app/content/types.ts` | `Work`, `NewsItem`, `NavItem`, `ClockZone`, `Badge` |
| `app/content/works.ts` | All twelve works; the Field and Practice selections |
| `app/content/news.ts` | The four Index entries |
| `app/content/site.ts` | Nav, footer columns, legal, socials, clock zones, hero copy |
| `app/content/content.test.ts` | Content integrity: fields, badges, unique slugs, media on disk |
| `app/lib/gsap.ts` | Single plugin registration point; `prefersReducedMotion()` helper |
| `app/lib/rail.ts` | Pure 3D rail geometry — no React, no DOM |
| `app/lib/rail.test.ts` | Rail layout and wrap math |
| `app/lib/time.ts` | Pure clock formatting and UTC offset labels — no React, no DOM |
| `app/lib/time.test.ts` | Formatting across zones and DST boundaries |
| `app/components/Nav.tsx` | Fixed bar: mark, division links, theme toggle, locale indicator |
| `app/components/ThemeToggle.tsx` | Client. Reads/writes `localStorage.theme` |
| `app/components/Hero.tsx` | Video, split headline, Learn More |
| `app/components/SplitHeadline.tsx` | Client. Per-character reveal |
| `app/components/HighlightRail.tsx` | Client. Perspective container, 3D rail, loop, scroll coupling |
| `app/components/Ticker.tsx` | Client. Edge text marquee |
| `app/components/WorkSection.tsx` | The eyebrow/statement/grid pattern, drives Field and Practice |
| `app/components/WorkCard.tsx` | One work card |
| `app/components/NewsSection.tsx` | Four-up Index grid |
| `app/components/NewsCard.tsx` | One news card |
| `app/components/Footer.tsx` | Oversized nav, clocks, subscribe, socials, legal |
| `app/components/Clock.tsx` | Client. One live clock, hydration-safe |
| `app/components/Reveal.tsx` | Client. Wraps server markup in a scroll-reveal |
| `public/media/` | 16 stills, 1 video, 1 poster frame |
| `public/media/CREDITS.md` | Source URL, photographer, and license for every file |

---

## Task 1: Scaffold the project

**Files:**
- Create: `verso/package.json`, `verso/tsconfig.json`, `verso/next.config.ts`, `verso/vitest.config.ts`, `verso/eslint.config.mjs`, `verso/postcss.config.mjs`, `verso/.gitignore`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/fonts.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a running dev server, a green (empty) test run, and the CSS custom properties every later task styles against: `--ground`, `--text`, `--muted`, `--hairline`, `--mark`, `--accent-field`, `--accent-practice`, `--accent-index`, `--gutter`, `--content`, `--gap`, `--card-h`.

- [ ] **Step 1: Create the app**

From the repo root (`web experiments/`):

```bash
pnpm create next-app@16.3.0 verso --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm
cd verso
pnpm add gsap@^3.15.0 @gsap/react
pnpm add -D vitest@^3.2.7
```

- [ ] **Step 2: Pin versions to match `fort`**

Edit `package.json` so `dependencies` and `devDependencies` match the Global Constraints exactly, and add the test script:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "packageManager": "pnpm@10.17.0"
}
```

Then run `pnpm install`.

- [ ] **Step 3: Add the vitest config**

Create `vitest.config.ts` — identical shape to `fort/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Declare the fonts**

Create `app/fonts.ts`:

```ts
import { Space_Grotesk, Space_Mono } from "next/font/google";

/** The one face that does nearly everything, at weight 500. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

/**
 * Reserved for micro monospace labels — UTC offsets, dates.
 *
 * Named --font-space-mono, not --font-mono: Tailwind's theme already owns
 * --font-mono, and pointing that token at a variable of the same name is a
 * circular reference that silently resolves to nothing.
 */
export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
```

- [ ] **Step 5: Write the design tokens**

Replace `app/globals.css` entirely:

```css
@import "tailwindcss";

/* ============================================================
   VERSO — Kyoto
   Tokens measured from besign.co/en/; see the design spec §2.
   ============================================================ */

@theme inline {
  --font-sans: var(--font-grotesk);
  --font-mono: var(--font-space-mono);
}

:root {
  /* palette — light is the fallback, dark is applied below */
  --ground: #fafafa;
  --text: #000000;
  --muted: #8a8a8a;
  --hairline: rgba(0, 0, 0, 0.1);
  --mark: #ff5b2e;
  --accent-field: #2e7f97;
  --accent-practice: #5b47a8;
  --accent-index: #8a7410;

  /* layout */
  --gutter: 32px;
  --content: 1376px;
  --gap: 8px;
  --card-h: 400px;

  /* optical tracking scale — tightens as size grows */
  --track-12: -0.02em;
  --track-16: -0.03em;
  --track-32: -0.03em;
  --track-40: -0.04em;
  --track-48: -0.05em;
}

[data-theme="dark"] {
  --ground: #0a0a0a;
  --text: #ffffff;
  --muted: #bfbfbf;
  --hairline: rgba(255, 255, 255, 0.1);
  --accent-field: #9fd8e8;
  --accent-practice: #c9b8ff;
  --accent-index: #e8d14a;
}

html {
  background: var(--ground);
  overflow-x: clip;
}

body {
  margin: 0;
  background: var(--ground);
  color: var(--text);
  font-family: var(--font-grotesk), system-ui, sans-serif;
  font-weight: 500;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}

img,
video,
canvas {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

.shell {
  max-width: var(--content);
  margin: 0 auto;
  padding-inline: var(--gutter);
}

@media (max-width: 1199px) {
  :root {
    --gutter: 24px;
  }
}

@media (max-width: 767px) {
  :root {
    --gutter: 16px;
  }
}
```

- [ ] **Step 6: Write the root layout with the pre-paint theme script**

Create `app/layout.tsx`. The inline script is not optional — without it every load flashes the light ground before dark resolves (spec §6).

```tsx
import type { Metadata, Viewport } from "next";
import { spaceGrotesk, spaceMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verso",
  description:
    "Interdisciplinary design studio · Kyoto, Japan. Precise, quiet, durable design systems.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

/** Runs before first paint so the ground never flashes. */
const THEME_BOOT = `
(function(){try{
  var t = localStorage.getItem('theme');
  if (t !== 'light' && t !== 'dark') {
    t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Stub the page**

Replace `app/page.tsx`:

```tsx
export default function Home() {
  return <main />;
}
```

- [ ] **Step 8: Verify the scaffold**

```bash
pnpm test     # expect: "No test files found" — exit 0 is fine here
pnpm build    # expect: clean build, no type errors
pnpm lint     # expect: no errors
```

Then `pnpm dev` and confirm `localhost:3000` serves a near-black page (dark is the default) with no console errors. Toggle your OS to light mode, hard-reload, and confirm it serves a near-white page with **no white-to-dark flash**.

- [ ] **Step 9: Commit**

```bash
cd "web experiments"
git add verso
git commit -m "$(cat <<'EOF'
Scaffold the Verso project

New Next 16 app alongside fort, matching its stack and conventions.
Establishes the design tokens measured from the source site — palette,
layout constants, and the optical tracking scale — plus the pre-paint
theme script that keeps the ground from flashing on load.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Source and commit the media

**Files:**
- Create: `public/media/hero.mp4`, `public/media/hero-poster.jpg`
- Create: `public/media/work/*.jpg` (12 files)
- Create: `public/media/news/*.jpg` (4 files)
- Create: `public/media/CREDITS.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the exact file paths that `app/content/works.ts` and `app/content/news.ts` reference in Task 3, and that `content.test.ts` asserts exist on disk. **Filenames below are contractual — Task 3 hardcodes them.**

This task comes before content because the content integrity test checks that every referenced media file exists. Building content first would mean writing a test you know fails for a reason unrelated to the code.

- [ ] **Step 1: Create the directories**

```bash
mkdir -p public/media/work public/media/news
```

- [ ] **Step 2: Source the twelve work stills**

All from Unsplash. Use WebSearch/WebFetch to find a photo matching each brief, then download it. The look is one system: **dark, high contrast, architectural or macro-textural, desaturated, no people's faces, no visible branding**. Reject anything that reads as generic corporate stock.

Narrow slots are **700×880** (portrait), the one wide slot is **1400×880**.

| File | Brief | Size |
| --- | --- | --- |
| `work/terminal-grotesk.jpg` | Macro of metal or letterpress type, raking light | 700×880 |
| `work/atlas-of-quiet-places.jpg` | Empty architectural interior, hard shadow | 700×880 |
| `work/signal-noise.jpg` | Moiré, interference pattern, or CRT texture | 1400×880 |
| `work/halide-capital.jpg` | Glass and steel facade, cold, geometric | 1400×880 |
| `work/nomad-audio.jpg` | Dark product macro — metal mesh, knurling | 700×880 |
| `work/orbital-health.jpg` | Clean gradient or soft-focus light study | 700×880 |
| `work/kiosk.jpg` | Night storefront, neon spill on wet ground | 700×880 |
| `work/meridian-press.jpg` | Stacked paper, ink, printing press detail | 700×880 |
| `work/bell-and-bone.jpg` | Ceramic or bone-white still life, low key | 700×880 |
| `work/grain-specimen.jpg` | Extreme film-grain or paper-fibre macro | 700×880 |
| `work/verso-rebrand.jpg` | Folded paper, open book spine, shadow | 700×880 |
| `work/low-tide.jpg` | Dark shoreline, long exposure water | 700×880 |

Download each with an explicit size and record the source. Unsplash's URL API takes the size as query params:

```bash
curl -L "https://images.unsplash.com/photo-<ID>?w=700&h=880&fit=crop&fm=jpg&q=80" \
  -o public/media/work/terminal-grotesk.jpg
```

- [ ] **Step 3: Source the four news stills**

Same look, **700×520** (landscape).

| File | Brief |
| --- | --- |
| `news/walk-lisbon.jpg` | Lisbon — azulejo tile, strong sun, repetition |
| `news/walk-kyoto.jpg` | Kyoto — timber, restraint, soft grey light |
| `news/halide-partnership.jpg` | Studio interior, desk, work in progress |
| `news/field-residency.jpg` | Workshop or archive shelving, ordered |

- [ ] **Step 4: Source the hero video**

From Pexels Videos, free licence. Dark and abstract — ink in water, light through glass, slow drifting particles. **Requirements: at least 1920×1080, under 6MB, and it must loop without an obvious cut.** Trim and compress if needed:

```bash
ffmpeg -i raw.mp4 -t 12 -vf scale=1920:-2 -c:v libx264 -crf 30 -preset slow \
  -an -movflags +faststart public/media/hero.mp4
```

Then extract the poster frame, which the `<video>` shows before playback and falls back to on error:

```bash
ffmpeg -i public/media/hero.mp4 -frames:v 1 -q:v 3 public/media/hero-poster.jpg
```

- [ ] **Step 5: Verify every file landed at the right size**

```bash
ls public/media/work | wc -l    # expect: 12
ls public/media/news | wc -l    # expect: 4
du -h public/media/hero.mp4     # expect: under 6M
find public/media -name '*.jpg' -size -10k   # expect: no output (no truncated downloads)
```

- [ ] **Step 6: Write the credits file**

Create `public/media/CREDITS.md`. Every row must be filled with the real URL and photographer — this is the file that makes the media legitimately usable.

```markdown
# Media credits

All imagery is used under the Unsplash Licence or the Pexels Licence, both of
which permit commercial use without attribution. Attribution is recorded here
anyway, because it costs nothing and it is the right thing to do.

| File | Source | Photographer | Licence |
| --- | --- | --- | --- |
| `hero.mp4` | https://www.pexels.com/video/... | ... | Pexels |
| `work/terminal-grotesk.jpg` | https://unsplash.com/photos/... | ... | Unsplash |
| ... | ... | ... | ... |
```

- [ ] **Step 7: Commit**

```bash
git add verso/public/media
git commit -m "$(cat <<'EOF'
Add curated media for the Verso homepage

Sixteen stills and one hero loop, all Unsplash and Pexels free-licence,
picked to one look: dark, high contrast, architectural and textural.
Every source URL and photographer recorded in CREDITS.md.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: The content layer

**Files:**
- Create: `app/content/types.ts`, `app/content/works.ts`, `app/content/news.ts`, `app/content/site.ts`
- Test: `app/content/content.test.ts`

**Interfaces:**
- Consumes: the media filenames from Task 2.
- Produces — every later task imports from here:
  - `type Badge = "T" | "E" | "P" | "I" | "W"`
  - `type Work = { slug: string; title: string; subtitle: string; badges: Badge[]; image: string; wide: boolean }`
  - `type NewsItem = { slug: string; category: string; date: string; headline: string; image: string; accent: string }`
  - `type ClockZone = { timeZone: string | null; city: string }`
  - `WORKS: Work[]` (12), `FIELD_WORKS: Work[]` (3), `PRACTICE_WORKS: Work[]` (3)
  - `NEWS: NewsItem[]` (4)
  - `NAV: NavItem[]`, `FOOTER_COLUMNS: NavItem[][]`, `HERO`, `FIELD`, `PRACTICE`, `INDEX_SECTION`, `LEGAL`, `SOCIALS`, `CLOCKS`

- [ ] **Step 1: Write the failing test**

Create `app/content/content.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FIELD_WORKS, PRACTICE_WORKS, WORKS } from "./works";
import { NEWS } from "./news";
import { CLOCKS, FOOTER_COLUMNS, NAV } from "./site";

const BADGES = new Set(["T", "E", "P", "I", "W"]);
const publicPath = (p: string) => join(process.cwd(), "public", p);

describe("WORKS", () => {
  it("has the twelve works the highlight rail needs", () => {
    expect(WORKS).toHaveLength(12);
  });

  it("gives every work a unique slug", () => {
    expect(new Set(WORKS.map((w) => w.slug)).size).toBe(WORKS.length);
  });

  it("gives every work non-empty copy", () => {
    for (const w of WORKS) {
      expect(w.title.trim(), w.slug).not.toBe("");
      expect(w.subtitle.trim(), w.slug).not.toBe("");
    }
  });

  it("only uses badge letters the card legend defines", () => {
    for (const w of WORKS) {
      expect(w.badges.length, w.slug).toBeGreaterThan(0);
      for (const b of w.badges) expect(BADGES.has(b), `${w.slug}: ${b}`).toBe(true);
    }
  });

  it("points every work at an image that exists on disk", () => {
    for (const w of WORKS) {
      expect(existsSync(publicPath(w.image)), w.image).toBe(true);
    }
  });
});

describe("section selections", () => {
  it("shows three works in each grid", () => {
    expect(FIELD_WORKS).toHaveLength(3);
    expect(PRACTICE_WORKS).toHaveLength(3);
  });

  it("draws both grids from WORKS", () => {
    const slugs = new Set(WORKS.map((w) => w.slug));
    for (const w of [...FIELD_WORKS, ...PRACTICE_WORKS]) {
      expect(slugs.has(w.slug), w.slug).toBe(true);
    }
  });

  it("gives each grid exactly one wide card", () => {
    expect(FIELD_WORKS.filter((w) => w.wide)).toHaveLength(1);
    expect(PRACTICE_WORKS.filter((w) => w.wide)).toHaveLength(1);
  });
});

describe("NEWS", () => {
  it("has the four entries the grid shows", () => {
    expect(NEWS).toHaveLength(4);
  });

  it("points every entry at an image that exists on disk", () => {
    for (const n of NEWS) {
      expect(existsSync(publicPath(n.image)), n.image).toBe(true);
    }
  });

  it("formats every date as M/D/YY", () => {
    for (const n of NEWS) {
      expect(n.date, n.slug).toMatch(/^\d{1,2}\/\d{1,2}\/\d{2}$/);
    }
  });
});

describe("site chrome", () => {
  it("lists the five divisions in the nav", () => {
    expect(NAV.map((n) => n.label)).toEqual([
      "Field",
      "Practice",
      "Foundry",
      "Index",
      "Goods",
    ]);
  });

  it("splits the footer into two five-item columns", () => {
    expect(FOOTER_COLUMNS).toHaveLength(2);
    for (const col of FOOTER_COLUMNS) expect(col).toHaveLength(5);
  });

  it("pairs a visitor-local clock with the Kyoto studio clock", () => {
    expect(CLOCKS).toHaveLength(2);
    expect(CLOCKS[0].timeZone).toBeNull();
    expect(CLOCKS[1].timeZone).toBe("Asia/Tokyo");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
pnpm test
```

Expected: FAIL — cannot resolve `./works`, `./news`, `./site`.

- [ ] **Step 3: Write the types**

Create `app/content/types.ts`:

```ts
/** T Type · E Editorial · P Product · I Identity · W Web */
export type Badge = "T" | "E" | "P" | "I" | "W";

export type Work = {
  slug: string;
  title: string;
  subtitle: string;
  badges: Badge[];
  /** Path under /public, with a leading slash. */
  image: string;
  /** True for the card that takes the 2fr slot in its grid. */
  wide: boolean;
};

export type NewsItem = {
  slug: string;
  category: string;
  /** M/D/YY, matching the source site's format. */
  date: string;
  headline: string;
  image: string;
  /** A CSS custom property name, e.g. "--accent-index". */
  accent: string;
};

export type NavItem = { label: string; href: string };

/** A null timeZone means "resolve the visitor's own zone on the client". */
export type ClockZone = { timeZone: string | null; city: string };
```

- [ ] **Step 4: Write the works**

Create `app/content/works.ts`. Titles and subtitles are verbatim from spec §3:

```ts
import type { Work } from "./types";

export const WORKS: Work[] = [
  {
    slug: "terminal-grotesk",
    title: "Terminal Grotesk",
    subtitle: "Variable Typeface, 9 Weights",
    badges: ["T"],
    image: "/media/work/terminal-grotesk.jpg",
    wide: false,
  },
  {
    slug: "atlas-of-quiet-places",
    title: "Atlas of Quiet Places",
    subtitle: "Editorial & Photographic Study",
    badges: ["E"],
    image: "/media/work/atlas-of-quiet-places.jpg",
    wide: false,
  },
  {
    slug: "signal-noise",
    title: "Signal / Noise",
    subtitle: "Generative Poster Series",
    badges: ["E", "W"],
    image: "/media/work/signal-noise.jpg",
    wide: true,
  },
  {
    slug: "halide-capital",
    title: "Halide Capital",
    subtitle: "Brand Identity & Digital Platform",
    badges: ["I", "W"],
    image: "/media/work/halide-capital.jpg",
    wide: true,
  },
  {
    slug: "nomad-audio",
    title: "Nomad Audio",
    subtitle: "In progress",
    badges: ["P"],
    image: "/media/work/nomad-audio.jpg",
    wide: false,
  },
  {
    slug: "orbital-health",
    title: "Orbital Health",
    subtitle: "Interface System",
    badges: ["W", "P"],
    image: "/media/work/orbital-health.jpg",
    wide: false,
  },
  {
    slug: "kiosk",
    title: "Kiosk",
    subtitle: "Retail Identity",
    badges: ["I"],
    image: "/media/work/kiosk.jpg",
    wide: false,
  },
  {
    slug: "meridian-press",
    title: "Meridian Press",
    subtitle: "Imprint & Book Design",
    badges: ["E", "I"],
    image: "/media/work/meridian-press.jpg",
    wide: false,
  },
  {
    slug: "bell-and-bone",
    title: "Bell & Bone",
    subtitle: "Packaging System",
    badges: ["P", "I"],
    image: "/media/work/bell-and-bone.jpg",
    wide: false,
  },
  {
    slug: "grain-specimen",
    title: "Grain Type Specimen",
    subtitle: "Specimen Site",
    badges: ["T", "W"],
    image: "/media/work/grain-specimen.jpg",
    wide: false,
  },
  {
    slug: "verso-rebrand",
    title: "Verso Rebrand",
    subtitle: "Studio Identity",
    badges: ["I"],
    image: "/media/work/verso-rebrand.jpg",
    wide: false,
  },
  {
    slug: "low-tide",
    title: "Low Tide",
    subtitle: "Photographic Series",
    badges: ["E"],
    image: "/media/work/low-tide.jpg",
    wide: false,
  },
];

const bySlug = (slug: string): Work => {
  const found = WORKS.find((w) => w.slug === slug);
  if (!found) throw new Error(`Unknown work slug: ${slug}`);
  return found;
};

/** Field grid — 1fr 1fr 2fr, so the wide card sits last. */
export const FIELD_WORKS: Work[] = [
  bySlug("terminal-grotesk"),
  bySlug("atlas-of-quiet-places"),
  bySlug("signal-noise"),
];

/** Practice grid — 2fr 1fr 1fr, so the wide card sits first. */
export const PRACTICE_WORKS: Work[] = [
  bySlug("halide-capital"),
  bySlug("nomad-audio"),
  bySlug("orbital-health"),
];
```

- [ ] **Step 5: Write the news**

Create `app/content/news.ts`. Headlines verbatim from spec §3:

```ts
import type { NewsItem } from "./types";

export const NEWS: NewsItem[] = [
  {
    slug: "walk-lisbon",
    category: "VERSO WALK",
    date: "3/14/26",
    headline: "Verso Walk Lisbon: light, tile, and repetition",
    image: "/media/news/walk-lisbon.jpg",
    accent: "--mark",
  },
  {
    slug: "walk-kyoto",
    category: "VERSO WALK",
    date: "11/2/25",
    headline: "Verso Walk Kyoto: on restraint",
    image: "/media/news/walk-kyoto.jpg",
    accent: "--mark",
  },
  {
    slug: "halide-partnership",
    category: "PRACTICE",
    date: "9/18/25",
    headline: "Verso partners with Halide Capital on a full rebrand",
    image: "/media/news/halide-partnership.jpg",
    accent: "--accent-practice",
  },
  {
    slug: "field-residency",
    category: "INDEX",
    date: "7/25/25",
    headline: "Verso Field opens applications for the 2026 residency",
    image: "/media/news/field-residency.jpg",
    accent: "--accent-index",
  },
];
```

- [ ] **Step 6: Write the site chrome**

Create `app/content/site.ts`. All copy verbatim from spec §3:

```ts
import type { ClockZone, NavItem } from "./types";

export const NAV: NavItem[] = [
  { label: "Field", href: "/field" },
  { label: "Practice", href: "/practice" },
  { label: "Foundry", href: "/foundry" },
  { label: "Index", href: "/index" },
  { label: "Goods", href: "/goods" },
];

export const FOOTER_COLUMNS: NavItem[][] = [
  [
    { label: "Home", href: "/" },
    { label: "Field", href: "/field" },
    { label: "Practice", href: "/practice" },
    { label: "Foundry", href: "/foundry" },
    { label: "Goods", href: "/goods" },
  ],
  [
    { label: "All Works", href: "/works" },
    { label: "About Us", href: "/about" },
    { label: "Project Inquiry", href: "/inquiry" },
    { label: "Index", href: "/index" },
    { label: "Open Positions", href: "/open-positions" },
  ],
];

export const HERO = {
  statement:
    "Verso builds precise, quiet, and durable design systems for companies working at the edge of technology, culture, and language.",
  link: "Learn More",
} as const;

export const FIELD = {
  label: "Field",
  accent: "--accent-field",
  statement:
    "We follow our own curiosity, testing new forms, tools, and typefaces before anyone asks us to.",
} as const;

export const PRACTICE = {
  label: "Practice",
  accent: "--accent-practice",
  statement:
    "We take on outside work. From identity to interface, we deliver considered, rigorous, and complete design systems.",
} as const;

export const INDEX_SECTION = { label: "Index", accent: "--accent-index" } as const;

/** First clock resolves to the visitor's own zone; second is the studio. */
export const CLOCKS: ClockZone[] = [
  { timeZone: null, city: "LOCAL" },
  { timeZone: "Asia/Tokyo", city: "KYOTO" },
];

export const SOCIALS: NavItem[] = [
  { label: "Email", href: "mailto:studio@verso.example" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X", href: "https://x.com" },
];

export const LEGAL = {
  copyright: "© 2026 Verso Studio",
  rights: "All rights reserved.",
  notice:
    "This website and all its content, including all text, graphics, videos, and photos, are copyrighted materials of Verso Studio or various third parties.",
  signoff: "The other side of the page.",
} as const;
```

- [ ] **Step 7: Run the tests**

```bash
pnpm test
```

Expected: PASS, all suites. If the disk-existence assertions fail, Task 2's filenames and these paths disagree — fix the content paths to match what is actually on disk, not the other way round.

- [ ] **Step 8: Commit**

```bash
git add verso/app/content
git commit -m "$(cat <<'EOF'
Add the Verso content layer

Three typed modules — works, news, site chrome — imported directly by
server components. No CMS: for one page that is the honest answer, and
works.ts is the seam a real content source would slot into.

The integrity test checks what actually breaks silently: duplicate
slugs, badge letters outside the legend, and image paths that point at
files no longer on disk.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Clock formatting

**Files:**
- Create: `app/lib/time.ts`
- Test: `app/lib/time.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, for `Clock.tsx` in Task 11:
  - `formatClock(now: Date, timeZone: string): string` → `"20:38"`, always 24-hour, always zero-padded
  - `utcOffsetLabel(now: Date, timeZone: string): string` → `"UTC+9"`, `"UTC-5"`, `"UTC+0"`, `"UTC+5:30"`
  - `resolveTimeZone(): string` → the visitor's IANA zone

- [ ] **Step 1: Write the failing test**

Create `app/lib/time.test.ts`. The DST cases are the point of this suite — a naive fixed-offset implementation passes every other assertion and fails these two.

```ts
import { describe, expect, it } from "vitest";
import { formatClock, utcOffsetLabel } from "./time";

// 2026-01-15 12:00 UTC — northern winter
const WINTER = new Date("2026-01-15T12:00:00Z");
// 2026-07-15 12:00 UTC — northern summer
const SUMMER = new Date("2026-07-15T12:00:00Z");

describe("formatClock", () => {
  it("renders 24-hour time for the studio zone", () => {
    expect(formatClock(WINTER, "Asia/Tokyo")).toBe("21:00");
  });

  it("zero-pads the hour", () => {
    expect(formatClock(new Date("2026-01-15T23:05:00Z"), "UTC")).toBe("23:05");
    expect(formatClock(new Date("2026-01-15T04:05:00Z"), "UTC")).toBe("04:05");
  });

  it("renders midnight as 00:00, never 24:00", () => {
    expect(formatClock(new Date("2026-01-15T00:00:00Z"), "UTC")).toBe("00:00");
  });

  it("handles a half-hour offset zone", () => {
    expect(formatClock(WINTER, "Asia/Kolkata")).toBe("17:30");
  });
});

describe("utcOffsetLabel", () => {
  it("labels the studio zone", () => {
    expect(utcOffsetLabel(WINTER, "Asia/Tokyo")).toBe("UTC+9");
  });

  it("labels UTC itself with an explicit zero", () => {
    expect(utcOffsetLabel(WINTER, "UTC")).toBe("UTC+0");
  });

  it("labels a negative offset", () => {
    expect(utcOffsetLabel(WINTER, "America/New_York")).toBe("UTC-5");
  });

  it("follows a zone across its DST boundary", () => {
    expect(utcOffsetLabel(WINTER, "America/New_York")).toBe("UTC-5");
    expect(utcOffsetLabel(SUMMER, "America/New_York")).toBe("UTC-4");
  });

  it("follows Lisbon across its DST boundary", () => {
    expect(utcOffsetLabel(WINTER, "Europe/Lisbon")).toBe("UTC+0");
    expect(utcOffsetLabel(SUMMER, "Europe/Lisbon")).toBe("UTC+1");
  });

  it("keeps Tokyo fixed, because Japan observes no DST", () => {
    expect(utcOffsetLabel(WINTER, "Asia/Tokyo")).toBe("UTC+9");
    expect(utcOffsetLabel(SUMMER, "Asia/Tokyo")).toBe("UTC+9");
  });

  it("renders a half-hour offset with minutes", () => {
    expect(utcOffsetLabel(WINTER, "Asia/Kolkata")).toBe("UTC+5:30");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
pnpm test app/lib/time.test.ts
```

Expected: FAIL — cannot resolve `./time`.

- [ ] **Step 3: Implement**

Create `app/lib/time.ts`. Everything routes through `Intl`, which is what makes DST correct for free:

```ts
/** 24-hour, zero-padded wall time in the given IANA zone. */
export function formatClock(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

/**
 * "UTC+9", "UTC-5", "UTC+0", "UTC+5:30".
 *
 * Derived from Intl rather than a lookup table so that daylight saving is
 * handled by the platform's tz database instead of by us.
 */
export function utcOffsetLabel(now: Date, timeZone: string): string {
  const raw =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";

  // longOffset yields "GMT+09:00", or bare "GMT" at exactly zero.
  const match = raw.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return "UTC+0";

  const [, sign, hours, minutes] = match;
  const h = Number(hours);
  const m = Number(minutes);
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${minutes}`;
}

/** The visitor's own IANA zone. Client-only — there is no such thing on the server. */
export function resolveTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
```

- [ ] **Step 4: Run the tests**

```bash
pnpm test app/lib/time.test.ts
```

Expected: PASS, all 12 assertions.

- [ ] **Step 5: Commit**

```bash
git add verso/app/lib/time.ts verso/app/lib/time.test.ts
git commit -m "$(cat <<'EOF'
Add clock formatting for the footer

Wall time and UTC offset labels derived from Intl rather than a lookup
table, so daylight saving comes from the platform tz database instead
of from us. The DST assertions are the point of the suite — a fixed
offset implementation passes everything else and fails those.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Rail geometry

**Files:**
- Create: `app/lib/rail.ts`
- Test: `app/lib/rail.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, for `HighlightRail.tsx` in Task 9:
  - `type RailConfig = { count: number; cardWidth: number; gap: number; yJitter: number; scaleJitter: number }`
  - `type RailCard = { index: number; x: number; y: number; scale: number }`
  - `DESKTOP_RAIL`, `TABLET_RAIL`, `MOBILE_RAIL: RailConfig`
  - `railLayout(config: RailConfig): RailCard[]`
  - `railSpan(config: RailConfig): number` — total loop distance in px
  - `wrapX(x: number, span: number): number`

**Design note.** Cards are laid out in a straight line along x, all at z = 0. The *rail itself* carries the 3D rotation, so perspective produces the depth and scale falloff for free. This is why there is no per-card z: adding one would fight the container's projection and make the loop impossible to close.

- [ ] **Step 1: Write the failing test**

Create `app/lib/rail.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DESKTOP_RAIL,
  MOBILE_RAIL,
  TABLET_RAIL,
  railLayout,
  railSpan,
  wrapX,
} from "./rail";

describe("rail configs", () => {
  it("thins the rail out as the viewport narrows", () => {
    expect(DESKTOP_RAIL.count).toBe(12);
    expect(TABLET_RAIL.count).toBe(10);
    expect(MOBILE_RAIL.count).toBe(8);
  });
});

describe("railLayout", () => {
  it("returns one card per configured slot", () => {
    expect(railLayout(DESKTOP_RAIL)).toHaveLength(12);
    expect(railLayout(MOBILE_RAIL)).toHaveLength(8);
  });

  it("spaces cards evenly by width plus gap", () => {
    const cards = railLayout(DESKTOP_RAIL);
    const step = DESKTOP_RAIL.cardWidth + DESKTOP_RAIL.gap;
    expect(cards[0].x).toBe(0);
    expect(cards[1].x).toBe(step);
    expect(cards[5].x).toBe(step * 5);
  });

  it("is deterministic, so server and client agree", () => {
    expect(railLayout(DESKTOP_RAIL)).toEqual(railLayout(DESKTOP_RAIL));
  });

  it("keeps vertical jitter inside its configured bound", () => {
    for (const c of railLayout(DESKTOP_RAIL)) {
      expect(Math.abs(c.y)).toBeLessThanOrEqual(DESKTOP_RAIL.yJitter);
    }
  });

  it("keeps scale jitter inside its configured bound", () => {
    for (const c of railLayout(DESKTOP_RAIL)) {
      expect(Math.abs(c.scale - 1)).toBeLessThanOrEqual(DESKTOP_RAIL.scaleJitter);
    }
  });

  it("does not place every card at the same height", () => {
    const ys = new Set(railLayout(DESKTOP_RAIL).map((c) => c.y));
    expect(ys.size).toBeGreaterThan(1);
  });
});

describe("railSpan", () => {
  it("measures the full loop distance", () => {
    const step = DESKTOP_RAIL.cardWidth + DESKTOP_RAIL.gap;
    expect(railSpan(DESKTOP_RAIL)).toBe(step * DESKTOP_RAIL.count);
  });
});

describe("wrapX", () => {
  const span = 1000;

  it("leaves a value inside the span untouched", () => {
    expect(wrapX(0, span)).toBe(0);
    expect(wrapX(400, span)).toBe(400);
  });

  it("wraps a value past the end back to the start", () => {
    expect(wrapX(1000, span)).toBe(0);
    expect(wrapX(1200, span)).toBe(200);
  });

  it("wraps a negative value up into the span", () => {
    expect(wrapX(-100, span)).toBe(900);
    expect(wrapX(-1100, span)).toBe(900);
  });

  it("is continuous across the seam, so the loop never jumps", () => {
    const before = wrapX(span - 0.001, span);
    const after = wrapX(0.001, span);
    expect(before).toBeCloseTo(span, 2);
    expect(after).toBeCloseTo(0, 2);
  });

  it("always returns a value inside [0, span)", () => {
    for (const x of [-5000, -1, 0, 1, 999, 1000, 7777]) {
      const w = wrapX(x, span);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(span);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
pnpm test app/lib/rail.test.ts
```

Expected: FAIL — cannot resolve `./rail`.

- [ ] **Step 3: Implement**

Create `app/lib/rail.ts`:

```ts
export type RailConfig = {
  /** How many cards ride the rail. */
  count: number;
  cardWidth: number;
  gap: number;
  /** Max vertical wander, px, applied symmetrically. */
  yJitter: number;
  /** Max scale deviation from 1, applied symmetrically. */
  scaleJitter: number;
};

export type RailCard = {
  index: number;
  x: number;
  y: number;
  scale: number;
};

export const DESKTOP_RAIL: RailConfig = {
  count: 12,
  cardWidth: 340,
  gap: 24,
  yJitter: 48,
  scaleJitter: 0.08,
};

export const TABLET_RAIL: RailConfig = {
  count: 10,
  cardWidth: 280,
  gap: 20,
  yJitter: 36,
  scaleJitter: 0.06,
};

export const MOBILE_RAIL: RailConfig = {
  count: 8,
  cardWidth: 200,
  gap: 16,
  yJitter: 20,
  scaleJitter: 0.04,
};

/**
 * Deterministic pseudo-random in [0, 1) from an integer seed.
 *
 * Deliberately not Math.random: the layout has to be identical on every
 * call so the rail does not reshuffle on re-render.
 */
function noise(seed: number): number {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

/** Signed jitter in [-amount, amount]. */
function jitter(seed: number, amount: number): number {
  return (noise(seed) * 2 - 1) * amount;
}

/**
 * Card positions along the rail.
 *
 * All cards sit at z = 0 — the rail element carries the 3D rotation, so
 * perspective supplies the depth and the scale falloff. The jitter here is
 * only the organic wander on top of that.
 */
export function railLayout(config: RailConfig): RailCard[] {
  const step = config.cardWidth + config.gap;
  return Array.from({ length: config.count }, (_, index) => ({
    index,
    x: index * step,
    y: jitter(index + 1, config.yJitter),
    scale: 1 + jitter(index + 101, config.scaleJitter),
  }));
}

/** Total loop distance: wrapping by this lands the rail back on itself. */
export function railSpan(config: RailConfig): number {
  return (config.cardWidth + config.gap) * config.count;
}

/** Fold any x into [0, span). Matches gsap.utils.wrap semantics. */
export function wrapX(x: number, span: number): number {
  return ((x % span) + span) % span;
}
```

- [ ] **Step 4: Run the tests**

```bash
pnpm test app/lib/rail.test.ts
```

Expected: PASS, all assertions.

- [ ] **Step 5: Commit**

```bash
git add verso/app/lib/rail.ts verso/app/lib/rail.test.ts
git commit -m "$(cat <<'EOF'
Add rail geometry for the highlight wall

Pure layout math, no React and no DOM, which is what makes the hardest
piece of the page testable at all. Cards sit in a straight line at z=0
and the rail element carries the rotation, so perspective supplies the
depth for free — a per-card z would fight the projection and make the
loop impossible to close.

Jitter is a seeded hash rather than Math.random so the layout cannot
reshuffle between renders.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: GSAP setup and the Reveal wrapper

**Files:**
- Create: `app/lib/gsap.ts`, `app/components/Reveal.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `registerGsap(): void` — idempotent plugin registration
  - `prefersReducedMotion(): boolean`
  - `<Reveal delay?: number stagger?: boolean className?: string>` — wraps server markup and reveals it on scroll

- [ ] **Step 1: Write the GSAP entry point**

Create `app/lib/gsap.ts`. One registration point, so no component ever calls `registerPlugin` itself:

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

/** Idempotent — safe to call from every client component that needs GSAP. */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  registered = true;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export { gsap, ScrollTrigger, SplitText };
```

- [ ] **Step 2: Write the Reveal wrapper**

Create `app/components/Reveal.tsx`. The critical rule from spec §6: the hidden state is set **in JavaScript**, never in CSS, so a JS failure leaves the page readable rather than blank.

```tsx
"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion, registerGsap } from "../lib/gsap";

type Props = {
  children: ReactNode;
  /** Stagger direct children instead of revealing the block as one. */
  stagger?: boolean;
  delay?: number;
  className?: string;
  /** Grid sections pass grid-template-columns through here. */
  style?: CSSProperties;
};

export default function Reveal({ children, stagger, delay = 0, className, style }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion()) return;

      const targets = stagger
        ? Array.from(root.current?.children ?? [])
        : [root.current];
      if (!targets.length) return;

      gsap.from(targets, {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        delay,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: root.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className} style={style}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm build
pnpm lint
```

Expected: clean. Nothing renders yet — this task ships infrastructure the next five consume.

- [ ] **Step 4: Commit**

```bash
git add verso/app/lib/gsap.ts verso/app/components/Reveal.tsx
git commit -m "$(cat <<'EOF'
Add GSAP registration and the scroll-reveal wrapper

Single registration point so no component reaches for registerPlugin on
its own. Reveal sets its hidden state in JavaScript rather than CSS, so
if JS fails or is slow the page reads fully instead of rendering blank.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Nav and theme toggle

**Files:**
- Create: `app/components/Nav.tsx`, `app/components/ThemeToggle.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `NAV` from `content/site`.
- Produces: `<Nav />`, fixed at the top of every section.

- [ ] **Step 1: Write the theme toggle**

Create `app/components/ThemeToggle.tsx`. It reads the attribute the boot script already set, so the two can never disagree:

```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Read what the pre-paint boot script decided; never re-derive it.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage: the toggle still works for this session.
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="text-[16px] leading-none opacity-60 transition-opacity hover:opacity-100"
      style={{ letterSpacing: "var(--track-16)", color: "var(--muted)" }}
    >
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}
```

- [ ] **Step 2: Write the nav**

Create `app/components/Nav.tsx`. Per spec §3 the locale control is a **static indicator, not a toggle** — the Chinese locale is out of scope, and a control that does nothing when clicked is worse than one that plainly reads as current state.

```tsx
import { NAV } from "../content/site";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className="mx-auto flex h-14 max-w-(--content) items-center justify-between px-(--gutter)"
        style={{ letterSpacing: "var(--track-16)" }}
      >
        {/* The mark. A verso is the reverse side of a leaf, hence the flip. */}
        <a href="/" aria-label="Verso, home" className="text-[18px] font-bold">
          <span style={{ color: "var(--mark)" }}>V</span>
        </a>

        <ul className="hidden gap-8 text-[16px] md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <span
                className="cursor-default transition-colors"
                style={{ color: "var(--muted)" }}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 text-[16px]">
          {/* Static indicator: EN is the only locale in scope. */}
          <span style={{ color: "var(--muted)" }} aria-label="Language: English">
            <span className="opacity-50">中</span>
            <span className="opacity-50"> / </span>
            <span style={{ color: "var(--text)" }}>EN</span>
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
```

Nav items render as `<span>`, not `<a>`: those routes do not exist in this phase, and shipping five links to 404s is worse than shipping five labels.

- [ ] **Step 3: Mount it**

Replace `app/page.tsx`:

```tsx
import Nav from "./components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main />
    </>
  );
}
```

- [ ] **Step 4: Verify in a browser**

```bash
pnpm dev
```

At `localhost:3000`, confirm: the nav is fixed at the top; the mark is vermilion `#FF5B2E`; nav labels are muted grey; clicking the theme toggle flips the whole page and **persists across a hard reload** with no flash; `EN` reads brighter than `中`.

- [ ] **Step 5: Commit**

```bash
git add verso/app/components/Nav.tsx verso/app/components/ThemeToggle.tsx verso/app/page.tsx
git commit -m "$(cat <<'EOF'
Add the fixed nav and theme toggle

The toggle reads the attribute the pre-paint boot script already set
rather than re-deriving it, so the two can never disagree.

Nav items and the locale control render as text, not links: those
routes do not exist in this phase, and five links to 404s is worse than
five labels.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Hero and the split headline

**Files:**
- Create: `app/components/Hero.tsx`, `app/components/HeroVideo.tsx`, `app/components/SplitHeadline.tsx`
- Modify: `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `HERO` from `content/site`; `/media/hero.mp4` and `/media/hero-poster.jpg` from Task 2.
- Produces: `<Hero />`; `<SplitHeadline text className style />`.

**A note on testing components.** From here on, tasks ship React that animates. There are no unit tests for these, and that is deliberate — asserting on GSAP tween state produces tests that stay green while the page looks broken, which is worse than no test at all. The verification step for every remaining task is a real browser at real breakpoints. The logic worth testing was already extracted into `lib/` and tested in Tasks 4 and 5.

- [ ] **Step 1: Write the split headline**

Create `app/components/SplitHeadline.tsx`. Two details matter: waiting on `document.fonts.ready` before splitting (splitting against a fallback face measures the wrong glyph widths and the layout jumps when the real font lands), and reverting the split on cleanup.

```tsx
"use client";

import { useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, prefersReducedMotion, registerGsap } from "../lib/gsap";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
};

export default function SplitHeadline({ text, className, style }: Props) {
  const el = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!el.current || prefersReducedMotion()) return;

      let split: SplitText | undefined;

      // Splitting before the webfont lands measures fallback glyph widths,
      // and the whole headline reflows when the real face arrives.
      const run = () => {
        if (!el.current) return;
        split = SplitText.create(el.current, {
          type: "words,chars",
          wordsClass: "vs-word",
          charsClass: "vs-char",
        });

        gsap.from(split.chars, {
          autoAlpha: 0,
          yPercent: 40,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.012,
          scrollTrigger: { trigger: el.current, start: "top 90%", once: true },
        });
      };

      document.fonts.ready.then(run);

      return () => split?.revert();
    },
    { scope: el },
  );

  return (
    <h1 ref={el} className={className} style={style}>
      {text}
    </h1>
  );
}
```

- [ ] **Step 2: Add the word class to globals**

Append to `app/globals.css` — this reproduces the source site's `white-space: nowrap` word wrappers, which are what stop a word breaking mid-character during the stagger:

```css
/* SplitText word wrappers — keeps words intact while chars animate. */
.vs-word {
  white-space: nowrap;
}

.vs-char {
  display: inline-block;
  will-change: transform, opacity;
}
```

- [ ] **Step 3: Write the hero**

Create `app/components/HeroVideo.tsx` first. Spec §6 requires an `onError` fallback, which needs an event handler and therefore a client component:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

export default function HeroVideo() {
  const [failed, setFailed] = useState(false);

  // A decoding failure or a blocked codec leaves poster="" showing nothing,
  // so fall all the way back to a real image.
  if (failed) {
    return (
      <Image
        src="/media/hero-poster.jpg"
        alt=""
        width={1920}
        height={1080}
        priority
        className="h-[70vh] w-full object-cover md:h-[85vh]"
      />
    );
  }

  return (
    <video
      className="h-[70vh] w-full object-cover md:h-[85vh]"
      src="/media/hero.mp4"
      poster="/media/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}
```

Then create `app/components/Hero.tsx`:

```tsx
import SplitHeadline from "./SplitHeadline";
import HeroVideo from "./HeroVideo";
import { HERO } from "../content/site";

export default function Hero() {
  return (
    <section className="relative">
      {/* Full-bleed loop. muted + playsInline are what make iOS autoplay at all. */}
      <HeroVideo />

      <div className="mx-auto max-w-(--content) px-(--gutter) py-16 md:py-24">
        <SplitHeadline
          text={HERO.statement}
          className="max-w-[24ch] text-[32px] leading-[1.16] md:text-[40px] lg:max-w-[30ch] lg:text-[48px] lg:leading-14"
          style={{ letterSpacing: "var(--track-48)" }}
        />
        <p
          className="mt-10 text-[32px] md:text-[40px] lg:text-[48px] lg:leading-14"
          style={{ color: "var(--muted)", letterSpacing: "var(--track-48)" }}
        >
          {HERO.link}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Mount it**

Update `app/page.tsx` to render `<Hero />` inside `<main>`.

- [ ] **Step 5: Verify in a browser**

At `localhost:3000`: the video autoplays, loops, and is silent. The headline animates in character by character, and **no word breaks across a line mid-word**. Inspect the headline in DevTools and confirm the structure is `.vs-word > .vs-char` spans — matching the source site's approach. Then set macOS System Settings → Accessibility → Display → Reduce Motion, reload, and confirm the headline is **fully visible immediately** with no animation.

Test the fallback too: temporarily rename `public/media/hero.mp4`, reload, and confirm the poster image renders at the same size rather than leaving a blank band. Rename it back.

- [ ] **Step 6: Commit**

```bash
git add verso/app/components/Hero.tsx verso/app/components/HeroVideo.tsx verso/app/components/SplitHeadline.tsx verso/app/globals.css verso/app/page.tsx
git commit -m "$(cat <<'EOF'
Add the hero and its per-character headline reveal

Splitting waits on document.fonts.ready: splitting against the fallback
face measures the wrong glyph widths and the headline reflows when the
real font lands. Words keep a nowrap wrapper so they never break
mid-character while the stagger runs, matching the source structure.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: The Highlight rail

**Files:**
- Create: `app/components/HighlightRail.tsx`, `app/components/Ticker.tsx`
- Modify: `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `railLayout`, `railSpan`, `DESKTOP_RAIL`, `TABLET_RAIL`, `MOBILE_RAIL` from `lib/rail`; `WORKS` from `content/works`.
- Produces: `<HighlightRail />`, `<Ticker text repeat? />`.

This is the centerpiece. The source renders it in WebGL; we render it in CSS 3D, which keeps the images as real DOM, keeps the whole thing inside the Next + GSAP brief, and costs only per-pixel lighting.

- [ ] **Step 1: Write the ticker**

Create `app/components/Ticker.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion, registerGsap } from "../lib/gsap";

export default function Ticker({ text, repeat = 12 }: { text: string; repeat?: number }) {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!track.current || prefersReducedMotion()) return;

      // Two identical halves; travelling exactly -50% lands the second half
      // where the first began, so the loop has no seam.
      gsap.to(track.current, {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: track },
  );

  const items = Array.from({ length: repeat * 2 }, (_, i) => (
    <span key={i} className="px-6 text-[12px] uppercase" style={{ letterSpacing: "var(--track-12)" }}>
      {text}
    </span>
  ));

  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div ref={track} className="flex w-max whitespace-nowrap" style={{ color: "var(--muted)" }}>
        {items}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the 3D scaffolding to globals**

Append to `app/globals.css`:

```css
/* ---- Highlight rail -------------------------------------------------
   The stage owns the perspective; the rail owns the rotation. Cards sit
   flat at z=0 and let the projection supply their depth. ------------- */

.rail-stage {
  perspective: 1400px;
  perspective-origin: 50% 50%;
  overflow: clip;
}

.rail {
  transform-style: preserve-3d;
  transform: rotateY(-28deg) rotateZ(-8deg);
  will-change: transform;
}

@media (max-width: 767px) {
  .rail {
    transform: rotateY(-14deg) rotateZ(-4deg);
  }
}

.rail-card {
  position: absolute;
  top: 50%;
  left: 0;
  overflow: hidden;
  border-radius: 2px;
  background: var(--hairline);
}
```

- [ ] **Step 3: Write the rail**

Create `app/components/HighlightRail.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  DESKTOP_RAIL,
  MOBILE_RAIL,
  TABLET_RAIL,
  railLayout,
  railSpan,
  wrapX,
  type RailConfig,
} from "../lib/rail";
import { WORKS } from "../content/works";
import { gsap, ScrollTrigger, prefersReducedMotion, registerGsap } from "../lib/gsap";
import Ticker from "./Ticker";

function configFor(width: number): RailConfig {
  if (width < 768) return MOBILE_RAIL;
  if (width < 1200) return TABLET_RAIL;
  return DESKTOP_RAIL;
}

export default function HighlightRail() {
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<RailConfig>(DESKTOP_RAIL);

  useGSAP(
    () => {
      registerGsap();
      if (!rail.current) return;

      const next = configFor(window.innerWidth);
      setConfig(next);
      if (prefersReducedMotion()) return;

      const span = railSpan(next);
      const cards = gsap.utils.toArray<HTMLElement>(".rail-card", rail.current);
      if (!cards.length) return;

      // One tween per card, each wrapped independently. Wrapping the whole
      // rail would snap the entire strip at the seam; wrapping each card
      // means only that card recycles, off-screen, invisibly.
      //
      // wrapX folds into [0, span); shifting by cardWidth either side moves
      // the recycle point just off the leading edge, where it cannot be seen.
      const loop = gsap.to(cards, {
        x: `-=${span}`,
        duration: 60,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => `${wrapX(parseFloat(x) + next.cardWidth, span) - next.cardWidth}px`,
        },
      });

      // Scroll does not scrub the loop, it leans on it: the wall drifts by
      // itself and surges while you move, then eases back to base rate.
      const trigger = ScrollTrigger.create({
        trigger: stage.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const surge = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 5);
          gsap.to(loop, { timeScale: surge, duration: 0.4, overwrite: true });
        },
      });

      return () => {
        trigger.kill();
        loop.kill();
      };
    },
    { scope: stage },
  );

  const layout = railLayout(config);

  return (
    <section
      ref={stage}
      className="rail-stage relative flex h-screen flex-col justify-between py-4"
    >
      <Ticker text="Highlight" />

      <div className="relative flex-1">
        {/* Decorative: every work here is already linked from the grids below,
            and the detail routes do not exist in this phase. */}
        <div ref={rail} className="absolute inset-0" aria-hidden="true">
          {layout.map((card) => {
            const work = WORKS[card.index % WORKS.length];
            return (
              <div
                key={card.index}
                className="rail-card"
                style={{
                  width: config.cardWidth,
                  height: config.cardWidth * 1.26,
                  transform: `translate3d(${card.x}px, calc(-50% + ${card.y}px), 0) scale(${card.scale})`,
                }}
              >
                <Image
                  src={work.image}
                  alt=""
                  width={config.cardWidth}
                  height={Math.round(config.cardWidth * 1.26)}
                  className="h-full w-full object-cover"
                  sizes={`${config.cardWidth}px`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="mx-auto flex w-full max-w-(--content) items-center justify-between px-(--gutter) text-[16px]"
        style={{ letterSpacing: "var(--track-16)" }}
      >
        <span>Highlight</span>
        <span style={{ color: "var(--muted)" }}>View All</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Mount it**

Add `<HighlightRail />` to `app/page.tsx`, directly after `<Hero />`.

- [ ] **Step 5: Verify in a browser — this is the task most likely to need iteration**

At `localhost:3000`, scroll to the Highlight band and check each of these:

1. Cards form a **diagonal receding wall**, near cards visibly larger than far ones.
2. The rail drifts continuously with **no visible jump or gap** at the wrap seam. Watch one full cycle — roughly 60 seconds.
3. Scrolling fast makes the wall **surge**, then settle back to its drift.
4. The band is exactly one viewport tall and nothing bleeds outside it.
5. Resize to 375px wide and reload: 8 cards, flattened rotation, still legible.
6. With Reduce Motion on: cards are **static and visible**, tickers still.

If the seam pops, the wrap bounds and `railSpan` disagree — recheck against `lib/rail.test.ts`, which already asserts the correct arithmetic.

- [ ] **Step 6: Commit**

```bash
git add verso/app/components/HighlightRail.tsx verso/app/components/Ticker.tsx verso/app/globals.css verso/app/page.tsx
git commit -m "$(cat <<'EOF'
Add the highlight rail

The source renders this wall in WebGL; this does it in CSS 3D, which
keeps the images as real DOM and stays inside the Next + GSAP brief for
the cost of per-pixel lighting.

Each card wraps independently rather than wrapping the rail as a whole:
wrapping the strip would snap every card at the seam, while per-card
wrapping recycles one card at a time, off-screen and invisibly.

Scroll leans on the loop rather than scrubbing it — the wall drifts on
its own and surges under movement, which is what the source does.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Work sections — Field and Practice

**Files:**
- Create: `app/components/WorkCard.tsx`, `app/components/WorkSection.tsx`
- Modify: `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `Work` from `content/types`; `FIELD_WORKS`, `PRACTICE_WORKS` from `content/works`; `FIELD`, `PRACTICE` from `content/site`; `<Reveal />` from Task 6.
- Produces: `<WorkSection label accent statement works weights />` where `weights` is a CSS `grid-template-columns` value.

- [ ] **Step 1: Add the grid utilities**

Append to `app/globals.css`:

```css
.work-grid {
  display: grid;
  gap: var(--gap);
}

@media (max-width: 767px) {
  .work-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .work-grid {
    grid-template-columns: 1fr 1fr !important;
  }
}
```

The `!important` is load-bearing: the desktop weights arrive as an inline style, which would otherwise beat these breakpoint rules.

- [ ] **Step 2: Write the card**

Create `app/components/WorkCard.tsx`:

```tsx
import Image from "next/image";
import type { Work } from "../content/types";

export default function WorkCard({ work }: { work: Work }) {
  return (
    <article className="group">
      <div className="h-(--card-h) overflow-hidden" style={{ background: "var(--hairline)" }}>
        <Image
          src={work.image}
          alt={`${work.title} — ${work.subtitle}`}
          width={work.wide ? 1400 : 700}
          height={880}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes={work.wide ? "(max-width: 767px) 100vw, 684px" : "(max-width: 767px) 100vw, 338px"}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px]" style={{ letterSpacing: "var(--track-16)" }}>
            {work.title}
          </h3>
          <p className="mt-1 text-[16px]" style={{ color: "var(--muted)", letterSpacing: "var(--track-16)" }}>
            {work.subtitle}
          </p>
        </div>

        <ul className="flex shrink-0 gap-1" aria-label="Disciplines">
          {work.badges.map((b) => (
            <li
              key={b}
              className="grid h-6 w-6 place-items-center rounded-full text-[12px]"
              style={{ background: "var(--hairline)", color: "var(--muted)", letterSpacing: "var(--track-12)" }}
            >
              {b}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Write the section**

Create `app/components/WorkSection.tsx`:

```tsx
import type { Work } from "../content/types";
import WorkCard from "./WorkCard";
import Reveal from "./Reveal";

type Props = {
  label: string;
  /** A CSS custom property name, e.g. "--accent-field". */
  accent: string;
  statement: string;
  works: Work[];
  /** Desktop grid-template-columns, e.g. "1fr 1fr 2fr". */
  weights: string;
};

export default function WorkSection({ label, accent, statement, works, weights }: Props) {
  return (
    <section className="mx-auto max-w-(--content) px-(--gutter) py-24 md:py-32">
      <Reveal>
        <p className="text-[12px]" style={{ color: `var(${accent})`, letterSpacing: "var(--track-12)" }}>
          {label}
        </p>
        <p
          className="mt-6 max-w-[46ch] text-[24px] leading-[1.35] md:text-[32px] md:leading-10"
          style={{ letterSpacing: "var(--track-32)" }}
        >
          {statement}
        </p>
      </Reveal>

      <div
        className="mt-16 flex items-center justify-between text-[16px]"
        style={{ letterSpacing: "var(--track-16)" }}
      >
        <span>Works</span>
        <span style={{ color: "var(--muted)" }}>View All</span>
      </div>

      <Reveal
        stagger
        className="work-grid mt-6"
        style={{ gridTemplateColumns: weights }}
      >
        {works.map((w) => (
          <WorkCard key={w.slug} work={w} />
        ))}
      </Reveal>
    </section>
  );
}
```

The desktop weights arrive as an inline style, which is exactly why the breakpoint rules in Step 1 need `!important` to win below 1200px.

- [ ] **Step 4: Mount both sections**

In `app/page.tsx`, after `<HighlightRail />`:

```tsx
<WorkSection
  label={FIELD.label}
  accent={FIELD.accent}
  statement={FIELD.statement}
  works={FIELD_WORKS}
  weights="1fr 1fr 2fr"
/>
<WorkSection
  label={PRACTICE.label}
  accent={PRACTICE.accent}
  statement={PRACTICE.statement}
  works={PRACTICE_WORKS}
  weights="2fr 1fr 1fr"
/>
```

- [ ] **Step 5: Verify in a browser**

At 1440px: Field's eyebrow is pale cyan, Practice's is periwinkle. Field's grid reads narrow-narrow-wide; Practice's reads wide-narrow-narrow. Cards are 400px tall with 8px gaps. Images scale gently on hover. Statements and cards reveal on scroll with a stagger.

At 900px: both grids drop to two columns. At 375px: one column. Switch to light theme and confirm both accents stay legible against the pale ground — that is what the darkened light-theme accent values in the tokens are for.

- [ ] **Step 6: Commit**

```bash
git add verso/app/components/WorkCard.tsx verso/app/components/WorkSection.tsx verso/app/globals.css verso/app/page.tsx
git commit -m "$(cat <<'EOF'
Add the Field and Practice work sections

One component drives both: they differ only in accent, copy, and grid
weighting, so two components would have been the same code twice.

Breakpoint grid rules carry !important because the desktop weights
arrive as an inline style and would otherwise win at every width.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: The Index section

**Files:**
- Create: `app/components/NewsCard.tsx`, `app/components/NewsSection.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `NEWS` from `content/news`; `INDEX_SECTION` from `content/site`; `<Reveal />`.
- Produces: `<NewsSection />`.

- [ ] **Step 1: Write the card**

Create `app/components/NewsCard.tsx`:

```tsx
import Image from "next/image";
import type { NewsItem } from "../content/types";

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group">
      <div className="aspect-7/5 overflow-hidden" style={{ background: "var(--hairline)" }}>
        <Image
          src={item.image}
          alt={item.headline}
          width={700}
          height={520}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 338px"
        />
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 text-[12px]" style={{ letterSpacing: "var(--track-12)" }}>
        <span style={{ color: `var(${item.accent})` }}>{item.category}</span>
        <span className="font-mono" style={{ color: "var(--muted)" }}>
          {item.date}
        </span>
      </div>

      <h3 className="mt-3 text-[16px] leading-[1.45]" style={{ letterSpacing: "var(--track-16)" }}>
        {item.headline}
      </h3>
    </article>
  );
}
```

- [ ] **Step 2: Write the section**

Create `app/components/NewsSection.tsx`:

```tsx
import { NEWS } from "../content/news";
import { INDEX_SECTION } from "../content/site";
import NewsCard from "./NewsCard";
import Reveal from "./Reveal";

export default function NewsSection() {
  return (
    <section className="mx-auto max-w-(--content) px-(--gutter) py-24 md:py-32">
      <div className="flex items-center justify-between text-[16px]" style={{ letterSpacing: "var(--track-16)" }}>
        <span style={{ color: `var(${INDEX_SECTION.accent})` }}>{INDEX_SECTION.label}</span>
        <span style={{ color: "var(--muted)" }}>View All</span>
      </div>

      <Reveal stagger className="work-grid mt-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {NEWS.map((item) => (
          <NewsCard key={item.slug} item={item} />
        ))}
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 3: Mount it**

Add `<NewsSection />` to `app/page.tsx`, after the two work sections.

- [ ] **Step 4: Verify in a browser**

At 1440px: four equal columns, 8px gaps. Category labels carry their per-item accent — the two Walk entries in vermilion, Practice in periwinkle, Index in acid yellow. Dates render in Space Mono, visibly monospaced and distinct from the surrounding Grotesk. At 900px: two columns. At 375px: one.

- [ ] **Step 5: Commit**

```bash
git add verso/app/components/NewsCard.tsx verso/app/components/NewsSection.tsx verso/app/page.tsx
git commit -m "$(cat <<'EOF'
Add the Index section

Four-up grid of dated entries, each carrying its own category accent.
Dates are the one place Space Mono earns its keep — a monospaced date
against the Grotesk headline is the source site's tell.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: The footer and live clocks

**Files:**
- Create: `app/components/Clock.tsx`, `app/components/Footer.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `formatClock`, `utcOffsetLabel`, `resolveTimeZone` from `lib/time`; `FOOTER_COLUMNS`, `CLOCKS`, `SOCIALS`, `LEGAL` from `content/site`.
- Produces: `<Footer />`, `<Clock zone city />`.

- [ ] **Step 1: Write the clock**

Create `app/components/Clock.tsx`. Spec §6: the server has no idea what time it is where the visitor is, so rendering a time on the server guarantees a hydration mismatch. It renders an empty fixed-width slot and fills in after mount.

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatClock, resolveTimeZone, utcOffsetLabel } from "../lib/time";
import type { ClockZone } from "../content/types";

export default function Clock({ zone }: { zone: ClockZone }) {
  const [state, setState] = useState<{ time: string; offset: string; city: string } | null>(null);

  useEffect(() => {
    const tz = zone.timeZone ?? resolveTimeZone();
    const city =
      zone.city === "LOCAL" ? (tz.split("/").pop() ?? "LOCAL").replace(/_/g, " ").toUpperCase() : zone.city;

    const tick = () => {
      const now = new Date();
      setState({ time: formatClock(now, tz), offset: utcOffsetLabel(now, tz), city });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [zone]);

  return (
    <div className="min-w-[7ch]">
      {/* Empty until mounted: server time is not the visitor's time. */}
      <div
        className="text-[32px] tabular-nums md:text-[40px] md:leading-10"
        style={{ letterSpacing: "var(--track-40)" }}
        suppressHydrationWarning
      >
        {state?.time ?? " "}
      </div>
      <div
        className="mt-4 font-mono text-[12px]"
        style={{ color: "var(--muted)", letterSpacing: "var(--track-12)" }}
        suppressHydrationWarning
      >
        {state ? (
          <>
            <div>{state.offset}</div>
            <div>{state.city}</div>
          </>
        ) : (
          " "
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the footer**

Create `app/components/Footer.tsx`:

```tsx
import Clock from "./Clock";
import { CLOCKS, FOOTER_COLUMNS, LEGAL, SOCIALS } from "../content/site";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-(--content) px-(--gutter) pb-16 pt-24">
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        {FOOTER_COLUMNS.map((column, i) => (
          <ul
            key={i}
            className="text-[24px] uppercase md:text-[28px] lg:text-[32px] lg:leading-10"
            style={{ letterSpacing: "var(--track-32)" }}
          >
            {column.map((item, j) => (
              <li
                key={item.href}
                className="cursor-default transition-colors hover:text-(--text)"
                // The first item of the first column is the current page.
                style={{ color: i === 0 && j === 0 ? "var(--text)" : "var(--muted)" }}
              >
                {item.label}
              </li>
            ))}
          </ul>
        ))}

        {CLOCKS.map((zone) => (
          <Clock key={zone.city} zone={zone} />
        ))}
      </div>

      <div className="mt-20 flex flex-wrap items-center justify-between gap-6">
        {/* Deliberately a div, not a form: there is no submit endpoint in
            this phase, and a form that posts nowhere reloads the page. */}
        <div
          className="flex items-center rounded-full px-2 py-1"
          style={{ background: "var(--hairline)" }}
        >
          <label htmlFor="subscribe" className="sr-only">
            Email
          </label>
          <input
            id="subscribe"
            type="email"
            placeholder="Email"
            className="w-56 bg-transparent px-4 py-3 text-[16px] outline-none"
            style={{ letterSpacing: "var(--track-16)" }}
          />
          <span
            className="cursor-default rounded-full px-6 py-3 text-[16px]"
            style={{ background: "var(--hairline)", letterSpacing: "var(--track-16)" }}
          >
            Subscribe
          </span>
        </div>

        <ul className="flex gap-5 text-[12px]" style={{ color: "var(--muted)", letterSpacing: "var(--track-12)" }}>
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a href={s.href} className="transition-colors hover:text-(--text)">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mt-24 flex flex-wrap justify-between gap-8 text-[12px]"
        style={{ color: "var(--muted)", letterSpacing: "var(--track-12)" }}
      >
        <div>
          <div style={{ color: "var(--text)" }}>{LEGAL.copyright}</div>
          <div>{LEGAL.rights}</div>
        </div>
        <p className="max-w-[44ch] leading-[1.6]">{LEGAL.notice}</p>
        <div>{LEGAL.signoff}</div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Mount it**

Add `<Footer />` to `app/page.tsx`, after `<NewsSection />` and outside `<main>`.

- [ ] **Step 4: Verify in a browser**

Both clocks tick every second. The second reads Kyoto time — check it against a world clock, and confirm its label reads `UTC+9`. The first reads your own zone with your own city name. Reload repeatedly and confirm **no hydration warning appears in the console**; that is the whole reason the clock renders empty on the server. Footer nav is oversized uppercase, `HOME` brighter than the rest, and items brighten on hover.

- [ ] **Step 5: Commit**

```bash
git add verso/app/components/Clock.tsx verso/app/components/Footer.tsx verso/app/page.tsx
git commit -m "$(cat <<'EOF'
Add the footer and its live clocks

The clock renders an empty fixed-width slot on the server and fills in
after mount. Server time is not the visitor's time, so rendering a real
value server-side guarantees a hydration mismatch — the empty slot is
the fix, not a placeholder.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Final pass — responsive, motion, and verification

**Files:**
- Modify: `app/globals.css`, any component needing breakpoint corrections
- Create: `verso/README.md`

**Interfaces:**
- Consumes: everything.
- Produces: a finished page meeting spec §9.

- [ ] **Step 1: Walk the breakpoint table**

Check every row of spec §8 at 375px, 900px, and 1440px, in **both themes**:

| | Mobile `<768` | Tablet `768–1199` | Desktop `≥1200` |
| --- | --- | --- | --- |
| Gutter | 16px | 24px | 32px |
| Work grids | 1 col | 2 col | `1fr 1fr 2fr` / `2fr 1fr 1fr` |
| News grid | 1 col | 2 col | 4 col |
| Headline | 32px | 40px | 48px |
| Rail | 8 cards, flat | 10 cards | 12 cards, full |
| Footer nav | 24px | 28px | 32px |

Fix whatever disagrees. Confirm **no horizontal scrollbar at any width** — `overflow-x: clip` is set on html and body, but a rail card escaping its stage will still force one.

- [ ] **Step 2: Audit reduced motion**

With Reduce Motion enabled, reload and confirm every one of these:

- Hero headline: fully visible, no character animation.
- Rail: cards static and visible, not blank.
- Tickers: still.
- All `Reveal` blocks: fully visible, no fade or rise.
- Nothing anywhere is stuck at `opacity: 0`.

- [ ] **Step 3: Audit the no-JS path**

In DevTools, disable JavaScript and reload. Every section must be **fully readable** — headline, statements, all cards, all copy. Only the clocks may be blank, since live time genuinely requires JS. If anything else is invisible, a hidden state leaked into CSS, which spec §6 forbids.

- [ ] **Step 4: Run the full gate**

```bash
pnpm test     # all suites green
pnpm build    # clean, no type errors, no warnings about missing image dimensions
pnpm lint     # clean
```

- [ ] **Step 5: Write the README**

Create `verso/README.md`:

```markdown
# Verso

The homepage of a fictional Kyoto design studio, built as a Next.js + GSAP
study of `besign.co/en/`. The layout, type system, and scroll choreography
follow the source closely — that is the thing being learned. Every word,
colour, project, and image is original.

## Running

```bash
pnpm install
pnpm dev      # localhost:3000
pnpm test     # vitest, pure logic only
pnpm build
```

## Structure

- `app/content/` — all copy and data, three typed modules
- `app/lib/` — pure logic: rail geometry, clock formatting. Tested.
- `app/components/` — the six sections
- `public/media/` — imagery, credited in `CREDITS.md`

## Notes

The highlight rail is CSS 3D, not WebGL: a perspective stage, a rotated
rail, cards flat at z=0 letting the projection supply depth. Each card
wraps independently so the loop has no visible seam.

Animation is verified in a browser, not in assertions — asserting on GSAP
tween state produces tests that pass while the page looks wrong. The logic
worth testing lives in `app/lib/`.

Routes other than `/` do not exist in this phase. Nav items, "View All",
and cards render fully styled but do not navigate.
```

- [ ] **Step 6: Commit**

```bash
git add verso
git commit -m "$(cat <<'EOF'
Finish the Verso homepage

Breakpoint pass across all three widths in both themes, plus audits of
the two paths that fail silently: reduced motion and no-JS. Both must
leave every section readable, and now do.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Definition of Done

From spec §9, every item verified:

- [ ] All six sections built and responsive across three breakpoints
- [ ] Light and dark themes complete, persisted, no flash on load
- [ ] Hero headline splits and staggers; rail loops seamlessly and responds to scroll velocity
- [ ] `prefers-reduced-motion` fully honoured everywhere
- [ ] No-JS path leaves every section readable
- [ ] All media committed and credited
- [ ] `pnpm test`, `pnpm build`, `pnpm lint` all clean
- [ ] Verified in a real browser at 375px, 900px, and 1440px, in both themes
