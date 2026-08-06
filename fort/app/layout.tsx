import type { Metadata, Viewport } from "next";
import { bbhBartle, interDisplay, jakob, satoshi } from "./fonts";
import "./globals.css";
import "./booking/booking.css";

export const metadata: Metadata = {
  title: "FORT — ABUJA",
  description:
    "Join FORT, Abuja's premier tennis club. Floodlit hard courts for players who play to win.",
};

export const viewport: Viewport = {
  themeColor: "#021024",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bbhBartle.variable} ${jakob.variable} ${interDisplay.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
