import localFont from "next/font/local";

/** Giant display face used for the FORT wordmark. */
export const bbhBartle = localFont({
  src: "./fonts/bbh-bartle.woff2",
  variable: "--font-display",
  weight: "400",
  style: "normal",
  display: "block",
});

/** Condensed grotesque used for nav, headings, buttons and prices. */
export const jakob = localFont({
  src: "./fonts/jakob.woff2",
  variable: "--font-jakob",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

/** Body / UI face. */
export const interDisplay = localFont({
  src: [
    { path: "./fonts/inter-display-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-display-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

/** Small labels — the coach tabs. */
export const satoshi = localFont({
  src: "./fonts/satoshi-medium.woff2",
  variable: "--font-satoshi",
  weight: "400 700",
  style: "normal",
  display: "swap",
});
