import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// The hub is served at the root, so it has no basePath. Its siblings do.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default createMDX()(nextConfig);
