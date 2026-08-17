"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  // The element can fail to load before React hydrates and attaches onError,
  // which is exactly the cold-load case. media.error persists, so read it.
  useEffect(() => {
    if (video.current?.error) setFailed(true);
  }, []);

  // The poster does keep showing if the video fails, but only incidentally.
  // Swapping to a real image makes the fallback a guarantee rather than a
  // side effect of how browsers happen to treat a failed <video>.
  if (failed) {
    return (
      <Image
        src="/media/hero-poster.jpg"
        alt=""
        width={1920}
        height={1080}
        priority
        className="h-[70vh] w-full object-cover md:h-[85vh]"
      />
    );
  }

  return (
    <video
      ref={video}
      className="h-[70vh] w-full object-cover md:h-[85vh]"
      src="/media/hero.mp4"
      poster="/media/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}
