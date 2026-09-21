export type Platform = "mobile" | "web";
export type Category = "Motion" | "Gestures" | "Generative" | "Full flows";
/** live: a site you can open. source: code only. wip: still being built. */
export type Status = "live" | "source" | "wip";

/** One section of a detail page. Two per experiment, kept short on purpose. */
export type Note = { heading: string; body: string };

export type Experiment = {
  /** URL path and media filename stem. Lowercase alphanumeric and dashes. */
  slug: string;
  title: string;
  /** One or two sentences, shown on the card. */
  blurb: string;
  platform: Platform;
  category: Category;
  tags: string[];
  year: number;
  status: Status;
  /**
   * Where you can open the thing itself, for an experiment that has a site.
   * Either a path on this host — a different Next app builds it and it is
   * copied in at that path, so link with a plain <a>, since a client-side
   * navigation would 404 — or an absolute URL when it is hosted elsewhere.
   */
  live?: string;
  /**
   * Path inside its repo. Differs from the slug where the app is nested or
   * has a space in its directory name.
   */
  folder: string;
  /**
   * The source. Derived from `folder` and `sourceRepo` — never written by hand.
   * Every experiment has one; it is the call to action for the ones with no
   * site to open.
   */
  repo: string;
  /**
   * The repo `folder` sits in, when it is not the one implied by `platform`.
   * An experiment kept in its own repo has an empty `folder` and names it here.
   */
  sourceRepo?: string;
  /** Overrides the last line of the run block where the default won't do. */
  run?: { command: string; note: string };
  media: { poster?: string; video?: string };
  notes: Note[];
};

export const CATEGORIES: Category[] = [
  "Motion",
  "Gestures",
  "Generative",
  "Full flows",
];

const MOBILE_REPO = "https://github.com/Justdan111/mobile-interaction";
const WEB_REPO = "https://github.com/Justdan111/web-experiment";

/** The repo an experiment's folder sits in, unless it names its own. */
const repoFor = (e: { platform: Platform; sourceRepo?: string }) =>
  e.sourceRepo ?? (e.platform === "mobile" ? MOBILE_REPO : WEB_REPO);

/**
 * Encodes each path segment but keeps the separators: "aiagent/sora" is two
 * directories deep, while "travel app" is one directory with a space in it.
 */
const encodePath = (folder: string) =>
  folder.split("/").map(encodeURIComponent).join("/");

/** Quotes a path the shell would otherwise split into two arguments. */
const shellPath = (path: string) => (/\s/.test(path) ? `"${path}"` : path);

/** The clone directory — the last segment of the repo URL. */
const cloneDir = (repo: string) => repo.slice(repo.lastIndexOf("/") + 1);

