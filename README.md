# web experiments

Sites built to learn something specific. Each folder is a self-contained app
with its own dependencies; each is published under one host.

| Folder | Served at | What it is |
| --- | --- | --- |
| `hub` | `/` | The index of experiments, and a case study for each at `/notes/<slug>/` |
| `verso` | `/verso` | Editorial studio homepage — layout, type animation, scroll |
| `fort` | `/fort` | Tennis club site — booking flow, cursor interaction |

- **Deployment:** `docs/deployment.md`
- **Design:** `docs/superpowers/specs/2026-08-24-experiments-hub-design.md`

## Local

```bash
cd verso && pnpm install && pnpm dev     # one experiment
docker compose -f docker-compose.local.yml up --build   # all of them, path-routed
./scripts/smoke.sh                                       # verify nothing 404s
```

Running a single experiment serves it at its path prefix: `verso` at `http://localhost:3000/verso/`,
`fort` at `http://localhost:3000/fort/`, `hub` at `http://localhost:3000/`.
(Next's startup banner shows the root — ignore it for prefixed apps.)
