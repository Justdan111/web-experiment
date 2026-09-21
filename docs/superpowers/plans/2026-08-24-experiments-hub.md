# Web Experiments Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish every experiment in this repo at one address — `experiments.<domain>/`, `/verso`, `/fort` — behind a hub page that indexes them, self-hosted on Dokploy with images built in GitHub Actions.

**Architecture:** Each app static-exports to `out/` and is baked into its own `nginx:alpine` image, with its files placed at the same path it is served from. Traefik (managed by Dokploy) routes by path prefix to the right container. A repo-root audit script runs *inside* each Docker build and fails the image if any asset URL escapes the app's path prefix — the one bug this architecture is prone to.

**Tech Stack:** Next 16.3.0, React 19.2.8, Tailwind 4, TypeScript 5, vitest 3.2.7, pnpm 10.17.0, Docker (nginx:alpine + node:22-alpine), GitHub Actions, GHCR, Dokploy, Cloudflare DNS.

**Spec:** `docs/superpowers/specs/2026-08-24-experiments-hub-design.md` — read it before starting. This plan argues from that spec; where the plan is silent, the spec governs.

## Global Constraints

- **Repo root is `/Users/danemmanuel/Documents/web experiments`.** It contains a space — quote every path in shell commands.
- **Git remote is `github.com/Justdan111/web-experiment`.** GHCR requires a lowercase owner, so images are `ghcr.io/justdan111/<app>`.
- **Branch is `experiments-hub`**, already created off the verso work.
- **This is NOT the Next.js you know.** Next 16 has breaking changes from training data. Before writing Next-specific code, read the relevant guide in `<app>/node_modules/next/dist/docs/`. See `verso/AGENTS.md`.
- **Exact pinned versions**, matching the existing apps: `next@16.3.0`, `react@19.2.8`, `react-dom@19.2.8`, `tailwindcss@^4`, `vitest@^3.2.7`, `typescript@^5`, `eslint-config-next@16.3.0`. Package manager `pnpm@10.17.0`.
- **Apps stay independent.** No root `package.json`, no root workspace, no shared lockfile. `scripts/` at the root is dependency-free Node — that is the only shared code.
- **An experiment's slug is one lowercase alphanumeric word** (`verso`, `fort`) and is used verbatim as: the folder name, the `basePath`, the URL path, the image name, and — uppercased — the CI secret name. A hyphen would break the secret-name derivation, so the hub's test suite enforces the pattern.
- **`basePath` does not prefix `public/` assets.** This is measured, not theoretical — see spec §6 item 2. Every literal path to a file in `public/` must be wrapped in `asset()`.
- **Never use `next/link` for a cross-app link.** `/verso` is a different container and is not a route in the hub's router; `next/link` would attempt a client-side navigation and prefetch a payload that does not exist. Plain `<a href>` only.
- **Docker build context is the repo root** for every app, with `-f <app>/Dockerfile`. This is what lets the audit script run inside the build. Local builds must use the same form as CI.
- **Every task ends with a commit.** Imperative subject, body explaining *why*, and the `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` trailer.
- **Existing tests must stay green.** `verso` has 45 passing, `fort` has 41. Run `pnpm test` in an app before committing a change to it.
- **Docker Desktop's daemon is not running.** Start it before any task that builds an image (Tasks 4, 6, 10, 11).

---

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/audit-export.mjs` | Fails when an exported site references a root-absolute URL outside its basePath. Generic over app and prefix. |
| `scripts/__fixtures__/{good,bad}/index.html` | Known-good and known-bad inputs proving the audit script works |
| `scripts/smoke.sh` | Curls every page and every asset it references through the local proxy; asserts all 200 |
| `.dockerignore` | Repo-root ignore, since every build context is the repo root |
| `<app>/app/lib/base-path.ts` | The app's single source of truth for its prefix: `BASE_PATH` + `asset()` |
| `<app>/next.config.ts` | Static export config; imports `BASE_PATH` so config and helper cannot drift |
| `<app>/Dockerfile` | Two-stage: pnpm build + audit, then nginx serving `out/` at the app's path |
| `<app>/nginx.conf` | Directory serving with immutable caching for `_next/static` |
| `hub/content/experiments.ts` | The index of experiments — one entry per experiment, the only file you edit to add one |
| `hub/content/experiments.test.ts` | Invariants: slug shape, poster exists, notes flag matches the filesystem, folder exists |
| `hub/app/page.tsx` | The single index page |
| `hub/app/notes/<slug>/page.mdx` | Optional writeup per experiment |
| `docker-compose.local.yml` + `proxy/nginx.conf` | Local simulation of Traefik path routing, for integration testing |
| `.github/workflows/deploy.yml` | Detect changed apps → build → push GHCR → trigger Dokploy |
| `docs/deployment.md` | The manual half: Dokploy apps, registry credentials, Cloudflare DNS and TLS ordering |

---

## Task 1: Export audit script

The enforcement mechanism for the whole architecture. Built first so every later task can use it.

**Files:**
- Create: `scripts/audit-export.mjs`
- Create: `scripts/__fixtures__/good/index.html`
- Create: `scripts/__fixtures__/bad/index.html`

**Interfaces:**
- Consumes: nothing.
- Produces: `node scripts/audit-export.mjs <out-dir> <base-path>` — exit 0 when every root-absolute reference sits under `<base-path>`, exit 1 when any escapes (printing each unique offender), exit 2 on bad usage. A `<base-path>` of `/` permits everything.

- [ ] **Step 1: Write the failing test — the fixtures**

`scripts/__fixtures__/good/index.html`:

```html
<link rel="stylesheet" href="/verso/_next/static/chunks/a.css">
<img src="/verso/media/work/low-tide.jpg">
<a href="/verso/about/">About</a>
<a href="https://example.com">External</a>
```

`scripts/__fixtures__/bad/index.html`:

```html
<link rel="stylesheet" href="/verso/_next/static/chunks/a.css">
<img src="/media/work/low-tide.jpg">
<video poster="/media/poster.jpg"></video>
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node scripts/audit-export.mjs scripts/__fixtures__/bad /verso`
Expected: FAIL — `Cannot find module`, because the script does not exist yet.

- [ ] **Step 3: Write the implementation**

`scripts/audit-export.mjs`:

```js
#!/usr/bin/env node
// Fails when an exported Next.js site references a root-absolute URL that is
// not under its basePath. Such a URL escapes the app's path prefix and, in
// production, resolves against a sibling container rather than this app.
//
// usage: node scripts/audit-export.mjs <out-dir> <base-path>
//    eg: node scripts/audit-export.mjs verso/out /verso

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const [outDir, basePath] = process.argv.slice(2);

