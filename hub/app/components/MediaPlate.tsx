"use client";

import { useEffect, useRef } from "react";
import type { Experiment } from "../../content/experiments";

const PLACEHOLDER_BG = "#2a2a2e";

/**
 * Plays only while it is on screen.
 *
 * The home page holds nineteen plates and nine distinct clips. Left to
 * themselves they would all fetch and decode at once, which is several
 * megabytes and nine simultaneous decodes for the two or three a reader can
 * actually see. `preload="none"` means nothing but the poster is fetched until
 * the plate comes into view.
 */
function Clip({ src, poster, title }: { src: string; poster?: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // An autoplaying loop is motion, whatever it is a video of.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Rejects if the tab is backgrounded or the decoder is busy; there is
          // nothing to do about it but leave the poster showing.
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={`${title} — screen recording`}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/**
 * A clip when one has been recorded, a poster when only that exists, and
 * otherwise the slug set in mono on a dark ground — the same ground the
 * portfolio puts its project media on, and dark because a near-white plate
 * blurred to 5px in the featured rail disappears against the page.
 */
export function MediaPlate({ experiment }: { experiment: Experiment }) {
  const { media, title, slug } = experiment;

  if (media.video) {
    return <Clip src={media.video} poster={media.poster} title={title} />;
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
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: PLACEHOLDER_BG }}
    >
      <span className="font-mono text-xs uppercase tracking-[0.24em] text-white/40">
        {slug}
      </span>
    </div>
  );
}
