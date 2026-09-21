import type { NextConfig } from "next";

// The hub is served at the root, so it has no basePath. Its siblings do.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
