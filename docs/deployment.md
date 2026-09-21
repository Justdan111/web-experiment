# Deploying the experiments

Everything is one host. The hub answers `/`, each experiment answers its own
path prefix — `/verso/`, `/fort/`. That used to be three Docker containers
behind an nginx proxy; it is now one static tree, assembled at build time.

## How it works

All three apps are `output: "export"`, and `verso` and `fort` each set a
`basePath` matching the path they are served from. So their files already land
in the right place, and assembling the site is a copy rather than a rewrite:

```
hub    build -> hub/out         -> dist/
verso  build -> verso/out/verso -> dist/verso/
fort   build -> fort/out/fort   -> dist/fort/
```

`scripts/build-site.mjs` does exactly that, and fails loudly if an app builds
no export — which is what happens if someone drops `output: "export"` from a
`next.config.ts`.

Every URL is the same as it was under Docker. Neither sibling app needed a
change.

## Vercel

One project, from the repo root.

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Root directory | `.` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Install command | `pnpm install --ignore-scripts` |

`vercel.json` already sets all of these, so the dashboard should need no edits.
The root install is only for the repo's own devDependencies — the build script
installs each app's dependencies itself, with `--frozen-lockfile`.

For a custom domain, point `experiments.<domain>` at the project in Vercel's
Domains tab. There is no certificate step; Vercel issues one.

## What has been verified, and what hasn't

Verified locally: all three apps build, the tree assembles,
`node scripts/audit-export.mjs dist` finds no asset escaping its own prefix,
and `scripts/smoke.sh` passes against `npx serve dist -l 8080` — every page and
every asset it references returns 200.

Not verified: the Vercel build itself, and the custom domain. Local green does
not mean deployed green. Treat the first deploy as first-run-in-anger.

## Locally

```bash
pnpm build                    # assemble dist/
npx serve dist -l 8080        # serve it exactly as Vercel will
scripts/smoke.sh              # crawl it, assert every page and asset 200s
node scripts/audit-export.mjs dist
```

To work on one app, run it on its own instead:

```bash
cd hub && pnpm dev            # http://localhost:3000/
cd verso && pnpm dev          # http://localhost:3000/verso/
cd fort && pnpm dev           # http://localhost:3000/fort/
```

Next's startup banner shows the root — ignore it for the prefixed apps.
