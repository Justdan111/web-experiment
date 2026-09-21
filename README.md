# dan / experiments

Mobile and web experiments — an annex of [dan-code.dev](https://dan-code.dev).
Thirteen of them: eleven React Native apps and two sites, each built to answer
one question and nothing more.

The **hub** is the index and the case notes. `verso` and `fort` are the two web
experiments, each a standalone Next app served under its own path. The eleven
mobile experiments live in
[mobile-interaction](https://github.com/Justdan111/mobile-interaction); the hub
indexes them and links to their source.

| Folder | Served at | What it is |
| --- | --- | --- |
| `hub` | `/` | The index, and a short detail page for each experiment at `/notes/<slug>/` |
| `verso` | `/verso` | Editorial studio homepage — layout, type animation, scroll |
| `fort` | `/fort` | Tennis club site — booking flow, cursor interaction |

- **Deployment:** `docs/deployment.md` — one Vercel project, built from the root
- **Design:** `docs/superpowers/specs/2026-09-21-experiments-hub-redesign-design.md`

## Running it

The whole site, exactly as it deploys:

```bash
pnpm build                 # builds all three, assembles dist/
npx serve dist -l 8080     # http://localhost:8080/, /verso/, /fort/
./scripts/smoke.sh         # crawl it; fails on any non-200
```

One app on its own, with hot reload:

```bash
cd hub && pnpm dev         # http://localhost:3000/
cd verso && pnpm dev       # http://localhost:3000/verso/
cd fort && pnpm dev        # http://localhost:3000/fort/
```

Next's startup banner shows the root — ignore it for the prefixed apps.

## Adding an experiment

One entry in `hub/content/experiments.ts`. See `hub/README.md`.
