#!/usr/bin/env node
// Assembles the three static exports into one tree, which is what nginx used to
// do at request time. Each app already emits its files at the path it is served
// from — verso and fort set basePath — so this is a copy, not a rewrite, and
// the URLs are identical to the Docker setup it replaces.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

/** `from` is relative to the app's own out/, `to` relative to dist/. */
const apps = [
  { name: "hub", from: ".", to: "." },
  { name: "verso", from: "verso", to: "verso" },
  { name: "fort", from: "fort", to: "fort" },
];

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env });

rmSync(dist, { recursive: true, force: true });

for (const app of apps) {
  const cwd = join(root, app.name);
  console.log(`\n── ${app.name} ──`);
  run("pnpm", ["install", "--frozen-lockfile"], cwd);
  run("pnpm", ["build"], cwd);

  const out = join(cwd, "out", app.from);
  if (!existsSync(out)) {
    throw new Error(
      `${app.name} built no export at ${out} — is output: "export" still set?`,
    );
  }
  cpSync(out, join(dist, app.to), { recursive: true });
}

console.log(`\nAssembled ${apps.length} apps into ${dist}`);
