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
  repo: `${REPO}/newthing`,      // mobile: source. web: `live: "/newthing/"` instead
  media: {},                     // see below
  notes: [
    { heading: "What it is", body: "…" },
    { heading: "How it's built", body: "…" },
  ],
}
```

A **web** experiment has `live` and no `repo`; a **mobile** experiment has
`repo` and no `live`. `content/experiments.test.ts` enforces that, so a card can
never offer a link it was not given.

## Media

```
public/media/<slug>.mp4      a screen recording, muted and looping
public/posters/<slug>.webp   a still
```

`MediaPlate` picks the first of the three it has: video, then poster, then a
typographic placeholder on the card ground. The placeholder is the shipped
state for an experiment with no clip yet, so adding one is a file plus a field:

```ts
media: { video: "/media/newthing.mp4", poster: "/posters/newthing.webp" }
```

The poster is optional, but it is what shows while the video is still loading.

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
