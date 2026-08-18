import type { ClockZone, NavItem } from "./types";

export const NAV: NavItem[] = [
  { label: "Field", href: "/field" },
  { label: "Practice", href: "/practice" },
  { label: "Foundry", href: "/foundry" },
  { label: "Index", href: "/index" },
  { label: "Goods", href: "/goods" },
];

export const FOOTER_COLUMNS: NavItem[][] = [
  [
    { label: "Home", href: "/" },
    { label: "Field", href: "/field" },
    { label: "Practice", href: "/practice" },
    { label: "Foundry", href: "/foundry" },
    { label: "Goods", href: "/goods" },
  ],
  [
    { label: "All Works", href: "/works" },
    { label: "About Us", href: "/about" },
    { label: "Project Inquiry", href: "/inquiry" },
    { label: "Index", href: "/index" },
    { label: "Open Positions", href: "/open-positions" },
  ],
];

export const HERO = {
  statement:
    "Verso builds precise, quiet, and durable design systems for companies working at the edge of technology, culture, and language.",
  link: "Learn More",
} as const;

export const FIELD = {
  label: "Field",
  accent: "--accent-field",
  statement:
    "We follow our own curiosity, testing new forms, tools, and typefaces before anyone asks us to.",
} as const;

export const PRACTICE = {
  label: "Practice",
  accent: "--accent-practice",
  statement:
    "We take on outside work. From identity to interface, we deliver considered, rigorous, and complete design systems.",
} as const;

export const INDEX_SECTION = { label: "Index", accent: "--accent-index" } as const;

/** First clock resolves to the visitor's own zone; second is the studio. */
export const CLOCKS: ClockZone[] = [
  { timeZone: null, city: "LOCAL" },
  { timeZone: "Asia/Tokyo", city: "KYOTO" },
];

export const SOCIALS: NavItem[] = [
  { label: "Email", href: "mailto:studio@verso.example" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X", href: "https://x.com" },
];

export const LEGAL = {
  copyright: "© 2026 Verso Studio",
  rights: "All rights reserved.",
  notice:
    "This website and all its content, including all text, graphics, videos, and photos, are copyrighted materials of Verso Studio or various third parties.",
  signoff: "The other side of the page.",
} as const;