if (!outDir || !basePath || !basePath.startsWith("/")) {
  console.error("usage: audit-export.mjs <out-dir> <base-path>");
  process.exit(2);
}

const SCANNED = new Set([".html", ".css"]);
const ATTR = /(?:src|href|poster)="(\/[^"]*)"/g;
const CSS_URL = /url\(\s*["']?(\/[^"')]*)/g;

// A hub served at the root has no prefix to escape from.
const inside = (url) =>
  basePath === "/" || url === basePath || url.startsWith(`${basePath}/`);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (SCANNED.has(extname(path))) yield path;
  }
}

const escaped = new Map();

for (const file of walk(outDir)) {
  const text = readFileSync(file, "utf8");
  for (const pattern of [ATTR, CSS_URL]) {
    for (const [, url] of text.matchAll(pattern)) {
      if (url.startsWith("//")) continue; // protocol-relative, not ours
      if (inside(url)) continue;
      if (!escaped.has(url)) escaped.set(url, file);
    }
  }
}

if (escaped.size > 0) {
  console.error(`${escaped.size} reference(s) escape ${basePath}:`);
  for (const [url, file] of escaped) {
    console.error(`  ${url}\n    first seen in ${file}`);
  }
  console.error("\nWrap these with asset() from app/lib/base-path.ts.");
  process.exit(1);
}

console.log(`ok - every root-absolute reference in ${outDir} is inside ${basePath}`);
```

- [ ] **Step 4: Run the audit against both fixtures**

```bash
node scripts/audit-export.mjs scripts/__fixtures__/bad /verso; echo "exit=$?"
node scripts/audit-export.mjs scripts/__fixtures__/good /verso; echo "exit=$?"
node scripts/audit-export.mjs scripts/__fixtures__/bad /; echo "exit=$?"
```

Expected, in order: `exit=1` listing `/media/work/low-tide.jpg` and `/media/poster.jpg` (two offenders, the `_next` and external links not flagged); `exit=0`; `exit=0` (root basePath permits everything).

- [ ] **Step 5: Commit**

```bash
git add scripts/
git commit -m "Add an export audit that catches assets escaping basePath"
```

---

## Task 2: Verso — base path module

**Files:**
- Create: `verso/app/lib/base-path.ts`
- Create: `verso/app/lib/base-path.test.ts`
- Modify: `verso/next.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `BASE_PATH: string` (`"/verso"`) and `asset(path: string): string`, both exported from `verso/app/lib/base-path.ts`. Tasks 3 and 4 depend on these exact names. Fort gets its own copy in Task 5 — this module is deliberately duplicated per app rather than shared, because the apps have no shared package.

- [ ] **Step 1: Write the failing test**

`verso/app/lib/base-path.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { BASE_PATH, asset } from "./base-path";

describe("BASE_PATH", () => {
  it("is the folder name this experiment is served under", () => {
    expect(BASE_PATH).toBe("/verso");
  });

  it("is what next.config.ts configures, so the two cannot drift", () => {
    expect(nextConfig.basePath).toBe(BASE_PATH);
  });
});

describe("asset", () => {
  it("prefixes a public path so it resolves under the base path", () => {
    expect(asset("/media/work/low-tide.jpg")).toBe("/verso/media/work/low-tide.jpg");
  });

  it("is idempotent, so double-wrapping during a refactor is harmless", () => {
    expect(asset(asset("/media/work/low-tide.jpg"))).toBe(
      "/verso/media/work/low-tide.jpg",
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd verso && pnpm vitest run app/lib/base-path.test.ts`
Expected: FAIL — cannot resolve `./base-path`.

- [ ] **Step 3: Write the implementation**

`verso/app/lib/base-path.ts`:

```ts
/**
 * The URL prefix this experiment is served under. Equals the folder name and
 * the path Traefik routes to it. `next.config.ts` reads this, so there is one
 * place to change it.
 */
export const BASE_PATH = "/verso";

/**
 * Prefixes a path to a file in `public/`.
 *
 * Next's `basePath` rewrites `_next/static` URLs, route links and metadata
 * routes — but NOT literal paths to `public/`. Unprefixed, `/media/x.jpg`
 * resolves against the hub container in production and 404s.
 */
export const asset = (path: string) =>
  path.startsWith(`${BASE_PATH}/`) ? path : `${BASE_PATH}${path}`;
```

`verso/next.config.ts` — replace the whole file:

```ts
import type { NextConfig } from "next";
import { BASE_PATH } from "./app/lib/base-path";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd verso && pnpm vitest run app/lib/base-path.test.ts`
Expected: PASS, 4 tests.

If importing `./app/lib/base-path` from `next.config.ts` fails at build time, fall back to writing `basePath: "/verso"` as a literal — the drift test in Step 1 still guards it. Do not skip the test.

- [ ] **Step 5: Commit**

```bash
git add verso/app/lib/base-path.ts verso/app/lib/base-path.test.ts verso/next.config.ts
git commit -m "Configure verso for static export under /verso"
```

---

## Task 3: Verso — prefix every public asset

