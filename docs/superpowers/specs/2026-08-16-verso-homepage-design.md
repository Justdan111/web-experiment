# Verso — Homepage Design Spec

**Date:** 2026-08-16
**Status:** Approved for planning
**Scope:** One page. The homepage of a fictional design studio, built to the structure, layout, type system, and motion vocabulary of `besign.co/en/`, carrying entirely original writing, identity, and imagery.

---

## 1. Purpose

Rebuild the besign.co homepage as a Next.js + GSAP study. The layout, typographic system, spatial rhythm, and scroll choreography are reproduced faithfully — that is the thing being learned. Every word, color decision, project, and image is original, so the result is a portfolio piece rather than a copy.

**In scope:** the homepage, end to end, responsive, themed, animated.

**Out of scope:** every other route (`/works`, `/news`, `/about`, `/store`, `/inquiry`, `/open-position`), the Chinese locale, any CMS or content API, any form backend. Links that would leave the homepage render fully styled but do not navigate. This is the seam for a later phase.

---

## 2. Source analysis

Measured directly from `besign.co/en/` at a 1440×900 viewport, DPR 2.

### Page composition

A 4902px page in six bands:

1. **Hero** — full-bleed autoplay/muted/loop video, then a 48px statement headline on black, then a muted "Learn More" link.
2. **Highlight** — a 100vh clipped band. A horizontal text ticker rides the top edge, a label + "View All" row sits on the bottom edge, and a diagonal wall of project cards fills the middle.
3. **Lab** — accent eyebrow, statement paragraph, "Works / View All" row, three-card grid weighted `1fr 1fr 2fr`.
4. **Studio** — same pattern, different accent, grid weighted `2fr 1fr 1fr`.
5. **News** — four-up grid; each card is image, colored category label, date, two-line headline.
6. **Footer** — oversized uppercase nav, two live clocks, newsletter field, social row, legal block, signoff.

### Technical findings

| Finding | Detail |
| --- | --- |
| Platform | Framer (`<meta name="generator" content="Framer">`) |
| Scrolling | Native. No Lenis, no smooth-scroll library, `scroll-behavior: auto` |
| Hero headline | Split into **414 per-character spans**, each `display:inline-block` with its own `opacity` and `transform`; whole words wrapped in `white-space:nowrap` spans so they never break mid-word |
| Highlight gallery | A **WebGL2 canvas**, backing store 2880×1344, displayed at 1440×672 |
| Theme | Persisted in `localStorage.theme`; resolved before first paint |
| Media | Two `<video>` elements (`autoplay muted loop`), 9 `<img>` |
| Type | Space Grotesk (400/500/600/700 + variable), Space Mono, Inter Display as fallback |

### Measured design tokens

Layout, at 1440px:

| Token | Value |
| --- | --- |
| Page gutter | 32px |
| Content width | 1376px |
| Grid gap | 8px |
| Card height | 400px |
| Card widths (`1fr 1fr 2fr`) | 338 / 338 / 684 |
| Highlight band height | 672px (100vh) |
| Highlight edge strips | 67px |

Typography — one family, Space Grotesk at weight 500, doing nearly everything. Tracking tightens optically as size grows:

| Size | Line height | Tracking | Role |
| --- | --- | --- | --- |
| 12px | — | −0.24px (−0.02em) | eyebrows, micro labels |
| 16px | — | −0.48px (−0.03em) | section labels, body |
| 32px | 40px | −0.96px (−0.03em) | footer nav |
| 40px | 40px | −1.60px (−0.04em) | footer clocks |
| 48px | 56px | −2.40px (−0.05em) | hero headline |

Color, dark theme: ground near-black, text `#FFFFFF`, muted `rgb(191,191,191)`, amber mark, one accent per section (Lab pale blue, Studio sage `rgb(173,209,140)`).

---

## 3. The invented studio

