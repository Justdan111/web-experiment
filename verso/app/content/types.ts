/** T Type · E Editorial · P Product · I Identity · W Web */
export type Badge = "T" | "E" | "P" | "I" | "W";

export type Work = {
  slug: string;
  title: string;
  subtitle: string;
  badges: Badge[];
  /** Path under /public, with a leading slash. */
  image: string;
  /** True for the card that takes the 2fr slot in its grid. */
  wide: boolean;
};

export type NewsItem = {
  slug: string;
  category: string;
  /** M/D/YY, matching the source site's format. */
  date: string;
  headline: string;
  image: string;
  /** A CSS custom property name, e.g. "--accent-index". */
  accent: string;
};

export type NavItem = { label: string; href: string };

/** A null timeZone means "resolve the visitor's own zone on the client". */
export type ClockZone = { timeZone: string | null; city: string };

/** A beat in the hero reel: one of Verso's words over one work still. */
export type ReelBeat = {
  word: string;
  /** Slug of the work whose image backs this beat. */
  slug: string;
  /** The closing beat, which shows the wordmark and the signoff. */
  mark?: boolean;
};