const entries: Omit<Experiment, "repo">[] = [
  {
    slug: "moodlift",
    title: "Moodlift",
    blurb:
      "A fitness app with mood as its primary axis. Say how you feel on a six-step wheel and the colour, mascot, copy and workout list all reshape around the answer.",
    platform: "mobile",
    category: "Full flows",
    tags: ["Reanimated", "Expo Router", "SVG", "Haptics"],
    year: 2026,
    status: "source",
    folder: "moodlift",
    media: {
      video: "/videos/moodlift.mp4",
      poster: "/posters/moodlift.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "A mood-first fitness app, built from thirteen reference comps. There is no screen that ignores the selected mood: home swaps its promo card for a matched workout rail, the picker is a full-bleed card whose hue is the mood itself, and the workout list reorders behind it. Six hand-drawn characters, one per step of the scale.",
      },
      {
        heading: "How it's built",
        body: "Expo Router and Reanimated, with every mascot drawn in react-native-svg rather than shipped as art. The gym pass carries a real QR encoding from qrcode-generator, not a decorative grid — it scans. The mood ramp fills in three colours the comps did not specify, landing on the brand coral at the high end.",
      },
    ],
  },
  {
    slug: "widget",
    title: "Widget Lab",
    blurb:
      "A host app for iOS widgets and Live Activities, with SwiftUI rendered from @expo/ui and no Swift in the repo. The delivery card runs itself with the app force-quit.",
    platform: "mobile",
    category: "Motion",
    tags: ["expo-widgets", "SwiftUI", "Live Activities"],
    year: 2026,
    status: "source",
    folder: "widget",
    run: {
      command: "npx expo run:ios",
      note: "Widget Lab builds iOS widgets and Live Activities, so it needs a development build rather than Expo Go — hence run:ios instead of start.",
    },
    media: {},
    notes: [
      {
        heading: "What it is",
        body: "Two Live Activities: a parcel in transit, with a route rail that fills amber as the van covers ground, and the Foody order card, where a rider travels a mint progress bar under a soft halo. Both supply every presentation the system can ask for — Lock Screen banner, the cut-down CarPlay variant, and both Dynamic Island states.",
      },
      {
        heading: "How it's built",
        body: "The trip is described by when it started and when it is due, not by a minute count the app decrements. So SwiftUI ticks the ETA down every second on its own, with the app suspended or force-quit. Position takes whichever is further along — the last push, or what the clock implies — which is what guarantees the truck actually lands at the destination.",
      },
    ],
  },
  {
    slug: "halftone",
    title: "Halftone",
    blurb:
      "A creative marketplace where the tab bar gets out of your way, and nothing in the app is photographed — every avatar, tile and art card is generated at runtime.",
    platform: "mobile",
    category: "Generative",
    tags: ["Reanimated", "Liquid Glass", "SVG"],
    year: 2026,
    status: "source",
    folder: "halftone",
    media: {
      video: "/videos/halftone.mp4",
      poster: "/posters/halftone.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "Scroll down and the floating glass pill collapses to icons; scroll back up and it opens again. The shrink is two moves pretending to be one — the focused chip drops its label while the bar pulls inward from both sides — so it reads as a single gesture rather than text vanishing from a bar that stayed put.",
      },
      {
        heading: "How it's built",
        body: "Expo 57, Reanimated and NativeWind, with Liquid Glass via expo-glass-effect and a blurred fallback. Every image is a halftone field generated from a seed at runtime, so no photography ships. A six-point dead zone keeps a resting finger from strobing the bar between its two sizes.",
      },
    ],
  },
  {
    slug: "glucose",
    title: "Glucose",
    blurb:
      "A glucose tracker whose day trace is a filled violet ridge that dissolves into the black as it falls. Touch anywhere to scrub and a crosshair locks to the nearest sample.",
    platform: "mobile",
    category: "Generative",
    tags: ["SVG", "Reanimated", "NativeWind"],
    year: 2026,
    status: "source",
    folder: "glucose",
    media: {},
    notes: [
      {
        heading: "What it is",
        body: "Three tabs: today, a graph with a prediction mode and a seven or fourteen day view, and an events log. The stroke sits only a shade brighter than the crest of the fill, so the trace reads as a mass of light rather than a plotted line.",
      },
      {
        heading: "How it's built",
        body: "Every chart is hand-drawn in react-native-svg — no charting library. Every figure on every screen, from time in range to the grade badge, derives from one readings series, so nothing on one screen can disagree with anything on another. The data is solved once; never hand-edited.",
      },
    ],
  },
  {
    slug: "rally",
    title: "Rally",
    blurb:
      "A badminton gear shop with a drawer built by hand rather than dropped in. The whole shop slides, scales, rounds its corners and casts a shadow as one movement.",
    platform: "mobile",
    category: "Gestures",
    tags: ["Reanimated", "Gestures", "NativeWind"],
    year: 2026,
    status: "source",
    folder: "rally",
    media: {
      video: "/videos/rally.mp4",
      poster: "/posters/rally.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "Open the drawer and the shop slides right, scales down and rounds its corners, with a second translucent sheet peeking out from behind it. Underneath: a voucher carousel, a brand rail, and a product grid where favourites, quantity and the cart stay live for the session.",
      },
      {
        heading: "How it's built",
        body: "One value between zero and one drives every transform, so the button press and the drag gesture can never fall out of step with each other — the drawer has a single source of truth rather than two animations racing. Expo 57, Reanimated, NativeWind. The product cut-outs are generated, not traced.",
      },
    ],
  },
  {
    slug: "travel",
    title: "Travel",
    blurb:
      "Destination cards you throw away with your thumb. The top card follows the drag, the two behind it sit in their own slots, and letting go past the threshold springs the next one forward.",
    platform: "mobile",
    category: "Gestures",
    tags: ["Reanimated", "Gestures", "expo-blur"],
    year: 2026,
    status: "source",
    folder: "travel app",
    media: {
      video: "/videos/travel.mp4",
      poster: "/posters/travel.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "A swipeable deck with real depth: the two cards behind the top one rest offset and scaled down, so the stack has a shape rather than being a single card with copies hidden underneath. A black pill tab bar floats over the whole thing.",
      },
      {
        heading: "How it's built",
        body: "Reanimated gesture handlers with a distance threshold rather than a velocity one, so a slow deliberate throw counts the same as a fast flick. The favourite heart pops whenever it becomes active — the small overshoot that makes a like feel registered rather than merely toggled.",
      },
    ],
  },
  {
    slug: "sushi",
    title: "Sushi",
    blurb:
      "A three-screen ordering flow in washi paper, sumi-e ink and vermilion, down to a hand-cut ink sweep behind each dish.",
    platform: "mobile",
    category: "Full flows",
    tags: ["Reanimated", "SVG", "NativeWind"],
    year: 2026,
    status: "source",
    folder: "sushi",
    media: {
      video: "/videos/sushi.mp4",
      poster: "/posters/sushi.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "Onboarding into the menu into a dish detail with a quantity stepper. Titles set vertically in kana, an ink sweep behind each dish, and every tappable surface in the app dips under the finger by the same amount — so the whole thing responds with one weight rather than each control having its own.",
      },
      {
        heading: "How it's built",
        body: "The paper is a cream fill under a tiled speckle. Tiled, not stretched: scaling a noise field up to screen width turns the grain into blotches. Expo 57, Reanimated, NativeWind. The dish cut-outs and ink bitmaps are generated by a Python tool in the repo rather than drawn by hand.",
      },
    ],
  },
  {
    slug: "trackit",
    title: "Trackit",
    blurb:
      "A parcel tracker that arrives in choreography rather than all at once — the lane draws itself, the pins land, and the ferry sails in from up-lane.",
    platform: "mobile",
    category: "Motion",
    tags: ["Reanimated", "SVG", "Expo Router"],
    year: 2026,
    status: "source",
    folder: "trackit",
    media: {
      video: "/videos/trackit.mp4",
      poster: "/posters/trackit.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "On the live tracking screen the chart fades up under the header, the lane draws itself, the origin pin lands, the waypoint drops in and the ferry finally sails in — while the ETA banner and sheet are already climbing over the bottom of the chart, so it reads as one movement instead of a queue. Plus a shipping-cost calculator.",
      },
      {
        heading: "How it's built",
        body: "Tab screens stay mounted, so every entrance is keyed to focus rather than mount: leaving a tab parks each piece back at its start and the whole sequence replays on the next visit. Shipments still in transit rock their ferry gently until they land. Reduced motion is respected throughout.",
      },
    ],
  },
  {
    slug: "sora",
    title: "Sora",
    blurb:
      "An AI agent console that introduces itself a word at a time, then hands over to a voice screen that transcribes one beat per word around a breathing orb.",
    platform: "mobile",
    category: "Motion",
    tags: ["Reanimated", "NativeWind", "Gradient"],
    year: 2026,
    status: "source",
    folder: "aiagent/sora",
    media: {
      video: "/videos/sora.mp4",
      poster: "/posters/sora.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "The headline lands word by word on a stagger, then the suggestion cards cascade in behind it while the composer fades up with them — the screen assembles itself instead of appearing. Tap the mic and the voice screen takes over.",
      },
      {
        heading: "How it's built",
        body: "Each transcript word fades in muted and turns fully active over the following beat, which is how a live transcription actually catches up with a sentence — rather than words arriving already finished. Expo 57, Reanimated, NativeWind, expo-linear-gradient for the orb.",
      },
    ],
  },
  {
    slug: "cars",
    title: "Cars",
    blurb:
      "A car showroom that opens on an SVG loader whose line sweeps around a growing circle, then a car that drives in from off-screen and brakes to a stop.",
    platform: "mobile",
    category: "Motion",
    tags: ["Reanimated", "SVG", "expo-image"],
    year: 2026,
    status: "source",
    folder: "car/cars-proj",
    media: {
      video: "/videos/cars.mp4",
      poster: "/posters/cars.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "The loader holds its centre and only grows while a line sweeps around it. Then the car drives in from off the left edge and settles with a small decelerating overshoot, as if braking. Onboarding into a collection, and a detail page from there.",
      },
      {
        heading: "How it's built",
        body: "Everything in the loader is linear in progress, so every percent advances the counter and the geometry by exactly the same amount — no easing quietly making ninety percent feel slower than ten. Expo 57, Reanimated, react-native-svg, expo-image.",
      },
    ],
  },
  {
    slug: "chompo",
    title: "Chompo",
    blurb:
      "A burger brand splash where the lockup lands like a wave — every letter of CHOMPO jumps into place on a short stagger over a full-bleed macro shot.",
    platform: "mobile",
    category: "Motion",
    tags: ["Reanimated", "SVG", "Anton"],
    year: 2026,
    status: "source",
    folder: "food/chompo",
    media: {
      video: "/videos/chompo.mp4",
      poster: "/posters/chompo.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "The wordmark is the whole idea: tall and condensed in Anton over a photograph, each letter jumping up into place a beat after the one before it. Tap through to the brand screen and the menu.",
      },
      {
        heading: "How it's built",
        body: "Per-letter Reanimated values on a short stagger, with just enough text shadow to survive the photo underneath — the lockup has to stay legible over a macro shot that is bright in some places and dark in others. Expo 54, Reanimated, NativeWind.",
      },
    ],
  },
  {
    slug: "greyroom",
    title: "Grey Room\u00b0",
    blurb:
      "A concept site for a fictional creative studio, built to find out how far scroll choreography and a hand-rolled 3D menu can carry an agency site's sense of craft.",
    platform: "web",
    category: "Motion",
    tags: ["Next.js", "GSAP", "Lenis"],
    year: 2026,
    status: "live",
    // Its own repo, and hosted on its own \u2014 not assembled into this site, so
    // the live link leaves it rather than pointing at a path here.
    sourceRepo: "https://github.com/Justdan111/grey-room",
    folder: "",
    live: "https://grey-room-eight.vercel.app",
    media: {
      video: "/videos/greyroom.mp4",
      poster: "/posters/greyroom.webp",
    },
    notes: [
      {
        heading: "What it is",
        body: "An agency site for modern consumer brands that does not exist. A hover-scrubbed video hero, a scroll-scrubbed portal that pins the layout and bleeds the page from paper through magenta to near-black, and a full-screen 3D menu carousel built from trigonometry rather than a library.",
      },
      {
        heading: "How it's built",
        body: "Next.js App Router, GSAP and Lenis, with no UI kit and no canned animation presets. Lenis is driven off GSAP's ticker so smooth scroll and every scrubbed animation read from one frame clock instead of two competing rAF loops. The menu carousel bypasses React state entirely on the 60fps path.",
      },
    ],
  },
  {
    slug: "verso",
    title: "Verso",
    blurb:
      "The homepage of a design studio that does not exist — a study in editorial layout, split-character type animation and scroll choreography.",
    platform: "web",
    category: "Motion",
    tags: ["Next.js", "GSAP", "Scroll"],
    year: 2026,
    status: "live",
    folder: "verso",
    live: "/verso/",
    media: { poster: "/posters/verso.webp" },
    notes: [
      {
        heading: "What it is",
        body: "An editorial studio homepage: a layout system built on a real grid rather than stacked sections, headlines that animate a character at a time, and a scroll that drives the page rather than merely moving it.",
      },
      {
        heading: "How it's built",
        body: "Next.js as a static export with GSAP for the timeline work and Tailwind for the grid. Typed throughout. It sets a basePath so its files land at /verso, which is what lets it be copied into the assembled site unchanged.",
      },
    ],
  },
  {
    slug: "fort",
    title: "Fort",
    blurb:
      "A tennis club site with a court booking flow that runs entirely in the browser, cursor-led interaction and a motion-heavy landing sequence.",
    platform: "web",
    category: "Full flows",
    tags: ["Next.js", "GSAP", "Booking"],
    year: 2026,
    status: "live",
    folder: "fort",
    live: "/fort/",
    media: { poster: "/posters/fort.webp" },
    notes: [
      {
        heading: "What it is",
        body: "A tennis club in Abuja. The landing sequence is cursor-led — the pointer is a participant rather than a passenger — and the booking flow takes you from a court and a date to a confirmed slot with no server behind it.",
      },
      {
        heading: "How it's built",
        body: "Next.js as a static export with GSAP, Tailwind and TypeScript. Booking state lives in the client for the session, which is the whole trick: the flow is complete and testable without an API. Like verso, it sets a basePath matching the path it is served from.",
      },
    ],
  },
];