**VERSO** — the left-hand page of an open book, the reverse side. A typographic term, five letters, and the right meaning for a studio that looks at things from the other side. Headquartered in **Kyoto**, which mirrors Besign's Shenzhen positioning and gives the footer clocks a genuine UTC+9 versus visitor-local split.

### Navigation — five divisions

`Field · Practice · Foundry · Index · Goods`

Field is self-initiated research (the Lab parallel). Practice is commissioned work (the Studio parallel). Foundry releases typefaces, Index is writing, Goods is the shop. Only Field, Practice, and Index have homepage sections; the rest exist in the nav and footer.

The `中 / EN` control is reproduced as a **static indicator with EN active**, not a working toggle — the Chinese locale is out of scope, and a control that does nothing when clicked is worse than one that plainly reads as current state.

**Footer nav**, two columns, matching the original's split between destinations and utilities:

| Column one | Column two |
| --- | --- |
| Home | All Works |
| Field | About Us |
| Practice | Project Inquiry |
| Foundry | Index |
| Goods | Open Positions |

### Copy

**Hero statement** — matched to the original's cadence and length so it splits into a comparable character count:

> Verso builds precise, quiet, and durable design systems for companies working at the edge of technology, culture, and language.

**Field:** "We follow our own curiosity, testing new forms, tools, and typefaces before anyone asks us to."

**Practice:** "We take on outside work. From identity to interface, we deliver considered, rigorous, and complete design systems."

**Footer signoff:** "The other side of the page."

**Legal:** `© 2026 Verso Studio` / `All rights reserved.` plus a short copyright paragraph.

### Color system

| Token | Dark | Light |
| --- | --- | --- |
| `--ground` | `#0A0A0A` | `#FAFAFA` |
| `--text` | `#FFFFFF` | `#000000` |
| `--muted` | `#BFBFBF` | `#8A8A8A` |
| `--hairline` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.10)` |
| `--mark` | `#FF5B2E` | `#FF5B2E` |
| `--accent-field` | `#9FD8E8` | `#2E7F97` |
| `--accent-practice` | `#C9B8FF` | `#5B47A8` |
| `--accent-index` | `#E8D14A` | `#8A7410` |

Light-theme accents are darkened variants so they hold contrast against the pale ground.

### Typography

Space Grotesk 500 and Space Mono, both free on Google Fonts, self-hosted through `next/font/google` — no runtime network dependency. Space Mono is reserved for micro monospace labels (`UTC+9`, dates). The measured tracking scale above is encoded as tokens and applied by size, not by hand.

### Work

Badge letters: **T** Type · **E** Editorial · **P** Product · **I** Identity · **W** Web.

**Field** (grid of three, `1fr 1fr 2fr`):

| Title | Subtitle | Badges |
| --- | --- | --- |
| Terminal Grotesk | Variable Typeface, 9 Weights | T |
| Atlas of Quiet Places | Editorial & Photographic Study | E |
| Signal / Noise | Generative Poster Series | E, W |

**Practice** (grid of three, `2fr 1fr 1fr`):

| Title | Subtitle | Badges |
| --- | --- | --- |
| Halide Capital | Brand Identity & Digital Platform | I, W |
| Nomad Audio | In progress | P |
| Orbital Health | Interface System | W, P |

**Highlight rail** — twelve cards: the six above plus *Kiosk*, *Meridian Press*, *Bell & Bone*, *Grain Type Specimen*, *Verso Rebrand*, *Low Tide*.

### Index entries

| Category | Date | Headline |
| --- | --- | --- |
| VERSO WALK | 3/14/26 | Verso Walk Lisbon: light, tile, and repetition |
| VERSO WALK | 11/2/25 | Verso Walk Kyoto: on restraint |
| PRACTICE | 9/18/25 | Verso partners with Halide Capital on a full rebrand |
| INDEX | 7/25/25 | Verso Field opens applications for the 2026 residency |

### Imagery

Roughly sixteen stills and one hero video, sourced from Unsplash and Pexels under their free commercial licenses. Curated to a single look — dark, high-contrast, architectural and macro-textural — rather than assembled as generic stock. Downloaded to `public/media/`, committed, and every source URL recorded in `public/media/CREDITS.md`.

