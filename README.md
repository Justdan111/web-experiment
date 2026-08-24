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