/** The repo link is derived, so it cannot drift from the folder. */
export const experiments: Experiment[] = entries.map((entry) => {
  const base = repoFor(entry);
  return {
    ...entry,
    // An experiment that is its own repo has no folder to point into.
    repo: entry.folder ? `${base}/tree/main/${encodePath(entry.folder)}` : base,
  };
});

/** The experiment's permanent number, one-based. Independent of any filter. */
export function numberOf(experiment: Experiment): number {
  return experiments.findIndex((e) => e.slug === experiment.slug) + 1;
}

/**
 * The four commands that get this experiment running locally, and the one
 * thing you need to know afterwards.
 */
export function runFor(experiment: Experiment) {
  const mobile = experiment.platform === "mobile";
  const repo = repoFor(experiment);
  const dir = cloneDir(repo);

  return {
    label: mobile ? "terminal · expo" : "terminal · next",
    lines: [
      `git clone ${repo}.git`,
      `cd ${shellPath(experiment.folder ? `${dir}/${experiment.folder}` : dir)}`,
      mobile ? "npm install" : "pnpm install",
      experiment.run?.command ?? (mobile ? "npm start" : "pnpm dev"),
    ],
    note:
      experiment.run?.note ??
      (mobile
        ? "Then press i for the iOS simulator, a for Android, or scan the QR code with Expo Go. Use npm start rather than npx expo start — each app pins its own Metro port, and Expo Go caches projects by port."
        : experiment.live?.startsWith("/")
          ? `It serves at localhost:3000${experiment.live} rather than the root, whatever Next's startup banner says.`
          : "It serves at localhost:3000, and has no basePath — it is its own site rather than one of the three assembled into this one."),
  };
}

/** Up to `count` others, same category first, then the rest in order. */
export function relatedTo(experiment: Experiment, count = 3): Experiment[] {
  const others = experiments.filter((e) => e.slug !== experiment.slug);
  return [
    ...others.filter((e) => e.category === experiment.category),
    ...others.filter((e) => e.category !== experiment.category),
  ].slice(0, count);
}

export function byPlatform(platform: Platform): Experiment[] {
  return experiments.filter((e) => e.platform === platform);
}

/** Row counts for the filter rail. Derived, so the rail can never drift. */
export function countsFor(list: Experiment[]) {
  const platform: Record<Platform, number> = { mobile: 0, web: 0 };
  const category: Record<Category, number> = {
    Motion: 0,
    Gestures: 0,
    Generative: 0,
    "Full flows": 0,
  };
  for (const e of list) {
    platform[e.platform] += 1;
    category[e.category] += 1;
  }
  return { platform, category };
}