---

## 4. Architecture

New project at `web experiments/verso/`, sibling to `fort`, matching the house stack: Next 16, React 19, GSAP 3.15, Tailwind 4, TypeScript 5, pnpm, vitest.

One addition beyond `fort`'s dependencies: **`@gsap/react`**, for its `useGSAP` hook. It scopes animations to a ref and reverts them on cleanup, which is what makes GSAP behave correctly under React 19 StrictMode's double-mount.

```
verso/
├── app/
│   ├── layout.tsx            root shell, fonts, theme boot script
│   ├── page.tsx              composes the six sections
│   ├── globals.css           tokens, resets, theme blocks
│   ├── fonts.ts              next/font declarations
│   ├── content/
│   │   ├── types.ts          Work, NewsItem, NavItem, SiteMeta
│   │   ├── site.ts           nav, footer, legal, socials, clock zones
│   │   ├── works.ts          all twelve works
│   │   └── news.ts           four index entries
│   ├── components/
│   │   ├── Nav.tsx           fixed bar, mark, theme toggle, locale indicator
│   │   ├── ThemeToggle.tsx
│   │   ├── Hero.tsx          video, headline, Learn More
│   │   ├── SplitHeadline.tsx per-character reveal
│   │   ├── HighlightRail.tsx the 3D diagonal wall
│   │   ├── Ticker.tsx        the edge text marquee
│   │   ├── WorkSection.tsx   drives Field and Practice
│   │   ├── WorkCard.tsx
│   │   ├── NewsSection.tsx
│   │   ├── NewsCard.tsx
│   │   ├── Footer.tsx
│   │   └── Clock.tsx
│   └── lib/
│       ├── gsap.ts           central plugin registration
│       ├── rail.ts           pure geometry for the 3D wall
│       └── time.ts           pure clock formatting
└── public/media/ + CREDITS.md
```

### Data flow

Content is three typed TypeScript modules, imported directly by server components. No CMS, no MDX, no fetching — for a single page that is the honest answer, and `works.ts` is the seam a real content source slots into later.

Everything renders on the server by default. Only four components are client components, each for a specific reason: `HighlightRail` and `SplitHeadline` need GSAP, `Clock` needs live time, `ThemeToggle` needs `localStorage`. Section reveal animations attach from a small client wrapper so the markup itself stays server-rendered.

### Component contracts

| Component | Takes | Owns |
| --- | --- | --- |
| `WorkSection` | `label`, `accent`, `statement`, `works[]`, `weights` | the eyebrow/statement/grid pattern for both Field and Practice |
| `WorkCard` | `Work`, `span` | one card: media, title, subtitle, badge row, hover state |
| `HighlightRail` | `works[]` | perspective container, 3D rail, loop timeline, scroll coupling |
| `Clock` | `zone`, `city` | one live clock; renders empty until mounted |
| `SplitHeadline` | `text`, `as` | character splitting and staggered reveal |

`lib/rail.ts` and `lib/time.ts` hold no React and no DOM. They are pure functions, which is what makes the two hardest parts of this page testable.

---

## 5. Motion

All GSAP plugins register once in `lib/gsap.ts`. GSAP 3.13+ ships SplitText, ScrollTrigger, and ScrollSmoother free in the public package, so there is no Club license involved — the import path gets confirmed against the installed version on first use.

### Hero

`SplitText` splits the headline into per-character `inline-block` spans, with whole words wrapped in `white-space:nowrap` spans so they never break mid-word — reproducing the original's structure rather than approximating it. Characters stagger in on opacity and a small y-translate at roughly 12ms apart. "Learn More" fades in on completion. The video plays immediately, `muted playsInline loop autoplay`.

### Highlight rail

The centerpiece, and the one part the original does in WebGL that we do in CSS 3D:

