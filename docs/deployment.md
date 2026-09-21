# Deploying the experiments

Everything is one host: `experiments.<domain>`. The hub answers `/`, each
experiment answers its own path prefix. Images are built by GitHub Actions and
pulled by Dokploy — the VPS never builds anything.

## What's been verified, and what hasn't

Everything up to the Dokploy/Cloudflare line has been exercised locally: all
three images build, serve, and pass `scripts/audit-export.mjs`'s
asset-escape check; `docker compose -f docker-compose.local.yml up --build`
reproduces the production path routing (hub at `/`, verso at `/verso`, fort
at `/fort`) through the same shape of nginx proxy that Dokploy's Traefik will
present; and `./scripts/smoke.sh` passes — every page and every asset it
references returns 200 — against that live local stack.

Nothing below that line has been. The GitHub Actions run itself, the push to
GHCR, the Dokploy webhook round-trip, and the Let's Encrypt issuance all
happen only in the real environment, and none of them have been exercised
outside of local Docker. Local green does not mean deployed green — treat
every step below as first-run-in-anger until it's actually been run once.

## One-time setup

### 1. GitHub secrets

Each app needs its Dokploy deploy webhook stored as `DOKPLOY_WEBHOOK_<SLUG>`:

- `DOKPLOY_WEBHOOK_HUB`
- `DOKPLOY_WEBHOOK_VERSO`
- `DOKPLOY_WEBHOOK_FORT`

Get each URL from the Dokploy application's Deployments tab after step 4 —
the application has to exist before it has a webhook.

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

Create one application per app. Provider is **Docker** (pulling a prebuilt
image), not Git — CI has already built the image, so Dokploy only pulls it.
For a brand-new setup, `:latest` may not exist in GHCR yet — CI only runs on
a push to `main` or a manual `workflow_dispatch`. Note that the build-and-push
steps in `deploy.yml` succeed independently of the webhook secret in step 1;
only the final "trigger Dokploy" step fails without it. So a push (or manual
run) before any webhook secret is set is enough to get a first image into
GHCR for Dokploy to pull.

| App | Image | Domain host | Path | Strip Path | Port |
| --- | --- | --- | --- | --- | --- |
| hub | `ghcr.io/justdan111/hub:latest` | `experiments.<domain>` | `/` | off | 80 |
| verso | `ghcr.io/justdan111/verso:latest` | `experiments.<domain>` | `/verso` | off | 80 |
| fort | `ghcr.io/justdan111/fort:latest` | `experiments.<domain>` | `/fort` | off | 80 |

**Strip Path stays off.** Each image places its files at the same path it is
served from, so the container behaves identically with or without a proxy in
front. Stripping would break that symmetry and make local testing a lie.

Enable HTTPS with the Let's Encrypt certificate provider on each.

**Image architecture.** `docker/build-push-action` in `deploy.yml` sets no
`platforms:`, so images build for the GitHub-hosted runner's architecture —
`linux/amd64`. If the VPS is arm64 (common on cheap ARM hosting), the pull
will succeed but the container will fail to start. If that's the case here,
add `platforms: linux/arm64` (or `linux/amd64,linux/arm64` for a multi-arch
image) to the `build-push-action` step.

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
   In development, `pnpm dev` serves the app at `http://localhost:3000/<slug>/`
   (not `/`), because `basePath` applies in development too.
3. Wrap every `public/` path in `asset()`.
4. Make sure the folder has a `pnpm-workspace.yaml`. `create-next-app` +
   `pnpm install` does not reliably produce one — pnpm only writes it when it
   needs to record something like `ignoredBuiltDependencies`, which is why
   `verso`, `fort` and `hub` happen to have one today. Every Dockerfile does
   `COPY <app>/package.json <app>/pnpm-lock.yaml <app>/pnpm-workspace.yaml ./`,
   and Docker's `COPY` errors on a missing source — so a new experiment
   without this file fails its first CI build with a `COPY failed: no such
   file or directory` and no obvious pointer back to the cause. If pnpm
   didn't create one, add an empty `pnpm-workspace.yaml` (or copy the
   `ignoredBuiltDependencies` block from a sibling app) before the first push.
5. Copy `Dockerfile` and `nginx.conf` from `verso/`, changing the slug in both.
6. Add an entry to `hub/content/experiments.ts` and a poster to
   `hub/public/posters/`.
7. Verify locally: add it to `docker-compose.local.yml` and `proxy/nginx.conf`,
   then `./scripts/smoke.sh`. Nothing to add to the smoke test itself — it
   discovers pages by crawling `/` and queuing any link that looks like a
   route (`^(/[a-z0-9]+)+/$`), so the new experiment's page and assets are
   checked the moment the hub links to it.
8. Create the Dokploy application per the table above.
9. Add the `DOKPLOY_WEBHOOK_<SLUG>` secret to GitHub.
10. Push.

No DNS change. No CI change — the workflow discovers any folder with a
Dockerfile. The slug must be lowercase alphanumeric; the hub's test suite
enforces it, because the CI secret name is derived from it. That test suite
also rejects a slug the hub reserves for itself (`notes`, `posters`, `_next`,
`favicon.ico`) — those would otherwise get a Traefik `PathPrefix` that wins
on length and takes the path from the hub.

**A caution about the `next/link` guard.** The test that stops the hub from
client-navigating into a different container (`hub/app/page.test.ts`) works
by reading `hub/app/page.tsx`'s source text and asserting it doesn't import
`next/link`. That's a text match against one specific file path, not a type
check or a render check — so it silently stops enforcing anything the moment
the experiment card markup is pulled out into its own component file. If you
ever refactor the hub's card rendering, either keep the assertion pointed at
whichever file ends up rendering the `<a href>`, or move the check with it.

## If an experiment needs a server

Static export is a default, not a constraint. An experiment that grows an API
route or needs SSR switches to `output: "standalone"` and a Node runtime stage
in its own Dockerfile. Routing, CI and the hub are all indifferent to what a
container runs — only that app changes.
