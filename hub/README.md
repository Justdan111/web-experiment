# hub

The index of `dan / experiments`, and a short detail page for each experiment
at `/notes/<slug>/`. Served at the root of the assembled site, so it has no
`basePath`.

## Adding an experiment

One entry in `content/experiments.ts`. Nothing else — the index, the filter
rail, its counts, the detail page and `generateStaticParams` all read from that
array, so an entry is the whole change.

```ts
{
  slug: "newthing",              // url path and media filename stem
  title: "New Thing",
  blurb: "One or two sentences. Shown on the card.",
  platform: "mobile",            // "mobile" | "web"
  category: "Gestures",          // one of CATEGORIES
  tags: ["Reanimated", "Skia"],
  year: 2026,
  status: "source",              // "live" | "source" | "wip"
  folder: "newthing",            // path inside its repo; repo link is derived
  media: {},                     // see below
  notes: [
    { heading: "What it is", body: "…" },
    { heading: "How it's built", body: "…" },
  ],
}
```

A **web** experiment has `live` (its path on this host); a **mobile** experiment
has neither, and its `repo` link is derived from `folder`.
`content/experiments.test.ts` enforces that split, so a card can never offer a
link it was not given.

## The run block

Each detail page shows the four commands that get the experiment running, built
by `runFor()` from `folder` — never written out per experiment, so they cannot
drift from the data:

```
git clone <its repo>.git
cd <clone dir>/<folder>          # quoted when the folder has a space in it
npm install | pnpm install
npm start   | pnpm dev
```

An app that needs something else overrides the last line and the note:

```ts
run: {
  command: "npx expo run:ios",
  note: "Widget Lab builds iOS widgets and Live Activities, so it needs a development build rather than Expo Go …",
}
```

`folder` holds the **real directory name** — `"travel app"`, not
`"travel%20app"`. `encodePath()` does the URL encoding for the GitHub link and
`shellPath()` does the quoting for `cd`; writing an encoded folder breaks both.

## The featured rail

`Recent` is a rail of three, pinned while the page scrolls past it
(`FeaturedRail`). The focused card is full width and sharp; its neighbours
narrow, blur and desaturate with distance. Every per-card value comes from one
number:

```
focus = progress x (cards - 1)     // progress through the tall section
d     = clamp(|i - focus|, 0, 1)
width = lerp(maxW, minW, d)        // and blur, grayscale, opacity likewise
```

It is driven from scroll progress rather than from measured positions on
purpose. Card widths decide the layout, so reading positions back to compute
widths is a feedback loop through the layout engine, and it oscillates.

A card is as wide as the viewport allows **but no taller than the stage** —
those are different axes, and on a short wide window a 43vw card at 4:3 is
taller than 68vh, which centres half the card behind the sticky nav.

Dragging the rail scrolls the page rather than moving the rail on its own, so
scroll stays the single source of truth. It goes through Lenis
(`app/lib/lenis.ts`) rather than `window.scrollTo`, which the smoothing would
otherwise undo mid-drag.

The rail is `lg` and up only. Narrow screens, and anyone who asks for reduced
motion, get the same three stacked instead — pinning the page and driving a
carousel from the scroll is scroll-jacking, which is the thing that preference
is asking you not to do. The rAF loop does not run in either case.

## More from the playground

Below the run block, three related experiments — same category first, then the
rest in order (`relatedTo()`). They show their **permanent** number via
`numberOf()`, not a local 1–3: the grid renumbers within a filtered view, but
this is a selection rather than a view, so `07` still means Sushi.

## Media

```
.media-source/videos/<name>.mp4   the 4K recording — gitignored, never shipped
hub/public/videos/<slug>.mp4      the web-sized clip
hub/public/posters/<slug>.webp    its first frame
```

Drop a recording into `.media-source/videos/` at the repo root and run:

```bash
./scripts/optimise-media.sh      # needs ffmpeg and cwebp
```

It scales to 1280 wide, drops the audio (the clips are muted everywhere they
are used), writes a `faststart` MP4 per slug and a poster beside it. The
originals are ~3840x2160 and ~23MB each; the output is 1-2MB. A card renders at
619px at most, so 1280 is still 2x on a retina screen.

If a recording's filename is not the slug, add it to `slug_for()` in that
script — `carproj` is `cars`, `trav` is `travel`.

Then point the entry at them:

```ts
media: { video: "/videos/newthing.mp4", poster: "/posters/newthing.webp" }
```

`MediaPlate` picks the first of the three it has: clip, then poster, then a
typographic placeholder on a dark ground. It plays only while on screen
(`preload="none"` plus an IntersectionObserver), because the home page holds
nineteen plates and nine distinct clips, and left alone they would all fetch
and decode at once.

`content/media.test.ts` checks every path resolves to a real file, that no clip
on disk is unclaimed, and that none is over 4MB — which is what catches a
source recording copied in by hand.

## The link rule

**Plain `<a href>` everywhere, never `next/link`.** `/verso/` and `/fort/` are
built by a different Next app and copied in beside this one, so a client-side
navigation to them 404s. `app/page.test.ts` enforces this across every `.tsx`
in `app/` rather than in one named file, so moving markup into a new component
cannot silently switch the check off. `@next/next/no-html-link-for-pages` is
disabled in `eslint.config.mjs` for the same reason.

## Build

```bash
pnpm dev     # http://localhost:3000/
pnpm build   # static export to out/
pnpm test    # vitest — experiments, filter, and the link rule
```

`out/` is assembled into the site's `dist/` by `scripts/build-site.mjs` in the
repo root. Deployment is documented in `docs/deployment.md`.
