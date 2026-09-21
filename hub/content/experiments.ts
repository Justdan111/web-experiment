export type Experiment = {
  /** Folder name, URL path, image name and CI secret stem. Lowercase alphanumeric. */
  slug: string;
  title: string;
  /** One or two sentences, shown on the card. */
  blurb: string;
  tags: string[];
  year: number;
  /** Always `/${slug}/` — a different container serves this, so link with a plain <a>. */
  href: string;
  /** Path under hub/public/. */
  poster: string;
  /** True exactly when hub/app/notes/<slug>/page.mdx exists. */
  notes: boolean;
  status?: "live" | "wip";
};

export const experiments: Experiment[] = [
  {
    slug: "verso",
    title: "Verso",
    blurb:
      "The homepage of a fictional design studio — a study in editorial layout, split-character type animation and scroll choreography.",
    tags: ["Editorial", "GSAP", "Scroll"],
    year: 2026,
    href: "/verso/",
    poster: "/posters/verso.webp",
    notes: true,
    status: "live",
  },
  {
    slug: "fort",
    title: "Fort",
    blurb:
      "A padel club site with a booking flow, cursor-led interaction and a motion-heavy landing sequence.",
    tags: ["Interaction", "Booking", "GSAP"],
    year: 2026,
    href: "/fort/",
    poster: "/posters/fort.webp",
    notes: false,
    status: "live",
  },
];
