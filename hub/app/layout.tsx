import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./components/SmoothScroll";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dan / experiments",
  description:
    "Mobile and web experiments by Emmanuel Ngulube — eleven React Native apps and two sites, each built to answer one question.",
  metadataBase: new URL("https://experiments.dan-code.dev"),
  openGraph: {
    title: "dan / experiments",
    description:
      "Eleven React Native apps and two sites, each built to answer one question.",
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
