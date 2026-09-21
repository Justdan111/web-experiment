"use client";

import type { Experiment } from "../../content/experiments";

/**
 * A video when one has been supplied, a poster when only that exists, and
 * otherwise the slug set in mono on the card ground. The placeholder is the
 * shipped state for every mobile experiment until its clip is recorded, so it
 * has to look deliberate rather than broken.
 *
 * No experiment has an accent of its own — every plate sits on the same
 * surface as every other panel on the site.
 */
export function MediaPlate({ experiment }: { experiment: Experiment }) {
  const { media, title, slug } = experiment;

  if (media.video) {
    return (
      <video
        src={media.video}
        poster={media.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-label={`${title} — screen recording`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  if (media.poster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- images are unoptimized in a static export
      <img
        src={media.poster}
        alt={`${title} — screenshot`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center bg-card"
    >
      <span className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {slug}
      </span>
    </div>
  );
}
