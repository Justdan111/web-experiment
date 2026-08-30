export type CaseStudy = {
  /** One line under the title. Says what the thing is, not how good it is. */
  summary: string;
  stack: string[];
  /**
   * The experiment's brand hue, deepened where it has to be. Carries the title
   * rule and large type — anything that needs 3:1 against the ground.
   */
  accent: string;
  /** A darker variant for small text: links, the button. Clears 4.5:1. */
  accentInk: string;
};

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
  status?: "live" | "wip";
  /** Every experiment has one, at `/notes/${slug}/`. */
  caseStudy: CaseStudy;
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
    status: "live",
    caseStudy: {
      summary: "The homepage of a design studio that does not exist.",
      stack: ["Next.js", "React", "GSAP", "Tailwind", "TypeScript"],
      accent: "#F5511F",
      accentInk: "#C4441B",
    },
  },
  {
    slug: "fort",
    title: "Fort",
    blurb:
      "A tennis club site with a booking flow, cursor-led interaction and a motion-heavy landing sequence.",
    tags: ["Interaction", "Booking", "GSAP"],
    year: 2026,
    href: "/fort/",
    poster: "/posters/fort.webp",
    status: "live",
    caseStudy: {
      summary: "A tennis club in Abuja, with a court booking flow that runs in the browser.",
      stack: ["Next.js", "React", "GSAP", "Tailwind", "TypeScript"],
      accent: "#7A9900",
      accentInk: "#5B6E00",
    },
  },
];