- Outer element sets `perspective: 1400px` and clips.
- The rail inside sets `transform-style: preserve-3d` and takes a compound `rotateY(-28deg) rotateZ(-8deg)`, which produces the diagonal.
- Twelve cards sit at x/z steps computed by `railLayout()` in `lib/rail.ts`, so near cards read larger than far ones and the wall has real depth.
- A GSAP timeline runs the rail on a continuous x-loop. `modifiers` plus `gsap.utils.wrap` make the wrap seamless with no jump.
- ScrollTrigger's `getVelocity()` feeds the timeline's `timeScale`: the wall drifts on its own, surges while you scroll, and eases back to its base rate.

Because work detail pages are out of scope, the rail is decorative. It is marked `aria-hidden="true"` and contains no links — its content is already represented by the real grids below.

### Sections

Statement paragraphs reveal line by line. Cards rise and fade on a stagger as they enter. Card images scale gently under hover. The edge tickers run their own constant x-loop.

### Motion rules

`gsap.matchMedia()` gates everything on `prefers-reduced-motion: reduce`. Under that query, reveals resolve instantly and the rail and tickers hold static. `will-change: transform` is applied only to actively animating elements and removed after, and every looping animation is transform-only so it stays on the compositor.

---

## 6. Failure modes

These are the things that break this specific page, and how each is handled.

**Hydration mismatch on the clocks.** Server time and client time differ, so server-rendering a clock guarantees a mismatch. `Clock` renders an empty fixed-width slot on the server and fills it on the client's first tick after mount.

**Theme flash.** A tiny blocking script in `<head>` reads `localStorage.theme` and sets the root attribute before first paint, exactly as the original does. Without it every load flashes white.

**Invisible content without JS.** Reveal animations set their hidden state in JavaScript, never in CSS. If JS fails or is slow, the page renders fully readable rather than blank.

**Video failure.** The hero `<video>` carries a `poster` frame and an `onError` fallback to a still image. iOS requires `muted` and `playsInline` for autoplay; both are set.

**Layout shift.** Every image goes through `next/image` with explicit dimensions. Fonts load through `next/font` with `display: swap` and a matched fallback metric.

**Low-end devices.** The rail drops to eight cards and flattens its rotation below 768px, where the depth reads as clutter and costs the most.

---

## 7. Testing

Vitest, mirroring how `fort` tests. Three suites, all on pure logic:

- **`rail.test.ts`** — `railLayout()` returns correct x/z/scale for a given index and card count; the wrap function is continuous across the seam and never produces a gap or overlap; mobile card count reduces correctly.
- **`time.test.ts`** — clock formatting for both zones, offset labels, and DST transitions in the Kyoto and visitor-local zones.
- **`content.test.ts`** — every work has its required fields; badge letters fall within the allowed set; slugs are unique; every media path referenced in content exists on disk.

Animation correctness is verified in the browser, not in assertions. Attempting to assert on GSAP tween state produces tests that pass while the page looks wrong.

---

## 8. Responsive

Three breakpoints.

| | Mobile `<768` | Tablet `768–1199` | Desktop `≥1200` |
| --- | --- | --- | --- |
| Gutter | 16px | 24px | 32px |
| Work grids | 1 column | 2 columns | `1fr 1fr 2fr` / `2fr 1fr 1fr` |
| News grid | 1 column | 2 columns | 4 columns |
| Headline | 32px | 40px | 48px |
| Rail | 8 cards, flattened | 10 cards | 12 cards, full rotation |
| Footer nav | 24px | 28px | 32px |

---

## 9. Definition of done

- All six sections built, responsive across the three breakpoints.
- Light and dark themes both complete, persisted, no flash on load.
- Hero headline splits and staggers; the rail loops seamlessly and responds to scroll velocity.
- `prefers-reduced-motion` fully honored.
- All media downloaded, committed, and credited.
- `pnpm test` green; `pnpm build` clean; `pnpm lint` clean.
- Verified in a real browser at all three breakpoints, in both themes.
