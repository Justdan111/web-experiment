import type { Work } from "./types";

export const WORKS: Work[] = [
  {
    slug: "terminal-grotesk",
    title: "Terminal Grotesk",
    subtitle: "Variable Typeface, 9 Weights",
    badges: ["T"],
    image: "/media/work/terminal-grotesk.jpg",
    wide: false,
  },
  {
    slug: "atlas-of-quiet-places",
    title: "Atlas of Quiet Places",
    subtitle: "Editorial & Photographic Study",
    badges: ["E"],
    image: "/media/work/atlas-of-quiet-places.jpg",
    wide: false,
  },
  {
    slug: "signal-noise",
    title: "Signal / Noise",
    subtitle: "Generative Poster Series",
    badges: ["E", "W"],
    image: "/media/work/signal-noise.jpg",
    wide: true,
  },
  {
    slug: "halide-capital",
    title: "Halide Capital",
    subtitle: "Brand Identity & Digital Platform",
    badges: ["I", "W"],
    image: "/media/work/halide-capital.jpg",
    wide: true,
  },
  {
    slug: "nomad-audio",
    title: "Nomad Audio",
    subtitle: "In progress",
    badges: ["P"],
    image: "/media/work/nomad-audio.jpg",
    wide: false,
  },
  {
    slug: "orbital-health",
    title: "Orbital Health",
    subtitle: "Interface System",
    badges: ["W", "P"],
    image: "/media/work/orbital-health.jpg",
    wide: false,
  },
  {
    slug: "kiosk",
    title: "Kiosk",
    subtitle: "Retail Identity",
    badges: ["I"],
    image: "/media/work/kiosk.jpg",
    wide: false,
  },
  {
    slug: "meridian-press",
    title: "Meridian Press",
    subtitle: "Imprint & Book Design",
    badges: ["E", "I"],
    image: "/media/work/meridian-press.jpg",
    wide: false,
  },
  {
    slug: "bell-and-bone",
    title: "Bell & Bone",
    subtitle: "Packaging System",
    badges: ["P", "I"],
    image: "/media/work/bell-and-bone.jpg",
    wide: false,
  },
  {
    slug: "grain-specimen",
    title: "Grain Type Specimen",
    subtitle: "Specimen Site",
    badges: ["T", "W"],
    image: "/media/work/grain-specimen.jpg",
    wide: false,
  },
  {
    slug: "verso-rebrand",
    title: "Verso Rebrand",
    subtitle: "Studio Identity",
    badges: ["I"],
    image: "/media/work/verso-rebrand.jpg",
    wide: false,
  },
  {
    slug: "low-tide",
    title: "Low Tide",
    subtitle: "Photographic Series",
    badges: ["E"],
    image: "/media/work/low-tide.jpg",
    wide: false,
  },
];

const bySlug = (slug: string): Work => {
  const found = WORKS.find((w) => w.slug === slug);
  if (!found) throw new Error(`Unknown work slug: ${slug}`);
  return found;
};

/** Field grid — 1fr 1fr 2fr, so the wide card sits last. */
export const FIELD_WORKS: Work[] = [
  bySlug("terminal-grotesk"),
  bySlug("atlas-of-quiet-places"),
  bySlug("signal-noise"),
];

/** Practice grid — 2fr 1fr 1fr, so the wide card sits first. */
export const PRACTICE_WORKS: Work[] = [
  bySlug("halide-capital"),
  bySlug("nomad-audio"),
  bySlug("orbital-health"),
];
