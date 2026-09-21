# Web Experiments — Hub & Deployment Design Spec

**Date:** 2026-08-24
**Status:** Approved; §6 revised 2026-08-24 after an empirical build
**Scope:** A single-page index of web experiments, plus the deployment architecture that puts every experiment on one host under its own path — self-hosted on Dokploy, behind Cloudflare DNS, built in GitHub Actions.

---

## 1. Purpose

Turn this repo from "two unrelated Next.js apps in folders" into a portfolio: one address that lists every experiment, where clicking an entry lands you on the live thing itself rather than a screenshot of it.

Two properties matter more than anything else in the design, because they are what make it survive experiment #3 through #15:

1. **Experiments stay independent.** A new experiment must be able to use a different Next version, or not use Next at all, without touching any other experiment.
2. **Adding one is cheap.** New folder, one content entry, one Dokploy app. No DNS change, no CI change, no hub redeploy required for routing.

**In scope:** the `hub/` app; the config and container changes that make `verso/` and `fort/` deployable under a path; the CI pipeline; the Dokploy and Cloudflare setup; the runbook for adding experiment N+1.

**Out of scope:** any change to the experiments' own components or design; a CMS; analytics; search; a shared component library between experiments; migrating the portfolio apex domain.

---

## 2. Current state

| | `fort` | `verso` |
| --- | --- | --- |
| Stack | Next 16.3, React 19.2, Tailwind 4, GSAP | same, plus `@gsap/react` |
| Route handlers | none | none |
| `'use server'` | none | none |
| Runtime `process.env` | none | none |
| `next/image` sources | all local | all local |
| `public/` | 3.2 MB | 1.4 MB |
| Lockfile | own | own |

`fort/.env.local` holds `PEXELS_API_KEY`, used for build-time media staging only — nothing reads it at runtime.

**Consequence: both apps are fully static-exportable today.** That is the single most load-bearing fact in this spec. It means an experiment costs a ~5 MB nginx container rather than a ~150 MB Node process, so the box can hold a lot of them.

---

## 3. Architecture

```
Cloudflare DNS
  A  experiments.<domain>  →  <VPS IP>          (portfolio apex untouched)
        │
  Traefik (managed by Dokploy) — TLS termination, routes by path prefix
        ├── /        → hub    container   (nginx)
        ├── /verso   → verso  container   (nginx)
        └── /fort    → fort   container   (nginx)
```

Routing table:

| Public URL | Dokploy app | Image | Domain Path | Strip Path | Port |
| --- | --- | --- | --- | --- | --- |
| `experiments.<domain>/` | `hub` | `ghcr.io/justdan111/hub:latest` | `/` | off | 80 |
| `experiments.<domain>/verso` | `verso` | `ghcr.io/justdan111/verso:latest` | `/verso` | off | 80 |
| `experiments.<domain>/fort` | `fort` | `ghcr.io/justdan111/fort:latest` | `/fort` | off | 80 |

Three Dokploy applications, each pulling a prebuilt image. Because CI builds the images (§7), Dokploy never clones the repo and the per-app **Build Path** an earlier draft specified is not needed — the distinction between apps lives in the image name instead. No repo restructuring is required either way.

**Why Strip Path stays off:** the exported files are placed inside the image at the same path they are served from (`/usr/share/nginx/html/verso/…`). The container is then self-contained and testable with no proxy in front of it — `docker run -p 8080:80 verso` and `http://localhost:8080/verso` renders exactly what production serves. Stripping at the edge would make the container behave differently locally than in production, which is precisely the class of bug that is miserable to chase.

---

## 4. Repo layout

```
web experiments/
├── hub/                      NEW — the index site
│   ├── app/
│   │   ├── page.tsx          the single index page
│   │   └── notes/<slug>/page.mdx   optional writeups
│   ├── content/experiments.ts      single source of truth
│   ├── public/posters/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── verso/                    + next.config change, Dockerfile, nginx.conf, .dockerignore
├── fort/                     + same
└── .github/workflows/deploy.yml
```

**No root workspace, deliberately.** A shared `pnpm-workspace.yaml` with one lockfile would let experiments share components, at the cost of coupling every experiment to one dependency set. For a collection of one-off studies, independence is worth more than reuse. Each app keeps its own lockfile and its own `pnpm-workspace.yaml`, exactly as today.

---

## 5. The hub

