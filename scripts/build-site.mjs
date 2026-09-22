#!/usr/bin/env node
// Assembles the three static exports into one tree, which is what nginx used to
// do at request time — the Docker images copied each app's out/ to the path it
// was served from, and this does the same thing into dist/.
//
// Note that an app's export root IS its prefix: verso sets basePath "/verso",
// so its out/index.html is the page served at /verso/. Hence `to`, and no
// `from` — the whole of out/ moves, never a subdirectory of it.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

/**
 * `to` is relative to dist/, `base` is the prefix the app is served under.
 * The hub has no basePath, so it lands at the root and has nothing to escape.
 */
const apps = [
  { name: "hub", to: ".", base: "/" },
  { name: "verso", to: "verso", base: "/verso" },
  { name: "fort", to: "fort", base: "/fort" },
];

/**
 * Runs a command, and on failure says which app and which step broke rather
 * than leaving a bare "Command failed: pnpm build" and a stack trace pointing
 * at this file. Three apps build here; a log that does not name one is a log
 * you cannot act on.
 */
const run = (cmd, args, cwd, app, step) => {
  try {
    execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  } catch (error) {
    console.error(
      [
        "",
        "\u2500".repeat(64),
        `FAILED: ${app} \u2014 ${step}`,
        `  command:  ${cmd} ${args.join(" ")}`,
        `  in:       ${cwd}`,
        `  exit:     ${error.status ?? "unknown"}`,
        "",
        `The real error is in ${app}'s own output above this block.`,
        "\u2500".repeat(64),
        "",
      ].join("\n"),
    );
    process.exit(1);
  }
};

rmSync(dist, { recursive: true, force: true });

for (const app of apps) {
  const cwd = join(root, app.name);
  console.log(`\n── ${app.name} ──`);
  run("pnpm", ["install", "--frozen-lockfile"], cwd, app.name, "install");
  run("pnpm", ["build"], cwd, app.name, "build");

  const out = join(cwd, "out");
  if (!existsSync(out)) {
    throw new Error(
      `${app.name} built no export at ${out} — is output: "export" still set?`,
    );
  }
  // The Docker images ran this per image, and an image could not exist with
  // assets escaping its prefix. Keep that guarantee here: a root-absolute URL
  // outside the app's own prefix resolves against a sibling app and 404s.
  run(
    "node",
    [join(root, "scripts", "audit-export.mjs"), out, app.base],
    root,
    app.name,
    "asset audit",
  );

  cpSync(out, join(dist, app.to), { recursive: true });
}

console.log(`\nAssembled ${apps.length} apps into ${dist}`);