**Files:**
- Modify: `verso/app/content/works.ts` (12 `image:` literals)
- Modify: `verso/app/content/news.ts` (4 `image:` literals)
- Modify: `verso/app/content/content.test.ts:9` (the `publicPath` helper)

**Interfaces:**
- Consumes: `asset` and `BASE_PATH` from `app/lib/base-path.ts` (Task 2).
- Produces: content objects whose `image` fields are already prefixed, so every consuming component (`WorkCard`, `NewsCard`, `HeroReel`, `HighlightRail`) is correct without being edited.

Wrapping at the point of *definition* rather than the point of *use* is deliberate: four components read these paths today and a fifth will tomorrow, but there are only two files where the paths are written down.

- [ ] **Step 1: Run the audit to see the failure this task fixes**

```bash
cd verso && pnpm build && node ../scripts/audit-export.mjs out /verso; echo "exit=$?"
```

Expected: `exit=1`, listing 15 unique `/media/...` references.

- [ ] **Step 2: Wrap the content paths**

Add to the top of both `verso/app/content/works.ts` and `verso/app/content/news.ts`:

```ts
import { asset } from "../lib/base-path";
```

Then wrap every image literal in both files:

```bash
cd verso
sed -i '' -E 's/image: "(\/media\/[^"]*)"/image: asset("\1")/' app/content/works.ts app/content/news.ts
grep -c 'asset("' app/content/works.ts app/content/news.ts
```

Expected counts: `works.ts` 12, `news.ts` 4. (Verified: those are the only `/media/` literals in the app — a repo-wide grep finds none outside these two files.) Each entry now reads `image: asset("/media/work/low-tide.jpg")`.

- [ ] **Step 3: Fix the media-existence test, which now looks in the wrong place**

`verso/app/content/content.test.ts` asserts every image exists on disk by joining the path onto `public/`. Prefixed paths would send it looking for `public/verso/media/...`. Change line 9 to strip the prefix:

```ts
import { BASE_PATH } from "../lib/base-path";

const publicPath = (p: string) =>
  join(process.cwd(), "public", p.replace(BASE_PATH, ""));
```

- [ ] **Step 4: Run the full suite and the audit**

```bash
cd verso && pnpm test && pnpm build && node ../scripts/audit-export.mjs out /verso; echo "exit=$?"
```

Expected: 49 tests pass (45 that existed before this plan, plus the 4 from Task 2), then `exit=0` with `ok - every root-absolute reference in out is inside /verso`.

- [ ] **Step 5: Commit**

```bash
git add verso/app/content/
git commit -m "Prefix verso media paths so they resolve under /verso"
```

---

## Task 4: Verso — container

**Files:**
- Create: `.dockerignore` (repo root)
- Create: `verso/Dockerfile`
- Create: `verso/nginx.conf`

**Interfaces:**
- Consumes: `scripts/audit-export.mjs` (Task 1), verso's export config (Tasks 2–3).
- Produces: an image tagged `verso` serving the app at `/verso` on port 80. Tasks 6 and 10 copy this shape for `fort` and `hub`.

- [ ] **Step 1: Start Docker and write the ignore file**

Start Docker Desktop, then confirm: `docker info >/dev/null && echo daemon ok`

`.dockerignore` at the repo root — the build context is the whole repo, so this matters for both speed and correctness:

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

- [ ] **Step 2: Write the Dockerfile and nginx config**

`verso/Dockerfile`:

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

`verso/nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  # Hashed filenames — safe to cache forever.
  location /verso/_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # trailingSlash: true means every route is a directory with an index.html.
  location / {
    try_files $uri $uri/ =404;
  }
}
```

- [ ] **Step 3: Build and run**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
docker build -f verso/Dockerfile -t verso .
docker run --rm -d -p 8080:80 --name verso-test verso
```

- [ ] **Step 4: Verify it serves correctly in isolation**

```bash
curl -s -o /dev/null -w 'page: %{http_code}\n' http://localhost:8080/verso/
curl -s http://localhost:8080/verso/ | grep -oE '(src|href)="/[^"]*"' | sed 's/.*="//;s/"$//' | sort -u > /tmp/verso-urls.txt
while read -r u; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8080$u")" "$u"
done < /tmp/verso-urls.txt | sort | uniq -c | sort -rn | head
docker stop verso-test
```

Expected: `page: 200`, and **every** asset URL returns 200. A single 404 here means an asset escaped the prefix and the audit missed it — stop and widen the audit's patterns rather than working around it.

- [ ] **Step 5: Commit**

```bash
git add .dockerignore verso/Dockerfile verso/nginx.conf
git commit -m "Package verso as an nginx image serving /verso"
```

---

## Task 5: Fort — base path and asset prefixing

Mirrors Tasks 2–3. `fort` has no `app/lib/` directory yet, and holds asset paths in components as well as content.

**Files:**
- Create: `fort/app/lib/base-path.ts`
- Create: `fort/app/lib/base-path.test.ts`
- Modify: `fort/next.config.ts`
- Modify: `fort/app/content.ts` (17 `/media/` literals across `image`, `photo`, `avatar` fields)
- Modify: `fort/app/components/Landing.tsx:387` (`/media/ball.png`), `:419` (`/media/club.mp4`)
- Modify: `fort/app/components/RacketCursor.tsx:50` (`/media/racket-cursor.png`)

**Interfaces:**
- Consumes: nothing.
- Produces: `BASE_PATH` (`"/fort"`) and `asset()` from `fort/app/lib/base-path.ts`.

- [ ] **Step 1: Write the failing test**

`fort/app/lib/base-path.test.ts` — same as verso's, with the slug changed:

```ts
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { BASE_PATH, asset } from "./base-path";

describe("BASE_PATH", () => {
  it("is the folder name this experiment is served under", () => {
    expect(BASE_PATH).toBe("/fort");
  });

  it("is what next.config.ts configures, so the two cannot drift", () => {
    expect(nextConfig.basePath).toBe(BASE_PATH);
  });
});