A fourth Next.js app matching its siblings' stack (Next 16, React 19, Tailwind 4), static-exported, served at the root path with no `basePath`.

### 5.1 Content model

One file is the source of truth for what exists:

```ts
// hub/content/experiments.ts
export type Experiment = {
  slug: string        // 'verso' — must equal the folder name and the URL path
  title: string
  blurb: string       // one or two sentences, shown on the card
  tags: string[]      // 'GSAP', 'editorial', 'WebGL'
  year: number
  href: string        // '/verso'
  poster: string      // '/posters/verso.webp'
  notes: boolean      // does hub/app/notes/<slug>/page.mdx exist?
  status?: 'live' | 'wip'
}

export const experiments: Experiment[] = [ /* … */ ]
```

### 5.2 Index page

One page, mapping over `experiments`. Each card shows poster, title, blurb, tags, year. The card itself is the primary link to `href`. When `notes` is true, a secondary "read notes" link points at `/notes/<slug>`.

**Cards must use a plain `<a href>`, never `next/link`.** `/verso` is served by a different container and is not a route in the hub's router; `next/link` would attempt a client-side navigation, fail to find the route, and prefetch a payload that does not exist. This is the single easiest way to break this architecture, so it is called out here and enforced by a test (§9).

### 5.3 Notes

Writeups are `page.mdx` files under `hub/app/notes/<slug>/`, rendered by `@next/mdx`. This works with static export and needs no MDX-loading library beyond the official plugin.

The `notes: boolean` flag and the presence of the MDX file can drift apart. A unit test asserts they agree in both directions (§9), so a flag set without a file — or a file written without flipping the flag — fails the build rather than shipping a dead link or a hidden page.

---

## 6. Per-experiment contract

Everything required to make a folder deployable. This list *is* the runbook in §10.

> **Revised 2026-08-24.** An earlier draft of this section claimed the change was config-only and touched no component code. A real `output: 'export'` build of `verso` with `basePath: '/verso'` disproved that — see item 2. The finding below is measured, not assumed.

**1. `next.config.ts`:**

```ts
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/verso',          // matches the folder name and the URL path
  trailingSlash: true,
  images: { unoptimized: true },
}
```

- `output: 'export'` — emits `out/`, no Node server at runtime.
- `basePath` — makes every internal link and asset URL resolve under the prefix.
- `trailingSlash: true` — every route becomes `<route>/index.html`, so nginx can serve directories and the config stays trivial. Without it, routes emit sibling `.html` files needing a `try_files $uri.html` fallback.
- `images: { unoptimized: true }` — static export has no image optimization server. All images here are already local files, so this only forgoes Next's resizing; posters and hero art should be checked for sane dimensions.

**2. Prefix every `public/` asset reference.**

`basePath` prefixes `_next/static` URLs, route links and metadata routes. **It does not prefix literal paths to files in `public/`.** A verified export of `verso` emitted 36 references to `/media/...` with no `/verso` prefix — every one of which would resolve against the *hub* container in production and 404, breaking every image on the page.

Each app therefore gets a single module naming its own prefix, which `next.config.ts` also imports so the two can never drift:

```ts
// app/lib/base-path.ts
export const BASE_PATH = "/verso";
export const asset = (path: string) => `${BASE_PATH}${path}`;
```

`asset()` is applied where asset paths are *defined* — the content modules — so every consuming component is correct without being touched individually. Components holding literal paths inline (`fort/app/components/Landing.tsx`, `fort/app/components/RacketCursor.tsx`) are wrapped at the point of use.

Known affected files:

| App | Files holding `public/` paths |
| --- | --- |
| `verso` | `app/content/works.ts`, `app/content/news.ts` |
| `fort` | `app/content.ts`, `app/components/Landing.tsx`, `app/components/RacketCursor.tsx` |

This is enforced mechanically rather than by review — see `scripts/audit-export.mjs` in §9. Hand-auditing this for every future experiment is exactly the kind of check people stop doing.

**3. `Dockerfile`** (build context is the **repo root**, not the app folder):

