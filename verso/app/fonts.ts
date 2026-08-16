import { Space_Grotesk, Space_Mono } from "next/font/google";

/** The one face that does nearly everything, at weight 500. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

/**
 * Reserved for micro monospace labels — UTC offsets, dates.
 *
 * Named --font-space-mono, not --font-mono: Tailwind's theme already owns
 * --font-mono, and pointing that token at a variable of the same name is a
 * circular reference that silently resolves to nothing.
 */
export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
