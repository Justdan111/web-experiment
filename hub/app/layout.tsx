import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./components/SmoothScroll";
import { countsFor, experiments } from "../content/experiments";

// Derived, so the description cannot go stale the way "two sites" did when a
// third arrived.
const { platform } = countsFor(experiments);
const summary = `${platform.mobile} React Native apps and ${platform.web} sites, each built to answer one question.`;

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dan / experiments",
  description: `Mobile and web experiments by Emmanuel Ngulube — ${summary}`,
  metadataBase: new URL("https://experiments.dan-code.dev"),
  openGraph: {
    title: "dan / experiments",
    description: summary,
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@Dan_code" },
};

export const viewport: Viewport = { colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
