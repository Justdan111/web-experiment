# hub

The index page of the [web experiments](../README.md) portfolio, served at
`/`, plus a case study for each experiment at `/notes/<slug>/`. See
`content/experiments.ts` for the single source of truth on what exists.

A card links to that experiment's case study; the case study links out to the
running site. One route — `app/notes/[slug]/page.tsx` — renders them all, with
the narrative coming from `content/case-studies/<slug>.mdx` and the title,
summary, stack and accent from the `caseStudy` field on each experiment.

The hub is **light only** — there is no dark theme and no `prefers-color-scheme`
block anywhere, so every accent is chosen against one known ground. Case studies
are short on purpose: `case-study.test.ts` caps each body at 320 words.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding an experiment's card and case study

1. Add an entry to `content/experiments.ts`, including its `caseStudy` block.
2. Add a poster to `public/posters/`.
3. Write `content/case-studies/<slug>.mdx` — the narrative, starting at `##`.
   The `#` level belongs to the page template, not the prose.
4. Register it in `content/case-studies/index.ts`.

`experiments.test.ts` enforces that every entry points at a real folder and
poster, and that no slug collides with a path the hub reserves for itself
(`notes`, `posters`, `_next`, `favicon.ico`). `case-study.test.ts` enforces
that every experiment has a body on disk, that it is registered in the map,
that the body stays under 320 words, and that `accent` clears 3:1 and
`accentInk` clears 4.5:1 against the paper ground — fort's brand lime is
invisible on white, which is why both variants exist. See
`docs/deployment.md` in the repo root for the full runbook.

**The hub uses plain `<a href>` everywhere, never `next/link`.** Most paths on
this host are served by a different container, so client navigation to one
breaks. `app/page.test.ts` enforces it across every `.tsx` in `app/` rather
than in one named file, so moving markup into a new component cannot silently
switch the check off. `@next/next/no-html-link-for-pages` is disabled in
`eslint.config.mjs` for the same reason.

## Build

```bash
pnpm build   # static export to out/, served by nginx in production
pnpm test    # vitest — content/experiments.test.ts, app/page.test.ts
```

Deployment for the whole portfolio, including this app, is documented in
`docs/deployment.md`.
