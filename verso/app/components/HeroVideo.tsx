"use client";

import Image from "next/image";
import { useState } from "react";

export default function HeroVideo() {
  const [failed, setFailed] = useState(false);

  // A decoding failure or a blocked codec leaves poster="" showing nothing,
  // so fall all the way back to a real image.
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
