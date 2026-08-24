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