```dockerfile
# Build context is the REPO ROOT, so that scripts/ is reachable:
#   docker build -f verso/Dockerfile -t verso .
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY verso/package.json verso/pnpm-lock.yaml verso/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY verso/ ./
RUN pnpm build

# An image cannot exist with assets that escape the path prefix.
COPY scripts/audit-export.mjs /audit.mjs
RUN node /audit.mjs out /verso

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html/verso
COPY verso/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

The build context has to be the repo root, not the app folder, because the audit step needs `scripts/audit-export.mjs` — a per-app context can't `COPY` a file that lives outside it. That's also why every `COPY` from the build context is prefixed with the app's folder name (`verso/package.json`, not `package.json`). The `--mount=type=cache` line requires BuildKit, which `docker buildx` in Actions provides by default. The `COPY` of `pnpm-workspace.yaml` assumes every app has one. pnpm does not always write that file on its own — it appears only when pnpm needs to record something like `ignoredBuiltDependencies`, which is why `verso`, `fort` and `hub` all have one today. A new experiment that never trips that condition won't get one, and the `COPY` fails the build with "no such file or directory." See `docs/deployment.md`'s "Adding an experiment" section.

The audit step is not optional per-app boilerplate: without it, an experiment can export assets that 404 against a sibling container in production with nothing catching it before the image ships (§9, §11).

**4. `.dockerignore`** — one at the **repo root**, since the build context is the repo root:

```
**/node_modules
**/.next
**/out
**/.env
**/.env.*
**/.media-staging
**/.media-backup
**/*.tsbuildinfo
.git
docs
```

Docker resolves `.dockerignore` relative to the build **context**, not the Dockerfile's own directory — so a per-app `.dockerignore` would be silently ignored while the context is the repo root. Without a root one, the build context balloons and stale local build output (including other apps') can leak into the image.

**5. `nginx.conf`:**

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  location /verso/_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ =404;
  }
}
```

Hashed `_next/static` assets are immutable and get a one-year cache; everything else falls back to nginx defaults so HTML revalidates.

**6. One entry in `hub/content/experiments.ts`, and a poster in `hub/public/posters/`.**

> **Resolved by measurement, 2026-08-24.** A real export of `verso` at `basePath: '/verso'` produces a **flat** `out/` — `out/index.html`, `out/_next/`, `out/media/`, with no `verso/` directory. Assets are referenced as `/verso/_next/static/…`, and `public/` is copied to the root of `out/`. So `COPY --from=build /app/out /usr/share/nginx/html/verso` is correct, and font `url()` references inside the exported CSS are relative (`../media/…`), so they need no prefixing.

---

## 7. CI/CD

One workflow, `.github/workflows/deploy.yml`, on push to `main`.

```
detect  → any top-level dir containing a Dockerfile that has changed in this push
build   → matrix over those dirs
          docker buildx build . -f <app>/Dockerfile   (context is the repo root)
          push ghcr.io/<owner>/<app>:<sha> and :latest
deploy  → curl the app's Dokploy webhook
```

The build context is the repo root — not `./<app>` — because each app's Dockerfile needs `scripts/audit-export.mjs` (§6 item 3), which lives outside the app folder. `docker/build-push-action` is called with `context: .` and `file: ./<app>/Dockerfile`.

**App discovery is filesystem-driven** — "every top-level directory containing a Dockerfile" — so adding an experiment requires no workflow edit. Combined with a `git diff` against the previous commit, pushing a change to `verso/` builds only `verso`.

Secrets: `DOKPLOY_WEBHOOK_HUB`, `DOKPLOY_WEBHOOK_VERSO`, `DOKPLOY_WEBHOOK_FORT`. The detect job emits objects rather than bare names — `{"app":"verso","secret":"DOKPLOY_WEBHOOK_VERSO"}` — so the deploy step can read `secrets[matrix.secret]`. (GitHub Actions expressions have no `upper()` function, so the uppercasing is done in the detect script, not in the workflow expression.) Registry auth uses the built-in `GITHUB_TOKEN` with `packages: write`.

**Why not build on the VPS:** Dokploy's own documentation recommends against it — a Next build wants 1–2 GB of RAM, and that spike lands on the same box serving every other experiment. Building in CI keeps the VPS doing nothing but pulling a finished image.

---

## 8. Dokploy, DNS and TLS

**Dokploy** — three applications, provider **Docker**, each pointed at the image in §3 with the domain, path and port from that table. Deploys are triggered by the webhook CI calls after pushing a new `:latest`. If the repo is private, add a registry credential under Settings → Registry: a GitHub PAT with `read:packages`.

**Cloudflare** — one `A` record, `experiments` → VPS IP.

> **Sequencing matters.** Leave the record **DNS-only (grey cloud)** until Let's Encrypt has issued the certificate. Behind Cloudflare's proxy the HTTP-01 challenge can fail, and the failure mode is a confusing one. Once the cert is issued, enable the proxy and set SSL/TLS mode to **Full (strict)**.

---

## 9. Verification

Acceptance criteria, in the order they should be checked:

| # | Check | How |
| --- | --- | --- |
| 1 | Each app exports cleanly | `pnpm build` in each folder produces `out/` |
| 1b | No asset escapes the basePath | `node scripts/audit-export.mjs <app>/out /<slug>` exits 0 |
| 2 | Container serves the app standalone | `docker run -p 8080:80 <app>`, load `localhost:8080/<slug>` — page renders, **no 404s in the network panel**, fonts and images load |
| 3 | Deep links work | a non-root route in the app loads directly, not just via client nav |
| 4 | Hub links leave the app | cards are `<a>`, confirmed by a test grepping the index page for `next/link` |
| 5 | Notes flag matches filesystem | vitest test over `experiments.ts` vs `hub/app/notes/*` — both directions |
| 6 | Poster exists for every experiment | same test file |
| 7 | Path routing does not shadow | on the server, `/`, `/verso` and `/fort` each hit the right container |
| 8 | Only changed apps rebuild | push a verso-only change, confirm CI builds one image |
| 9 | TLS valid | `curl -I https://experiments.<domain>/verso` returns 200 with a valid cert |

Checks 4–6 are vitest tests in `hub/`, matching the existing `vitest run` setup in the sibling apps. Check 2 is the one that catches `basePath` mistakes, and it is worth doing before anything is pushed.

---

## 10. Adding experiment N+1

1. `mkdir newthing/`, build whatever you want in it.
2. Apply the §6 contract: four config lines, `Dockerfile`, `nginx.conf` (copy from `verso/`, change the slug).
3. Add an entry to `hub/content/experiments.ts` and a poster to `hub/public/posters/`.
4. In Dokploy: new application, provider **Docker** pulling `ghcr.io/<owner>/newthing:latest` (CI has already built and pushed it — Dokploy never clones the repo, so there is no Build Path to set), domain `experiments.<domain>` with Path `/newthing`.
5. Add the `DOKPLOY_WEBHOOK_NEWTHING` secret.
6. Push.

No DNS change. No CI change. The hub redeploys only to show the new card, never for routing.

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A `public/` asset reference escapes the basePath and 404s against a sibling container | `scripts/audit-export.mjs` fails the build on any root-absolute reference outside the prefix; runs in CI for every app on every push |
| Adding an experiment reintroduces the same escaped-asset bug | Same audit script — it is generic over app and prefix, so a new experiment is covered the day it is added |
| Traefik path priority — hub's `/` shadowing `/verso` | Traefik sorts rules by specificity, so the longer prefix should win; verified explicitly as check 7 |
| Let's Encrypt fails behind Cloudflare proxy | Documented sequencing in §8 — issue on grey cloud, then proxy |
| Private GHCR pull fails on the VPS | Registry credential configured in Dokploy before first deploy |
| `unoptimized: true` ships oversized images | Audit poster and hero dimensions during implementation; these are hand-picked assets, not user uploads |
| A future experiment needs SSR or an API route | That app alone switches to `output: 'standalone'` and a Node Dockerfile. Nothing else changes — routing, CI and the hub are all indifferent to what a container runs |

---

## 12. Decisions

| Decision | Chosen | Rejected, and why |
| --- | --- | --- |
| URL shape | Path under one host (`/verso`) | Subdomains — more DNS records, reads as separate sites. Raw container URLs — disjointed |
| Hub depth | Card → live site, optional `/notes/<slug>` writeup | Writeup-first — puts a click between the visitor and the actual work |
| Routing layer | Traefik path routing (Dokploy-native) | Next rewrites in the hub — adds a proxy hop and makes the hub a single point of failure for every experiment |
| Serving | Static export → nginx | Node container per app — 30× the idle RAM for no benefit today. Hub serves everything — couples every experiment's deploy to every other |
| Build location | GitHub Actions → GHCR | On-VPS builds — 1–2 GB RAM spike on the box serving live traffic |
| Repo structure | Independent apps, no root workspace | Shared workspace — couples experiments to one dependency set |
| Host | `experiments.<domain>` subdomain | Path off the portfolio apex — entangles two deployments |