describe("asset", () => {
  it("prefixes a public path so it resolves under the base path", () => {
    expect(asset("/media/ball.png")).toBe("/fort/media/ball.png");
  });

  it("is idempotent, so double-wrapping during a refactor is harmless", () => {
    expect(asset(asset("/media/ball.png"))).toBe("/fort/media/ball.png");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd fort && pnpm vitest run app/lib/base-path.test.ts`
Expected: FAIL — cannot resolve `./base-path`.

- [ ] **Step 3: Write the implementation**

`fort/app/lib/base-path.ts`:

```ts
/**
 * The URL prefix this experiment is served under. Equals the folder name and
 * the path Traefik routes to it. `next.config.ts` reads this, so there is one
 * place to change it.
 */
export const BASE_PATH = "/fort";

/**
 * Prefixes a path to a file in `public/`.
 *
 * Next's `basePath` rewrites `_next/static` URLs, route links and metadata
 * routes — but NOT literal paths to `public/`. Unprefixed, `/media/x.png`
 * resolves against the hub container in production and 404s.
 */
export const asset = (path: string) =>
  path.startsWith(`${BASE_PATH}/`) ? path : `${BASE_PATH}${path}`;
```

`fort/next.config.ts` — replace the whole file:

```ts
import type { NextConfig } from "next";
import { BASE_PATH } from "./app/lib/base-path";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 4: Wrap every asset path**

Content file — add `import { asset } from "./lib/base-path";` at the top, then:

```bash
cd fort
sed -i '' -E 's/"(\/media\/[^"]*)"/asset("\1")/g' app/content.ts
grep -c 'asset("' app/content.ts
```

Expected: 17.

Components — these hold literals inline, so edit them by hand. In `app/components/Landing.tsx` add `import { asset } from "../lib/base-path";` and change:

```tsx
<img className="bigball" ref={bigBall} src={asset("/media/ball.png")} alt="" />
<video src={asset("/media/club.mp4")} autoPlay muted loop playsInline />
```

In `app/components/RacketCursor.tsx` add the same import and change:

```tsx
src={asset("/media/racket-cursor.png")}
```

- [ ] **Step 5: Run the suite and the audit**

```bash
cd fort && pnpm test && pnpm build && node ../scripts/audit-export.mjs out /fort; echo "exit=$?"
```

Expected: 45 tests pass (41 existing + 4 new), then `exit=0`.

If the audit reports offenders, they are literals this task's file list missed. Find them with `grep -rn '"/[a-z]' app | grep -v base-path` and wrap them the same way.

- [ ] **Step 6: Commit**

```bash
git add fort/
git commit -m "Configure fort for static export under /fort"
```

---

## Task 6: Fort — container

**Files:**
- Create: `fort/Dockerfile`
- Create: `fort/nginx.conf`

**Interfaces:**
- Consumes: Task 4's image shape, Task 5's export config.
- Produces: an image tagged `fort` serving `/fort` on port 80.

- [ ] **Step 1: Write the Dockerfile**

`fort/Dockerfile` — identical to verso's with the slug changed:

```dockerfile
# Build context is the REPO ROOT, so that scripts/ is reachable:
#   docker build -f fort/Dockerfile -t fort .
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY fort/package.json fort/pnpm-lock.yaml fort/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY fort/ ./
RUN pnpm build

COPY scripts/audit-export.mjs /audit.mjs
RUN node /audit.mjs out /fort

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html/fort
COPY fort/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 2: Write the nginx config**

`fort/nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  location /fort/_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ =404;
  }
}
```

- [ ] **Step 3: Build and verify**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
docker build -f fort/Dockerfile -t fort .
docker run --rm -d -p 8081:80 --name fort-test fort
curl -s -o /dev/null -w 'page: %{http_code}\n' http://localhost:8081/fort/
curl -s http://localhost:8081/fort/ | grep -oE '(src|href)="/[^"]*"' | sed 's/.*="//;s/"$//' | sort -u |
  while read -r u; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8081$u")" "$u"; done | grep -v '^200' || echo "all assets 200"
docker stop fort-test
```

Expected: `page: 200`, then `all assets 200`. Note fort references a video (`club.mp4`) — confirm it appears in the list and returns 200.

- [ ] **Step 4: Commit**

```bash
git add fort/Dockerfile fort/nginx.conf
git commit -m "Package fort as an nginx image serving /fort"
```

---

## Task 7: Hub — scaffold and content model

**Files:**
- Create: `hub/` (Next app)
- Create: `hub/content/experiments.ts`
- Create: `hub/content/experiments.test.ts`
- Create: `hub/vitest.config.ts`
- Create: `hub/public/posters/verso.webp`, `hub/public/posters/fort.webp`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `type Experiment` and `export const experiments: Experiment[]` from `hub/content/experiments.ts`, with fields exactly: `slug`, `title`, `blurb`, `tags`, `year`, `href`, `poster`, `notes`, `status?`. Task 8 renders these; Task 9 depends on `notes`.

- [ ] **Step 1: Scaffold the app**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
pnpm create next-app@16.3.0 hub --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-pnpm
```

Then align it with its siblings — open `hub/package.json` and pin `next@16.3.0`, `react@19.2.8`, `react-dom@19.2.8`, `eslint-config-next@16.3.0`, add `"test": "vitest run"` to scripts and `vitest@^3.2.7` to devDependencies, and set `"packageManager": "pnpm@10.17.0"`. Run `pnpm install`.

Confirm `hub/pnpm-workspace.yaml` exists — Task 10's Dockerfile copies it and `COPY` fails on a missing file. If pnpm did not create one, create it matching the siblings:

```yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

`hub/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "content/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Write the failing test**

`hub/content/experiments.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";

const repoRoot = join(process.cwd(), "..");

describe("experiments", () => {
  it("lists at least the two experiments that exist today", () => {
    expect(experiments.length).toBeGreaterThanOrEqual(2);
  });

  it("gives every experiment a unique slug", () => {
    expect(new Set(experiments.map((e) => e.slug)).size).toBe(experiments.length);
  });

  it("uses slugs that survive being turned into a CI secret name", () => {
    // The workflow derives DOKPLOY_WEBHOOK_<SLUG>; a hyphen would break it.
    for (const e of experiments) {
      expect(e.slug, e.slug).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("points each entry at a folder that actually exists in the repo", () => {
    for (const e of experiments) {
      expect(existsSync(join(repoRoot, e.slug)), e.slug).toBe(true);
    }
  });

  it("derives href from slug, with the trailing slash the apps expect", () => {
    // The experiments set trailingSlash: true; linking without it costs a redirect.
    for (const e of experiments) {
      expect(e.href, e.slug).toBe(`/${e.slug}/`);
    }
  });

  it("has a poster file on disk for every entry", () => {
    for (const e of experiments) {
      expect(existsSync(join(process.cwd(), "public", e.poster)), e.poster).toBe(true);
    }
  });

  it("sets notes: true exactly when the writeup file exists", () => {
    for (const e of experiments) {
      const hasFile = existsSync(join(process.cwd(), "app", "notes", e.slug, "page.mdx"));
      expect(hasFile, `${e.slug}: notes flag says ${e.notes}, file exists ${hasFile}`).toBe(e.notes);
    }
  });

  it("gives every entry non-empty copy", () => {
    for (const e of experiments) {
      expect(e.title.trim(), e.slug).not.toBe("");
      expect(e.blurb.trim(), e.slug).not.toBe("");
      expect(e.tags.length, e.slug).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd hub && pnpm vitest run content/experiments.test.ts`
Expected: FAIL — cannot resolve `./experiments`.

- [ ] **Step 4: Write the content module and add posters**

`hub/content/experiments.ts`:

```ts
export type Experiment = {
  /** Folder name, URL path, image name and CI secret stem. Lowercase alphanumeric. */
  slug: string;
  title: string;
  /** One or two sentences, shown on the card. */
  blurb: string;
  tags: string[];
  year: number;
  /** Always `/${slug}/` — a different container serves this, so link with a plain <a>. */
  href: string;
  /** Path under hub/public/. */
  poster: string;
  /** True exactly when hub/app/notes/<slug>/page.mdx exists. */
  notes: boolean;
  status?: "live" | "wip";
};

export const experiments: Experiment[] = [
  {
    slug: "verso",
    title: "Verso",
    blurb:
      "The homepage of a fictional design studio — a study in editorial layout, split-character type animation and scroll choreography.",
    tags: ["Editorial", "GSAP", "Scroll"],
    year: 2026,
    href: "/verso/",
    poster: "/posters/verso.webp",
    notes: false,
    status: "live",
  },
  {
    slug: "fort",
    title: "Fort",
    blurb:
      "A padel club site with a booking flow, cursor-led interaction and a motion-heavy landing sequence.",
    tags: ["Interaction", "Booking", "GSAP"],
    year: 2026,
    href: "/fort/",
    poster: "/posters/fort.webp",
    notes: false,
    status: "live",
  },
];
```

Create the posters. Screenshot each experiment at 1440×900 and save as WebP:

```bash
cd "/Users/danemmanuel/Documents/web experiments"
mkdir -p hub/public/posters
# With verso/fort containers running (Tasks 4 and 6), capture from the browser,
# or reuse existing art:
cp verso/public/media/work/terminal-grotesk.jpg /tmp/verso-poster.jpg
sips -s format webp -Z 1440 /tmp/verso-poster.jpg --out hub/public/posters/verso.webp
cp fort/public/media/g1.webp hub/public/posters/fort.webp
```

Placeholder art is acceptable for this task — the test asserts the file exists, not that it is a good screenshot. Replacing them is a content chore, not a code change.

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd hub && pnpm test`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add hub/
git commit -m "Scaffold the hub and its experiment index"
```

---

## Task 8: Hub — index page

**Files:**
- Modify: `hub/app/page.tsx`
- Modify: `hub/next.config.ts`
- Create: `hub/app/page.test.ts`

**Interfaces:**
- Consumes: `experiments` from `hub/content/experiments.ts` (Task 7).
- Produces: a static index page. No exports other tasks consume.

- [ ] **Step 1: Write the failing test**

The rule this guards is architectural, not cosmetic: `next/link` on a cross-container href silently breaks navigation in production while looking fine in dev.

`hub/app/page.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");

describe("index page", () => {
  it("never uses next/link — every experiment is a different container", () => {
    expect(source).not.toMatch(/from ["']next\/link["']/);
  });

  it("links every experiment with a plain anchor", () => {
    expect(source).toMatch(/<a\s+href=\{/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd hub && pnpm vitest run app/page.test.ts`
Expected: FAIL on the second assertion — the scaffolded page has no anchor.

- [ ] **Step 3: Write the page and config**

`hub/next.config.ts`:

```ts
import type { NextConfig } from "next";

// The hub is served at the root, so it has no basePath. Its siblings do.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

`hub/app/page.tsx`:

```tsx
import { experiments } from "../content/experiments";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <header className="mb-16">
        <h1 className="text-4xl font-medium tracking-tight">Web Experiments</h1>
        <p className="mt-3 max-w-prose text-neutral-500">
          Sites built to learn something specific — layout systems, motion, interaction.
          Each one is live; click through to the thing itself.
        </p>
      </header>

      <ul className="grid gap-10 sm:grid-cols-2">
        {experiments.map((e) => (
          <li key={e.slug} className="group">
            {/* Plain anchor, never next/link: a different container serves this. */}
            <a href={e.href} className="block">
              <img
                src={e.poster}
                alt=""
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <h2 className="mt-4 text-xl tracking-tight">
                {e.title}
                {e.status === "wip" && (
                  <span className="ml-2 align-middle text-xs uppercase tracking-widest text-neutral-400">
                    in progress
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{e.blurb}</p>
            </a>

            <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
              <span>{e.year}</span>
              <span>{e.tags.join(" · ")}</span>
              {e.notes && (
                <a href={`/notes/${e.slug}/`} className="underline hover:text-neutral-600">
                  read notes
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Note the poster uses a plain `<img>`, not `next/image`. The hub has no basePath, so there is nothing to prefix, and the poster is a fixed-size local file — `next/image` with `unoptimized: true` would add markup for no benefit.

- [ ] **Step 4: Run the tests and build**

```bash
cd hub && pnpm test && pnpm build && node ../scripts/audit-export.mjs out /
```

Expected: 10 tests pass, build succeeds, audit prints `ok`.

- [ ] **Step 5: Commit**

```bash
git add hub/
git commit -m "Build the hub index page"
```

---

## Task 9: Hub — optional writeups

**Files:**
- Modify: `hub/next.config.ts`
- Modify: `hub/package.json`
- Create: `hub/mdx-components.tsx`
- Create: `hub/app/notes/verso/page.mdx`
- Modify: `hub/content/experiments.ts` (flip verso's `notes` to `true`)

**Interfaces:**
- Consumes: the `notes` flag from Task 7's content model, whose test already asserts flag-and-file agreement.
- Produces: `/notes/<slug>/` routes.

- [ ] **Step 1: Run the invariant test to see it catch the drift**

Flip `notes: false` to `notes: true` for verso in `hub/content/experiments.ts`, then:

Run: `cd hub && pnpm vitest run content/experiments.test.ts`
Expected: FAIL — `verso: notes flag says true, file exists false`. This is the guard from Task 7 doing its job.

- [ ] **Step 2: Install and configure MDX**

```bash
cd hub && pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

`hub/next.config.ts`:

```ts
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// The hub is served at the root, so it has no basePath. Its siblings do.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default createMDX()(nextConfig);
```

`hub/mdx-components.tsx` — required by `@next/mdx` in the App Router:

```tsx
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-3xl tracking-tight">{children}</h1>,
    p: ({ children }) => <p className="mt-4 max-w-prose text-neutral-600">{children}</p>,
    ...components,
  };
}
```

- [ ] **Step 3: Write the note**

`hub/app/notes/verso/page.mdx`:

```mdx
# Verso

A reconstruction of an editorial studio homepage, built to learn three things:
splitting a headline into per-character spans without breaking words, driving a
diagonal card wall from scroll position, and keeping both of them honest under
`prefers-reduced-motion`.

[View the site →](/verso/)
```

- [ ] **Step 4: Run the tests and build**

```bash
cd hub && pnpm test && pnpm build && test -f out/notes/verso/index.html && echo "note exported"
```

Expected: all tests pass (the flag now matches the file), build succeeds, `note exported`.

If `@next/mdx` fails under Next 16 with Turbopack, the fallback is a `page.tsx` per note with the prose inline — the content model, the invariant test and the index page are all unchanged by that substitution. Adjust the test's expected filename if you take the fallback.

- [ ] **Step 5: Commit**

```bash
git add hub/
git commit -m "Add optional per-experiment writeups to the hub"
```

---

## Task 10: Hub — container

**Files:**
- Create: `hub/Dockerfile`
- Create: `hub/nginx.conf`

**Interfaces:**
- Consumes: Task 4's image shape.
- Produces: an image tagged `hub` serving the index at `/` on port 80.

- [ ] **Step 1: Write the Dockerfile**

`hub/Dockerfile`:

```dockerfile
# Build context is the REPO ROOT:
#   docker build -f hub/Dockerfile -t hub .
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY hub/package.json hub/pnpm-lock.yaml hub/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY hub/ ./
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY hub/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

No audit step here, unlike the experiments: the hub is served at the root, so there is no prefix for an asset to escape and the check would be vacuous.

- [ ] **Step 2: Write the nginx config**

`hub/nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ =404;
  }
}
```

- [ ] **Step 3: Build and verify**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
docker build -f hub/Dockerfile -t hub .
docker run --rm -d -p 8082:80 --name hub-test hub
curl -s -o /dev/null -w 'page: %{http_code}\n' http://localhost:8082/
curl -s http://localhost:8082/ | grep -o 'href="/[a-z]*/"' | sort -u
docker stop hub-test
```

Expected: `page: 200`, and the experiment links `href="/verso/"` and `href="/fort/"` present. Those 404 against this container alone — that is correct, and Task 11 is where they resolve.

- [ ] **Step 4: Commit**

```bash
git add hub/Dockerfile hub/nginx.conf
git commit -m "Package the hub as an nginx image serving the root"
```

---

## Task 11: Local path-routing integration

Proves the three containers compose into one site *before* any of it reaches a server. This is where "does `/` shadow `/verso`?" gets answered.

**Files:**
- Create: `docker-compose.local.yml`
- Create: `proxy/nginx.conf`
- Create: `scripts/smoke.sh`

**Interfaces:**
- Consumes: the three images from Tasks 4, 6 and 10.
- Produces: `./scripts/smoke.sh [base-url]` — exit 0 when every page and every asset it references returns 200.

- [ ] **Step 1: Write the compose file and proxy config**

`docker-compose.local.yml`:

```yaml
# Local stand-in for Traefik. Mirrors the production path routing so the
# three containers can be tested as one site.
services:
  hub:
    build: { context: ., dockerfile: hub/Dockerfile }
  verso:
    build: { context: ., dockerfile: verso/Dockerfile }
  fort:
    build: { context: ., dockerfile: fort/Dockerfile }
  proxy:
    image: nginx:alpine
    ports: ["8080:80"]
    volumes:
      - ./proxy/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [hub, verso, fort]
```

`proxy/nginx.conf`:

```nginx
server {
  listen 80;

  # nginx picks the longest matching prefix, the same way Traefik ranks
  # PathPrefix rules by specificity. This is the shadowing check.
  location /verso { proxy_pass http://verso; }
  location /fort  { proxy_pass http://fort;  }
  location /      { proxy_pass http://hub;   }
}
```

- [ ] **Step 2: Write the smoke test**

`scripts/smoke.sh`:

```bash
#!/usr/bin/env bash
# Curls every page and every asset it references. Exits non-zero on any non-200.
set -uo pipefail

BASE="${1:-http://localhost:8080}"
fail=0

check() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$1")
  if [ "$code" != "200" ]; then
    echo "FAIL $code $1"
    fail=1
  fi
}

for page in / /notes/verso/ /verso/ /fort/; do
  echo "--- $page"
  check "$page"
  curl -s "$BASE$page" \
    | grep -oE '(src|href)="/[^"#]*"' \
    | sed 's/.*="//;s/"$//' \
    | sort -u \
    | while read -r url; do
        code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$url")
        [ "$code" = "200" ] || echo "FAIL $code $url"
      done
done

# The pipeline above runs in a subshell, so re-check the aggregate here.
if curl -s "$BASE/" | grep -q 'href="/verso/"'; then
  check /verso/
else
  echo "FAIL hub does not link to /verso/"
  fail=1
fi

[ "$fail" -eq 0 ] && echo "smoke ok"
exit "$fail"
```

Make it executable: `chmod +x scripts/smoke.sh`

- [ ] **Step 3: Bring the stack up and run the smoke test**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
docker compose -f docker-compose.local.yml up -d --build
./scripts/smoke.sh http://localhost:8080
```

Expected: no `FAIL` lines, ending in `smoke ok`. Any `FAIL 404` on a `/media/...` or `/_next/...` URL is the escaped-asset bug — go back to the relevant app's Task 3 or Task 5.

- [ ] **Step 4: Verify path precedence explicitly**

```bash
curl -s http://localhost:8080/        | grep -o '<h1[^>]*>[^<]*' | head -1
curl -s http://localhost:8080/verso/  | grep -o '<title>[^<]*' | head -1
curl -s http://localhost:8080/fort/   | grep -o '<title>[^<]*' | head -1
docker compose -f docker-compose.local.yml down
```

Expected: the hub's heading at `/`, and each experiment's own title under its prefix — confirming `/` does not shadow the longer prefixes.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.local.yml proxy/ scripts/smoke.sh
git commit -m "Add a local proxy that mirrors production path routing"
```

---

## Task 12: CI pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: each app's `Dockerfile` (Tasks 4, 6, 10).
- Produces: images at `ghcr.io/justdan111/<app>:<sha>` and `:latest`, plus a POST to each changed app's Dokploy webhook.

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      apps: ${{ steps.find.outputs.apps }}
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - id: find
        name: Find apps whose files changed
        run: |
          set -euo pipefail
          before="${{ github.event.before }}"
          # First push to a branch, or a manual run: build everything.
          if [ -z "$before" ] || [ "$before" = "0000000000000000000000000000000000000000" ]; then
            before=""
          fi

          apps=()
          for dir in */; do
            app="${dir%/}"
            [ -f "$app/Dockerfile" ] || continue
            if [ -z "$before" ] || ! git diff --quiet "$before" "${{ github.sha }}" -- "$app" "scripts/"; then
              apps+=("$app")
            fi
          done

          if [ ${#apps[@]} -eq 0 ]; then
            echo "apps=[]" >> "$GITHUB_OUTPUT"
          else
            printf '%s\n' "${apps[@]}" \
              | jq -R '{app: ., secret: ("DOKPLOY_WEBHOOK_" + (. | ascii_upcase))}' \
              | jq -sc . \
              | sed 's/^/apps=/' >> "$GITHUB_OUTPUT"
          fi
          echo "changed: ${apps[*]:-none}"

  build:
    needs: detect
    if: needs.detect.outputs.apps != '[]'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      fail-fast: false
      matrix:
        include: ${{ fromJson(needs.detect.outputs.apps) }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: img
        name: Compute image name
        run: |
          owner=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
          echo "repo=ghcr.io/$owner/${{ matrix.app }}" >> "$GITHUB_OUTPUT"

      # Context is the repo root so the Dockerfile can COPY scripts/audit-export.mjs.
      # The audit runs inside the build: a failing app produces no image.
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./${{ matrix.app }}/Dockerfile
          push: true
          tags: |
            ${{ steps.img.outputs.repo }}:${{ github.sha }}
            ${{ steps.img.outputs.repo }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Trigger Dokploy deploy
        env:
          WEBHOOK: ${{ secrets[matrix.secret] }}
        run: |
          if [ -z "$WEBHOOK" ]; then
            echo "Missing secret ${{ matrix.secret }} — add it in repo settings."
            exit 1
          fi
          curl -fsS -X POST "$WEBHOOK"
```

The detect step includes `scripts/` in the diff on purpose: a change to the audit script must rebuild every app, since it can newly fail one.

- [ ] **Step 2: Verify the YAML parses and the matrix shape is right**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/deploy.yml')); print('jobs:', list(d['jobs']))"
printf '%s\n' verso fort | jq -R '{app: ., secret: ("DOKPLOY_WEBHOOK_" + (. | ascii_upcase))}' | jq -sc .
```

Expected: `jobs: ['detect', 'build']`, then `[{"app":"verso","secret":"DOKPLOY_WEBHOOK_VERSO"},{"app":"fort","secret":"DOKPLOY_WEBHOOK_FORT"}]`.

- [ ] **Step 3: Verify the detect logic locally**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
for dir in */; do app="${dir%/}"; [ -f "$app/Dockerfile" ] && echo "buildable: $app"; done
```

Expected: `hub`, `verso`, `fort` — exactly the apps with Dockerfiles, discovered from the filesystem with no list to maintain.

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "Build changed apps in CI and push them to GHCR"
```

---

## Task 13: Deployment runbook

The half that cannot be automated from here — it happens in the Dokploy and Cloudflare UIs.

**Files:**
- Create: `docs/deployment.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: documentation only.

- [ ] **Step 1: Write the runbook**

`docs/deployment.md`:

````markdown
# Deploying the experiments

Everything is one host: `experiments.<domain>`. The hub answers `/`, each
experiment answers its own path prefix. Images are built by GitHub Actions and
pulled by Dokploy — the VPS never builds anything.

## One-time setup

### 1. GitHub secrets

Each app needs its Dokploy deploy webhook stored as `DOKPLOY_WEBHOOK_<SLUG>`:

- `DOKPLOY_WEBHOOK_HUB`
- `DOKPLOY_WEBHOOK_VERSO`
- `DOKPLOY_WEBHOOK_FORT`

Get each URL from the Dokploy application's Deployments tab after step 3.

### 2. Cloudflare DNS

Add one record:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `experiments` | `<VPS IP>` | **DNS only (grey) for now** |

**Leave the proxy off until the certificate is issued.** Behind Cloudflare's
proxy the Let's Encrypt HTTP-01 challenge can fail, and the error is unhelpful.
Once TLS works, switch the record to Proxied and set SSL/TLS mode to
**Full (strict)**.

### 3. Dokploy registry credential

Settings → Registry → add a Docker registry:

- URL: `ghcr.io`
- Username: your GitHub username
- Password: a GitHub PAT with `read:packages`

Only needed while the repo (and therefore its packages) is private.

### 4. Dokploy applications

Create one application per app. Provider is **Docker**, not Git — CI has
already built the image, so Dokploy only pulls it.

| App | Image | Domain host | Path | Strip Path | Port |
| --- | --- | --- | --- | --- | --- |
| hub | `ghcr.io/justdan111/hub:latest` | `experiments.<domain>` | `/` | off | 80 |
| verso | `ghcr.io/justdan111/verso:latest` | `experiments.<domain>` | `/verso` | off | 80 |
| fort | `ghcr.io/justdan111/fort:latest` | `experiments.<domain>` | `/fort` | off | 80 |

**Strip Path stays off.** Each image places its files at the same path it is
served from, so the container behaves identically with or without a proxy in
front. Stripping would break that symmetry and make local testing a lie.

Enable HTTPS with the Let's Encrypt certificate provider on each.

## Verifying a deploy

```bash
./scripts/smoke.sh https://experiments.<domain>
```

Exit 0 means every page and every asset it references returned 200.

## Adding an experiment

1. Create the folder and build the thing.
2. Add `app/lib/base-path.ts` with the new slug, and the four config lines in
   `next.config.ts` (`output: "export"`, `basePath: BASE_PATH`,
   `trailingSlash: true`, `images: { unoptimized: true }`).
3. Wrap every `public/` path in `asset()`.
4. Copy `Dockerfile` and `nginx.conf` from `verso/`, changing the slug in both.
5. Add an entry to `hub/content/experiments.ts` and a poster to
   `hub/public/posters/`.
6. Verify locally: add it to `docker-compose.local.yml` and `proxy/nginx.conf`,
   then `./scripts/smoke.sh`.
7. Create the Dokploy application per the table above.
8. Add the `DOKPLOY_WEBHOOK_<SLUG>` secret to GitHub.
9. Push.

No DNS change. No CI change — the workflow discovers any folder with a
Dockerfile. The slug must be lowercase alphanumeric; the hub's test suite
enforces it, because the CI secret name is derived from it.

## If an experiment needs a server

Static export is a default, not a constraint. An experiment that grows an API
route or needs SSR switches to `output: "standalone"` and a Node runtime stage
in its own Dockerfile. Routing, CI and the hub are all indifferent to what a
container runs — only that app changes.
````

- [ ] **Step 2: Update the README**

Replace `README.md` with:

```markdown
# web experiments

Sites built to learn something specific. Each folder is a self-contained app
with its own dependencies; each is published under one host.

| Folder | Served at | What it is |
| --- | --- | --- |
| `hub` | `/` | The index of experiments |
| `verso` | `/verso` | Editorial studio homepage — layout, type animation, scroll |
| `fort` | `/fort` | Padel club site — booking flow, cursor interaction |

- **Deployment:** `docs/deployment.md`
- **Design:** `docs/superpowers/specs/2026-08-24-experiments-hub-design.md`

## Local

```bash
cd verso && pnpm install && pnpm dev     # one experiment
docker compose -f docker-compose.local.yml up --build   # all of them, path-routed
./scripts/smoke.sh                                       # verify nothing 404s
```
```

- [ ] **Step 3: Verify the runbook's commands are real**

```bash
cd "/Users/danemmanuel/Documents/web experiments"
test -x scripts/smoke.sh && echo "smoke.sh executable"
grep -c 'DOKPLOY_WEBHOOK_' docs/deployment.md
```

Expected: `smoke.sh executable`, and at least 4 mentions of the secret pattern.

- [ ] **Step 4: Commit**

```bash
git add docs/deployment.md README.md
git commit -m "Document the deployment runbook"
```

---

## Done

At the end of Task 13:

- `./scripts/smoke.sh` passes against the local stack — every page and asset 200s.
- An image cannot be built with an asset that escapes its path prefix.
- `verso` (49 tests), `fort` (45), `hub` (10) all green.
- Pushing to `main` builds only the apps that changed and redeploys them. This
  one cannot be proven locally — confirm it on the first real push by checking
  that a verso-only commit produces exactly one image build.
- Adding experiment #3 touches one new folder, one content entry, and two UI forms.

The remaining work is manual and documented: create the three Dokploy
applications, add the Cloudflare record, and add the three webhook secrets.
