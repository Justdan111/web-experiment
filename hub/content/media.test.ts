import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";

const PUBLIC = join(process.cwd(), "public");
const asFile = (url: string) => join(PUBLIC, url.replace(/^\//, ""));

describe("media", () => {
  it("points every video at a file that exists", () => {
    // A path typo is invisible until someone loads the page: the plate just
    // falls back and the card looks like it has no clip yet.
    for (const e of experiments) {
      if (!e.media.video) continue;
      expect(existsSync(asFile(e.media.video)), `${e.slug}: ${e.media.video}`).toBe(true);
    }
  });

  it("points every poster at a file that exists", () => {
    for (const e of experiments) {
      if (!e.media.poster) continue;
      expect(existsSync(asFile(e.media.poster)), `${e.slug}: ${e.media.poster}`).toBe(true);
    }
  });

  it("gives every video a poster, so nothing pops in from blank", () => {
    for (const e of experiments) {
      if (!e.media.video) continue;
      expect(e.media.poster, e.slug).toBeTruthy();
    }
  });

  it("leaves no clip in public/videos that no experiment claims", () => {
    const claimed = new Set(
      experiments.flatMap((e) => (e.media.video ? [e.media.video.split("/").pop()] : [])),
    );
    const onDisk = readdirSync(join(PUBLIC, "videos")).filter((f) => f.endsWith(".mp4"));
    expect(onDisk.filter((f) => !claimed.has(f))).toEqual([]);
  });

  it("keeps every clip small enough to autoplay over a phone connection", () => {
    // The 4K originals are ~23MB each; scripts/optimise-media.sh builds these.
    // If this fails, someone has copied a source recording in by hand.
    const dir = join(PUBLIC, "videos");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".mp4"))) {
      const mb = statSync(join(dir, f)).size / 1024 / 1024;
      expect(mb, `${f} is ${mb.toFixed(1)}MB`).toBeLessThan(4);
    }
  });
});
