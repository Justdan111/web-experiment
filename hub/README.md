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

## More from the playground

Below the run block, three related experiments — same category first, then the
rest in order (`relatedTo()`). They show their **permanent** number via
`numberOf()`, not a local 1–3: the grid renumbers within a filtered view, but
this is a selection rather than a view, so `07` still means Sushi.

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
