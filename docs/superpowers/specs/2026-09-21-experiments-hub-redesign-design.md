# Experiments hub — redesign

The hub indexes two web experiments. It should index thirteen: the eleven
React Native apps in `mobile-interaction` as well as `verso` and `fort`. At
the same time it drops Docker and nginx for Vercel, and takes its visual
language from the portfolio at `dan-code.dev` so the two sites read as
siblings.

Layout and interaction follow `thumbfeel.iamthecode.xyz`: a hero with a status
rail beside it, a featured strip, and a playground grid filtered from a sticky
rail of counted categories.

## What changes

| | Before | After |
| --- | --- | --- |
| Scope | 2 web experiments | 13 — 11 mobile, 2 web |
| Name | Web Experiments | dan / experiments |
| Type | Bricolage / Newsreader / JetBrains Mono | Geist Sans / Geist Mono |
| Colour | A per-experiment accent hue each | One accent, `#2563eb` |
| Detail pages | MDX case studies, ~1200 words | Data-driven, short |
| Hosting | Docker images, nginx, GHCR, Dokploy | One Vercel project |

## Deployment

All three apps are `output: "export"`. The build assembles them into one
static tree rather than routing between three containers:

```
hub    build -> hub/out         -> dist/
verso  build -> verso/out/verso -> dist/verso/
fort   build -> fort/out/fort   -> dist/fort/
```

`verso` and `fort` already set `basePath`, so their files land at the path
they are served from. Every URL is unchanged from the Docker setup, and
nothing in either sibling app is touched.

Vercel builds `dist` from a root `package.json`. Removed: the three
`Dockerfile`s, the three `nginx.conf`s, `proxy/`, `docker-compose.local.yml`,
`.dockerignore`, and `.github/workflows/deploy.yml`.

`scripts/audit-export.mjs` and `scripts/smoke.sh` are kept and pointed at
`dist/`. The smoke crawler is self-maintaining — it discovers pages by
following links — so adding an experiment needs no edit to it.

## Content model

`content/experiments.ts` is the only source of content. MDX is removed, so
there is one rendering path rather than two.

```ts
type Experiment = {
  slug: string;
  title: string;
  blurb: string;                  // 1-2 sentences, shown on the card
  platform: "mobile" | "web";
  category: "Motion" | "Gestures" | "Generative" | "Full flows";
  tags: string[];                 // Reanimated, GSAP, Skia, SVG
  year: number;
  status: "live" | "clip" | "wip";
  live?: string;                  // "/verso/" — web only
  repo?: string;                  // GitHub URL — mobile only
  media: { poster?: string; video?: string };
  notes: { heading: string; body: string }[];
};
```

A web experiment has `live` and no `repo`; a mobile experiment has `repo` and
no `live`. Tests enforce that, so a card can never offer a link it has not
been given.

Detail pages are short, in the manner of the reference: what the thing is, and
what it was built with. The long-form `verso.mdx` and `fort.mdx` are condensed
to that same shape — git keeps the originals.

## Design language

The portfolio's tokens, verbatim:

```
--background #ffffff        --foreground #0a0a0a
--muted #f4f4f5             --muted-foreground #71717a
--border rgba(10,10,10,.08) --card #f5f5f4
--accent #2563eb
```

One accent, used for the hero's emphasised word, section labels, links and
focus rings. No experiment carries a hue of its own; media plates sit on
`--card` like every other surface.

Ported from the portfolio so the sites match: the pill `Nav`, `SectionLabel`
(`//` then mono uppercase in accent), `Reveal`/`RevealStagger`, `SmoothScroll`
(Lenis), and cards that are `rounded-3xl border-border`, lift `y:-6` and fill
to `bg-card` on hover. Easing is `[0.22, 1, 0.36, 1]` throughout.

## Pages

**`/`** — Nav, hero with status rail, featured strip, playground grid,
services, footer.

The playground's rail carries both axes in one list, divided by a hairline:
platform above (Mobile, Web), craft below (Motion, Gestures, Generative, Full
flows), with `All experiments` at the top and `Showing N of N` at the foot.
Every row shows a count derived from the data. Sticky on desktop; a horizontal
chip row on mobile. Filtering is client-side over the static array.

**`/notes/<slug>/`** — eyebrow (`// MOBILE · MOTION`), title, summary, one
call to action (`View live` for web, `View on GitHub` for mobile), media
plate, tech chips, the note sections, and prev/next.

## Media

```
hub/public/media/<slug>.mp4
hub/public/posters/<slug>.webp
```

The plate renders a muted autoplaying loop when `media.video` is set, a poster
when only that exists, and otherwise a typographic placeholder on `--card`
showing the slug in mono — the fallback the portfolio's `ProjectCard` already
uses. The site is therefore complete before any video exists, and each video
added later is one file and one field.

Videos are not yet supplied. Every experiment ships with the placeholder.

## Testing

Vitest, already configured in the hub:

- Data invariants: slugs unique; every mobile experiment has `repo` and no
  `live`; every web experiment has `live` and no `repo`; category and platform
  counts equal the data.
- The filter is a pure function, tested apart from the component.
- `page.test.ts`'s existing rule keeping `next/link` out of the app: still
  required, because `/verso/` and `/fort/` are built by a different Next app
  and a client-side navigation to them would 404.

Then `scripts/audit-export.mjs` and `scripts/smoke.sh` against the assembled
`dist/`.
