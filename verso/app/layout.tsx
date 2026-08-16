import type { Metadata, Viewport } from "next";
import { spaceGrotesk, spaceMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verso",
  description:
    "Interdisciplinary design studio · Kyoto, Japan. Precise, quiet, durable design systems.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

/** Runs before first paint so the ground never flashes. */
const THEME_BOOT = `
(function(){try{
  var t = localStorage.getItem('theme');
  if (t !== 'light' && t !== 'dark') {
    t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
