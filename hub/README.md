# hub

The index page of the [web experiments](../README.md) portfolio, served at
`/`. Lists every experiment as a card linking to its own container — see
`content/experiments.ts` for the single source of truth on what exists.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding an experiment's card

Add an entry to `content/experiments.ts` and a poster to `public/posters/`.
`experiments.test.ts` enforces that every entry points at a real folder and
poster, that `notes` matches whether `app/notes/<slug>/page.mdx` exists, and
that no slug collides with a path the hub reserves for itself
(`notes`, `posters`, `_next`, `favicon.ico`). See
`docs/deployment.md` in the repo root for the full runbook.

**Cards use a plain `<a href>`, never `next/link`** — every experiment is a
different container, not a route in this app's router. `app/page.test.ts`
enforces that.

## Build

```bash
pnpm build   # static export to out/, served by nginx in production
pnpm test    # vitest — content/experiments.test.ts, app/page.test.ts
```

Deployment for the whole portfolio, including this app, is documented in
`docs/deployment.md`.
